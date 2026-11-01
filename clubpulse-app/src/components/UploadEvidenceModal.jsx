"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Upload, ShieldAlert } from "lucide-react";
export default function UploadEvidenceModal({ clubId, clubName, isOpen, onClose, onSuccess, }) {
    const { currentUser } = useAuth();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Technical Workshop");
    const [attendanceCount, setAttendanceCount] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [reportUrl, setReportUrl] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    if (!isOpen)
        return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            setError("Please provide title and activity description.");
            return;
        }
        setIsSubmitting(true);
        setError("");
        try {
            const res = await fetch("/api/evidence", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clubId,
                    clubName,
                    title,
                    description,
                    category,
                    date,
                    attendanceCount,
                    mediaUrls: mediaUrl.trim() ? [mediaUrl.trim()] : [],
                    reportUrl: reportUrl || undefined,
                    submittedBy: currentUser.id,
                    submittedByName: currentUser.name,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to submit evidence");
            }
            onSuccess();
            onClose();
        }
        catch (err) {
            setError(err.message || "Failed to submit evidence");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#d97706]/40 bg-[#12151c] p-6 shadow-2xl text-slate-100 sm:p-7">
        <button onClick={onClose} className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:bg-[#1a1f2c] hover:text-white transition-colors">
          <X className="h-5 w-5"/>
        </button>

        <div className="border-b border-[#d97706]/20 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl badge-gold">
              <Upload className="h-4 w-4 text-[#fbbf24]"/>
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                Submit Verified Activity Evidence
              </h3>
              <p className="text-xs text-slate-400">
                {clubName} • Public Transparency Ledger
              </p>
            </div>
          </div>
        </div>

        {error && (<div className="mt-3 flex items-center gap-2 rounded-xl bg-red-950/40 border border-red-500/40 p-2.5 text-xs text-red-300">
            {error}
          </div>)}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Event or Activity Title
            </label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AI Prompt Engineering & API Workshop" className="w-full rounded-xl border border-[#d97706]/25 bg-[#0b0d12] p-2.5 text-xs text-white focus:border-[#f59e0b] focus:outline-none placeholder:text-slate-500"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-[#d97706]/25 bg-[#0b0d12] p-2.5 text-xs text-white focus:border-[#f59e0b] focus:outline-none">
                <option value="Technical Workshop">Technical Workshop</option>
                <option value="Campus Hackathon">Campus Hackathon</option>
                <option value="Guest Lecture">Guest Lecture</option>
                <option value="Sprint / Code Review">Sprint / Code Review</option>
                <option value="Community Initiative">Community Initiative</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Verified Attendee Count
              </label>
              <input type="number" min={1} value={attendanceCount} onChange={(e) => setAttendanceCount(Number(e.target.value))} className="w-full rounded-xl border border-[#d97706]/25 bg-[#0b0d12] p-2.5 text-xs text-white focus:border-[#f59e0b] focus:outline-none"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Evidence Summary & Deliverables
            </label>
            <textarea required rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what was accomplished, curriculum taught, and deliverables completed..." className="w-full rounded-xl border border-[#d97706]/25 bg-[#0b0d12] p-2.5 text-xs text-white focus:border-[#f59e0b] focus:outline-none placeholder:text-slate-500"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Photographic / Documentation Proof URL
            </label>
            <input type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-[#d97706]/25 bg-[#0b0d12] p-2.5 text-xs text-white focus:border-[#f59e0b] focus:outline-none placeholder:text-slate-500"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Repository / Report / Drive Link (Optional)
            </label>
            <input type="url" value={reportUrl} onChange={(e) => setReportUrl(e.target.value)} placeholder="https://github.com/... or Google Drive link" className="w-full rounded-xl border border-[#d97706]/25 bg-[#0b0d12] p-2.5 text-xs text-white focus:border-[#f59e0b] focus:outline-none placeholder:text-slate-500"/>
          </div>

          <div className="rounded-xl bg-[#d97706]/10 border border-[#d97706]/30 p-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[#fbbf24]">
              <ShieldAlert className="h-3.5 w-3.5 text-[#f59e0b]"/> Administrative Audit Workflow
            </div>
            <p className="mt-1 text-[11px] text-amber-200/80">
              Submissions enter the ledger as <strong>Unverified</strong> until reviewed and authenticated by university administration. This prevents exaggerated claims.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-[#d97706]/30 bg-[#0b0d12] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-[#1a1f2c] hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-1.5 rounded-xl btn-gold px-4 py-2 text-xs font-semibold text-slate-950 shadow-md disabled:opacity-50">
              <Upload className="h-3.5 w-3.5"/>
              {isSubmitting ? "Uploading..." : "Submit for Audit"}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
