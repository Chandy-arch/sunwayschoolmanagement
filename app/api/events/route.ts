import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import EventModel from "@/models/Event";

// GET /api/events — list events (all authenticated users)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // YYYY-MM
    const year = searchParams.get("year");
    const type = searchParams.get("type");

    const role = (session.user as { role?: string }).role || "parent";

    const filter: Record<string, unknown> = { isActive: true };

    // Filter by audience: show events targeted to this role or "all"
    if (role !== "admin") {
      filter.$or = [
        { targetAudience: "all" },
        { targetAudience: role },
      ];
    }

    // Filter by month
    if (month) {
      const [y, m] = month.split("-").map(Number);
      filter.startDate = { $lte: new Date(y, m, 0, 23, 59, 59) }; // end of month
      filter.endDate = { $gte: new Date(y, m - 1, 1) }; // start of month
    } else if (year) {
      const y = parseInt(year);
      filter.startDate = { $lte: new Date(y, 11, 31, 23, 59, 59) };
      filter.endDate = { $gte: new Date(y, 0, 1) };
    }

    if (type && type !== "all") {
      filter.eventType = type;
    }

    const events = await EventModel.find(filter)
      .sort({ startDate: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: events.map((e) => ({
        _id: e._id.toString(),
        title: e.title,
        description: e.description || "",
        eventType: e.eventType,
        startDate: e.startDate,
        endDate: e.endDate,
        isFullDay: e.isFullDay,
        targetAudience: e.targetAudience,
        className: e.className || "",
        color: e.color || "",
        isActive: e.isActive,
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/events — create event (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { title, description, eventType, startDate, endDate, isFullDay, targetAudience, className, color } = body;

    if (!title || !eventType || !startDate || !endDate) {
      return NextResponse.json({ success: false, message: "Title, type, start date, and end date are required" }, { status: 400 });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return NextResponse.json({ success: false, message: "End date cannot be before start date" }, { status: 400 });
    }

    const event = await EventModel.create({
      title: title.trim(),
      description: description?.trim(),
      eventType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isFullDay: isFullDay ?? true,
      targetAudience: targetAudience || "all",
      className: className || undefined,
      color: color || undefined,
      createdBy: (session.user as { id?: string }).id,
      isActive: true,
    });

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
      message: "Event created successfully",
    });
  } catch (error) {
    console.error("POST /api/events error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
