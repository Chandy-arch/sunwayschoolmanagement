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
      subjects, classes, classTeacher, qualifications, experience,
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
    let defaultPassword: string | undefined;
    if (createLoginAccount) {
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (!existingUser) {
        defaultPassword = `${name.split(" ")[0].toLowerCase()}@${year}`;
        // Do NOT manually hash — the User model pre-save hook handles hashing
        const user = await User.create({
          name,
          email: email.toLowerCase().trim(),
          password: defaultPassword,
          role: "staff",
          phone,
          isActive: true,
        });
        userId = user._id.toString();
      }
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
      classTeacher: classTeacher || "",
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

    return NextResponse.json({
      success: true,
      data: staff,
      staffId,
      // Only returned once at creation — never stored in plaintext after this
      credentials: createLoginAccount && defaultPassword
        ? { email: email.toLowerCase().trim(), password: defaultPassword }
        : null,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/staff error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
