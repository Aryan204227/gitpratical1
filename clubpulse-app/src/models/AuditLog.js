import mongoose, { Schema } from "mongoose";
const AuditLogSchema = new Schema({
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedByName: { type: String, required: true },
    role: { type: String, required: true },
    targetType: {
        type: String,
        enum: ["task", "application", "evidence", "member", "club"],
        required: true,
    },
    targetId: { type: String, required: true },
    details: { type: String, required: true },
    timestamp: { type: String, required: true },
}, { timestamps: true });
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);

export default AuditLogModel;
