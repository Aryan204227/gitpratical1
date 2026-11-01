"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import ApplyClubModal from "@/components/ApplyClubModal";
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  Megaphone,
  Palette,
  Bot,
  Music,
  Users,
  Calendar,
  Building2,
  ChevronRight,
  Trophy,
  Camera,
  Compass,
} from "lucide-react";

export default function RecruitmentHubPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const [recruitmentsList, setRecruitmentsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadRecruitments() {
      try {
        const response = await fetch("/api/clubs?recruitment=open");
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Could not load open club recruitment.");
        if (cancelled) return;
        setRecruitmentsList((data.clubs || []).map((club) => {
          const category = club.category || "Other";
          const Icon = category.toLowerCase().includes("sport") ? Trophy : category.toLowerCase().includes("cultur") ? Music : category.toLowerCase().includes("design") ? Palette : category.toLowerCase().includes("market") ? Megaphone : Zap;
          const deadline = club.recruitmentDeadline ? new Date(club.recruitmentDeadline) : null;
          const daysRemaining = deadline && !Number.isNaN(deadline.getTime())
            ? Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400000))
            : null;
          return {
            id: String(club._id || club.id),
            clubId: String(club._id || club.id),
            clubName: club.name,
            role: "Membership & Contribution Intake",
            category,
            tags: Array.isArray(club.requirements) ? club.requirements : [],
            description: club.description || club.tagLine || "Club membership applications are open.",
            daysLeft: daysRemaining === null ? "Open now" : daysRemaining === 0 ? "Deadline today" : `${daysRemaining} days remaining`,
            deadline: club.recruitmentDeadline || "No deadline set",
            status: "Open",
            icon: Icon,
            iconBg: "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-[#D2F863]",
          };
        }));
      } catch (error) {
        if (!cancelled) setLoadError(error.message || "Recruitment data is unavailable.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadRecruitments();
    return () => { cancelled = true; };
  }, []);

  const filtered = recruitmentsList.filter((item) => {
    const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.clubName.toLowerCase().includes(search.toLowerCase()) ||
      item.role.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => String(t).toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleApplyClick = (item) => {
    setSelectedClub({ id: item.clubId, name: item.clubName });
    setSelectedRole("General Member");
    setIsModalOpen(true);
  };

  const handleApplySuccess = () => {
    setToastMessage("Application submitted! Check status in your Student Dashboard.");
    setTimeout(() => setToastMessage(""), 4500);
  };

  return (
    <div className="bg-[#EDF1F7] dark:bg-[#121316] text-slate-900 dark:text-slate-100 min-h-screen py-8 pb-20 transition-colors duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-[#D2F863] border border-blue-200 dark:border-white/10 mb-2">
              <Briefcase className="h-3.5 w-3.5" />
              <span>Campus Recruitment Portals</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Open Club Recruitments
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Apply to join core teams, executive boards, and general member cohorts for the current semester.
            </p>
          </div>

          <Link
            href="/dashboard/student"
            className="text-xs font-bold text-blue-600 dark:text-[#D2F863] hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Back to Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#14151B] border border-slate-200/90 dark:border-white/10 shadow-xs transition-colors">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {["All", ...new Set(recruitmentsList.map((item) => item.category))].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by club, role, track..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#1C1E26] border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Recruitments Grid */}
        {loadError && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{loadError}</p>}
        {isLoading ? <p className="py-12 text-center text-sm text-slate-500">Loading live recruitment records…</p> : filtered.length === 0 ? <p className="py-12 text-center text-sm text-slate-500">No clubs currently have recruitment open.</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#14151B] rounded-3xl border border-slate-200/90 dark:border-white/10 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                        <IconComp className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                          {item.clubName}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                          {item.role}
                        </h3>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 shrink-0">
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {item.description}
                  </p>

                  {/* Track Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {item.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{item.daysLeft}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span>Applications open</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyClick(item)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>}
      </div>

      <ApplyClubModal
        club={selectedClub}
        initialRole={selectedRole}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleApplySuccess}
      />
    </div>
  );
}
