import mongoose, { Schema } from "mongoose";
const EvidenceSchema = new Schema({
    clubId: { type: String, required: true, index: true },
    clubName: { type: String, required: true },
    eventId: { type: String },
    eventTitle: { type: String },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    date: { type: String, required: true },
    mediaUrls: [{ type: String }],
    reportUrl: { type: String },
    attendanceCount: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ["unverified", "verified", "disputed"],
        default: "unverified",
        index: true,
    },
    submittedBy: { type: String, required: true },
    submittedByName: { type: String, required: true },
    submittedAt: { type: String, required: true },
    verifiedBy: { type: String },
    verifiedByName: { type: String },
    verifiedAt: { type: String },
    disputeReason: { type: String },
}, { timestamps: true });
export const EvidenceModel = mongoose.models.Evidence || mongoose.model("Evidence", EvidenceSchema);

export default EvidenceModel;
