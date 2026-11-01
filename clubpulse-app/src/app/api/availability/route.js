import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { getAuthenticatedUserSession as getSessionFromRequest } from "@/lib/authenticatedSession";

export async function GET(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const url = new URL(request.url);
    const userId = session.userId;
    if (!userId) return NextResponse.json({ success: false, error: "userId required." }, { status: 400 });
    const availability = await db.getAvailability(userId);
    return NextResponse.json({ success: true, availability: availability || { weeklyAvailableHours: 0, onBreak: false } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to load availability." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const body = await request.json();
    const { weeklyAvailableHours, onBreak, breakReason, breakEndDate, preferredCategories } = body;
    const userId = session.userId;
    if (!userId) return NextResponse.json({ success: false, error: "userId required." }, { status: 400 });
    const availability = await db.updateAvailability(userId, { weeklyAvailableHours, onBreak: !!onBreak, breakReason, breakEndDate: breakEndDate ? new Date(breakEndDate) : null, preferredCategories });
    return NextResponse.json({ success: true, availability });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update availability." }, { status: 500 });
  }
}
