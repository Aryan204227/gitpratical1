import mongoose, { Schema } from "mongoose";

const AvailabilitySchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    weeklyAvailableHours: { type: Number, default: 0, min: 0, max: 40 },
    preferredCategories: [{ type: String }],
    onBreak: { type: Boolean, default: false },
    breakReason: { type: String },
    breakStartDate: { type: Date },
    breakEndDate: { type: Date },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const AvailabilityModel =
  mongoose.models.Availability || mongoose.model("Availability", AvailabilitySchema);
export default AvailabilityModel;
