import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import StaffModel from "@/models/Staff";
import User from "@/models/User";
import crypto from "crypto";

// Generate a readable random password: firstname + @ + 4 random digits
function generatePassword(name: string): string {
  const firstName = name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");
  const digits = crypto.randomInt(1000, 9999);
  return `${firstName}@${digits}`;
}

// POST /api/staff/[id]/account — create login account for staff
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const staff = await StaffModel.findById(params.id);
    if (!staff) {
      return NextResponse.json({ success: false, message: "Staff member not found" }, { status: 404 });
    }

    // Check if already has an account
    if (staff.userId) {
      const existingUser = await User.findById(staff.userId);
      if (existingUser) {
        return NextResponse.json({ success: false, message: "This staff member already has a login account" }, { status: 409 });
      }
    }

    // Check if email already used by another user
    const existingUserByEmail = await User.findOne({ email: staff.email });
    if (existingUserByEmail) {
      // If this user has role "staff" and isn't linked to anyone else, link it
      if (existingUserByEmail.role === "staff") {
        const linkedToOther = await StaffModel.findOne({ userId: existingUserByEmail._id, _id: { $ne: staff._id } });
        if (!linkedToOther) {
          // Re-activate if deactivated, generate new password, and link
          const plainPassword = generatePassword(staff.name);
          existingUserByEmail.password = plainPassword;
          existingUserByEmail.isActive = true;
          existingUserByEmail.name = staff.name;
          await existingUserByEmail.save();

          staff.userId = existingUserByEmail._id;
          await staff.save();

          return NextResponse.json({
            success: true,
            data: {
              email: staff.email,
              password: plainPassword,
              staffName: staff.name,
              staffId: staff.staffId,
            },
            message: "Existing account linked and password reset",
          }, { status: 201 });
        }
      }
      return NextResponse.json({ success: false, message: "An account with this email already exists" }, { status: 409 });
    }

    // Generate credentials
    const plainPassword = generatePassword(staff.name);

    const user = await User.create({
      name: staff.name,
      email: staff.email,
      password: plainPassword, // pre-save hook in User model will hash it
      role: "staff",
      phone: staff.phone,
      isActive: true,
    });

    // Link user to staff
    staff.userId = user._id;
    await staff.save();

    return NextResponse.json({
      success: true,
      data: {
        email: staff.email,
        password: plainPassword, // show once to admin
        staffName: staff.name,
        staffId: staff.staffId,
      },
      message: "Login account created successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/staff/[id]/account error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/staff/[id]/account — reset password
export async function PUT(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const staff = await StaffModel.findById(params.id);
    if (!staff || !staff.userId) {
      return NextResponse.json({ success: false, message: "No login account found for this staff member" }, { status: 404 });
    }

    const user = await User.findById(staff.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: "User account not found" }, { status: 404 });
    }

    const newPassword = generatePassword(staff.name);
    user.password = newPassword; // pre-save hook will hash
    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        email: staff.email,
        password: newPassword,
        staffName: staff.name,
        staffId: staff.staffId,
      },
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("PUT /api/staff/[id]/account error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/staff/[id]/account — revoke login access
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

    const staff = await StaffModel.findById(params.id);
    if (!staff || !staff.userId) {
      return NextResponse.json({ success: false, message: "No login account found for this staff member" }, { status: 404 });
    }

    // Deactivate the user account (soft delete)
    await User.findByIdAndUpdate(staff.userId, { $set: { isActive: false } });

    // Unlink from staff
    staff.userId = undefined;
    await staff.save();

    return NextResponse.json({ success: true, message: "Login access revoked" });
  } catch (error) {
    console.error("DELETE /api/staff/[id]/account error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
