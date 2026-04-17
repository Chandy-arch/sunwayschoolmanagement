import mongoose, { Document, Schema } from "mongoose";

export interface IAssignment extends Document {
  title: string;
  description: string;
  subject: string;
  className: string;
  section: string;
  dueDate: Date;
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  academicYear: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AssignmentSchema.index({ className: 1, section: 1, academicYear: 1 });
AssignmentSchema.index({ dueDate: 1 });
AssignmentSchema.index({ subject: 1 });

export default mongoose.models.Assignment ||
  mongoose.model<IAssignment>("Assignment", AssignmentSchema);
