import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { getAuthenticatedUserSession as getSessionFromRequest } from "@/lib/authenticatedSession";

export async function GET(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "admin") return NextResponse.json({ success: false, error: "Administrator access required." }, { status: 403 });
    await connectMongoose();
    const users = await db.getUsers();
    return NextResponse.json({ success: true, users: users.map((user) => ({
      id: String(user._id || user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      year: user.year,
      bio: user.bio,
      createdAt: user.createdAt,
    })) });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ success: false, error: "Could not load user accounts." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "admin") return NextResponse.json({ success: false, error: "Administrator access required." }, { status: 403 });
    await connectMongoose();
    const { userId, role } = await request.json();
    if (!userId || !["student", "leader"].includes(role)) return NextResponse.json({ success: false, error: "A user ID and permitted role (student or leader) are required." }, { status: 400 });
    const user = await db.getUserById(userId);
    if (!user) return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    if (user.role === "admin") return NextResponse.json({ success: false, error: "Administrator accounts cannot be changed here." }, { status: 403 });
    const updated = await db.updateUser(userId, { role });
    return NextResponse.json({ success: true, user: { id: String(updated._id), name: updated.name, email: updated.email, role: updated.role } });
  } catch (error) {
    console.error("Admin user role update error:", error);
    return NextResponse.json({ success: false, error: "Could not update user role." }, { status: 500 });
  }
}
