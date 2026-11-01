"use client";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  Calendar,
  FileCheck,
  FileText,
  UserCheck,
  Settings,
  LogOut,
  ChevronDown,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  Users,
  GraduationCap,
  Shield,
  Activity,
  ChevronRight,
  Search,
  Download,
  Filter,
  UserX,
  FileDown,
  ExternalLink,
  Sliders,
  Bell,
  Trash2,
  Check,
  X,
  Eye,
  Plus,
  Sun,
  Moon,
  Heart,
} from "lucide-react";

const SLUG_TO_LABEL = {
  overview: "Dashboard",
  dashboard: "Dashboard",
  clubs: "All Clubs",
  "all-clubs": "All Clubs",
  analytics: "Contribution Analytics",
  "contribution-analytics": "Contribution Analytics",
  events: "Events & Impact",
  "events-and-impact": "Events & Impact",
  recruitment: "Recruitment Reviews",
  "recruitment-reviews": "Recruitment Reviews",
  reports: "Reports",
  users: "User Management",
  "user-management": "User Management",
  settings: "Settings",
};

const LABEL_TO_SLUG = {
  "Dashboard": "overview",
  "All Clubs": "clubs",
  "Contribution Analytics": "analytics",
  "Events & Impact": "events",
  "Recruitment Reviews": "recruitment",
  "Reports": "reports",
  "User Management": "users",
  "Settings": "settings",
};

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isLoading, logout } = useAuth();
  const { theme, isDark, setTheme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) {
        router.push("/login?redirect=/dashboard/admin");
      } else if (currentUser.role !== "admin") {
        router.push("/unauthorized");
      }
    }
  }, [currentUser, isLoading, router]);

  // Navigation tab state (defaults to Dashboard, or syncs with URL tab param)
  const tabParam = searchParams.get("tab")?.toLowerCase();
  const resolvedInitialTab = tabParam && SLUG_TO_LABEL[tabParam] ? SLUG_TO_LABEL[tabParam] : "Dashboard";
  const [activeNav, setActiveNav] = useState(resolvedInitialTab);
  const [selectedSemester, setSelectedSemester] = useState("Current term not configured");
  const [toastMessage, setToastMessage] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleNavClick = (label) => {
    setActiveNav(label);
    const slug = LABEL_TO_SLUG[label] || "overview";
    router.replace(`/dashboard/admin?tab=${slug}`, { scroll: false });
  };

  useEffect(() => {
    const currentTab = searchParams.get("tab")?.toLowerCase();
    if (currentTab && SLUG_TO_LABEL[currentTab]) {
      setActiveNav(SLUG_TO_LABEL[currentTab]);
    }
  }, [searchParams]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleSwitchToStudent = () => {
    router.push("/dashboard/student");
  };

  // --- STATE FOR ALL CLUBS ---
  const [allClubsList, setAllClubsList] = useState([]);

  // --- STATE FOR CONTRIBUTION ANALYTICS & MEMBERS ---
  const [selectedClubId, setSelectedClubId] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("all");
  const [membersTable, setMembersTable] = useState([]);

  // --- STATE FOR EVENTS & IMPACT AUDIT ---
  const [eventsList, setEventsList] = useState([]);
  const [tasksList, setTasksList] = useState([]);

  const handleVerifyEvent = async (id, clubName) => {
    try {
      const response = await fetch("/api/evidence", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "verified" }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Evidence verification failed.");
      setEventsList((previous) => previous.map((item) => item.id === id ? { ...item, status: "verified" } : item));
      showToast(`Evidence verified for ${clubName}. Club trust score recalculated from saved records.`);
    } catch (error) { showToast(error.message || "Could not verify evidence."); }
  };

  // --- STATE FOR RECRUITMENT REVIEWS ---
  const [applicationsQueue, setApplicationsQueue] = useState([]);

  const updateApplication = async (id, status, applicant, club) => {
    try {
      const response = await fetch("/api/applications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, reviewerNotes: "Reviewed by campus administrator." }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Application review failed.");
      setApplicationsQueue((previous) => previous.map((item) => item.id === id ? { ...item, status } : item));
      showToast(`${applicant}'s application for ${club} was ${status}.`);
    } catch (error) { showToast(error.message || "Could not update application."); }
  };
  const handleApproveApp = (id, name, club) => updateApplication(id, "accepted", name, club);
  const handleRejectApp = (id, name, club) => updateApplication(id, "rejected", name, club);

  const handleUserRoleChange = async (user) => {
    const nextRole = user.role === "leader" ? "student" : "leader";
    try {
      const response = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, role: nextRole }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Role update failed.");
      setUsersList((previous) => previous.map((item) => item.id === user.id ? { ...item, role: nextRole } : item));
      showToast(`${user.name} is now assigned the ${nextRole} role. They must sign in again to refresh their session.`);
    } catch (error) { showToast(error.message || "Could not update role."); }
  };

  // --- STATE FOR USER MANAGEMENT ---
  const [usersList, setUsersList] = useState([]);

  // Load every administrative view from authenticated, persistent API records.
  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") return;
    let cancelled = false;
    async function loadAdminData() {
      try {
        const endpoints = ["/api/clubs", "/api/members", "/api/tasks", "/api/evidence", "/api/applications", "/api/events", "/api/users"];
        const responses = await Promise.all(endpoints.map((url) => fetch(url)));
        const payloads = await Promise.all(responses.map((response) => response.json()));
        if (cancelled) return;
        const [clubsData, membersData, tasksData, evidenceData, applicationsData, eventsData, usersData] = payloads;
        if (responses.some((response) => !response.ok)) throw new Error("One or more admin data services could not be loaded.");
        const clubs = clubsData.clubs || [];
        const members = membersData.members || [];
        const tasks = tasksData.tasks || [];
        const mappedClubs = clubs.map((club) => {
          const clubId = String(club._id || club.id);
          const clubMembers = members.filter((member) => String(member.clubId) === clubId);
          const activeMembers = clubMembers.filter((member) => member.status === "active").length;
          const score = Number(club.trustScore) || 0;
          return { id: clubId, name: club.name, category: club.category || "Uncategorised", lead: club.presidentName || "Not assigned", coordinator: club.coordinatorName || "Not recorded", totalMembers: clubMembers.length, activeMembers, trustScore: score, tier: club.transparencyTier || "Under Review", health: score >= 70 ? "Healthy" : "Needs Attention" };
        });
        setAllClubsList(mappedClubs);
        if (!selectedClubId && mappedClubs[0]) setSelectedClubId(mappedClubs[0].id);
        setMembersTable(members.map((member) => {
          const assigned = tasks.filter((task) => String(task.assigneeId) === String(member.userId));
          return { id: String(member._id || member.userId), clubId: String(member.clubId), name: member.userName || "Unnamed member", role: member.clubRole || "Member", tasks: Number(member.tasksCompleted) || assigned.filter((task) => task.status === "completed").length, events: Number(member.eventsAttended) || 0, score: Number(member.contributionScore) || 0, status: member.status || "unknown" };
        }));
        setTasksList(tasks);
        setEventsList((evidenceData.evidence || []).map((item) => ({ id: String(item._id || item.id), club: item.clubName || "Club not recorded", title: item.title, chair: item.submittedByName || "Unknown submitter", venue: item.eventTitle || "Not supplied", date: item.date || item.submittedAt, attendance: Number(item.attendanceCount) || 0, status: item.status, fundAmount: "Not tracked", attachments: [...(item.mediaUrls || []), item.reportUrl].filter(Boolean).join(" · ") || "No attachments supplied", clubId: String(item.clubId) })));
        setApplicationsQueue((applicationsData.applications || []).map((app) => ({ id: String(app._id || app.id), applicant: app.applicantName || "Applicant", email: app.applicantEmail || "", department: app.department || "Not supplied", year: app.year || "Not supplied", clubName: app.clubName || "Club", role: app.roleApplied || "Membership", hours: Number(app.weeklyHoursAvailable) || 0, status: app.status, reason: app.reason || "No application statement supplied" })));
        setUsersList((usersData.users || []).map((user) => {
          const ownedClub = clubs.find((club) => String(club.presidentId) === String(user._id || user.id));
          return { id: String(user._id || user.id), name: user.name, email: user.email, role: user.role, club: ownedClub?.name || "—", dept: user.department || "—", status: "Registered" };
        }));
      } catch (error) {
        console.error("Admin data load failed:", error);
        showToast(error.message || "Could not load live admin records.");
      }
    }
    loadAdminData();
    return () => { cancelled = true; };
  }, [currentUser]);

  // --- STATE FOR SETTINGS ---
  const [auditThreshold, setAuditThreshold] = useState(75);
  const [burnoutThreshold, setBurnoutThreshold] = useState(30);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    showToast("These thresholds are currently a local preview and are not saved to the database.");
  };

  if (isLoading || !currentUser || currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white text-xs gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="font-semibold text-slate-400">Verifying administrator clearance...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-2 sm:p-4 lg:p-6 flex flex-col md:flex-row gap-4 lg:gap-6 font-sans transition-colors duration-300 ${
      isDark ? "bg-[#121316] text-slate-100" : "bg-[#EDF1F7] text-slate-900"
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#D2F863] text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top">
          <CheckCircle2 className="h-4 w-4 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. CLUBPULSE DEAN SIDEBAR */}
      <aside className={`w-64 flex flex-col justify-between shrink-0 hidden md:flex py-2 pl-2 pr-1 transition-colors duration-300 ${
        isDark ? "bg-[#121316] text-slate-300" : "bg-[#EDF1F7] text-slate-700"
      }`}>
        <div>
          {/* Top Brand Logo */}
          <Link href="/" className="flex items-center gap-3 px-3 py-3 mb-6 group cursor-pointer">
            <div className="w-9 h-9 rounded-2xl bg-[#D2F863] flex items-center justify-center text-slate-950 font-black shadow-md shadow-[#D2F863]/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className={`text-xl font-black tracking-tight leading-none block ${isDark ? "text-white" : "text-slate-900"}`}>
                ClubPulse<span className="text-[#D2F863]">.</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mt-0.5">
                Dean Console
              </span>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="space-y-1 text-xs">
            {[
              { label: "Dashboard", icon: LayoutDashboard, badge: "3" },
              { label: "All Clubs", icon: Building2 },
              { label: "Contribution Analytics", icon: Activity },
              { label: "Events & Impact", icon: Calendar },
              { label: "Recruitment Reviews", icon: FileCheck },
              { label: "Reports", icon: FileText, badge: "1" },
              { label: "User Management", icon: UserCheck },
              { label: "Settings", icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item.label)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-slate-900 font-extrabold shadow-md"
                      : isDark
                      ? "text-slate-400 hover:text-white hover:bg-white/5 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-slate-900" : isDark ? "text-slate-400" : "text-slate-500"}`} />
                    <span className="text-xs">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                        isActive
                          ? "bg-[#D2F863] text-slate-950"
                          : "bg-[#D2F863] text-slate-950"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Dean Governance Card & Switch View */}
        <div className="space-y-3 mt-6">
          <div className="bg-[#D2F863] text-slate-950 rounded-[28px] p-5 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <h4 className="text-sm font-extrabold text-slate-950 tracking-tight leading-tight">
                  Dean Governance
                </h4>
              </div>
              <p className="text-[11px] font-semibold text-slate-800 mt-1 leading-snug">
                Audit status is calculated from current saved records.
              </p>
              
              <div className="mt-3.5 pt-3 border-t border-slate-900/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleNavClick("Reports")}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 text-white font-bold text-[11px] shadow-sm hover:scale-105 transition-transform cursor-pointer"
                >
                  View Dossier →
                </button>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                  {allClubsList.length} Clubs
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSwitchToStudent}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-colors cursor-pointer ${
              isDark
                ? "bg-[#1C1D22] hover:bg-[#25272F] text-slate-300 hover:text-white"
                : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs"
            }`}
          >
            <GraduationCap className="h-4 w-4 text-[#D2F863]" />
            <span>Switch to Student View</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT INSET ISLAND */}
      <main className={`flex-1 rounded-[36px] p-5 sm:p-7 lg:p-9 shadow-2xl overflow-y-auto flex flex-col justify-between border transition-all duration-300 ${
        isDark ? "bg-[#14151B] border-white/10 text-white" : "bg-[#EBEEF2] border-slate-200/90 text-slate-900"
      }`}>
        <div>
          {/* Top Header Bar */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            {/* User Profile with Switch Dropdown */}
            <div className="relative">
              <div
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-2xl hover:bg-white/5 transition-colors select-none"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-0.5 shadow-xs shrink-0">
                  <img
                    src={currentUser?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-extrabold transition-colors ${isDark ? "text-white group-hover:text-[#D2F863]" : "text-slate-900 group-hover:text-blue-600"}`}>
                      {currentUser?.name || "Prof. Marcus Vance"}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <p className={`text-[11px] font-medium -mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {currentUser?.email || "marcus.vance@campus.edu"}
                  </p>
                </div>
              </div>

              {showProfileMenu && (
                <div className={`absolute left-0 mt-2 w-56 rounded-2xl p-2 shadow-2xl z-50 border ${
                  isDark ? "bg-[#181920] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
                }`}>
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10 mb-1">
                    <p className="text-xs font-bold truncate">{currentUser?.name || "Administrator"}</p>
                    <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">Dean / Admin Role</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleSwitchToStudent();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer text-left"
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Switch to Student View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                      router.push("/login");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Controls: Search + Theme Toggle + Notification Bell */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className={`w-56 sm:w-64 pl-10 pr-4 py-2.5 rounded-full text-xs transition-colors duration-300 focus:outline-none focus:ring-2 ${
                    isDark
                      ? "bg-[#1F2129] text-white placeholder-slate-400 border border-white/10 focus:ring-[#D2F863]/40"
                      : "bg-white text-slate-800 placeholder-slate-400 shadow-xs focus:ring-slate-300"
                  }`}
                />
              </div>

              {/* Theme Toggle Button */}
              <ThemeToggle />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => showToast("2 unread Dean alerts in audit queue")}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isDark
                      ? "bg-[#1F2129] text-slate-200 border border-white/10 hover:text-white hover:border-[#D2F863]/50"
                      : "bg-white text-slate-700 shadow-xs hover:text-slate-900 hover:shadow-md"
                  }`}
                >
                  <Bell className="h-4 w-4" />
                </button>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D2F863] text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs">
                  2
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isDark
                    ? "bg-[#1F2129] text-slate-400 border border-white/10 hover:text-rose-400 hover:border-rose-400/40"
                    : "bg-white text-slate-500 shadow-xs hover:text-rose-600 hover:shadow-md"
                }`}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Page Heading Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-6 mb-7">
            <div>
              <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight transition-colors duration-300 ${
                isDark ? "text-white" : "text-slate-900"
              }`}>
                {activeNav === "Dashboard" && "Club Governance Overview"}
                {activeNav === "All Clubs" && "All Campus Clubs Management"}
                {activeNav === "Contribution Analytics" && "Member Contribution Analytics"}
                {activeNav === "Events & Impact" && "Evidence Verification"}
                {activeNav === "Recruitment Reviews" && "Recruitment Reviews"}
                {activeNav === "Reports" && "Compliance Reports & Audit Dossiers"}
                {activeNav === "User Management" && "Campus User Accounts"}
                {activeNav === "Settings" && "Governance & Audit Parameters"}
              </h1>
              <p className={`text-xs sm:text-sm font-medium mt-1 transition-colors duration-300 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}>
                {activeNav === "Dashboard" && "Real-time chapter health, member verified contributions, and audit compliance."}
                {activeNav !== "Dashboard" && "Inspect rosters, track activity proofs, and manage chapter health."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Live database snapshot
              </span>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-xs font-extrabold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? "bg-[#1F2129] text-white border border-white/10 hover:border-white/20"
                    : "bg-white text-slate-800 hover:shadow-md"
                }`}
              >
                <span>Today</span>
                <ChevronDown className="h-3 w-3 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation Tabs for small screens */}
          <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-3 mb-5 border-b border-slate-200">
            {[
              { label: "Dashboard", icon: LayoutDashboard },
              { label: "All Clubs", icon: Building2 },
              { label: "Contribution Analytics", icon: Activity },
              { label: "Events & Impact", icon: Calendar },
              { label: "Recruitment Reviews", icon: FileCheck },
              { label: "Reports", icon: FileText },
              { label: "User Management", icon: UserCheck },
              { label: "Settings", icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item.label)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? "bg-white text-slate-900 shadow-xs"
                      : "bg-slate-200/70 text-slate-600 hover:bg-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* ============================================================== */}
          {/* VIEW 1: DASHBOARD (OVERVIEW) — CLUBPULSE GOVERNANCE TELEMETRY */}
          {/* ============================================================== */}
          {activeNav === "Dashboard" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { label: "Registered clubs", value: allClubsList.length, icon: Building2 },
                  { label: "Membership records", value: membersTable.length, icon: Users },
                  { label: "Tasks recorded", value: tasksList.length, icon: CheckCircle2 },
                  { label: "Evidence awaiting review", value: eventsList.filter((item) => item.status === "unverified" || item.status === "pending").length, icon: FileCheck },
                ].map((metric) => { const MetricIcon = metric.icon; return <div key={metric.label} className={`rounded-3xl border p-6 ${isDark ? "bg-[#1C1E26] border-white/10" : "bg-white border-slate-200"}`}><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{metric.label}</span><MetricIcon className="h-5 w-5 text-blue-500" /></div><p className={`mt-4 text-3xl font-black font-mono ${isDark ? "text-white" : "text-slate-900"}`}>{metric.value}</p></div>; })}
              </div>
              <div className={`rounded-3xl border p-6 ${isDark ? "bg-[#1C1E26] border-white/10" : "bg-white border-slate-200"}`}>
                <h2 className="text-base font-bold">Club trust &amp; activity overview</h2><p className="text-xs text-slate-500 mt-1 mb-4">Calculated from saved club, membership and evidence records.</p>
                {allClubsList.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No club records exist yet.</p> : <div className="space-y-3">{allClubsList.map((club) => <div key={club.id} className="flex items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/10 pb-3"><div><p className="text-sm font-semibold">{club.name}</p><p className="text-xs text-slate-500">{club.category} · {club.activeMembers}/{club.totalMembers} active members</p></div><div className="text-right"><p className="text-sm font-bold">{club.trustScore}/100</p><p className="text-xs text-slate-500">{club.tier}</p></div></div>)}</div>}
              </div>
            </div>
          )}

                {/* VIEW 2: ALL CLUBS */}
        {/* ============================================================== */}
        {activeNav === "All Clubs" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className={`rounded-3xl border shadow-xs overflow-hidden transition-all duration-300 ${
              isDark ? "bg-[#1C1E26] border-white/10 text-white" : "bg-white border-slate-200/90 text-slate-900"
            }`}>
              <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDark ? "border-white/10" : "border-slate-100"
              }`}>
                <div>
                  <h2 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Campus Organization Directory</h2>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Showing all registered chapters, designated leads, and audit standing</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                    isDark ? "bg-white/10 text-[#D2F863] border-white/15" : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                    {allClubsList.length} Registered Clubs
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isDark ? "border-white/10 bg-white/5 text-slate-400" : "border-slate-100 bg-slate-50/70 text-slate-500"
                    }`}>
                      <th className="py-3 px-5">Club Name</th>
                      <th className="py-3 px-5">Category</th>
                      <th className="py-3 px-5">Club Lead</th>
                      <th className="py-3 px-5">Faculty Coordinator</th>
                      <th className="py-3 px-5 text-center">Members (Active / Total)</th>
                      <th className="py-3 px-5 text-center">Trust Score</th>
                      <th className="py-3 px-5 text-center">Health Status</th>
                      <th className="py-3 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-white/10 text-slate-200" : "divide-slate-100 text-slate-700"}`}>
                    {allClubsList.map((c) => (
                      <tr key={c.id} className={`${isDark ? "hover:bg-white/5" : "hover:bg-slate-50/80"} transition-colors`}>
                        <td className={`py-4 px-5 font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                          {c.name}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-700"
                          }`}>
                            {c.category}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-medium">{c.lead}</td>
                        <td className={`py-4 px-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{c.coordinator}</td>
                        <td className="py-4 px-5 text-center font-mono">
                          <span className="font-bold text-emerald-500">{c.activeMembers}</span> / {c.totalMembers}
                        </td>
                        <td className={`py-4 px-5 text-center font-mono font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                          {c.trustScore}/100
                        </td>
                        <td className="py-4 px-5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              c.health === "Healthy"
                                ? isDark ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : c.health === "Needs Attention"
                                ? isDark ? "bg-amber-950/40 text-amber-400 border-amber-800/40" : "bg-amber-50 text-amber-700 border-amber-200"
                                : isDark ? "bg-rose-950/40 text-rose-400 border-rose-800/40" : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {c.health}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClubId(c.id);
                              setActiveNav("Contribution Analytics");
                            }}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                              isDark ? "bg-white/10 hover:bg-[#D2F863] text-white hover:text-slate-950" : "bg-blue-50 hover:bg-blue-100 text-blue-700"
                            }`}
                          >
                            Inspect Roster →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: CONTRIBUTION ANALYTICS & OVERLOAD (SCREEN 5) */}
        {/* ============================================================== */}
        {activeNav === "Contribution Analytics" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className={`rounded-3xl border p-6 ${isDark ? "bg-[#1C1E26] border-white/10" : "bg-white border-slate-200"}`}>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Select a registered club</label>
              <select value={selectedClubId} onChange={(event) => setSelectedClubId(event.target.value)} className="w-full max-w-md rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm"><option value="">Select club</option>{allClubsList.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select>
              {selectedClubId ? <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">{[
                { label: "Members", value: membersTable.filter((member) => member.clubId === selectedClubId).length },
                { label: "Active members", value: membersTable.filter((member) => member.clubId === selectedClubId && member.status === "active").length },
                { label: "Tasks", value: tasksList.filter((task) => String(task.clubId) === selectedClubId).length },
                { label: "Evidence records", value: eventsList.filter((item) => item.clubId === selectedClubId).length },
              ].map((metric) => <div key={metric.label} className="rounded-2xl bg-slate-50 dark:bg-white/5 p-4"><p className="text-xs text-slate-500">{metric.label}</p><p className="mt-2 text-2xl font-bold">{metric.value}</p></div>)}</div> : <p className="mt-4 text-sm text-slate-500">No club selected.</p>}
            </div>
            <div className={`rounded-3xl border overflow-hidden ${isDark ? "bg-[#1C1E26] border-white/10" : "bg-white border-slate-200"}`}><div className="p-5 border-b border-slate-200 dark:border-white/10"><h2 className="font-bold">Member contribution records</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="bg-slate-50 dark:bg-white/5"><th className="p-3">Member</th><th className="p-3">Role</th><th className="p-3">Tasks completed</th><th className="p-3">Contribution score</th><th className="p-3">Status</th></tr></thead><tbody>{membersTable.filter((member) => !selectedClubId || member.clubId === selectedClubId).map((member) => <tr key={member.id} className="border-t border-slate-200 dark:border-white/10"><td className="p-3 font-semibold">{member.name}</td><td className="p-3">{member.role}</td><td className="p-3">{member.tasks}</td><td className="p-3">{member.score}</td><td className="p-3">{member.status}</td></tr>)}</tbody></table></div>{membersTable.filter((member) => !selectedClubId || member.clubId === selectedClubId).length === 0 && <p className="p-8 text-center text-sm text-slate-500">No membership records for this club.</p>}</div>
          </div>
        )}

                {/* VIEW 4: EVENTS & IMPACT VERIFICATION (USER'S CLICKED SECTION) */}
        {/* ============================================================== */}
        {activeNav === "Events & Impact" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-5 rounded-2xl border shadow-xs transition-all duration-300 ${
                isDark ? "bg-[#1C1E26] border-white/10 text-white" : "bg-white border-slate-200 shadow-xs"
              }`}>
                <span className="text-2xl font-extrabold text-blue-500 font-mono block">{eventsList.filter((item) => item.status === "verified").length}</span>
                <span className={`text-xs font-medium mt-1 block ${isDark ? "text-slate-400" : "text-slate-500"}`}>Verified Evidence Records</span>
              </div>
              <div className={`p-5 rounded-2xl border shadow-xs transition-all duration-300 ${
                isDark ? "bg-[#1C1E26] border-white/10 text-white" : "bg-white border-slate-200 shadow-xs"
              }`}>
                <span className="text-2xl font-extrabold text-emerald-500 font-mono block">{allClubsList.length}</span>
                <span className={`text-xs font-medium mt-1 block ${isDark ? "text-slate-400" : "text-slate-500"}`}>Registered Campus Clubs</span>
              </div>
              <div className={`p-5 rounded-2xl border shadow-xs transition-all duration-300 ${
                isDark ? "bg-[#1C1E26] border-white/10 text-white" : "bg-white border-slate-200 shadow-xs"
              }`}>
                <span className={`text-2xl font-extrabold font-mono block ${isDark ? "text-white" : "text-slate-900"}`}>
                  {eventsList.filter((e) => e.status === "pending" || e.status === "unverified").length} Pending
                </span>
                <span className={`text-xs font-medium mt-1 block ${isDark ? "text-slate-400" : "text-slate-500"}`}>Evidence awaiting administrator review</span>
              </div>
            </div>

            {/* Audit Queue List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Evidence Review Queue</h2>
                <span className={`text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {eventsList.filter((e) => e.status === "pending" || e.status === "unverified").length} requiring administrator review
                </span>
              </div>

              {eventsList.map((ev) => {
                const isVerified = ev.status === "verified";
                return (
                  <div
                    key={ev.id}
                    className={`p-6 rounded-3xl border shadow-xs flex flex-col gap-4 transition-all duration-300 ${
                      isDark ? "bg-[#1C1E26] border-white/10 text-white" : "bg-white border-slate-200/90 text-slate-900"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`font-bold font-mono ${isDark ? "text-[#D2F863]" : "text-blue-600"}`}>{ev.club}</span>
                          <span className={isDark ? "text-white/20" : "text-slate-300"}>•</span>
                          <span className={isDark ? "text-slate-300" : "text-slate-500"}>{ev.chair}</span>
                          <span className={isDark ? "text-white/20" : "text-slate-300"}>•</span>
                          <span className={isDark ? "text-slate-300" : "text-slate-500"}>{ev.venue}</span>
                        </div>
                        <h3 className={`text-base font-bold mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{ev.title}</h3>
                      </div>

                      <span
                        className={`self-start px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                          isVerified
                            ? isDark ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isDark ? "bg-amber-950/40 text-amber-400 border-amber-800/40" : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {isVerified ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Evidence Verified</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3.5 w-3.5" />
                            <span>Audit Pending</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Telemetry info */}
                    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl text-xs font-mono border ${
                      isDark ? "bg-[#22242D] border-white/10 text-white" : "bg-slate-50 border-slate-100 text-slate-900"
                    }`}>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Attendance submitted</span>
                        <span className={`font-bold text-xs mt-0.5 block ${isDark ? "text-white" : "text-slate-900"}`}>{ev.attendance} Attendees</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Funding data</span>
                        <span className={`font-bold text-xs mt-0.5 block ${isDark ? "text-[#D2F863]" : "text-blue-600"}`}>{ev.fundAmount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Submission date</span>
                        <span className={`font-bold text-xs mt-0.5 block ${isDark ? "text-slate-200" : "text-slate-700"}`}>{ev.date}</span>
                      </div>
                    </div>

                    <p className={`text-xs flex items-center gap-1.5 ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                      <FileCheck className={`h-4 w-4 shrink-0 ${isDark ? "text-[#D2F863]" : "text-blue-600"}`} />
                      <span>{ev.attachments}</span>
                    </p>

                    <div className={`pt-3 border-t flex items-center justify-end gap-3 ${isDark ? "border-white/10" : "border-slate-100"}`}>
                      {!isVerified ? (
                        <button
                          type="button"
                          onClick={() => handleVerifyEvent(ev.id, ev.club)}
                          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Verify Evidence</span>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                          <Check className="h-4 w-4" /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 5: RECRUITMENT REVIEWS */}
        {/* ============================================================== */}
        {activeNav === "Recruitment Reviews" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className={`rounded-3xl border shadow-xs overflow-hidden transition-all duration-300 ${
              isDark ? "bg-[#1C1E26] border-white/10 text-white" : "bg-white border-slate-200/90 text-slate-900"
            }`}>
              <div className={`p-6 border-b flex items-center justify-between ${isDark ? "border-white/10" : "border-slate-100"}`}>
                <div>
                  <h2 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Student Membership Applications</h2>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Approve, under-review, or reject student applicants across all campus organizations</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                  isDark ? "bg-white/10 text-purple-300 border-white/15" : "bg-purple-50 text-purple-700 border-purple-200"
                }`}>
                  {applicationsQueue.length} Applications
                </span>
              </div>

              <div className={`divide-y ${isDark ? "divide-white/10" : "divide-slate-100"}`}>
                {applicationsQueue.map((app) => (
                  <div key={app.id} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isDark ? "hover:bg-white/5" : "hover:bg-slate-50/50"
                  }`}>
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2.5">
                        <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{app.applicant}</h4>
                        <span className={`text-xs font-mono ${isDark ? "text-slate-400" : "text-slate-400"}`}>({app.email})</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isDark ? "bg-white/10 text-[#D2F863]" : "bg-blue-50 text-blue-700"
                        }`}>
                          {app.clubName}
                        </span>
                      </div>
                      <p className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                        Applying for: <span className={isDark ? "text-blue-400 font-bold" : "text-blue-600 font-bold"}>{app.role}</span> · {app.hours} hrs/wk capacity
                      </p>
                      <p className={`text-xs italic p-3 rounded-xl border ${
                        isDark ? "bg-[#22242D] border-white/10 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-600"
                      }`}>
                        "{app.reason}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      {app.status === "pending" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRejectApp(app.id, app.applicant, app.clubName)}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold text-slate-600 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveApp(app.id, app.applicant, app.clubName)}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                            app.status === "accepted"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {app.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 6: REPORTS & AUDIT DOSSIERS */}
        {/* ============================================================== */}
        {activeNav === "Reports" && (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1C1E26] p-10 text-center">
            <FileDown className="h-10 w-10 mx-auto text-slate-400 mb-3" />
            <h2 className="text-base font-bold">No report exports generated</h2>
            <p className="text-sm text-slate-500 mt-2">Reports will appear here when a saved reporting/export workflow is configured. No sample reports are displayed.</p>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 7: USER MANAGEMENT */}
        {/* ============================================================== */}
        {activeNav === "User Management" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Campus User Accounts</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Student leaders, faculty coordinators, and registered members</p>
                </div>
                <button
                  disabled
                  title="Invitation workflow is not connected yet"
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Invites unavailable</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-5">Name & Email</th>
                      <th className="py-3 px-5">System Role</th>
                      <th className="py-3 px-5">Assigned Club</th>
                      <th className="py-3 px-5">Department</th>
                      <th className="py-3 px-5 text-center">Status</th>
                      <th className="py-3 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-slate-900 block">{u.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono block">{u.email}</span>
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-slate-800">{u.role}</td>
                        <td className="py-3.5 px-5 text-blue-600 font-medium">{u.club}</td>
                        <td className="py-3.5 px-5 text-slate-500">{u.dept}</td>
                        <td className="py-3.5 px-5 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {u.role !== "admin" && <button type="button" onClick={() => handleUserRoleChange(u)} className="px-3 py-1 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold">{u.role === "leader" ? "Set student" : "Promote to leader"}</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 8: SETTINGS */}
        {/* ============================================================== */}
        {activeNav === "Settings" && (
          <div className="max-w-2xl bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Audit & Governance Parameters</h2>
              <p className="text-xs text-slate-500 mt-1">Preview thresholds. Persistent governance settings are not connected in this build.</p>
            </div>

            {/* Appearance & Interface Theme Selector */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Appearance &amp; Theme</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Toggle interface contrast and color modes across all views</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-200 text-slate-800">
                    {theme} Mode
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Dark Mode Card */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme("dark");
                    showToast("ClubPulse Dark Mode activated");
                  }}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all cursor-pointer text-left ${
                    isDark
                      ? "border-slate-900 bg-[#121316] text-white shadow-md ring-2 ring-[#D2F863]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#18191E] flex items-center justify-center text-[#D2F863] shrink-0 shadow-xs">
                    <Moon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">ClubPulse Dark</span>
                    <span className="text-[11px] text-slate-400">Deep obsidian &amp; neon accents</span>
                  </div>
                  {isDark && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-[#D2F863]" />
                  )}
                </button>

                {/* Light Mode Card */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme("light");
                    showToast("ClubPulse Light Mode activated");
                  }}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all cursor-pointer text-left ${
                    !isDark
                      ? "border-blue-600 bg-white text-slate-900 shadow-md ring-2 ring-blue-500"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 shadow-xs">
                    <Sun className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-slate-900">ClubPulse Light</span>
                    <span className="text-[11px] text-slate-500">Clean platinum &amp; crisp whites</span>
                  </div>
                  {!isDark && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Active Term / Semester
                </label>
                <input
                  type="text"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Minimum Trust Score for Dean Grant Disbursement</span>
                  <span className="font-mono text-blue-600 font-bold">{auditThreshold} / 100</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  value={auditThreshold}
                  onChange={(e) => setAuditThreshold(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Officer Workload Overload Alert Threshold</span>
                  <span className="font-mono text-amber-600 font-bold">&gt; {burnoutThreshold}% load</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={50}
                  value={burnoutThreshold}
                  onChange={(e) => setBurnoutThreshold(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Send instant Dean alerts when club active quota drops below quorum</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#121316] flex items-center justify-center text-slate-300 text-xs">
          Loading Dean & Admin Console...
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
