import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

export async function POST(request) {
  try {
    const { credential } = await request.json();
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!credential || !clientId) return NextResponse.json({ success: false, error: "Google sign-in is not configured." }, { status: 503 });
    const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, { cache: "no-store" });
    if (!verifyResponse.ok) return NextResponse.json({ success: false, error: "Google credential is invalid or expired." }, { status: 401 });
    const identity = await verifyResponse.json();
    if (identity.aud !== clientId || identity.email_verified !== "true" || !identity.email) return NextResponse.json({ success: false, error: "Google account verification failed." }, { status: 401 });
    await connectMongoose();
    const email = identity.email.toLowerCase();
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
    let user = await db.getUserByEmail(email);
    if (user) {
      user = await db.updateUser(String(user._id), { authProvider: "google", ...(identity.picture && !user.avatar ? { avatar: identity.picture } : {}) });
    } else {
      user = await db.createUser({ name: identity.name || email.split("@")[0], email, role: adminEmails.includes(email) ? "admin" : "student", avatar: identity.picture || "", department: "General", year: "1st Year", bio: "", authProvider: "google", clubsJoined: [] });
    }
    const userId = String(user._id || user.id);
    const safeUser = { id: userId, name: user.name, email: user.email, role: user.role, avatar: user.avatar, department: user.department, year: user.year, bio: user.bio, clubsJoined: user.clubsJoined || [] };
    const response = NextResponse.json({ success: true, authenticated: true, user: safeUser, redirectUrl: user.role === "admin" ? "/dashboard/admin" : "/dashboard/student" });
    return setSessionCookie(response, user);
  } catch (error) {
    console.error("Google authentication error:", error);
    return NextResponse.json({ success: false, error: "Google authentication service is unavailable." }, { status: 500 });
  }
}
