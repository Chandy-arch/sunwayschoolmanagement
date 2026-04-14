import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import StaffModel from "@/models/Staff";

// GET /api/staff/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const staff = await StaffModel.findById(params.id).lean();
    if (!staff) {
      return NextResponse.json({ success: false, message: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    console.error("GET /api/staff/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/staff/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();

    // Prevent staffId and email from being changed (use a separate flow if needed)
    const { staffId: _staffId, email: _email, userId: _userId, ...updateFields } = body;

    const staff = await StaffModel.findByIdAndUpdate(
      params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    if (!staff) {
      return NextResponse.json({ success: false, message: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    console.error("PUT /api/staff/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/staff/[id] — soft delete (set isActive = false)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const staff = await StaffModel.findByIdAndUpdate(
      params.id,
      { $set: { isActive: false } },
      { new: true }
    ).lean();

    if (!staff) {
      return NextResponse.json({ success: false, message: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Staff member deactivated" });
  } catch (error) {
    console.error("DELETE /api/staff/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
