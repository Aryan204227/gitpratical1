import mongoose, { Schema } from "mongoose";
const NotificationSchema = new Schema({
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: [
            "task_assigned",
            "burnout_alert",
            "inactivity_reminder",
            "application_update",
            "evidence_verified",
            "event_reminder",
            "break_request",
        ],
        required: true,
    },
    read: { type: Boolean, default: false },
    link: { type: String },
}, { timestamps: true });
export const NotificationModel = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

export default NotificationModel;
