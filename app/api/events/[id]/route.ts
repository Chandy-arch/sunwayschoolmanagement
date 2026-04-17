import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import EventModel from "@/models/Event";

// PUT /api/events/[id] — update event (admin only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const { title, description, eventType, startDate, endDate, isFullDay, targetAudience, className, color } = body;

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return NextResponse.json({ success: false, message: "End date cannot be before start date" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title.trim();
    if (description !== undefined) update.description = description.trim();
    if (eventType !== undefined) update.eventType = eventType;
    if (startDate !== undefined) update.startDate = new Date(startDate);
    if (endDate !== undefined) update.endDate = new Date(endDate);
    if (isFullDay !== undefined) update.isFullDay = isFullDay;
    if (targetAudience !== undefined) update.targetAudience = targetAudience;
    if (className !== undefined) update.className = className || undefined;
    if (color !== undefined) update.color = color || undefined;

    const event = await EventModel.findByIdAndUpdate(id, update, { new: true }).lean();

    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: event._id.toString(),
        title: event.title,
        description: event.description || "",
        eventType: event.eventType,
        startDate: event.startDate,
        endDate: event.endDate,
        isFullDay: event.isFullDay,
        targetAudience: event.targetAudience,
        className: event.className || "",
        color: event.color || "",
        isActive: event.isActive,
      },
      message: "Event updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/events/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/events/[id] — soft delete event (admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const event = await EventModel.findByIdAndUpdate(id, { isActive: false }, { new: true });

    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/events/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
