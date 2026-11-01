import mongoose, { Schema } from "mongoose";
const PromiseSubSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    promisedTarget: { type: String, required: true },
    deliveredCount: { type: Number, default: 0 },
    targetCount: { type: Number, default: 1 },
    delivered: { type: Boolean, default: false },
    evidenceIds: [{ type: String }],
}, { _id: true });
const ClubSchema = new Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    tagLine: { type: String, required: true },
    description: { type: String, required: true },
    logo: { type: String, default: "" },
    banner: { type: String, default: "" },
    presidentId: { type: String, required: true },
    presidentName: { type: String, required: true },
    coordinators: [{ type: String }],
    memberCount: { type: Number, default: 0 },
    trustScore: { type: Number, default: 0, min: 0, max: 100 },
    transparencyTier: {
        type: String,
        enum: ["Tier 1 - Gold", "Tier 2 - Silver", "Tier 3 - Bronze", "Under Review"],
        default: "Under Review",
    },
    meetingSchedule: { type: String, required: true },
    recruitmentOpen: { type: Boolean, default: true },
    recruitmentDeadline: { type: String },
    requirements: [{ type: String }],
    promises: [PromiseSubSchema],
    contactEmail: { type: String, required: true },
}, { timestamps: true });
export const ClubModel = mongoose.models.Club || mongoose.model("Club", ClubSchema);

export default ClubModel;
