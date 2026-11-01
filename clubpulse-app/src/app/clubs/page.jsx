"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ApplyClubModal from "@/components/ApplyClubModal";
import {
  Search,
  Users,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  Zap,
  Building2,
  Star,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Technical",
  "Cultural",
  "Sports",
  "Photography",
  "Social Service",
  "Marketing",
  "Entrepreneurship",
];

export default function ClubsDirectoryPage() {
  const { currentUser } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [onlyRecruiting, setOnlyRecruiting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedClubForApply, setSelectedClubForApply] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (search) params.append("search", search);
      if (onlyRecruiting) params.append("recruitment", "open");

      const res = await fetch(`/api/clubs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setClubs(data.clubs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, [selectedCategory, search, onlyRecruiting]);

  const handleApplySuccess = () => {
    setToastMessage("Application submitted! Track status on your Student Dashboard.");
    setTimeout(() => setToastMessage(""), 5000);
  };

  return (
    <div className="bg-[#EDF1F7] dark:bg-[#121316] text-slate-900 dark:text-slate-100 min-h-screen py-8 pb-20 transition-colors duration-300">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-[#D2F863] border border-blue-200 dark:border-white/10 mb-2">
              <Building2 className="h-3.5 w-3.5" />
              <span>Campus Organization Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Explore All Clubs & Societies
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Find verified student organizations, browse open recruitments, and submit your membership application.
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

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#14151B] border border-slate-200/90 dark:border-white/10 shadow-xs transition-colors">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {CATEGORIES.map((cat) => (
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

          {/* Search & Recruitment Toggle */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, tag..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#1C1E26] border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
              <input
                type="checkbox"
                checked={onlyRecruiting}
                onChange={(e) => setOnlyRecruiting(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span>Recruiting Now</span>
            </label>
          </div>
        </div>

        {/* Clubs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#14151B] rounded-3xl border border-slate-200/90 dark:border-white/10 h-72 animate-pulse"
              />
            ))}
          </div>
        ) : clubs.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#14151B] border border-slate-200/90 dark:border-white/10">
            <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              No organizations found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn't find any student clubs matching "{selectedCategory}". Try clearing your filters or search keywords.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSearch("");
                setOnlyRecruiting(false);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {clubs.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-[#14151B] rounded-3xl border border-slate-200/90 dark:border-white/10 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-36 w-full overflow-hidden bg-slate-900">
                    <img
                      src={c.banner || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80"}
                      alt={c.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                    <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-[#1C1E26]/90 text-slate-800 dark:text-slate-200 backdrop-blur-md shadow-xs border border-white/20 dark:border-white/10">
                      {c.category}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {c.name}
                      </h3>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        ★ 4.5
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {c.tagLine || c.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>{c.memberCount || 120} members</span>
                      <span className={c.recruitmentOpen ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}>
                        {c.recruitmentOpen ? "● Recruitments Open" : "Closed"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center gap-2">
                  <Link
                    href={`/clubs/${c.id}`}
                    className="flex-1 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C1E26] hover:bg-blue-50 dark:hover:bg-[#252834] text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-[#D2F863] border border-slate-200/80 dark:border-white/10 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <span>View Details</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  {c.recruitmentOpen && (
                    <button
                      type="button"
                      onClick={() => setSelectedClubForApply(c)}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 shrink-0 cursor-pointer"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ApplyClubModal
        club={selectedClubForApply}
        isOpen={!!selectedClubForApply}
        onClose={() => setSelectedClubForApply(null)}
        onSuccess={handleApplySuccess}
      />
    </div>
  );
}
