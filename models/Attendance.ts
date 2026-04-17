import mongoose, { Document, Schema } from "mongoose";

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  className: string;
  section: string;
  date: Date;
  status: "Present" | "Absent" | "Late" | "Holiday";
  markedBy: mongoose.Types.ObjectId;
  remarks?: string;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    studentName: { type: String, required: true },
    className: { type: String, required: true },
    section: { type: String, required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["Present", "Absent", "Late", "Holiday"], required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    remarks: { type: String },
  },
  { timestamps: true }
);

AttendanceSchema.index({ className: 1, section: 1, date: 1 });
AttendanceSchema.index({ studentId: 1, date: -1 });

export default mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", AttendanceSchema);
