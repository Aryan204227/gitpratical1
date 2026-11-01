import mongoose, { Schema } from "mongoose";

const EventSchema = new Schema(
  {
    clubId: { type: String, required: true, index: true },
    clubName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    eventDate: { type: Date, required: true },
    location: { type: String },
    createdById: { type: String, required: true },
    attendees: [{ type: String }], // userIds
    maxAttendees: { type: Number },
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const EventModel =
  mongoose.models.Event || mongoose.model("Event", EventSchema);
export default EventModel;
