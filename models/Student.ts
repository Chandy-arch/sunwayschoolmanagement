import mongoose, { Document, Schema } from "mongoose";

export interface IStudent extends Document {
  studentId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: "Male" | "Female" | "Other";
  bloodGroup: string;
  address: string;
  photo?: string;
  classId: mongoose.Types.ObjectId;
  className: string;
  section: string;
  rollNumber: number;
  parentId: mongoose.Types.ObjectId;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  admissionDate: Date;
  admissionNumber: string;
  isActive: boolean;
}

const StudentSchema = new Schema<IStudent>(
  {
    studentId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    bloodGroup: { type: String },
    address: { type: String },
    photo: { type: String },
    classId: { type: Schema.Types.ObjectId, ref: "Class" },
    className: { type: String, required: true },
    section: { type: String, required: true },
    rollNumber: { type: Number },
    parentId: { type: Schema.Types.ObjectId, ref: "User" },
    parentName: { type: String },
    parentPhone: { type: String },
    parentEmail: { type: String },
    admissionDate: { type: Date, default: Date.now },
    admissionNumber: { type: String, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

StudentSchema.index({ classId: 1, section: 1 });
StudentSchema.index({ parentId: 1 });
StudentSchema.index({ isActive: 1 });
StudentSchema.index({ admissionNumber: 1 }, { unique: true, sparse: true });
StudentSchema.index({ name: "text", studentId: "text", admissionNumber: "text" });

export default mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);
