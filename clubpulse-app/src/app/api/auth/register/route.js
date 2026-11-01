import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectMongoose, db } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

export async function POST(request) {
  try {
    await connectMongoose();
    const body = await request.json();
    const { name, email, password, department, year, bio } = body;
    if (!name?.trim() || !email?.trim() || !password) return NextResponse.json({ success: false, error: "Please fill in name, email, and password." }, { status: 400 });
    if (password.length < 10) return NextResponse.json({ success: false, error: "Use a password with at least 10 characters." }, { status: 400 });
    const normalizedEmail = email.trim().toLowerCase();
    if (await db.getUserByEmail(normalizedEmail)) return NextResponse.json({ success: false, error: "An account with this email already exists." }, { status: 409 });
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
    const role = adminEmails.includes(normalizedEmail) ? "admin" : "student";
    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = await db.createUser({ name: name.trim(), email: normalizedEmail, password: passwordHash, authProvider: "password", role, department: department || "General", year: year || "1st Year", bio: bio || "", avatar: "", clubsJoined: [] });
    const userId = String(newUser._id || newUser.id);
    const safeUser = { id: userId, name: newUser.name, email: newUser.email, role: newUser.role, avatar: newUser.avatar, department: newUser.department, year: newUser.year, bio: newUser.bio, clubsJoined: newUser.clubsJoined || [] };
    const response = NextResponse.json({ success: true, user: safeUser, message: "Account registered successfully." }, { status: 201 });
    return setSessionCookie(response, newUser);
  } catch (error) {
    console.error("Auth register error:", error);
    return NextResponse.json({ success: false, error: error.message.includes("SESSION_SECRET") ? error.message : "Registration service is unavailable." }, { status: 500 });
  }
}
