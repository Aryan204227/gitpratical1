import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const notifications = await db.getNotifications(session.userId);
    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const body = await request.json();
    if (body.action === "mark_all_read" || body.markAll) {
      await db.markAllNotificationsRead(session.userId);
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }
    if (body.id) {
      const Notification = (await import("@/models/Notification")).default;
      const updated = await Notification.findOneAndUpdate({ _id: body.id, userId: session.userId }, { $set: { read: true } }, { new: true });
      if (!updated) return NextResponse.json({ success: false, error: "Notification not found." }, { status: 404 });
      return NextResponse.json({ success: true, message: "Notification marked as read." });
    }
    return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update notification" }, { status: 500 });
  }
}
