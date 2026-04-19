import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import AnnouncementModel, { IAnnouncement } from "@/models/Announcement";
import type { Types } from "mongoose";

// GET /api/announcements — list announcements filtered by role
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const role = (session.user as { role?: string }).role || "parent";
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));

    const filter: Record<string, unknown> = { isActive: true };

    if (role === "staff") {
      filter.$or = [{ targetAudience: "staff" }, { targetAudience: "both" }];
    } else if (role === "parent") {
      filter.$or = [{ targetAudience: "parent" }, { targetAudience: "both" }];
    }
    // admin sees all

    const announcements = await AnnouncementModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<(IAnnouncement & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date })[]>();

    return NextResponse.json({
      success: true,
      data: announcements.map((a) => ({
        _id: a._id.toString(),
        title: a.title,
        content: a.content,
        priority: a.priority,
        targetAudience: a.targetAudience,
        createdBy: a.createdBy,
        createdByName: a.createdByName,
        expiresAt: a.expiresAt,
        isActive: a.isActive,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/announcements error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/announcements — create announcement (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { title, content, priority, targetAudience, expiresAt } = body;

    if (!title?.trim() || !content?.trim() || !targetAudience) {
      return NextResponse.json({ success: false, message: "Title, content and audience are required" }, { status: 400 });
    }

    const userId = (session.user as { id?: string }).id || "admin";
    const userName = session.user?.name || "Admin";

    const announcement = await AnnouncementModel.create({
      title: title.trim(),
      content: content.trim(),
      priority: priority || "medium",
      targetAudience,
      createdBy: userId,
      createdByName: userName,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive: true,
    });

    return NextResponse.json({ success: true, data: announcement }, { status: 201 });
  } catch (error) {
    console.error("POST /api/announcements error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
