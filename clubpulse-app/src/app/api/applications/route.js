import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";
import { canManageClub } from "@/lib/authorization";

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("clubId");
    const requestedUserId = searchParams.get("userId");
    const userId = session.role === "student" ? session.userId : requestedUserId;

    let applications = await db.getApplications(clubId);
    if (session.role === "leader") {
      const clubs = await db.getClubs();
      const managedIds = clubs.filter((club) => String(club.presidentId) === session.userId).map((club) => String(club._id));
      applications = applications.filter((application) => managedIds.includes(String(application.clubId)));
    }
    if (userId) {
      applications = applications.filter((a) => String(a.userId) === String(userId));
    }
    return NextResponse.json({ success: true, applications: applications.map((application) => ({ ...application, id: String(application._id || application.id), role: application.roleApplied })) });
  } catch (error) {
    console.error("Applications GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch applications" }, { status: 500 });
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
      applicantName,
      applicantEmail,
      applicantAvatar,
      roleApplied,
      reason,
      skills,
      weeklyHoursAvailable,
    } = body;

    const userId = session.userId;
    const applicant = await db.getUserById(userId);
    if (!applicant) return NextResponse.json({ success: false, error: "Authenticated user record not found." }, { status: 404 });
    if (!clubId || !reason?.trim() || !Number.isFinite(Number(weeklyHoursAvailable)) || Number(weeklyHoursAvailable) < 1) {
      return NextResponse.json({ success: false, error: "Missing required application fields" }, { status: 400 });
    }

    const club = await db.getClubById(clubId);
    if (!club || !club.recruitmentOpen) return NextResponse.json({ success: false, error: "This club is not accepting applications." }, { status: 400 });
    // Check if already applied
    const existingApps = await db.getApplications(clubId);
    const duplicate = existingApps.find(
      (a) => String(a.userId) === String(userId) && (a.status === "pending" || a.status === "under_review")
    );
    if (duplicate) {
      return NextResponse.json({ success: true, application: duplicate, updated: true });
    }

    const application = await db.createApplication({
      userId,
      clubId,
      clubName: club.name,
      applicantName: applicant.name,
      applicantEmail: applicant.email,
      applicantAvatar: applicant.avatar || "",
      department: applicant.department || "",
      year: applicant.year || "",
      roleApplied: roleApplied || "Member",
      reason,
      skills: Array.isArray(skills) ? skills : [skills],
      weeklyHoursAvailable: Number(weeklyHoursAvailable),
    });
    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("POST /api/applications error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to submit application" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    if (!["leader", "admin"].includes(session.role)) return NextResponse.json({ success: false, error: "Leader access required." }, { status: 403 });
    await connectMongoose();
    const body = await request.json();
    const { id, status, reviewerNotes, reviewerId, reviewerName } = body;
    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Missing id or status" }, { status: 400 });
    }
    const applicationRecord = (await db.getApplications()).find((item) => String(item._id) === String(id));
    if (!applicationRecord) return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    if (!(await canManageClub(session, applicationRecord.clubId))) return NextResponse.json({ success: false, error: "You can only review applications for your own club." }, { status: 403 });
    const reviewer = await db.getUserById(session.userId);
    const updated = await db.updateApplicationStatus(
      id,
      status,
      reviewerNotes || "",
      session.userId,
      reviewer?.name || "Club Reviewer"
    );
    if (!updated) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    console.error("PATCH /api/applications error:", error);
    return NextResponse.json({ success: false, error: "Failed to update application" }, { status: 500 });
  }
}
