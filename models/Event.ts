import mongoose, { Document, Schema } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description?: string;
  eventType: "Holiday" | "Exam" | "Meeting" | "Sports" | "Cultural" | "PTM" | "Other";
  startDate: Date;
  endDate: Date;
  isFullDay: boolean;
  targetAudience: "all" | "staff" | "parent" | "admin";
  className?: string; // optional: target specific class
  createdBy: string;
  color?: string;
  isActive: boolean;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    eventType: {
      type: String,
      enum: ["Holiday", "Exam", "Meeting", "Sports", "Cultural", "PTM", "Other"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isFullDay: { type: Boolean, default: true },
    targetAudience: {
      type: String,
      enum: ["all", "staff", "parent", "admin"],
      default: "all",
    },
    className: { type: String },
    createdBy: { type: String },
    color: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

EventSchema.index({ startDate: 1, endDate: 1 });
EventSchema.index({ eventType: 1 });
EventSchema.index({ targetAudience: 1 });

export default mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);
