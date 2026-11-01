"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Send, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

export default function ApplyClubModal({ club, isOpen, onClose, onSuccess, initialRole }) {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState("");
  const [skills, setSkills] = useState("");
  const [roleApplied, setRoleApplied] = useState(initialRole || "General Member");
  const [hours, setHours] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (initialRole) setRoleApplied(initialRole);
  }, [initialRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser?.id || !club?.id) {
      setError("Sign in and select a real club before applying.");
      return;
    }
    if (!reason.trim() || !hours || hours < 1) {
      setError("Please provide your reason and weekly availability (at least 1 hour).");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const skillsArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId: club.id,
          clubName: club.name,
          roleApplied,
          reason,
          skills: skillsArray,
          weeklyHoursAvailable: hours,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit application");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#14151B] p-6 sm:p-8 shadow-2xl text-slate-800 dark:text-slate-100 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-blue-600 dark:text-[#D2F863] text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="h-4 w-4" />
          <span>Membership Application</span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Apply to {club?.name || "Selected Club"}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Submit your application to become an active contributor or core team member.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Position / Role
            </label>
            <select
              value={roleApplied}
              onChange={(e) => setRoleApplied(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#1C1E26] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            >
              <option value="General Member">General Member (Open to all branches)</option>
              <option value="Core Team - Web Dev">Core Team — Web Developer</option>
              <option value="Core Team - Design">Core Team — UI/UX Designer</option>
              <option value="Core Team - Events">Core Team — Event Coordinator</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Statement of Interest / Motivation
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you want to join? What skills or passion do you bring?"
              className="w-full bg-slate-50 dark:bg-[#1C1E26] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Key Skills (comma separated)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. React, Python, Video Editing, Public Speaking"
              className="w-full bg-slate-50 dark:bg-[#1C1E26] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Weekly Commitment Capacity</span>
              <span className="text-blue-600 dark:text-[#D2F863] font-bold">{hours} hours / week</span>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-[#D2F863]"
            />
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
              Helps club leadership prevent workload burnout.
            </span>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Submitting..." : "Submit Application"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
