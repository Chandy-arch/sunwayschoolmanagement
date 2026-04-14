import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import FeeModel from "@/models/Fee";
import StudentModel from "@/models/Student";

// GET /api/fees
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const className = searchParams.get("className") || "";
    const academicYear = searchParams.get("academicYear") || "";
    const feeType = searchParams.get("feeType") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15")));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (className) filter.className = className;
    if (academicYear) filter.academicYear = academicYear;
    if (feeType) filter.feeType = feeType;
    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: "i" } },
      ];
    }

    const [fees, total] = await Promise.all([
      FeeModel.find(filter).sort({ dueDate: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      FeeModel.countDocuments(filter),
    ]);

    // Summary stats (all matching, not just current page)
    const allStats = await FeeModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalPaid: { $sum: "$paidAmount" },
        },
      },
    ]);

    const summary = { totalCollected: 0, totalPending: 0, totalOverdue: 0, byStatus: { paid: 0, pending: 0, partial: 0, overdue: 0 } };
    for (const s of allStats) {
      if (s._id === "Paid") { summary.totalCollected += s.totalPaid; summary.byStatus.paid = s.count; }
      if (s._id === "Pending") { summary.totalPending += (s.totalAmount - s.totalPaid); summary.byStatus.pending = s.count; }
      if (s._id === "Partial") { summary.totalPending += (s.totalAmount - s.totalPaid); summary.byStatus.partial = s.count; }
      if (s._id === "Overdue") { summary.totalOverdue += (s.totalAmount - s.totalPaid); summary.byStatus.overdue = s.count; }
    }
    const totalDue = summary.totalCollected + summary.totalPending + summary.totalOverdue;
    const collectionRate = totalDue > 0 ? Math.round((summary.totalCollected / totalDue) * 100) : 0;

    const feeTypes = await FeeModel.distinct("feeType");
    const classes = await FeeModel.distinct("className");

    return NextResponse.json({
      success: true,
      data: fees,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: { ...summary, collectionRate },
      feeTypes: feeTypes.sort(),
      classes: classes.sort(),
    });
  } catch (error) {
    console.error("GET /api/fees error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/fees — create new fee record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { studentId, feeType, amount, dueDate, academicYear, remarks } = body;

    if (!studentId || !feeType || !amount || !dueDate || !academicYear) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // Fetch student details
    const student = await StudentModel.findById(studentId).lean() as { name: string; className: string; section: string } | null;
    if (!student) {
      return NextResponse.json({ success: false, message: "Student not found" }, { status: 404 });
    }

    const fee = await FeeModel.create({
      studentId,
      studentName: student.name,
      className: student.className || "",
      section: student.section || "",
      feeType,
      amount,
      paidAmount: 0,
      dueDate: new Date(dueDate),
      status: "Pending",
      academicYear,
      remarks: remarks || undefined,
    });

    return NextResponse.json({ success: true, data: fee }, { status: 201 });
  } catch (error) {
    console.error("POST /api/fees error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
