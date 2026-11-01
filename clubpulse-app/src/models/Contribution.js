import mongoose, { Schema } from "mongoose";

const ContributionSchema = new Schema(
  {
    taskId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    clubId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    taskTitle: { type: String, required: true },
    clubName: { type: String, required: true },
    // Evidence submitted for this contribution
    evidenceUrl: { type: String },
    evidenceType: {
      type: String,
      enum: ["url", "github", "document", "image", "report", "other"],
      default: "other",
    },
    description: { type: String, required: true },
    hoursSpent: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["submitted", "under_review", "approved", "rejected"],
      default: "submitted",
      index: true,
    },
    reviewedBy: { type: String },
    reviewedByName: { type: String },
    reviewNote: { type: String },
    reviewedAt: { type: Date },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ContributionModel =
  mongoose.models.Contribution || mongoose.model("Contribution", ContributionSchema);
export default ContributionModel;
