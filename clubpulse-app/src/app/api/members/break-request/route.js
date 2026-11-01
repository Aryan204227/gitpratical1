import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

export async function POST(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const body = await request.json();
    const { clubId, reason, endDate } = body;
    const userId = session.userId;
    if (!userId || !clubId || !reason || !endDate) {
      return NextResponse.json(
        { success: false, error: "Missing required break request details (reason, endDate)" },
        { status: 400 }
      );
    }
    const updated = await db.requestLeaveOfAbsence(userId, clubId, reason, endDate);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Membership not found for this club" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      message: "Temporary break approved and recorded. You will not be flagged as inactive.",
      membership: updated,
    });
  } catch (error) {
    console.error("Break request error:", error);
    return NextResponse.json({ success: false, error: "Failed to process break request" }, { status: 500 });
  }
}
