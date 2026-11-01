"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  AlertTriangle,
  Zap,
  Users,
  CheckSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  Ghost,
  BarChart2,
  AlertCircle,
} from "lucide-react";

function getBurnoutColor(riskLevel) {
  if (riskLevel === "critical") return "text-red-400 bg-red-500/10 border-red-500/20";
  if (riskLevel === "high") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  if (riskLevel === "moderate") return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
}

function getParticipationBadge(status) {
  if (status === "check_in_suggested") return { label: "Check-in Needed", color: "text-red-400" };
  if (status === "activity_declining") return { label: "Declining", color: "text-amber-400" };
  if (status === "on_approved_break") return { label: "On Break", color: "text-blue-400" };
  return { label: "Active", color: "text-emerald-400" };
}

export default function LeaderDashboard() {
  const { currentUser } = useAuth();

  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const loadLiveData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const clubRes = await fetch("/api/clubs?myClub=true");
      const clubData = await clubRes.json();
      if (!clubData.success || !clubData.club) {
        setClub(null);
        setMembers([]);
        setTasks([]);
        setAnalysis(null);
        setLoading(false);
        return;
      }
      const leaderClub = clubData.club;
      setClub(leaderClub);

      const clubId = leaderClub._id || leaderClub.id;

      const [membRes, taskRes, analyticsRes] = await Promise.all([
        fetch(`/api/members?clubId=${clubId}`),
        fetch(`/api/tasks?clubId=${clubId}`),
        fetch(`/api/analytics?clubId=${clubId}`),
      ]);

      const [membData, taskData, analyticsData] = await Promise.all([
        membRes.json(),
        taskRes.json(),
        analyticsRes.json(),
      ]);

      if (membData.success) setMembers(membData.members || []);
      if (taskData.success) setTasks(taskData.tasks || []);
      if (analyticsData.success) setAnalysis(analyticsData.analytics?.fairwork || null);
    } catch (err) {
      console.error("Leader dashboard fetch error:", err);
      setError("Failed to load dashboard data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLiveData();
  }, [loadLiveData]);

  const handleReassignTask = async (taskId, toMemberId, toMemberName) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: toMemberId, assigneeName: toMemberName }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Task reassigned to ${toMemberName}.`, "success");
        await loadLiveData();
      } else {
        showToast(data.error || "Reassignment failed.", "error");
      }
    } catch {
      showToast("Network error. Please retry.", "error");
    }
  };

  const activeMembers = members.filter((m) => m.status === "active").length;
  const pendingTasks = tasks.filter((t) => t.status !== "completed").length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;
  const memberWorkloads = analysis?.memberWorkloads || [];
  const recommendations = analysis?.recommendations || [];
  const ghostMembers = memberWorkloads.filter(
    (m) =>
      m.participationStatus?.status === "check_in_suggested" ||
      m.participationStatus?.status === "activity_declining"
  );
  const overloadedMembers = memberWorkloads.filter(
    (m) => m.burnoutRisk?.riskLevel === "critical" || m.burnoutRisk?.riskLevel === "high"
  );

  if (loading) {
    return (
      <div className="bg-[#0A0A0B] text-neutral-100 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-400">Loading club dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0A0A0B] text-neutral-100 min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center space-y-4 p-6 rounded-xl bg-[#141416] border border-[#27272A]">
          <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-semibold text-white">Dashboard Unavailable</h2>
          <p className="text-sm text-neutral-400">{error}</p>
          <button
            onClick={loadLiveData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-400 text-black hover:bg-amber-300"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="bg-[#0A0A0B] text-neutral-100 min-h-screen py-16 px-4 sm:px-6">
        <div className="max-w-md mx-auto text-center space-y-4 p-8 rounded-xl bg-[#141416] border border-[#27272A]">
          <ShieldCheck className="h-12 w-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-semibold text-white">No Club Registered Yet</h2>
          <p className="text-sm text-neutral-400">
            You do not currently lead an approved club. Register a new club or request approval from the campus administrator.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/clubs"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-400 text-black hover:bg-amber-300"
            >
              Browse Campus Clubs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0B] text-neutral-100 min-h-screen py-8 px-4 sm:px-6">
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-2 rounded-lg text-xs font-semibold shadow-xl flex items-center gap-2 ${
            toastType === "error"
              ? "bg-rose-500 text-white"
              : toastType === "info"
              ? "bg-blue-500 text-white"
              : "bg-amber-400 text-black"
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272A]">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                {club?.name || "Your Club"}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {club?.status === "approved" ? "Active" : club?.status || "Live"}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {club?.description || "Executive health, capacity load telemetry, and supportive community retention."}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={loadLiveData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-neutral-300 bg-[#141416] hover:bg-[#1C1C20] border border-[#27272A]"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <Link
              href="/recruitment"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300"
            >
              <Plus className="h-3.5 w-3.5" /> Recruit
            </Link>
          </div>
        </section>

        {/* FairWork Alert Banner */}
        {overloadedMembers.length > 0 && (
          <section className="relative overflow-hidden rounded-xl border border-rose-500/20 bg-gradient-to-r from-rose-950/25 via-[#141416] to-amber-950/15 p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-medium text-rose-400">
                    FairWork Alert — Workload Imbalance Detected
                  </span>
                  <h2 className="text-base font-medium text-white">
                    {overloadedMembers.map((m) => m.name).join(" & ")}{" "}
                    {overloadedMembers.length === 1 ? "is" : "are"} carrying a disproportionate share of tasks.
                  </h2>
                  <p className="text-xs text-neutral-400">
                    {recommendations[0]?.explanation || "Consider redistributing tasks to restore balance across members."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#27272A] bg-[#141416] p-5">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
              <span className="font-medium">Total Members</span>
              <Users className="h-4 w-4" />
            </div>
            <div className="text-3xl font-semibold text-white font-mono">{members.length}</div>
            <p className="text-xs text-neutral-400 mt-1">{activeMembers} actively participating</p>
          </div>

          <div className="rounded-xl border border-[#27272A] bg-[#141416] p-5">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
              <span className="font-medium">Participation Alerts</span>
              <Ghost className="h-4 w-4" />
            </div>
            <div
              className={`text-3xl font-semibold font-mono ${
                ghostMembers.length > 0 ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {ghostMembers.length}
            </div>
            <p className="text-xs text-neutral-400 mt-1">members need check-in</p>
          </div>

          <div className="rounded-xl border border-[#27272A] bg-[#141416] p-5">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
              <span className="font-medium">Active Tasks</span>
              <CheckSquare className="h-4 w-4" />
            </div>
            <div
              className={`text-3xl font-semibold font-mono ${
                overdueTasks > 0 ? "text-rose-400" : "text-white"
              }`}
            >
              {pendingTasks}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {overdueTasks > 0 ? `${overdueTasks} overdue` : "All on track"}
            </p>
          </div>

          <div className="rounded-xl border border-[#27272A] bg-[#141416] p-5">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
              <span className="font-medium">Workload Health</span>
              <BarChart2 className="h-4 w-4" />
            </div>
            <div
              className={`text-3xl font-semibold font-mono ${
                analysis?.isHealthy ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {analysis?.isHealthy ? "Balanced" : "Review Needed"}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {analysis?.workloadConcentrationIndex != null
                ? `Max load: ${analysis.workloadConcentrationIndex}%`
                : "No active load"}
            </p>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Member Workload */}
          <section className="lg:col-span-7 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">FairWork — Member Workload</h2>
              <p className="text-xs text-neutral-400">Estimated hours of pending tasks per member</p>
            </div>

            {memberWorkloads.length === 0 ? (
              <div className="rounded-xl border border-[#27272A] bg-[#141416] p-8 text-center">
                <BarChart2 className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
                <p className="text-sm text-neutral-400">No member workload data yet.</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Assign tasks to members to see FairWork telemetry and burnout risk indicators here.
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-[#141416] border border-[#27272A] space-y-4">
                {memberWorkloads.map((member, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-white">{member.name}</span>
                        <span className="text-neutral-500 text-[11px] ml-2">({member.role})</span>
                        <span
                          className={`ml-2 text-[11px] px-1.5 py-0.5 rounded border ${getBurnoutColor(
                            member.burnoutRisk?.riskLevel
                          )}`}
                        >
                          {member.burnoutRisk?.riskLevel || "low"}
                        </span>
                      </div>
                      <span className="font-mono text-neutral-300 font-semibold">
                        {member.percentageOfClubWorkload}%
                      </span>
                    </div>
                    <div className="w-full bg-[#202024] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          member.burnoutRisk?.riskLevel === "critical"
                            ? "bg-red-500"
                            : member.burnoutRisk?.riskLevel === "high"
                            ? "bg-amber-400"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${member.percentageOfClubWorkload}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      {member.estimatedHours}h pending · {member.pendingTasks} tasks
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t border-[#202024] text-xs text-neutral-400">
                  Target: <strong className="text-neutral-200">≤ 30% per member.</strong> Red indicates critical burnout risk.
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">FairWork Recommendations</h3>
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border ${
                      rec.urgency === "high"
                        ? "border-rose-500/20 bg-rose-950/10"
                        : "border-amber-500/20 bg-amber-950/10"
                    }`}
                  >
                    <p className="text-xs text-neutral-200 font-medium">{rec.message}</p>
                    <p className="text-[11px] text-neutral-400 mt-1">{rec.explanation}</p>
                    <p className="text-[11px] text-amber-400 mt-1 font-medium">
                      Leader approval required before any reassignment.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Right: Ghost Members */}
          <section className="lg:col-span-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">Participation Monitoring</h2>
              <p className="text-xs text-neutral-400">Declining engagement and check-in reminders</p>
            </div>

            {memberWorkloads.length === 0 ? (
              <div className="rounded-xl border border-[#27272A] bg-[#141416] p-6 text-center">
                <Ghost className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">No members registered yet.</p>
                <p className="text-xs text-neutral-500 mt-1">
                  New members who join your club will be monitored here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {memberWorkloads.slice(0, 6).map((member, i) => {
                  const badge = getParticipationBadge(member.participationStatus?.status);
                  return (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-[#141416] border border-[#27272A] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-[#27272A] flex items-center justify-center text-xs font-semibold text-neutral-200">
                          {(member.name || "?")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xs font-medium text-white">{member.name}</h3>
                          <p className={`text-[11px] ${badge.color}`}>{badge.label}</p>
                        </div>
                      </div>
                      {(member.participationStatus?.status === "check_in_suggested" ||
                        member.participationStatus?.status === "activity_declining") && (
                        <button
                          onClick={() =>
                            showToast(
                              `Reminder: Personally check in with ${member.name} — not automated.`,
                              "info"
                            )
                          }
                          className="px-2.5 py-1 rounded bg-[#202024] hover:bg-neutral-700 text-xs text-neutral-300 font-medium transition-colors"
                        >
                          Check-in
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recent Tasks */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Recent Tasks</h3>
              {tasks.length === 0 ? (
                <div className="rounded-xl border border-[#27272A] bg-[#141416] p-4 text-center">
                  <p className="text-xs text-neutral-400">No tasks created yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.slice(0, 5).map((task, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-[#141416] border border-[#27272A] flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-medium text-white">{task.title}</p>
                        <p className="text-[11px] text-neutral-400">{task.assigneeName || "Unassigned"}</p>
                      </div>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          task.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : task.status === "overdue"
                            ? "bg-rose-500/10 text-rose-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}