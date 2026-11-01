import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";
import { canManageClub } from "@/lib/authorization";

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const url = new URL(request.url);
    const requestedUserId = url.searchParams.get("userId");
    const clubId = url.searchParams.get("clubId");
    const filter = {};
    if (session.role === "student") filter.userId = session.userId;
    else if (requestedUserId) filter.userId = requestedUserId;
    if (clubId) filter.clubId = clubId;
    let contributions = await db.getContributions(filter);
    if (session.role === "leader") {
      const clubs = await db.getClubs();
      const managedIds = clubs.filter((club) => String(club.presidentId) === session.userId).map((club) => String(club._id));
      contributions = contributions.filter((item) => managedIds.includes(String(item.clubId)));
    }
    return NextResponse.json({ success: true, contributions: contributions.map((item) => ({ ...item, id: String(item._id || item.id) })) });
  } catch (error) {
    console.error("Contributions GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load contributions." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const body = await request.json();
    const { taskId, clubId, userName, taskTitle, clubName, evidenceUrl, evidenceType, description, hoursSpent } = body;
    const userId = session.userId;
    if (!taskId || !clubId || !description) {
      return NextResponse.json({ success: false, error: "Missing required fields: taskId, userId, clubId, description." }, { status: 400 });
    }
    const task = await db.getTaskById(taskId);
    if (!task || String(task.assigneeId) !== session.userId || String(task.clubId) !== String(clubId)) return NextResponse.json({ success: false, error: "You can submit contributions only for your own assigned task." }, { status: 403 });
    const user = await db.getUserById(session.userId);
    const club = await db.getClubById(clubId);
    if (!club || !user) return NextResponse.json({ success: false, error: "Club or member record not found." }, { status: 404 });
    const contribution = await db.createContribution({ taskId, userId, clubId, userName: user.name, taskTitle: task.title, clubName: club.name, evidenceUrl, evidenceType, description, hoursSpent: Number(hoursSpent) || 0 });
    await db.updateTask(taskId, { status: "review" });
    return NextResponse.json({ success: true, contribution });
  } catch (error) {
    console.error("Contributions POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit contribution." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    if (!["leader", "admin"].includes(session.role)) return NextResponse.json({ success: false, error: "Leader access required." }, { status: 403 });
    await connectMongoose();
    const body = await request.json();
    const { contributionId, status, reviewNote, reviewerId, reviewerName } = body;
    if (!contributionId || !status) {
      return NextResponse.json({ success: false, error: "Missing contributionId or status." }, { status: 400 });
    }
    const existingContribution = (await db.getContributions()).find((item) => String(item._id) === String(contributionId));
    if (!existingContribution) return NextResponse.json({ success: false, error: "Contribution not found." }, { status: 404 });
    if (!(await canManageClub(session, existingContribution.clubId))) return NextResponse.json({ success: false, error: "You can only review contributions for your own club." }, { status: 403 });
    const reviewer = await db.getUserById(session.userId);
    const updates = { status, reviewNote, reviewedBy: session.userId, reviewedByName: reviewer?.name || "Club leader", reviewedAt: new Date() };
    const contribution = await db.updateContribution(contributionId, updates);
    // If approved, update task to completed
    if (status === "approved" && contribution) {
      await db.updateTask(contribution.taskId, { status: "completed" });
    }
    return NextResponse.json({ success: true, contribution });
  } catch (error) {
    console.error("Contributions PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update contribution." }, { status: 500 });
  }
}
