import mongoose, { Schema } from "mongoose";
const ApplicationSchema = new Schema({
    userId: { type: String, required: true, index: true },
    clubId: { type: String, required: true, index: true },
    clubName: { type: String, required: true },
    applicantName: { type: String, required: true },
    applicantEmail: { type: String, required: true },
    applicantAvatar: { type: String, default: "" },
    department: { type: String, required: true },
    year: { type: String, required: true },
    roleApplied: { type: String, default: "Member" },
    reason: { type: String, required: true },
    skills: [{ type: String }],
    weeklyHoursAvailable: { type: Number, required: true, min: 1 },
    status: {
        type: String,
        enum: ["pending", "under_review", "accepted", "rejected"],
        default: "pending",
        index: true,
    },
    appliedAt: { type: String, required: true },
    reviewedAt: { type: String },
    reviewerId: { type: String },
    reviewerNotes: { type: String },
}, { timestamps: true });
export const ApplicationModel = mongoose.models.Application || mongoose.model("Application", ApplicationSchema);

export default ApplicationModel;
