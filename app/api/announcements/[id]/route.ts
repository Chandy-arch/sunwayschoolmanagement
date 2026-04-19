import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import AnnouncementModel from "@/models/Announcement";

// PUT /api/announcements/[id] — update (admin only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { title, content, priority, targetAudience, expiresAt } = body;

    const updated = await AnnouncementModel.findByIdAndUpdate(
      id,
      {
        ...(title && { title: title.trim() }),
        ...(content && { content: content.trim() }),
        ...(priority && { priority }),
        ...(targetAudience && { targetAudience }),
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: "Announcement not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/announcements/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/announcements/[id] — soft delete (admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    await AnnouncementModel.findByIdAndUpdate(id, { isActive: false });

    return NextResponse.json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    console.error("DELETE /api/announcements/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
