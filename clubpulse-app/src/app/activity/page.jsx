"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import UploadEvidenceModal from "@/components/UploadEvidenceModal";
import {
  Activity,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  Award,
  FileText,
  UploadCloud,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Briefcase,
  ChevronRight,
  Sparkles,
  Zap,
  Check,
  X,
  Send,
  Building2,
  Lock,
} from "lucide-react";

export default function MyActivityPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'clubs' | 'applications' | 'events' | 'tasks' | 'proofs'

  // Data States
  const [memberships, setMemberships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [allClubs, setAllClubs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Modals & Interactivity
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [selectedClubForEvidence, setSelectedClubForEvidence] = useState(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveClubId, setLeaveClubId] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Fetch student data
  useEffect(() => {
    let isMounted = true;

    async function fetchActivityData() {
      setDataLoading(true);
      try {
        if (!currentUser?.id) {
          setMemberships([]); setApplications([]); setTasks([]); setEvents([]); setEvidenceList([]); setAllClubs([]);
          setDataLoading(false);
          return;
        }
        const userId = currentUser.id;

        const [memRes, appRes, taskRes, evRes, clubRes, evidenceRes] = await Promise.all([
          fetch(`/api/members?userId=${userId}`),
          fetch(`/api/applications?userId=${userId}`),
          fetch(`/api/tasks?assigneeId=${userId}`),
          fetch("/api/events"),
          fetch("/api/clubs"),
          fetch(`/api/evidence?userId=${userId}`),
        ]);

        const [memData, appData, taskData, evData, clubData, evidenceData] = await Promise.all([
          memRes.json(),
          appRes.json(),
          taskRes.json(),
          evRes.json(),
          clubRes.json(),
          evidenceRes.json(),
        ]);

        if (!isMounted) return;

        // Empty API collections are genuine empty states, not sample data.
        setMemberships(memData?.members || []);
        setApplications(appData?.applications || []);
        setTasks(taskData?.tasks || []);
        setEvents(evData?.events || []);

        // Clubs
        if (clubData?.clubs) {
          setAllClubs(clubData.clubs);
        }

        // Evidence shown here is always returned by the authenticated API.
        setEvidenceList(evidenceData?.evidence || []);
      } catch (err) {
        console.error("Failed to load student activity records:", err);
      } finally {
        if (isMounted) setDataLoading(false);
      }
    }

    fetchActivityData();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalClubs = memberships.length;
    const avgAttendance =
      totalClubs > 0
        ? Math.round(memberships.reduce((acc, m) => acc + (m.attendanceRate ?? 0), 0) / totalClubs)
        : 0;

    const completedTasksCount = tasks.filter((t) => t.status === "completed").length;
    const pendingAppsCount = applications.filter(
      (a) => a.status === "pending" || a.status === "under_review"
    ).length;
    const attendedEventsCount = events.filter((e) => e.attendanceVerified || e.isRsvped).length;

    // Ghost Member Risk Assessment
    const isAnyLow = memberships.some(
      (m) => (m.attendanceRate || 0) < 60 || m.status === "low_activity"
    );
    const isOnLeave = memberships.some((m) => m.status === "on_leave");

    let ghostRisk = "Low Risk (0 Flags)";
    let ghostRiskColor = "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40";

    if (isOnLeave) {
      ghostRisk = "Excused - Academic Leave";
      ghostRiskColor = "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40";
    } else if (isAnyLow) {
      ghostRisk = "Moderate - Review Needed";
      ghostRiskColor = "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40";
    }

    return {
      totalClubs,
      avgAttendance,
      completedTasksCount,
      pendingAppsCount,
      attendedEventsCount,
      ghostRisk,
      ghostRiskColor,
    };
  }, [memberships, tasks, applications, events]);

  // Handle Event RSVP Toggle
  const handleToggleRsvp = async (event) => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rsvp",
          eventId: event.id,
          userName: currentUser?.name || "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === event.id
              ? {
                  ...e,
                  isRsvped: data.isRsvped,
                  actualAttendees: data.event?.actualAttendees ?? e.actualAttendees,
                }
              : e
          )
        );
        showToast(data.message || (data.isRsvped ? "RSVP confirmed!" : "RSVP cancelled."));
      } else {
        showToast(data.error || "Could not update your RSVP. Please try again.");
      }
    } catch {
      showToast("Network error. Your RSVP was not changed.");
    }
  };

  // Handle Task Completion Toggle
  const handleToggleTask = async (task) => {
    const nextStatus = task.status === "completed" ? "in_progress" : "completed";
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id || task._id, status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Task update failed.");
      setTasks((prev) => prev.map((t) => ((t.id || t._id) === (task.id || task._id) ? { ...t, status: nextStatus } : t)));
      showToast(nextStatus === "completed" ? "Task marked as completed." : "Task returned to active in-progress.");
    } catch (error) {
      showToast(error.message || "Task update failed. No changes were saved.");
    }
  };

  // Submit Leave Request
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!leaveClubId || !leaveReason.trim() || !leaveEndDate) {
      showToast("Please select a club, reason, and expected return date.");
      return;
    }

    setIsSubmittingLeave(true);
    try {
      const res = await fetch("/api/members/break-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId: leaveClubId,
          reason: leaveReason,
          endDate: leaveEndDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMemberships((prev) =>
          prev.map((m) =>
            m.clubId === leaveClubId
              ? {
                  ...m,
                  status: "on_leave",
                  inactivityExplanation: `Approved Leave until ${leaveEndDate}: ${leaveReason}`,
                }
              : m
          )
        );
        showToast("Leave of absence recorded! You are protected from inactive flags.");
        setIsLeaveModalOpen(false);
        setLeaveReason("");
        setLeaveEndDate("");
      } else {
        showToast(data.error || "Failed to submit leave request.");
      }
    } catch (err) {
      showToast("Failed to submit leave request. Please try again.");
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  return (
    <div className="bg-[#EDF1F7] dark:bg-[#121316] text-slate-900 dark:text-slate-100 min-h-screen pb-20 pt-6 transition-colors duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/student" className="hover:text-blue-600 dark:hover:text-[#D2F863] transition-colors">
              Student Home
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-bold">My Activity & Proof Ledger</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              disabled={memberships.length === 0}
              onClick={() => {
                if (memberships[0]) {
                  setSelectedClubForEvidence(memberships[0]);
                  setIsEvidenceModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all cursor-pointer"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload Proof</span>
            </button>
            <button
              disabled={memberships.length === 0}
              onClick={() => {
                if (memberships[0]?.clubId) {
                  setLeaveClubId(memberships[0].clubId);
                  setIsLeaveModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#18191E] border border-slate-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-white/30 transition-all cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Request Leave</span>
            </button>
          </div>
        </div>

        {/* HERO ACTIVITY HEALTH BANNER */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/40 dark:from-[#18191E] dark:via-[#1E2028] dark:to-[#18191E] border border-blue-100/90 dark:border-white/10 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            {/* Left Copy */}
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border bg-white/80 dark:bg-white/5 border-blue-200/60 dark:border-white/10 text-blue-700 dark:text-blue-300">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-[#D2F863]" />
                <span>Verified Campus Participation Record</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                My Club Activity & Verification
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
                Track your active memberships, meeting attendance, submitted application workflows, and verifiable contributions across campus chapters.
              </p>

              {/* Status Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${metrics.ghostRiskColor}`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>Ghost Audit: {metrics.ghostRisk}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10">
                  <Activity className="h-3.5 w-3.5 text-blue-600 dark:text-[#D2F863]" />
                  <span>{metrics.avgAttendance}% Overall Attendance</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white dark:bg-white/5 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{metrics.completedTasksCount} Contributions Completed</span>
                </span>
              </div>
            </div>

            {/* Right Health Meter Visual */}
            <div className="shrink-0 flex items-center justify-center">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#121316] border border-slate-200/90 dark:border-white/10 shadow-sm flex flex-col items-center justify-center text-center w-52 sm:w-56">
                <div className="relative w-20 h-20 flex items-center justify-center mb-2">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-white/10"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-blue-600 dark:text-[#D2F863] transition-all duration-1000"
                      strokeDasharray={`${metrics.avgAttendance}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                      {metrics.avgAttendance}%
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-white">Active Standing</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Safe from Ghost Audits
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4 TOP SUMMARY STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18191E] border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Joined Clubs
              </p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                {metrics.totalClubs}
              </h3>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18191E] border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pending Applications
              </p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                {metrics.pendingAppsCount}
              </h3>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18191E] border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Events & Passes
              </p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                {metrics.attendedEventsCount}
              </h3>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18191E] border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Verified Tasks
              </p>
              <h3 className="text-xl font-extrabold text-emerald-600 dark:text-[#D2F863] font-mono">
                {metrics.completedTasksCount}
              </h3>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto no-scrollbar gap-2 sm:gap-4 pt-2">
          {[
            { id: "overview", label: "Overview & Timeline", icon: Activity },
            { id: "clubs", label: `My Clubs (${memberships.length})`, icon: Users },
            { id: "applications", label: `Applications (${applications.length})`, icon: Briefcase },
            { id: "events", label: `Events & Passes (${events.length})`, icon: Calendar },
            { id: "tasks", label: `Tasks & Deliverables (${tasks.length})`, icon: CheckCircle2 },
            { id: "proofs", label: `Submitted Proofs (${evidenceList.length})`, icon: UploadCloud },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "border-blue-600 dark:border-[#D2F863] text-blue-600 dark:text-[#D2F863]"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & TIMELINE */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Clubs & Tasks Quick View (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* My Clubs Snapshot */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#18191E] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600 dark:text-[#D2F863]" />
                    <span>Active Club Memberships</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("clubs")}
                    className="text-xs font-bold text-blue-600 dark:text-[#D2F863] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="space-y-3">
                  {memberships.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {mem.clubName}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              mem.status === "on_leave"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}
                          >
                            {mem.status === "on_leave" ? "On Leave" : "Active Member"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {mem.clubRole || "Member"} • Schedule: {mem.meetingSchedule || "Weekly Thursdays"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white font-mono block">
                            {mem.attendanceRate ?? 0}%
                          </span>
                          <span className="text-[10px] text-slate-400">Attendance</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedClubForEvidence({ id: mem.clubId, name: mem.clubName });
                            setIsEvidenceModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-blue-500 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-[#D2F863] transition-colors cursor-pointer"
                        >
                          Submit Proof
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks Checklist */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#18191E] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>My Action Items & Contributions</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("tasks")}
                    className="text-xs font-bold text-blue-600 dark:text-[#D2F863] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {tasks.slice(0, 3).map((task) => {
                    const isDone = task.status === "completed";
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(task)}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isDone
                            ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/30 opacity-80"
                            : "bg-slate-50/70 dark:bg-white/5 border-slate-200/60 dark:border-white/10 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                              isDone
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-slate-300 dark:border-white/20 bg-white dark:bg-white/5"
                            }`}
                          >
                            {isDone && <Check className="h-3.5 w-3.5" />}
                          </div>
                          <div>
                            <p
                              className={`text-xs font-bold ${
                                isDone
                                  ? "line-through text-slate-500 dark:text-slate-400"
                                  : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {task.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {task.clubName} • Due: {task.dueDate}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 uppercase">
                          {task.priority || "Medium"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Live Audit Trail & Applications (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Active Applications */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#18191E] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-purple-600" />
                    <span>Recruitment Applications</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("applications")}
                    className="text-xs font-bold text-blue-600 dark:text-[#D2F863] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Details</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="space-y-3">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {app.clubName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          {app.status === "under_review" ? "Under Review" : "Pending Review"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Role: <strong className="text-slate-800 dark:text-slate-200">{app.roleApplied || app.role || "Member"}</strong>
                      </p>
                      {app.reviewerNotes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                          "{app.reviewerNotes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Activity Feed */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#18191E] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Recent Verified Milestones</span>
                </h3>

                <div className="space-y-3">
                  {evidenceList.filter((item) => item.status === "verified").slice(0, 3).map((item) => (
                    <div key={item._id || item.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-xs">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div><p className="font-bold text-slate-900 dark:text-white">Evidence verified</p><p className="text-slate-500 dark:text-slate-400 text-[11px]">{item.title} · {item.clubName}</p></div>
                    </div>
                  ))}
                  {events.filter((item) => item.isRsvped).slice(0, 2).map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-xs">
                      <Calendar className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <div><p className="font-bold text-slate-900 dark:text-white">Event RSVP confirmed</p><p className="text-slate-500 dark:text-slate-400 text-[11px]">{item.title}</p></div>
                    </div>
                  ))}
                  {evidenceList.filter((item) => item.status === "verified").length === 0 && events.filter((item) => item.isRsvped).length === 0 && <p className="text-xs text-slate-500">No verified milestones or event RSVPs are recorded yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY CLUBS & ATTENDANCE */}
        {activeTab === "clubs" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  My Active Club Affiliations
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage your verified roles, weekly schedules, attendance records, and leave requests.
                </p>
              </div>
              <Link
                href="/clubs"
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>Discover More Clubs</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memberships.map((mem) => {
                const clubDetails = allClubs.find((c) => c.id === mem.clubId);
                return (
                  <div
                    key={mem.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#18191E] border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between gap-5 hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-base overflow-hidden shrink-0">
                            {clubDetails?.logo ? (
                              <img src={clubDetails.logo} alt={mem.clubName} className="w-full h-full object-cover" />
                            ) : (
                              <Building2 className="h-6 w-6" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                              {mem.clubName}
                            </h3>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {mem.clubRole || "Member"}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            mem.status === "on_leave"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                          }`}
                        >
                          {mem.status === "on_leave" ? "On Leave" : "Active Member"}
                        </span>
                      </div>

                      {/* Attendance Meter */}
                      <div className="space-y-1.5 bg-slate-50 dark:bg-white/5 p-3.5 rounded-xl border border-slate-200/60 dark:border-white/10">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700 dark:text-slate-300">Attendance Rate</span>
                          <span className="text-blue-600 dark:text-[#D2F863] font-mono">
                            {mem.attendanceRate ?? 0}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 dark:bg-[#D2F863] rounded-full transition-all duration-500"
                            style={{ width: `${mem.attendanceRate ?? 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                          <span>Last Active: {mem.lastActiveAt || "Recently"}</span>
                          <span>Tasks Done: {mem.tasksCompleted || 0}</span>
                        </div>
                      </div>

                      {mem.inactivityExplanation && (
                        <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                          <strong>Leave Status:</strong> {mem.inactivityExplanation}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-3">
                      <button
                        onClick={() => {
                          setSelectedClubForEvidence({ id: mem.clubId, name: mem.clubName });
                          setIsEvidenceModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud className="h-3.5 w-3.5" />
                        <span>Submit Proof</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setLeaveClubId(mem.clubId);
                            setIsLeaveModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          Request Leave
                        </button>

                        <Link
                          href={`/clubs/${clubDetails?.slug || mem.clubId}`}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 dark:text-[#D2F863] hover:underline flex items-center gap-1"
                        >
                          <span>Club Page</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: APPLICATIONS & RECRUITMENT TRACKER */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  My Recruitment Applications
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live status tracking for campus recruitment drives, core team openings, and general member rosters.
                </p>
              </div>
              <Link
                href="/recruitment"
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>Browse Open Recruitments</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#18191E] border border-slate-200/80 dark:border-white/10 text-center space-y-3">
                <Briefcase className="h-10 w-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No applications submitted yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Explore active recruitments across technical, cultural, sports, and marketing clubs.
                </p>
                <Link
                  href="/recruitment"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#18191E] border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {app.clubName}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            app.status === "accepted"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : app.status === "rejected"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                          }`}
                        >
                          {app.status === "accepted"
                            ? "Selected / Accepted"
                            : app.status === "under_review"
                            ? "Under Review"
                            : "Application Submitted"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Position: {app.role || "General Member"} • Applied on {app.appliedAt || "Recently"}
                      </p>
                      {app.reason && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2">
                          "{app.reason}"
                        </p>
                      )}
                      {app.reviewerNotes && (
                        <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-white/5 border border-blue-200/50 dark:border-white/10 text-xs text-blue-800 dark:text-blue-300">
                          <strong>Reviewer Feedback:</strong> {app.reviewerNotes}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2.5">
                      <Link
                        href={`/clubs/${app.clubId}`}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors"
                      >
                        View Club
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EVENTS & PASSES */}
        {activeTab === "events" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Campus Events, Hackathons & Match RSVPs
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Confirm your attendance to earn verified event badges and maintain high participation metrics.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#18191E] border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
                        {ev.eventType || "Event"}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                        {ev.date}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {ev.clubName}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/10 space-y-1">
                      <p>📍 {ev.location || "Main Auditorium"}</p>
                      <p>👥 {ev.actualAttendees || 35} registered attendees</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleRsvp(ev)}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        ev.isRsvped
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {ev.isRsvped ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Pass Active (Attending)</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-3.5 w-3.5" />
                          <span>RSVP / Get Pass</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: TASKS & DELIVERABLES */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Assigned Tasks & Deliverables
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Complete assigned tasks on schedule to preserve high contribution ratings and prevent burnout alerts.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {tasks.map((task) => {
                const isDone = task.status === "completed";
                return (
                  <div
                    key={task.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isDone
                        ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/40"
                        : "bg-white dark:bg-[#18191E] border-slate-200/80 dark:border-white/10 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className={`w-6 h-6 rounded-lg mt-0.5 flex items-center justify-center border transition-all cursor-pointer ${
                          isDone
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 hover:border-blue-500"
                        }`}
                      >
                        {isDone && <Check className="h-4 w-4" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-sm font-bold ${
                              isDone
                                ? "line-through text-slate-400 dark:text-slate-500"
                                : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {task.title}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 uppercase">
                            {task.priority || "Medium"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {task.clubName} • Category: {task.category || "General"} • Estimated:{" "}
                          {task.estimatedHours || 3} hrs
                        </p>
                        <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                          Deadline: {task.dueDate}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isDone
                            ? "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        }`}
                      >
                        {isDone ? "Mark Incomplete" : "Mark Completed"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: SUBMITTED PROOFS */}
        {activeTab === "proofs" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Verifiable Proofs & Activity Ledger
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Uploaded event photos, contribution reports, and workshop evidence audited by Dean Affairs.
                </p>
              </div>
              <button
                disabled={memberships.length === 0}
                onClick={() => {
                  if (memberships[0]) {
                    setSelectedClubForEvidence(memberships[0]);
                    setIsEvidenceModalOpen(true);
                  }
                }}
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Upload New Evidence</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evidenceList.map((ev) => (
                <div
                  key={ev.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#18191E] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
                        {ev.category || "Evidence"}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {ev.clubName} • Date: {ev.date}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ev.status === "verified"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {ev.status === "verified" ? "Audit Verified" : "Pending Audit"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ev.description}
                  </p>

                  {ev.mediaUrls && ev.mediaUrls.length > 0 && (
                    <div className="h-36 rounded-xl overflow-hidden border border-slate-200/60 dark:border-white/10">
                      <img
                        src={ev.mediaUrls[0]}
                        alt={ev.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Attendance Verified: {ev.attendanceCount || 0} students</span>
                    <span className="font-mono text-slate-500">{ev.status === "verified" ? "Verified" : "Awaiting review"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Evidence Modal */}
      {isEvidenceModalOpen && selectedClubForEvidence && (
        <UploadEvidenceModal
          clubId={selectedClubForEvidence.id || selectedClubForEvidence.clubId}
          clubName={selectedClubForEvidence.name || selectedClubForEvidence.clubName}
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
          onSuccess={() => {
            showToast("Evidence proof submitted successfully! Dean audit pending.");
            setIsEvidenceModalOpen(false);
          }}
        />
      )}

      {/* Leave of Absence Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18191E] p-6 sm:p-7 shadow-2xl text-slate-900 dark:text-slate-100">
            <button
              onClick={() => setIsLeaveModalOpen(false)}
              className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Request Academic Leave of Absence
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Protect your standing from ghost member inactivity penalties.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Club
                </label>
                <select
                  value={leaveClubId}
                  onChange={(e) => setLeaveClubId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {memberships.map((m) => (
                    <option key={m.clubId} value={m.clubId}>
                      {m.clubName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason for Temporary Break
                </label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Preparing for midterm examinations, medical leave, or intense engineering capstone sprint..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Expected Return Date
                </label>
                <input
                  type="date"
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLeave}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingLeave ? "Submitting..." : "Submit Leave Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
