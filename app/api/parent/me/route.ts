import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import StudentModel from "@/models/Student";
import AttendanceModel from "@/models/Attendance";
import MarksModel from "@/models/Marks";
import FeeModel from "@/models/Fee";

// GET /api/parent/me — returns the logged-in parent's children + dashboard data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "parent") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userId = (session.user as { id?: string }).id;

    // Find all active students linked to this parent
    const children = await StudentModel.find({ parentId: userId, isActive: true })
      .sort({ className: 1, name: 1 })
      .lean();

    if (children.length === 0) {
      return NextResponse.json({
        success: true,
        data: { children: [], stats: {} },
        message: "No children found linked to this parent account",
      });
    }

    const childIds = children.map((c) => c._id);

    // Get attendance for all children (current academic year)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yearStart = new Date(today.getFullYear(), 3, 1); // April 1
    if (today.getMonth() < 3) yearStart.setFullYear(yearStart.getFullYear() - 1);

    const attendance = await AttendanceModel.find({
      studentId: { $in: childIds },
      date: { $gte: yearStart, $lte: today },
    }).lean();

    // Get marks for all children (current academic year)
    const currentYear = today.getMonth() >= 3
      ? `${today.getFullYear()}-${today.getFullYear() + 1}`
      : `${today.getFullYear() - 1}-${today.getFullYear()}`;

    const marks = await MarksModel.find({
      studentId: { $in: childIds },
      academicYear: currentYear,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get fees for all children
    const fees = await FeeModel.find({
      studentId: { $in: childIds },
    })
      .sort({ dueDate: -1 })
      .lean();

    // Build per-child data
    const childrenData = children.map((child) => {
      const cid = child._id.toString();

      // Attendance stats
      const childAttendance = attendance.filter((a) => a.studentId.toString() === cid);
      const totalDays = childAttendance.length;
      const present = childAttendance.filter((a) => a.status === "Present").length;
      const absent = childAttendance.filter((a) => a.status === "Absent").length;
      const late = childAttendance.filter((a) => a.status === "Late").length;
      const attendancePercent = totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : 0;

      // Monthly attendance breakdown
      const monthlyAttendance: Record<string, { total: number; present: number; absent: number; late: number }> = {};
      childAttendance.forEach((a) => {
        const key = `${a.date.getFullYear()}-${String(a.date.getMonth() + 1).padStart(2, "0")}`;
        if (!monthlyAttendance[key]) monthlyAttendance[key] = { total: 0, present: 0, absent: 0, late: 0 };
        monthlyAttendance[key].total++;
        if (a.status === "Present") monthlyAttendance[key].present++;
        else if (a.status === "Absent") monthlyAttendance[key].absent++;
        else if (a.status === "Late") monthlyAttendance[key].late++;
      });

      // Daily attendance for calendar view (current month)
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const dailyAttendance = childAttendance
        .filter((a) => a.date >= monthStart)
        .map((a) => ({
          date: a.date.toISOString().slice(0, 10),
          status: a.status,
        }));

      // Marks stats
      const childMarks = marks.filter((m) => m.studentId.toString() === cid);
      const latestExam = childMarks.length > 0 ? childMarks[0].examType : null;
      const latestExamMarks = latestExam
        ? childMarks.filter((m) => m.examType === latestExam)
        : [];
      const avgPercentage =
        latestExamMarks.length > 0
          ? Math.round(latestExamMarks.reduce((sum, m) => sum + (m.percentage || 0), 0) / latestExamMarks.length)
          : 0;

      // Fee stats
      const childFees = fees.filter((f) => f.studentId.toString() === cid);
      const pendingFees = childFees.filter((f) =>
        ["Pending", "Partial", "Overdue"].includes(f.status)
      );
      const totalFeesDue = pendingFees.reduce((sum, f) => sum + (f.amount - (f.paidAmount || 0)), 0);

      return {
        _id: cid,
        studentId: child.studentId,
        name: child.name,
        className: child.className,
        section: child.section,
        rollNumber: child.rollNumber,
        gender: child.gender,
        bloodGroup: child.bloodGroup,
        dateOfBirth: child.dateOfBirth,
        photo: child.photo,
        attendance: {
          totalDays,
          present,
          absent,
          late,
          percentage: attendancePercent,
          monthly: monthlyAttendance,
          daily: dailyAttendance,
        },
        marks: childMarks.map((m) => ({
          _id: m._id.toString(),
          subject: m.subject,
          examType: m.examType,
          marksObtained: m.marksObtained,
          maxMarks: m.maxMarks,
          percentage: m.percentage,
          grade: m.grade,
          remarks: m.remarks,
        })),
        latestExam,
        avgPercentage,
        fees: childFees.map((f) => ({
          _id: f._id.toString(),
          feeType: f.feeType,
          amount: f.amount,
          paidAmount: f.paidAmount || 0,
          dueDate: f.dueDate,
          status: f.status,
          paymentDate: f.paymentDate,
          paymentMethod: f.paymentMethod,
        })),
        totalFeesDue,
      };
    });

    // Aggregate stats across all children
    const totalPresent = childrenData.reduce((s, c) => s + c.attendance.present, 0);
    const totalDays = childrenData.reduce((s, c) => s + c.attendance.totalDays, 0);
    const overallAttendance = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;
    const totalFeesDue = childrenData.reduce((s, c) => s + c.totalFeesDue, 0);

    return NextResponse.json({
      success: true,
      data: {
        parentName: (session.user as { name?: string }).name || children[0]?.parentName || "Parent",
        children: childrenData,
        stats: {
          totalChildren: childrenData.length,
          overallAttendance,
          totalFeesDue,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/parent/me error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
