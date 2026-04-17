import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import FeeModel from "@/models/Fee";

// GET /api/fees/[id]
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const fee = await FeeModel.findById(params.id).lean();
    if (!fee) return NextResponse.json({ success: false, message: "Fee not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: fee });
  } catch (error) {
    console.error("GET /api/fees/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/fees/[id] — update fee or record a payment
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    await connectDB();

    const body = await request.json();
    const fee = await FeeModel.findById(params.id);
    if (!fee) return NextResponse.json({ success: false, message: "Fee not found" }, { status: 404 });

    // Payment collection
    if (body.collectPayment) {
      const { paidAmount, paymentMethod, paidDate, remarks } = body;
      const newPaid = (fee.paidAmount || 0) + Number(paidAmount);
      fee.paidAmount = newPaid;
      fee.paymentMethod = paymentMethod;
      fee.paidDate = paidDate ? new Date(paidDate) : new Date();
      if (remarks) fee.remarks = remarks;

      if (newPaid >= fee.amount) {
        fee.status = "Paid";
        // Generate receipt number: RCP-YYYY-XXXXXX
        if (!fee.receiptNumber) {
          const year = new Date().getFullYear();
          const count = await FeeModel.countDocuments({ receiptNumber: { $exists: true, $ne: null } });
          fee.receiptNumber = `RCP-${year}-${String(count + 1).padStart(5, "0")}`;
        }
      } else if (newPaid > 0) {
        fee.status = "Partial";
      }
      await fee.save();
      return NextResponse.json({ success: true, data: fee });
    }

    // General update (due date, amount, remarks, etc.)
    const allowed = ["feeType", "amount", "dueDate", "academicYear", "remarks"];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === "dueDate") {
          (fee as Record<string, unknown>)[key] = new Date(body[key] as string);
        } else {
          (fee as Record<string, unknown>)[key] = body[key];
        }
      }
    }

    // Re-evaluate status if amount changed
    const now = new Date();
    if (fee.paidAmount >= fee.amount) {
      fee.status = "Paid";
    } else if (fee.paidAmount > 0) {
      fee.status = "Partial";
    } else if (fee.dueDate < now) {
      fee.status = "Overdue";
    } else {
      fee.status = "Pending";
    }

    await fee.save();
    return NextResponse.json({ success: true, data: fee });
  } catch (error) {
    console.error("PUT /api/fees/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/fees/[id]
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    await FeeModel.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/fees/[id] error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
