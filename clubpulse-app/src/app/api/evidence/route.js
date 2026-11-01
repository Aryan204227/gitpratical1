import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("clubId");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    let evidence = await db.getEvidence(clubId);
    if (session.role === "student") evidence = evidence.filter((item) => String(item.submittedBy) === session.userId);
    if (session.role === "leader") {
      const clubs = await db.getClubs();
      const managedClubIds = clubs.filter((club) => String(club.presidentId) === session.userId).map((club) => String(club._id));
      evidence = evidence.filter((item) => managedClubIds.includes(String(item.clubId)));
    }
    if (status) {
      evidence = evidence.filter((e) => e.status === status);
    }
    if (userId) {
      evidence = evidence.filter((e) => String(e.submittedBy) === String(userId));
    }
    return NextResponse.json({ success: true, evidence: evidence.map((item) => ({ ...item, id: String(item._id || item.id) })) });
  } catch (error) {
    console.error("Evidence GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch evidence" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const body = await request.json();
    const {
      clubId,
      clubName,
      eventId,
      eventTitle,
      title,
      description,
      category,
      date,
      mediaUrls,
      reportUrl,
      attendanceCount,
      submittedByName,
    } = body;
    const submittedBy = session.userId;

    if (!clubId || !title || !description) {
      return NextResponse.json({ success: false, error: "Missing required evidence fields" }, { status: 400 });
    }

    const club = await db.getClubById(clubId);
    if (!club) return NextResponse.json({ success: false, error: "Club not found." }, { status: 404 });
    const user = await db.getUserById(session.userId);
    if (session.role === "student") {
      const memberships = await db.getUserMemberships(session.userId);
      if (!memberships.some((membership) => String(membership.clubId) === String(clubId))) return NextResponse.json({ success: false, error: "You must be a club member to submit evidence." }, { status: 403 });
    } else if (session.role === "leader" && String(club.presidentId) !== session.userId) {
      return NextResponse.json({ success: false, error: "You can only submit evidence for your own club." }, { status: 403 });
    }
    const newEvidence = await db.createEvidence({
      clubId: String(club._id || club.id),
      clubName: club.name,
      eventId,
      eventTitle,
      title,
      description,
      category: category || "Club Activity",
      date: date || new Date().toISOString().split("T")[0],
      mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
      reportUrl,
      attendanceCount: Number(attendanceCount) || 0,
      submittedBy,
      submittedByName: user?.name || "Member",
    });
    return NextResponse.json({ success: true, evidence: newEvidence });
  } catch (error) {
    console.error("Evidence POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit evidence" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ success: false, error: "Administrator access required." }, { status: 403 });
    await connectMongoose();
    const body = await request.json();
    const { id, status, verifierId, verifierName, disputeReason } = body;
    if (!id || !status || (status !== "verified" && status !== "disputed")) {
      return NextResponse.json(
        { success: false, error: "Missing required verification status (verified or disputed)" },
        { status: 400 }
      );
    }
    const verifier = await db.getUserById(session.userId);
    const updated = await db.verifyEvidence(
      id,
      status,
      session.userId,
      verifier?.name || "Administrator",
      disputeReason
    );
    if (!updated) {
      return NextResponse.json({ success: false, error: "Evidence not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, evidence: updated });
  } catch (error) {
    console.error("Evidence PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to audit evidence" }, { status: 500 });
  }
}
