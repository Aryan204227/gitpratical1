import mongoose, { Schema } from "mongoose";
const MembershipSchema = new Schema({
    userId: { type: String, required: true, index: true },
    clubId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userAvatar: { type: String, default: "" },
    department: { type: String, required: true },
    clubRole: {
        type: String,
        enum: ["president", "coordinator", "core_team", "member"],
        default: "member",
    },
    status: {
        type: String,
        enum: ["active", "low_activity", "inactive", "on_leave"],
        default: "active",
        index: true,
    },
    joinedAt: { type: String, required: true },
    lastActiveAt: { type: String, required: true },
    attendanceRate: { type: Number, default: 0, min: 0, max: 100 },
    tasksCompleted: { type: Number, default: 0 },
    tasksPending: { type: Number, default: 0 },
    estimatedWeeklyHours: { type: Number, default: 0 },
    contributionScore: { type: Number, default: 0, min: 0, max: 100 },
    leaveDetails: {
        onLeave: { type: Boolean, default: false },
        reason: { type: String },
        startDate: { type: String },
        endDate: { type: String },
        approvedAt: { type: String },
    },
    inactivityExplanation: { type: String },
    lastReminderSentAt: { type: String },
}, { timestamps: true });
MembershipSchema.index({ userId: 1, clubId: 1 }, { unique: true });
export const MembershipModel = mongoose.models.Membership || mongoose.model("Membership", MembershipSchema);

export default MembershipModel;
