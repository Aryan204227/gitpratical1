import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    if (!["leader", "admin"].includes(session.role)) return NextResponse.json({ success: false, error: "Leader access required." }, { status: 403 });
    await connectMongoose();
    const url = new URL(request.url);
    const clubId = url.searchParams.get("clubId");
    const userId = session.userId; // authenticated requester
    if (!clubId) {
      return NextResponse.json({ success: false, error: "clubId is required." }, { status: 400 });
    }
    // Verify the requesting user is the club leader - done here simply by checking the club
    const club = await db.getClubById(clubId);
    if (!club) {
      return NextResponse.json({ success: false, error: "Club not found." }, { status: 404 });
    }
    if (session.role !== "admin" && String(club.presidentId) !== String(userId)) {
      return NextResponse.json({ success: false, error: "Only the club leader can view feedback." }, { status: 403 });
    }
    const feedback = await db.getFeedback(clubId);
    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error("Feedback GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load feedback." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const body = await request.json();
    const { clubId, isAnonymous, organizationRating, taskDistributionRating, leadershipSupportRating, participationOpportunitiesRating, overallRating, positiveAspects, improvementSuggestions, additionalComments } = body;
    const userId = session.userId;
    if (!clubId || !overallRating) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }
    const fb = await db.createFeedback({ clubId, userId, isAnonymous: !!isAnonymous, organizationRating, taskDistributionRating, leadershipSupportRating, participationOpportunitiesRating, overallRating, positiveAspects, improvementSuggestions, additionalComments, isVisibleToLeader: true });
    return NextResponse.json({ success: true, feedback: fb });
  } catch (error) {
    console.error("Feedback POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit feedback." }, { status: 500 });
  }
}
