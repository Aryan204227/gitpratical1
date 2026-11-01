"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Award,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Users,
  Activity,
  Zap,
  Sparkles,
} from "lucide-react";

export default function TransparencyAndAboutPage() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/clubs");
        const data = await res.json();
        if (data.success) {
          setClubs(data.clubs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="bg-[#EDF1F7] dark:bg-[#121316] text-slate-900 dark:text-slate-100 min-h-screen py-8 pb-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-[#D2F863] border border-blue-200 dark:border-white/10 mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Campus Public Accountability Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              About ClubPulse & Transparency Criteria
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 max-w-2xl leading-relaxed">
              Eliminating ghost clubs, protecting student leaders from burnout, and ensuring promised co-curricular workshops and mentorship are authenticated with the Dean of Student Affairs.
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

        {/* 3 Pillars / Trust Score Formula */}
        <section className="bg-white dark:bg-[#14151B] rounded-3xl border border-slate-200/90 dark:border-white/10 p-6 sm:p-8 shadow-xs space-y-6 transition-colors duration-300">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-[#D2F863] flex items-center justify-center">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                How the Campus Trust Score is Computed
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                An objective 0–100 index calculating quorum fulfillment, verified receipts, and member retention.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {/* Card 1: Promise Fulfillment */}
            <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-[#1C1E26] border border-blue-100 dark:border-white/10 flex flex-col justify-between transition-colors duration-300">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40">
                  45% Weight
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3">
                  Promise Fulfillment
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Percentage of stated recruitment objectives (workshops, hackathons, guest lectures) fully executed and documented.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-blue-100 dark:border-white/10 text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                Validated through event manifests
              </div>
            </div>

            {/* Card 2: Verified Evidence Ratio */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-[#1C1E26] border border-emerald-100 dark:border-white/10 flex flex-col justify-between transition-colors duration-300">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40">
                  35% Weight
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3">
                  Verified Evidence Ratio
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Ratio of activities signed off by the Dean of Student Affairs with attendee sign-in rosters, venue slips, and GitHub repos.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-100 dark:border-white/10 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                100% dean audit clearance
              </div>
            </div>

            {/* Card 3: Active Member Retention */}
            <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-[#1C1E26] border border-purple-100 dark:border-white/10 flex flex-col justify-between transition-colors duration-300">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-900/40">
                  20% Weight
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3">
                  Active Member Retention
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Health score tracking genuine member contribution, preventing overloaded lead burnout through academic exam shields.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-purple-100 dark:border-white/10 text-[11px] font-semibold text-purple-700 dark:text-purple-400">
                Zero punitive drop policy
              </div>
            </div>
          </div>
        </section>

        {/* Club Trust Matrix Table */}
        <section className="bg-white dark:bg-[#14151B] rounded-3xl border border-slate-200/90 dark:border-white/10 p-6 sm:p-8 shadow-xs space-y-6 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Campus Organization Trust Rankings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Live audit ratings and Tier standing across registered student clubs
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 self-start sm:self-auto border border-slate-200 dark:border-white/10">
              Updated Live · Quad-7 Term
            </span>
          </div>

          <div className="space-y-3.5">
            {clubs && clubs.length > 0 ? (
              clubs
                .sort((a, b) => b.trustScore - a.trustScore)
                .map((club, idx) => (
                  <div
                    key={club.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-[#1C1E26] border border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#252834] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-xl bg-white dark:bg-[#14151B] border border-slate-200 dark:border-white/10 flex items-center justify-center text-xs font-extrabold text-blue-600 dark:text-[#D2F863] shadow-2xs font-mono shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {club.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-[#D2F863] border border-blue-200 dark:border-blue-900/50">
                            {club.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          President: {club.presidentName} · {club.memberCount} active members
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-start sm:self-auto">
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono block">
                          {club.trustScore || 90} / 100
                        </span>
                        <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase flex items-center justify-end gap-1">
                          <Sparkles className="h-3 w-3" />
                          <span>Tier 1 Gold Certified</span>
                        </span>
                      </div>

                      <Link
                        href={`/clubs/${club.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#14151B] hover:bg-blue-50 dark:hover:bg-[#252834] text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-[#D2F863] text-xs font-bold border border-slate-200 dark:border-white/10 transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <span>View</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Loading campus ratings...
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
