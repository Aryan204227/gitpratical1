"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Calendar, HeartHandshake, CheckCircle2 } from "lucide-react";
export default function RequestBreakModal({ clubId, clubName, isOpen, onClose, onSuccess, }) {
    const { currentUser } = useAuth();
    const [reason, setReason] = useState("Midterm & Final Exams");
    const [customReason, setCustomReason] = useState("");
    const [endDate, setEndDate] = useState("2026-11-20");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    if (!isOpen)
        return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage("");
        const finalReason = reason === "Other" ? customReason : reason;
        try {
            const res = await fetch("/api/members/break-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: currentUser.id,
                    clubId,
                    reason: finalReason,
                    endDate,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to submit break request");
            }
            onSuccess();
            onClose();
        }
        catch (err) {
            setMessage(err.message || "Failed to record break");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-[#d97706]/40 bg-[#12151c] p-6 shadow-2xl text-slate-100 sm:p-7">
        <button onClick={onClose} className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:bg-[#1a1f2c] hover:text-white transition-colors">
          <X className="h-5 w-5"/>
        </button>

        <div className="flex items-center gap-3 border-b border-[#d97706]/20 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl badge-gold">
            <HeartHandshake className="h-6 w-6 text-[#fbbf24]"/>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Request Academic / Personal Break
            </h3>
            <p className="text-xs text-slate-400">
              {clubName}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-[#0b0d12] border border-[#d97706]/25 p-3 text-xs text-slate-300">
          <p className="font-semibold text-white">
            Supportive Leave Policy
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Life happens! Taking a break notifies leadership so you will not be marked as a "ghost member" or assigned urgent tasks while prioritizing studies or health.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reason for Temporary Leave
            </label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-xl border border-[#d97706]/25 bg-[#0b0d12] p-2.5 text-xs text-white focus:border-[#f59e0b] focus:outline-none">
              <option value="Midterm & Final Exams">Midterm & Final Exams</option>
              <option value="Capstone / Heavy Academic Milestone">Capstone / Heavy Academic Milestone</option>
              <option value="Health or Medical Recovery">Health or Medical Recovery</option>
              <option value="Off-Campus Internship / Co-op">Off-Campus Internship / Co-op</option>
              <option value="Personal / Family Emergency">Personal / Family Emergency</option>
              <option value="Other">Other Reason</option>
            </select>
          </div>

          {reason === "Other" && (<div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Specify Reason
              </label>
              <input type="text" required value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Brief reason for leadership..." className="w-full rounded-xl border border-[#d97706]/25 bg-[#0b0d12] p-2.5 text-xs text-white focus:border-[#f59e0b] focus:outline-none placeholder:text-slate-500"/>
            </div>)}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Expected Return Date
            </label>
            <div className="relative">
              <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl border border-[#d97706]/25 bg-[#0b0d12] p-2.5 pl-9 text-xs text-white focus:border-[#f59e0b] focus:outline-none"/>
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400"/>
            </div>
          </div>

          {message && (<p className="text-xs text-red-400">{message}</p>)}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-[#d97706]/30 bg-[#0b0d12] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-[#1a1f2c] hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-1.5 rounded-xl btn-gold px-4 py-2 text-xs font-semibold text-slate-950 shadow-md disabled:opacity-50">
              <CheckCircle2 className="h-3.5 w-3.5"/>
              {isSubmitting ? "Saving..." : "Confirm Temporary Break"}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
