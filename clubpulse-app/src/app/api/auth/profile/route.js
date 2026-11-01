import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

export async function PATCH(request) {
  try {
    await connectMongoose();
    const session = getSessionFromRequest(request);
    const body = await request.json();
    const userId = session?.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to update profile" },
        { status: 401 }
      );
    }

    const { name, department, year, bio, avatar } = body;
    const updates = {};
    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (typeof department === "string" && department.trim()) updates.department = department.trim();
    if (typeof year === "string" && year.trim()) updates.year = year.trim();
    if (typeof bio === "string") updates.bio = bio.trim();
    if (typeof avatar === "string" && avatar.trim()) updates.avatar = avatar.trim();

    const updated = await db.updateUser(userId, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "User account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        avatar: updated.avatar,
        department: updated.department,
        year: updated.year,
        bio: updated.bio,
        clubsJoined: updated.clubsJoined || [],
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile information" },
      { status: 500 }
    );
  }
}
