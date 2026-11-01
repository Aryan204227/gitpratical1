import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { getAuthenticatedUserSession as getSessionFromRequest } from "@/lib/authenticatedSession";

export async function GET(request) {
  try {
    await connectMongoose();
    const { searchParams } = new URL(request.url);
    const myClub = searchParams.get("myClub");
    if (myClub === "true") {
      const session = await getSessionFromRequest(request);
      if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
      const userId = session.userId;
      const clubs = await db.getClubs();
      const club = userId ? clubs.find((c) => String(c.presidentId) === String(userId)) : null;
      if (club) {
        return NextResponse.json({ success: true, club });
      }
      return NextResponse.json({ success: false, error: "No club found for this leader" }, { status: 404 });
    }

    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const recruitment = searchParams.get("recruitment");

    let clubs = await db.getClubs();

    if (category && category !== "All") {
      clubs = clubs.filter((c) => c.category?.toLowerCase() === category.toLowerCase());
    }
    if (recruitment === "open") {
      clubs = clubs.filter((c) => c.recruitmentOpen);
    }
    if (search) {
      const q = search.toLowerCase();
      clubs = clubs.filter((c) =>
        c.name?.toLowerCase().includes(q) ||
        c.tagLine?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
      );
    }
    return NextResponse.json({ success: true, clubs: clubs.map((club) => ({ ...club, id: String(club._id || club.id) })) });
  } catch (error) {
    console.error("Clubs GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch clubs" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !["leader", "admin"].includes(session.role)) return NextResponse.json({ success: false, error: "Leader or administrator access required." }, { status: 403 });
    await connectMongoose();
    const body = await request.json();
    const club = await db.createClub({ ...body, presidentId: session.userId });
    return NextResponse.json({ success: true, club });
  } catch (error) {
    console.error("Clubs POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create club" }, { status: 500 });
  }
}
