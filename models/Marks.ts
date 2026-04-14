import mongoose, { Document, Schema } from "mongoose";

export interface IMarks extends Document {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  className: string;
  section: string;
  subject: string;
  examType: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  academicYear: string;
  uploadedBy: mongoose.Types.ObjectId;
  remarks?: string;
}

const MarksSchema = new Schema<IMarks>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    studentName: { type: String, required: true },
    className: { type: String, required: true },
    section: { type: String, required: true },
    subject: { type: String, required: true },
    examType: { type: String, required: true },
    marksObtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, default: 100 },
    percentage: { type: Number },
    grade: { type: String },
    academicYear: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    remarks: { type: String },
  },
  { timestamps: true }
);

MarksSchema.pre("save", function (next) {
  this.percentage = Math.round((this.marksObtained / this.maxMarks) * 100);
  const p = this.percentage;
  if (p >= 91) this.grade = "A+";
  else if (p >= 81) this.grade = "A";
  else if (p >= 71) this.grade = "B+";
  else if (p >= 61) this.grade = "B";
  else if (p >= 51) this.grade = "C+";
  else if (p >= 41) this.grade = "C";
  else if (p >= 35) this.grade = "D";
  else this.grade = "F";
  next();
});

MarksSchema.index({ studentId: 1, examType: 1, subject: 1 });
MarksSchema.index({ className: 1, section: 1, subject: 1, examType: 1 });

export default mongoose.models.Marks || mongoose.model<IMarks>("Marks", MarksSchema);
