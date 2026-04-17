import mongoose, { Document, Schema } from "mongoose";

export interface IStaff extends Document {
  staffId: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  subjects: string[];
  classes: string[];
  classTeacher?: string; // class this staff is the class teacher of
  qualifications: string;
  experience: number;
  salary: number;
  dateOfJoining: string;
  gender: "Male" | "Female" | "Other";
  address: string;
  photo?: string;
  teacherType: "class_teacher" | "subject_teacher";
  userId?: mongoose.Types.ObjectId; // linked User account for login
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    staffId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    subjects: [{ type: String, trim: true }],
    classes: [{ type: String, trim: true }],
    classTeacher: { type: String, trim: true, default: "" },
    qualifications: { type: String, trim: true, default: "" },
    experience: { type: Number, required: true, min: 0 },
    salary: { type: Number, required: true, min: 0 },
    dateOfJoining: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    address: { type: String, trim: true, default: "" },
    photo: { type: String },
    teacherType: { type: String, enum: ["class_teacher", "subject_teacher"], default: "class_teacher" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

StaffSchema.index({ department: 1 });
StaffSchema.index({ designation: 1 });
StaffSchema.index({ isActive: 1 });

// Delete cached model in development so schema changes are always picked up
if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as Record<string, unknown>).Staff;
}

export default mongoose.model<IStaff>("Staff", StaffSchema);
