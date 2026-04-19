import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import StaffModel from "@/models/Staff";
import User from "@/models/User";

// GET /api/staff — list with search, department filter, pagination
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: Record<string, unknown> = { isActive: true };
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { staffId: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [staffRaw, total] = await Promise.all([
      StaffModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      StaffModel.countDocuments(filter),
    ]);

    // Add hasLoginAccount flag
    const staff = staffRaw.map((s) => ({
      ...s,
      hasLoginAccount: !!s.userId,
    }));

    // Fetch departments list for filter UI
    const departments = await StaffModel.distinct("department", { isActive: true });

    return NextResponse.json({
      success: true,
      data: staff,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      departments,
    });
  } catch (error) {
    console.error("GET /api/staff error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/staff — create new staff member + optional login account
function generateSchoolEmail(name: string, suffix = 0): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return suffix === 0 ? `${base}@sunwayschooledu.in` : `${base}${suffix}@sunwayschooledu.in`;
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const {
      name, email, phone, designation, department,
      subjects, classes, qualifications, experience,
      salary, dateOfJoining, gender, address, createLoginAccount, teacherType,
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !designation || !department || !gender || !dateOfJoining) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // Check for duplicate email
    const existing = await StaffModel.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ success: false, message: "A staff member with this email already exists" }, { status: 409 });
    }

    // Generate staff ID: ST + year + 4-digit sequence
    const year = new Date().getFullYear();
    const count = await StaffModel.countDocuments();
    const staffId = `ST${year}${String(count + 1).padStart(4, "0")}`;

    // Optionally create a User login account
    let userId: string | undefined;
    let loginEmail: string | undefined;
    let loginPassword: string | undefined;
    if (createLoginAccount) {
      // Generate unique school email from name
      let candidate = generateSchoolEmail(name);
      let suffix = 1;
      while (await User.findOne({ email: candidate })) {
        candidate = generateSchoolEmail(name, suffix++);
      }
      loginEmail = candidate;
      loginPassword = generatePassword();
      // Pass plain password — User model's pre-save hook will hash it
      const user = await User.create({
        name,
        email: loginEmail,
        password: loginPassword,
        role: "staff",
        phone,
        isActive: true,
      });
      userId = user._id.toString();
    }

    const staff = await StaffModel.create({
      staffId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      designation: designation.trim(),
      department: department.trim(),
      subjects: subjects || [],
      classes: classes || [],
      classTeacher: teacherType === "class_teacher" ? (classes?.[0] || "") : "",
      qualifications: qualifications || "",
      experience: Number(experience) || 0,
      salary: Number(salary) || 0,
      dateOfJoining,
      gender,
      address: address || "",
      teacherType: teacherType || "class_teacher",
      userId,
      isActive: true,
    });

    return NextResponse.json({ success: true, data: staff, staffId, loginEmail, loginPassword }, { status: 201 });
  } catch (error) {
    console.error("POST /api/staff error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
