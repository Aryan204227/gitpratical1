import mongoose, { Schema } from "mongoose";
const TaskSchema = new Schema({
    clubId: { type: String, required: true, index: true },
    clubName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ["event_prep", "marketing", "logistics", "technical", "content", "sponsorship"],
        default: "logistics",
    },
    assigneeId: { type: String, required: true, index: true },
    assigneeName: { type: String, required: true },
    assigneeRole: { type: String, default: "member" },
    assigneeAvatar: { type: String, default: "" },
    assignedById: { type: String, required: true },
    assignedByName: { type: String, required: true },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium",
    },
    estimatedHours: { type: Number, required: true, min: 1 },
    dueDate: { type: String, required: true },
    status: {
        type: String,
        enum: ["todo", "in_progress", "review", "completed", "blocked"],
        default: "todo",
        index: true,
    },
    completedAt: { type: String },
    notes: { type: String },
    isDelegated: { type: Boolean, default: false },
    delegatedFrom: { type: String },
}, { timestamps: true });
export const TaskModel = mongoose.models.Task || mongoose.model("Task", TaskSchema);

export default TaskModel;
