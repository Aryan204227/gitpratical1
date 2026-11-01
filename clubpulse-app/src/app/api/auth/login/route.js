import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectMongoose, db } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

export async function POST(request) {
  try {
    await connectMongoose();
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ success: false, error: "Please enter your email and password." }, { status: 400 });
    const user = await db.getUserByEmail(email.trim().toLowerCase());
    if (!user?.password || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ success: false, error: "Invalid email or password." }, { status: 401 });
    }
    const safeUser = { id: String(user._id), name: user.name, email: user.email, role: user.role, avatar: user.avatar, department: user.department, year: user.year, bio: user.bio, clubsJoined: user.clubsJoined || [] };
    const response = NextResponse.json({ success: true, user: safeUser, redirectUrl: user.role === "admin" ? "/dashboard/admin" : user.role === "leader" ? "/dashboard/leader" : "/dashboard/student", message: "Authentication successful" });
    return setSessionCookie(response, user);
  } catch (error) {
    console.error("Auth login error:", error);
    return NextResponse.json({ success: false, error: error.message.includes("SESSION_SECRET") ? error.message : "Authentication service is unavailable." }, { status: 500 });
  }
}
