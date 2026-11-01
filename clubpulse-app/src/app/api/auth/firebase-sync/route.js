import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { setSessionCookie, verifyFirebaseIdToken } from "@/lib/session";

function adminAllowed(email) {
  return (process.env.ADMIN_EMAILS || "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean).includes(email);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const identity = await verifyFirebaseIdToken(body.idToken);
    await connectMongoose();
    const existing = await db.getUserByEmail(identity.email);
    const isAdmin = adminAllowed(identity.email);
    const role = isAdmin ? "admin" : (existing?.role === "leader" ? "leader" : "student");
    let user;
    if (existing) {
      user = await db.updateUser(String(existing._id), {
        role,
        firebaseUid: identity.uid,
        authProvider: "firebase",
        ...(identity.avatar && !existing.avatar ? { avatar: identity.avatar } : {}),
        lastLoginAt: new Date(),
      });
    } else {
      user = await db.createUser({
        name: identity.name || identity.email.split("@")[0],
        email: identity.email,
        role,
        avatar: identity.avatar,
        department: "General",
        year: "1st Year",
        bio: "",
        firebaseUid: identity.uid,
        authProvider: "firebase",
        clubsJoined: [],
      });
    }
    const userId = String(user._id || user.id);
    const safeUser = { id: userId, name: user.name, email: user.email, role: user.role, avatar: user.avatar, department: user.department, year: user.year, bio: user.bio, clubsJoined: user.clubsJoined || [] };
    const response = NextResponse.json({ success: true, authenticated: true, isNewUser: !existing, role: user.role, redirectUrl: user.role === "admin" ? "/dashboard/admin" : user.role === "leader" ? "/dashboard/leader" : "/dashboard/student", user: safeUser });
    return setSessionCookie(response, user);
  } catch (error) {
    console.error("Firebase sync error:", error);
    return NextResponse.json({ success: false, error: error.message || "Firebase authentication could not be verified." }, { status: 401 });
  }
}
