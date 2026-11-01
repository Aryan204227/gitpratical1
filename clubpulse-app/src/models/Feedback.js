import mongoose, { Schema } from "mongoose";

const FeedbackSchema = new Schema(
  {
    clubId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    isAnonymous: { type: Boolean, default: false },
    // Ratings (1-5)
    organizationRating: { type: Number, min: 1, max: 5, required: true },
    taskDistributionRating: { type: Number, min: 1, max: 5, required: true },
    leadershipSupportRating: { type: Number, min: 1, max: 5, required: true },
    participationOpportunitiesRating: { type: Number, min: 1, max: 5, required: true },
    overallRating: { type: Number, min: 1, max: 5, required: true },
    // Text feedback
    positiveAspects: { type: String },
    improvementSuggestions: { type: String },
    additionalComments: { type: String },
    // Only the club leader can read this, not other members
    isVisibleToLeader: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const FeedbackModel =
  mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);
export default FeedbackModel;
