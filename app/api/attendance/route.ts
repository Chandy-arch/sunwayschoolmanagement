import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import AttendanceModel from "@/models/Attendance";
import StaffModel from "@/models/Staff";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");
    const section = searchParams.get("section");
    const date = searchParams.get("date");
    const studentId = searchParams.get("studentId");
    const month = searchParams.get("month");

    const filter: Record<string, unknown> = {};
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (studentId) filter.studentId = studentId;

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    } else if (month) {
      const [year, mon] = month.split("-").map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 1);
      filter.date = { $gte: start, $lt: end };
    }

    const records = await AttendanceModel.find(filter)
      .sort({ date: -1, studentName: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: records.map((r) => ({
        _id: String(r._id),
        studentId: r.studentId.toString(),
        studentName: r.studentName,
        className: r.className,
        section: r.section,
        date: r.date.toISOString().split("T")[0],
        status: r.status,
        remarks: r.remarks,
        markedBy: r.markedBy?.toString(),
      })),
      total: records.length,
    });
  } catch (error) {
    console.error("GET /api/attendance error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const records = body.records || [body];
    const userId = (session.user as { id?: string }).id;
    const role = (session.user as { role?: string }).role;

    // Staff may only mark attendance for their own class teacher class
    if (role === "staff") {
      const staffProfile = await StaffModel.findOne({ userId, isActive: true }).lean();
      if (!staffProfile) {
        return NextResponse.json(
          { success: false, message: "Staff profile not found." },
          { status: 403 }
        );
      }

      // Determine which class this staff can mark attendance for:
      // - Explicit classTeacher field, OR
      // - Single-class staff (backward-compat: treat as class teacher of their only class)
      const isSingleClass = staffProfile.classes.length === 1;
      const allowedClass: string | null =
        staffProfile.classTeacher ||
        (isSingleClass ? staffProfile.classes[0] : null);

      if (!allowedClass) {
        return NextResponse.json(
          { success: false, message: "You are not assigned as a class teacher and cannot mark attendance." },
          { status: 403 }
        );
      }
      const unauthorisedRecord = records.find(
        (r: { className: string }) => r.className !== allowedClass
      );
      if (unauthorisedRecord) {
        return NextResponse.json(
          { success: false, message: `You can only mark attendance for your assigned class: ${allowedClass}.` },
          { status: 403 }
        );
      }
    }

    const saved = [];
    for (const r of records) {
      const dateObj = new Date(r.date);
      dateObj.setHours(0, 0, 0, 0);
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);

      const doc = await AttendanceModel.findOneAndUpdate(
        {
          studentId: r.studentId,
          date: { $gte: dateObj, $lt: nextDay },
        },
        {
          studentId: r.studentId,
          studentName: r.studentName,
          className: r.className,
          section: r.section,
          date: dateObj,
          status: r.status,
          markedBy: userId,
          remarks: r.remarks || "",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      saved.push(doc);
    }

    return NextResponse.json({
      success: true,
      data: saved.map((s) => ({
        _id: s._id.toString(),
        studentId: s.studentId.toString(),
        studentName: s.studentName,
        className: s.className,
        section: s.section,
        date: s.date.toISOString().split("T")[0],
        status: s.status,
      })),
      message: `${saved.length} attendance record(s) saved`,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/attendance error:", error);
    return NextResponse.json({ success: false, message: "Failed to save attendance" }, { status: 500 });
  }
}
