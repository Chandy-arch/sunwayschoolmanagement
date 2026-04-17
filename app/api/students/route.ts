import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import StudentModel from "@/models/Student";
import FeeModel from "@/models/Fee";

// GET /api/students — list with search, class filter, pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const classId = searchParams.get("classId") || "";
    const className = searchParams.get("className") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isActive: true };
    if (classId) filter.classId = classId;
    if (className) filter.className = className;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { admissionNumber: { $regex: search, $options: "i" } },
        { parentName: { $regex: search, $options: "i" } },
      ];
    }

    const [students, total] = await Promise.all([
      StudentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      StudentModel.countDocuments(filter),
    ]);

    // Distinct class names for filter dropdown
    const classes = await StudentModel.distinct("className", { isActive: true });

    // Look up latest fee record per student in current page
    const studentIds = students.map((s) => s._id);
    const latestFees = await FeeModel.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$studentId", status: { $first: "$status" }, feeType: { $first: "$feeType" }, amount: { $first: "$amount" }, paidAmount: { $first: "$paidAmount" }, dueDate: { $first: "$dueDate" } } },
    ]);
    const feeMap = new Map(latestFees.map((f) => [String(f._id), f]));

    // Attach fee info to each student
    const studentsWithFees = students.map((s) => {
      const fee = feeMap.get(String(s._id));
      return {
        ...s,
        hasParentAccount: !!s.parentId,
        fees: fee ? [{ status: fee.status, feeType: fee.feeType, amount: fee.amount, paidAmount: fee.paidAmount, dueDate: fee.dueDate }] : [],
      };
    });

    // Summary stats
    const [activeCount, pendingFeesCount] = await Promise.all([
      StudentModel.countDocuments({ isActive: true }),
      FeeModel.distinct("studentId", { status: { $in: ["Pending", "Partial", "Overdue"] } }).then((ids) => ids.length),
    ]);

    return NextResponse.json({
      success: true,
      data: studentsWithFees,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      classes: classes.sort(),
      stats: { total: activeCount, active: activeCount, pendingFees: pendingFeesCount },
    });
  } catch (error) {
    console.error("GET /api/students error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/students — create new student
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      name, email, phone, dateOfBirth, gender, bloodGroup, address,
      className, section, rollNumber, parentName, parentPhone, parentEmail,
      admissionDate,
    } = body;

    if (!name || !dateOfBirth || !gender || !className || !section || !parentName || !parentPhone) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // Generate sequential student ID: PA + year + 4-digit count
    const year = new Date().getFullYear();
    const count = await StudentModel.countDocuments();
    const studentId = `PA${year}${String(count + 1).padStart(4, "0")}`;
    const admissionNumber = `ADM${year}${String(count + 1).padStart(5, "0")}`;

    const student = await StudentModel.create({
      studentId,
      admissionNumber,
      name: name.trim(),
      email: email?.toLowerCase().trim() || "",
      phone: phone?.trim() || "",
      dateOfBirth: new Date(dateOfBirth),
      gender,
      bloodGroup: bloodGroup || "",
      address: address?.trim() || "",
      className: className.trim(),
      section: section.trim(),
      rollNumber: rollNumber ? Number(rollNumber) : undefined,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      parentEmail: parentEmail?.toLowerCase().trim() || "",
      admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
      isActive: true,
    });

    return NextResponse.json({ success: true, data: student, studentId, admissionNumber }, { status: 201 });
  } catch (error) {
    console.error("POST /api/students error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
