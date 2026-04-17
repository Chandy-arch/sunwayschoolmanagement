import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import MarksModel from "@/models/Marks";

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
    const studentId = searchParams.get("studentId");
    const examType = searchParams.get("examType");
    const subject = searchParams.get("subject");
    const academicYear = searchParams.get("academicYear");

    const filter: Record<string, unknown> = {};
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (studentId) filter.studentId = studentId;
    if (examType) filter.examType = examType;
    if (subject) filter.subject = subject;
    if (academicYear) filter.academicYear = academicYear;

    const marks = await MarksModel.find(filter)
      .sort({ studentName: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: marks.map((m) => ({
        _id: m._id.toString(),
        studentId: m.studentId.toString(),
        studentName: m.studentName,
        className: m.className,
        section: m.section,
        subject: m.subject,
        examType: m.examType,
        marksObtained: m.marksObtained,
        maxMarks: m.maxMarks,
        percentage: m.percentage,
        grade: m.grade,
        academicYear: m.academicYear,
      })),
      total: marks.length,
    });
  } catch (error) {
    console.error("GET /api/marks error:", error);
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

    const saved = [];
    for (const r of records) {
      // Upsert: student + class + subject + examType + academicYear
      const doc = await MarksModel.findOneAndUpdate(
        {
          studentId: r.studentId,
          className: r.className,
          section: r.section,
          subject: r.subject,
          examType: r.examType,
          academicYear: r.academicYear,
        },
        {
          studentId: r.studentId,
          studentName: r.studentName,
          className: r.className,
          section: r.section,
          subject: r.subject,
          examType: r.examType,
          marksObtained: r.marksObtained,
          maxMarks: r.maxMarks || 100,
          percentage: Math.round((r.marksObtained / (r.maxMarks || 100)) * 100),
          grade: calcGrade(r.marksObtained, r.maxMarks || 100),
          academicYear: r.academicYear,
          uploadedBy: userId,
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
        subject: s.subject,
        examType: s.examType,
        marksObtained: s.marksObtained,
        maxMarks: s.maxMarks,
        percentage: s.percentage,
        grade: s.grade,
      })),
      message: `${saved.length} marks record(s) saved`,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/marks error:", error);
    return NextResponse.json({ success: false, message: "Failed to save marks" }, { status: 500 });
  }
}

function calcGrade(obtained: number, max: number): string {
  const p = Math.round((obtained / max) * 100);
  if (p >= 91) return "A+";
  if (p >= 81) return "A";
  if (p >= 71) return "B+";
  if (p >= 61) return "B";
  if (p >= 51) return "C+";
  if (p >= 41) return "C";
  if (p >= 35) return "D";
  return "F";
}
