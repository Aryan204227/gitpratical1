"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Users, CheckCircle2, Clock, Award, ArrowRight,
  ChevronRight, Loader2, AlertCircle, Compass
} from "lucide-react";

export default function StudentDashboardPage() {
  const { currentUser } = useAuth();

  const [memberships, setMemberships] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        if (!currentUser?.id) {
          setIsLoading(false);
          return;
        }
        const [membRes, taskRes, contribRes, clubRes] = await Promise.all([
          fetch(`/api/members?userId=${currentUser.id}`),
          fetch(`/api/tasks?assigneeId=${currentUser.id}`),
          fetch(`/api/contributions?userId=${currentUser.id}`),
          fetch(`/api/clubs`),
        ]);
        const [membData, taskData, contribData, clubData] = await Promise.all([
          membRes.json(), taskRes.json(), contribRes.json(), clubRes.json(),
        ]);
        if (!membRes.ok) throw new Error(membData.error || "Failed to load memberships.");
        if (!taskRes.ok || !contribRes.ok || !clubRes.ok) throw new Error("One or more live dashboard services could not be reached.");
        setMemberships(membData.memberships || []);
        setTasks(taskData.tasks || []);
        setContributions(contribData.contributions || []);
        setClubs(clubData.clubs || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError(err.message || "Failed to load dashboard. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [currentUser]);

  // Compute simple stats
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status !== "completed").length;
  const approvedContributions = contributions.filter((c) => c.status === "approved").length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0A100F]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0A100F] p-6">
        <div className="max-w-md w-full p-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <h2 className="font-bold text-slate-900 dark:text-white mb-1">Could not load dashboard</h2>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <p className="text-xs text-slate-500 mt-3">Check your database connection configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A100F] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Welcome back, {currentUser?.name?.split(" ")[0] || "Student"} 👋
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Your activity summary from the live campus database
            </p>
          </div>
          <Link
            href="/clubs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Compass className="h-4 w-4" />
            Explore Clubs
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Clubs Joined", value: memberships.length, icon: Users, color: "text-blue-600" },
            { label: "Tasks Completed", value: completedTasks, icon: CheckCircle2, color: "text-emerald-600" },
            { label: "Pending Tasks", value: pendingTasks, icon: Clock, color: "text-amber-600" },
            { label: "Contributions Approved", value: approvedContributions, icon: Award, color: "text-purple-600" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-2xl bg-white dark:bg-[#111A16] border border-slate-200 dark:border-white/10 flex flex-col gap-2"
            >
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* My Clubs */}
        <div className="bg-white dark:bg-[#111A16] rounded-2xl border border-slate-200 dark:border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-white">My Clubs</h2>
            <Link href="/clubs" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Browse all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {memberships.length === 0 ? (
            <div className="text-center py-10">
              <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-300 font-medium">You haven&apos;t joined any clubs yet.</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                Discover clubs and submit a membership application to get started.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
                <Link
                  href="/clubs"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Compass className="h-4 w-4" />
                  Explore Clubs
                </Link>

              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {memberships.map((m) => {
                const club = clubs.find((c) => String(c.id || c._id) === String(m.clubId));
                return (
                  <div key={m.id || m._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm shrink-0">
                      {(club?.name || m.clubId).charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {club?.name || m.clubId}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{m.clubRole}</p>
                    </div>
                    <Link
                      href={`/clubs/${m.clubId}`}
                      className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0 flex items-center gap-1"
                    >
                      View <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div className="bg-white dark:bg-[#111A16] rounded-2xl border border-slate-200 dark:border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-white">My Tasks</h2>
            <Link href="/activity" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Full history <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">No tasks have been assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 5).map((t) => {
                const isOverdue = new Date(t.dueDate) < new Date() && t.status !== "completed";
                return (
                  <div key={t.id || t._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      t.status === "completed" ? "bg-emerald-500" :
                      isOverdue ? "bg-red-500" :
                      t.status === "in_progress" ? "bg-blue-500" : "bg-slate-400"
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{t.title}</p>
                      <p className="text-xs text-slate-400">
                        {t.clubName} · Due {new Date(t.dueDate).toLocaleDateString()}
                        {isOverdue && <span className="text-red-500 ml-1 font-semibold">· Overdue</span>}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${
                      t.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                      t.status === "in_progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" :
                      isOverdue ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" :
                      "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400"
                    }`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                );
              })}
              {tasks.length > 5 && (
                <p className="text-xs text-center text-slate-400 pt-1">
                  +{tasks.length - 5} more tasks —{" "}
                  <Link href="/activity" className="text-blue-600 dark:text-blue-400 hover:underline">view all</Link>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Contribution History */}
        <div className="bg-white dark:bg-[#111A16] rounded-2xl border border-slate-200 dark:border-white/10 p-5">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Contribution History</h2>

          {contributions.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">No contributions have been submitted yet.</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Complete a task and submit evidence to log your first contribution.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {contributions.map((c) => (
                <div key={c.id || c._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.taskTitle}</p>
                    <p className="text-xs text-slate-400">{c.clubName} · {new Date(c.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${
                    c.status === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                    c.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" :
                    c.status === "under_review" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
                    "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400"
                  }`}>
                    {c.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
