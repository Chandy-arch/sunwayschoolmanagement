import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import StudentModel from "@/models/Student";
import User from "@/models/User";
import crypto from "crypto";

// Generate a readable random password: parentfirstname + @ + 4 random digits
function generatePassword(name: string): string {
  const firstName = name.split(" ").pop()?.toLowerCase().replace(/[^a-z]/g, "") || "parent";
  const digits = crypto.randomInt(1000, 9999);
  return `${firstName}@${digits}`;
}

// POST /api/students/[id]/parent-account — create parent login account
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

    const student = await StudentModel.findById(params.id);
    if (!student) {
      return NextResponse.json({ success: false, message: "Student not found" }, { status: 404 });
    }

    if (!student.parentEmail) {
      return NextResponse.json({ success: false, message: "Parent email is required to create a login account. Please update the student record first." }, { status: 400 });
    }

    // Check if already has a parent account
    if (student.parentId) {
      const existingUser = await User.findById(student.parentId);
      if (existingUser && existingUser.isActive) {
        return NextResponse.json({ success: false, message: "This student's parent already has a login account" }, { status: 409 });
      }
    }

    // Check if email already used by another user
    const existingUserByEmail = await User.findOne({ email: student.parentEmail });
    if (existingUserByEmail) {
      // If this user has role "parent" and isn't linked to another active student, link it
      if (existingUserByEmail.role === "parent") {
        const linkedToOther = await StudentModel.findOne({
          parentId: existingUserByEmail._id,
          _id: { $ne: student._id },
          isActive: true,
        });
        if (!linkedToOther) {
          // Re-activate if deactivated, generate new password, and link
          const plainPassword = generatePassword(student.parentName);
          existingUserByEmail.password = plainPassword;
          existingUserByEmail.isActive = true;
          existingUserByEmail.name = student.parentName;
          await existingUserByEmail.save();

          student.parentId = existingUserByEmail._id;
          await student.save();

          return NextResponse.json({
            success: true,
            data: {
              email: student.parentEmail,
              password: plainPassword,
              parentName: student.parentName,
              studentName: student.name,
              studentId: student.studentId,
            },
            message: "Existing account linked and password reset",
          }, { status: 201 });
        }
        // Parent already linked to another active student — create shared parent account
        // Link this student to the same parent, but reset password
        const plainPassword = generatePassword(student.parentName);
        existingUserByEmail.password = plainPassword;
        existingUserByEmail.isActive = true;
        await existingUserByEmail.save();

        student.parentId = existingUserByEmail._id;
        await student.save();

        return NextResponse.json({
          success: true,
          data: {
            email: student.parentEmail,
            password: plainPassword,
            parentName: student.parentName,
            studentName: student.name,
            studentId: student.studentId,
          },
          message: "Linked to existing parent account (shared with siblings)",
        }, { status: 201 });
      }
      return NextResponse.json({ success: false, message: "An account with this email already exists with a different role" }, { status: 409 });
    }

    // Generate credentials
    const plainPassword = generatePassword(student.parentName);

    const user = await User.create({
      name: student.parentName,
      email: student.parentEmail,
      password: plainPassword,
      role: "parent",
      phone: student.parentPhone,
      isActive: true,
    });

    // Link user to student
    student.parentId = user._id;
    await student.save();

    return NextResponse.json({
      success: true,
      data: {
        email: student.parentEmail,
        password: plainPassword,
        parentName: student.parentName,
        studentName: student.name,
        studentId: student.studentId,
      },
      message: "Parent login account created successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/students/[id]/parent-account error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/students/[id]/parent-account — reset password
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

    const student = await StudentModel.findById(params.id);
    if (!student || !student.parentId) {
      return NextResponse.json({ success: false, message: "No parent login account found for this student" }, { status: 404 });
    }

    const user = await User.findById(student.parentId);
    if (!user) {
      return NextResponse.json({ success: false, message: "Parent user account not found" }, { status: 404 });
    }

    const newPassword = generatePassword(student.parentName);
    user.password = newPassword;
    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        password: newPassword,
        parentName: student.parentName,
        studentName: student.name,
        studentId: student.studentId,
      },
      message: "Parent password reset successfully",
    });
  } catch (error) {
    console.error("PUT /api/students/[id]/parent-account error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/students/[id]/parent-account — revoke parent login access
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

    const student = await StudentModel.findById(params.id);
    if (!student || !student.parentId) {
      return NextResponse.json({ success: false, message: "No parent login account found for this student" }, { status: 404 });
    }

    // Check if other active students share this parentId
    const siblings = await StudentModel.countDocuments({
      parentId: student.parentId,
      _id: { $ne: student._id },
      isActive: true,
    });

    if (siblings === 0) {
      // No other students use this parent account — deactivate it
      await User.findByIdAndUpdate(student.parentId, { $set: { isActive: false } });
    }

    // Unlink from student
    student.parentId = undefined;
    await student.save();

    return NextResponse.json({ success: true, message: "Parent login access revoked" });
  } catch (error) {
    console.error("DELETE /api/students/[id]/parent-account error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
