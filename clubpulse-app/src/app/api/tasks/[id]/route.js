import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { getAuthenticatedUserSession as getSessionFromRequest } from "@/lib/authenticatedSession";
import { canManageClub } from "@/lib/authorization";

export async function GET(request, { params }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const { id } = await params;
    const task = await db.getTaskById(id);
    if (!task) return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    if (session.role === "leader" && !(await canManageClub(session, task.clubId))) return NextResponse.json({ success: false, error: "You cannot access tasks for another club." }, { status: 403 });
    if (session.role === "student" && String(task.assigneeId) !== session.userId) return NextResponse.json({ success: false, error: "You cannot access another member's task." }, { status: 403 });
    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Task GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const { id } = await params;
    const body = await request.json();
    const existingTask = await db.getTaskById(id);
    if (!existingTask) return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    if (session.role === "leader" && !(await canManageClub(session, existingTask.clubId))) return NextResponse.json({ success: false, error: "You cannot update tasks for another club." }, { status: 403 });
    if (session.role === "student") {
      if (String(existingTask.assigneeId) !== session.userId || !["completed", "in_progress"].includes(body.status) || Object.keys(body).some((key) => key !== "status")) {
        return NextResponse.json({ success: false, error: "You can only update the status of your own task." }, { status: 403 });
      }
    }
    const updated = await db.updateTask(id, body);
    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error("Task PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update task" }, { status: 500 });
  }
}

// POST to delegate / reassign task
export async function POST(request, { params }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    if (!["leader", "admin"].includes(session.role)) return NextResponse.json({ success: false, error: "Leader access required." }, { status: 403 });
    await connectMongoose();
    const { id } = await params;
    const existingTask = await db.getTaskById(id);
    if (!existingTask) return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    if (!(await canManageClub(session, existingTask.clubId))) return NextResponse.json({ success: false, error: "You can only delegate tasks for your own club." }, { status: 403 });
    const { newAssigneeId } = await request.json();
    if (!newAssigneeId) return NextResponse.json({ success: false, error: "A new assignee is required." }, { status: 400 });
    const assignee = await db.getUserById(newAssigneeId);
    const membership = (await db.getMemberships(existingTask.clubId)).find((item) => String(item.userId) === String(newAssigneeId) && item.status === "active");
    if (!assignee || !membership) return NextResponse.json({ success: false, error: "The new assignee must be an active member of this club." }, { status: 400 });
    const task = await db.updateTask(id, {
      assigneeId: newAssigneeId,
      assigneeName: assignee.name,
      assigneeRole: membership.clubRole || "Member",
      delegatedByName: (await db.getUserById(session.userId))?.name || "Club leader",
    });
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Task delegate error:", error);
    return NextResponse.json({ success: false, error: "Failed to delegate task" }, { status: 500 });
  }
}
