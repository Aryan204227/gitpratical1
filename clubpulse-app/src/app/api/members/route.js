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
    const userId = searchParams.get("userId");
    if (session.role === "leader" && !(await canManageClub(session, clubId))) return NextResponse.json({ success: false, error: "You can only view your own club roster." }, { status: 403 });

    let members = session.role === "student"
      ? await db.getUserMemberships(session.userId)
      : await db.getMemberships(clubId);
    if (session.role !== "student" && userId) members = members.filter((m) => String(m.userId) === String(userId));
    const normalizedMembers = members.map((member) => ({ ...member, id: String(member._id || member.id) }));
    return NextResponse.json({ success: true, members: normalizedMembers, memberships: normalizedMembers });
  } catch (error) {
    console.error("Members GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    if (!["leader", "admin"].includes(session.role)) return NextResponse.json({ success: false, error: "Leader access required." }, { status: 403 });
    await connectMongoose();
    const body = await request.json();
    if (!(await canManageClub(session, body.clubId))) return NextResponse.json({ success: false, error: "You can only manage membership for your own club." }, { status: 403 });
    const membership = await db.createMembership(body);
    return NextResponse.json({ success: true, membership });
  } catch (error) {
    console.error("Members POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create membership" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    if (!["leader", "admin"].includes(session.role)) return NextResponse.json({ success: false, error: "Leader access required." }, { status: 403 });
    await connectMongoose();
    const body = await request.json();
    const { id, action, note, leaderName } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing member ID" }, { status: 400 });
    }
    const membership = (await db.getMemberships()).find((item) => String(item._id) === String(id));
    if (!membership) return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
    if (!(await canManageClub(session, membership.clubId))) return NextResponse.json({ success: false, error: "You can only update members in your own club." }, { status: 403 });
    if (action === "send_reminder") {
      const updated = await db.updateMembership(id, {
        lastReminderSentAt: new Date().toISOString().split("T")[0],
        inactivityExplanation: note || "Friendly check-in reminder sent by leadership.",
      });
      if (!updated) {
        return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: "Friendly check-in reminder sent successfully.",
        member: updated,
      });
    }
    const updated = await db.updateMembership(id, body);
    return NextResponse.json({ success: true, member: updated });
  } catch (error) {
    console.error("Members PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update member" }, { status: 500 });
  }
}
