import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import AssignmentModel from "@/models/Assignment";
import StaffModel from "@/models/Staff";

// PUT /api/assignments/[id] — staff updates their own assignment
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role;
    if (!session || (role !== "staff" && role !== "admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userId = (session.user as { id?: string }).id;
    const body = await req.json();
    const { title, description, subject, dueDate, academicYear } = body;

    const assignment = await AssignmentModel.findById(id);
    if (!assignment || !assignment.isActive) {
      return NextResponse.json({ success: false, message: "Assignment not found" }, { status: 404 });
    }

    // Staff can only update their own assignments
    if (role === "staff" && assignment.createdBy.toString() !== userId) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    if (title) assignment.title = title.trim();
    if (description) assignment.description = description.trim();
    if (subject) assignment.subject = subject.trim();
    if (dueDate) assignment.dueDate = new Date(dueDate);
    if (academicYear) assignment.academicYear = academicYear;

    await assignment.save();

    return NextResponse.json({ success: true, data: assignment });
  } catch (error) {
    console.error("PUT /api/assignments/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/assignments/[id] — soft delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role;
    if (!session || (role !== "staff" && role !== "admin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userId = (session.user as { id?: string }).id;
    const assignment = await AssignmentModel.findById(id);
    if (!assignment || !assignment.isActive) {
      return NextResponse.json({ success: false, message: "Assignment not found" }, { status: 404 });
    }

    if (role === "staff") {
      const staff = await StaffModel.findOne({ userId, isActive: true }).lean();
      if (!staff || assignment.createdBy.toString() !== userId) {
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
      }
    }

    assignment.isActive = false;
    await assignment.save();

    return NextResponse.json({ success: true, message: "Assignment deleted" });
  } catch (error) {
    console.error("DELETE /api/assignments/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
