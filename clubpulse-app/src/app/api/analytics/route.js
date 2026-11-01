import { NextResponse } from "next/server";
import { connectMongoose, db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";
import { canManageClub } from "@/lib/authorization";
import { analyzeClubWorkload } from "@/lib/fairwork";

export async function GET(request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    if (!["leader", "admin"].includes(session.role)) return NextResponse.json({ success: false, error: "Leader access required." }, { status: 403 });
    await connectMongoose();
    const url = new URL(request.url);
    const clubId = url.searchParams.get("clubId");
    if (!clubId) return NextResponse.json({ success: false, error: "clubId is required." }, { status: 400 });
    if (!(await canManageClub(session, clubId))) return NextResponse.json({ success: false, error: "You can only view analytics for your own club." }, { status: 403 });
    const [memberships, tasks, contributions] = await Promise.all([
      db.getMemberships(clubId),
      db.getTasks(clubId),
      db.getContributions({ clubId }),
    ]);
    // Run FairWork analysis
    const fairwork = analyzeClubWorkload(memberships, tasks);
    // Compute simple analytics stats
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const overdueTasks = tasks.filter(
      (t) => t.status !== "completed" && new Date(t.dueDate) < new Date()
    ).length;
    const approvedContributions = contributions.filter((c) => c.status === "approved").length;
    return NextResponse.json({
      success: true,
      analytics: {
        memberCount: memberships.length,
        totalTasks: tasks.length,
        completedTasks,
        overdueTasks,
        pendingTasks: tasks.filter((t) => t.status === "todo" || t.status === "in_progress").length,
        approvedContributions,
        fairwork,
      },
    });
  } catch (error) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("Analytics GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load analytics." }, { status: 500 });
  }
}
