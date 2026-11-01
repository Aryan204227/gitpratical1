import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { getAuthenticatedUserSession as getSessionFromRequest } from "@/lib/authenticatedSession";
import { canManageClub } from "@/lib/authorization";

export async function GET(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("clubId");
    if (session.role === "leader" && !(await canManageClub(session, clubId))) return NextResponse.json({ success: false, error: "You can only view events for your own club." }, { status: 403 });

    const records = await db.getEvents(clubId);
    const events = records.map((event) => {
      const attendees = Array.isArray(event.attendees) ? event.attendees.map(String) : [];
      return { ...event, id: String(event._id || event.id), date: event.eventDate, actualAttendees: attendees.length, isRsvped: attendees.includes(session.userId) };
    });
    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error("Events GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const body = await request.json();
    const { action, eventId, userName } = body;

    // Handle RSVP action with a persisted MongoDB update.
    if (action === "rsvp" && eventId) {
      const events = await db.getEvents();
      const event = events.find((item) => String(item._id || item.id) === String(eventId));
      if (!event) return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
      const attendees = Array.isArray(event.attendees) ? event.attendees.map(String) : [];
      const alreadyRsvp = attendees.includes(session.userId);
      const nextAttendees = alreadyRsvp
        ? attendees.filter((attendeeId) => attendeeId !== session.userId)
        : [...attendees, session.userId];
      const updatedEvent = await db.updateEvent(String(event._id || event.id), { attendees: nextAttendees });
      return NextResponse.json({
        success: true,
        event: { ...updatedEvent, id: String(updatedEvent._id), date: updatedEvent.eventDate, actualAttendees: nextAttendees.length },
        isRsvped: !alreadyRsvp,
        message: alreadyRsvp ? "RSVP cancelled." : "RSVP confirmed!",
      });
    }

    if (!(await canManageClub(session, body.clubId))) return NextResponse.json({ success: false, error: "You can only create events for your own club." }, { status: 403 });
    const club = await db.getClubById(body.clubId);
    if (!club || !body.title?.trim() || !(body.eventDate || body.date)) return NextResponse.json({ success: false, error: "A valid club, event title and event date are required." }, { status: 400 });
    const newEvent = await db.createEvent({ ...body, clubId: String(club._id || club.id), clubName: club.name, createdById: session.userId, eventDate: body.eventDate || body.date });
    return NextResponse.json({ success: true, event: newEvent });
  } catch (error) {
    console.error("Events POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process event" },
      { status: 500 }
    );
  }
}
