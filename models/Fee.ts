import mongoose, { Document, Schema } from "mongoose";

export interface IFee extends Document {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  className: string;
  section: string;
  feeType: string;
  amount: number;
  paidAmount: number;
  dueDate: Date;
  paidDate?: Date;
  status: "Paid" | "Pending" | "Partial" | "Overdue";
  academicYear: string;
  receiptNumber?: string;
  paymentMethod?: string;
  remarks?: string;
}

const FeeSchema = new Schema<IFee>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    studentName: { type: String, required: true },
    className: { type: String, default: "" },
    section: { type: String, default: "" },
    feeType: { type: String, required: true },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date },
    status: { type: String, enum: ["Paid", "Pending", "Partial", "Overdue"], default: "Pending" },
    academicYear: { type: String, required: true },
    receiptNumber: { type: String, unique: true, sparse: true },
    paymentMethod: { type: String },
    remarks: { type: String },
  },
  { timestamps: true }
);

FeeSchema.index({ studentId: 1, academicYear: 1 });
FeeSchema.index({ status: 1, dueDate: 1 });
FeeSchema.index({ className: 1, academicYear: 1 });

export default mongoose.models.Fee || mongoose.model<IFee>("Fee", FeeSchema);
