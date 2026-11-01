import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    await connectMongoose();
    const { id } = await params;
    const club = await db.getClubById(id);
    if (!club) {
      return NextResponse.json({ success: false, error: "Club not found" }, { status: 404 });
    }
    const clubId = club._id ? String(club._id) : club.id;
    const [events, evidence, memberships] = await Promise.all([
      db.getEvents(clubId),
      db.getEvidence(clubId),
      db.getMemberships(clubId),
    ]);
    return NextResponse.json({
      success: true,
      club: { ...club, id: String(club._id || club.id) },
      events: events.map((event) => ({ ...event, id: String(event._id || event.id) })),
      evidence: evidence.map((item) => ({ ...item, id: String(item._id || item.id) })),
      membersCount: memberships.length,
      activeMembersCount: memberships.filter((m) => m.status === "active").length,
      leaders: memberships.filter((m) => m.clubRole !== "member"),
    });
  } catch (error) {
    console.error("Club details GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch club details" }, { status: 500 });
  }
}
