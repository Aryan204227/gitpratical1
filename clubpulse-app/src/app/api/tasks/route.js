import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { getAuthenticatedUserSession as getSessionFromRequest } from "@/lib/authenticatedSession";
import { canManageClub } from "@/lib/authorization";

export async function GET(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("clubId");
    if (session.role === "leader" && !(await canManageClub(session, clubId))) return NextResponse.json({ success: false, error: "You can only view tasks for your own club." }, { status: 403 });
    const assigneeId = searchParams.get("assigneeId");
    const status = searchParams.get("status");

    let tasks = session.role === "student" ? await db.getUserTasks(session.userId) : await db.getTasks(clubId);
    if (session.role !== "student" && assigneeId) tasks = tasks.filter((t) => String(t.assigneeId) === String(assigneeId));
    if (status) {
      tasks = tasks.filter((t) => t.status === status);
    }
    return NextResponse.json({ success: true, tasks: tasks.map((task) => ({ ...task, id: String(task._id || task.id) })) });
  } catch (error) {
    console.error("Tasks GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    if (!["leader", "admin"].includes(session.role)) return NextResponse.json({ success: false, error: "Leader access required." }, { status: 403 });
    await connectMongoose();
    const body = await request.json();
    const { clubId, title, description, category, assigneeId, priority, estimatedHours, dueDate } = body;
    if (!clubId || !title?.trim() || !assigneeId || !dueDate || !Number.isFinite(Number(estimatedHours)) || Number(estimatedHours) <= 0) {
      return NextResponse.json({ success: false, error: "Club, title, assignee, due date and positive estimated hours are required." }, { status: 400 });
    }
    if (!(await canManageClub(session, clubId))) return NextResponse.json({ success: false, error: "You can only create tasks for your own club." }, { status: 403 });
    const club = await db.getClubById(clubId);
    const assignee = await db.getUserById(assigneeId);
    const membership = (await db.getMemberships(clubId)).find((item) => String(item.userId) === String(assigneeId) && item.status === "active");
    if (!club || !assignee || !membership) return NextResponse.json({ success: false, error: "Assignee must be an active member of this club." }, { status: 400 });
    const assignedBy = await db.getUserById(session.userId);
    const task = await db.createTask({
      clubId: String(club._id || club.id), clubName: club.name, title: title.trim(),
      description: description || "", category: category || "general", assigneeId,
      assigneeName: assignee.name, assigneeRole: membership.clubRole || "Member",
      assigneeAvatar: assignee.avatar || "", assignedById: session.userId,
      assignedByName: assignedBy?.name || "Club leader", priority: priority || "medium",
      estimatedHours: Number(estimatedHours), dueDate, status: "todo",
    });
    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Tasks POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    await connectMongoose();
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: "Missing task ID" }, { status: 400 });
    const existingTask = await db.getTaskById(id);
    if (!existingTask) return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    if (session.role === "leader" && !(await canManageClub(session, existingTask.clubId))) return NextResponse.json({ success: false, error: "You can only manage tasks for your own club." }, { status: 403 });
    if (session.role === "student" && (String(existingTask.assigneeId) !== session.userId || !["completed", "in_progress"].includes(updates.status) || Object.keys(updates).some((key) => key !== "status"))) {
      return NextResponse.json({ success: false, error: "You can only update the status of your own task." }, { status: 403 });
    }
    const updated = await db.updateTask(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error("Tasks PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update task" }, { status: 500 });
  }
}
