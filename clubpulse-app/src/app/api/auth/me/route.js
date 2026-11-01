import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, authenticated: false, user: null }, { status: 200 });
    await connectMongoose();
    const user = await db.getUserById(session.userId);
    if (!user || user.role !== session.role) return NextResponse.json({ success: false, authenticated: false, user: null }, { status: 200 });
    return NextResponse.json({ success: true, authenticated: true, user: { id: String(user._id), name: user.name, email: user.email, role: user.role, avatar: user.avatar, department: user.department, year: user.year, bio: user.bio, clubsJoined: user.clubsJoined || [] } });
  } catch (error) {
    console.error("Auth session check error:", error);
    return NextResponse.json({ success: false, authenticated: false, error: "Failed to verify session." }, { status: 500 });
  }
}
