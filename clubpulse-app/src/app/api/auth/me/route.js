import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

function safeUser(user) {
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || "",
    department: user.department,
    year: user.year,
    bio: user.bio || "",
    clubsJoined: user.clubsJoined || [],
  };
}

export async function GET(request) {
  try {
    const claims = await getSessionFromRequest(request);
    if (!claims) return NextResponse.json({ success: false, authenticated: false, user: null }, { status: 200 });

    await connectMongoose();
    const firebaseUid = claims.uid || claims.sub;
    const user = await db.getUserByFirebaseUid(firebaseUid);
    if (!user) return NextResponse.json({ success: false, authenticated: false, user: null }, { status: 200 });

    return NextResponse.json({ success: true, authenticated: true, user: safeUser(user) });
  } catch {
    return NextResponse.json(
      { success: false, authenticated: false, code: "AUTH_SERVICE_UNAVAILABLE", error: "Failed to load the account session." },
      { status: 503 }
    );
  }
}
