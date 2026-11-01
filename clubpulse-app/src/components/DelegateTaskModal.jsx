"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, ArrowRightLeft, Sparkles } from "lucide-react";
export default function DelegateTaskModal({ task, members, isOpen, onClose, onSuccess, }) {
    const { currentUser } = useAuth();
    const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    if (!isOpen || !task)
        return null;
    // Filter out current assignee and members on leave
    const eligibleMembers = members.filter((m) => m.userId !== task.assigneeId && m.status !== "on_leave");
    // Smart recommendation: member with highest attendance and lowest weekly load
    const recommendedMember = [...eligibleMembers].sort((a, b) => a.estimatedWeeklyHours - b.estimatedWeeklyHours)[0];
    const handleDelegate = async (targetId) => {
        const finalId = targetId || selectedAssigneeId || recommendedMember?.userId;
        if (!finalId) {
            setError("Please choose a member to delegate to.");
            return;
        }
        const targetMember = members.find((m) => m.userId === finalId);
        if (!targetMember)
            return;
        setIsSubmitting(true);
        setError("");
        try {
            const res = await fetch(`/api/tasks/${task.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    newAssigneeId: targetMember.userId,
                    newAssigneeName: targetMember.userName,
                    delegatedByName: currentUser.name,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to delegate task");
            }
            onSuccess();
            onClose();
        }
        catch (err) {
            setError(err.message || "Failed to delegate");
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
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl badge-gold">
              <ArrowRightLeft className="h-4 w-4 text-[#fbbf24]"/>
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                Rebalance Workload & Delegate
              </h3>
              <p className="text-xs text-slate-400">
                Redistribute responsibility from overloaded leads
              </p>
            </div>
          </div>
        </div>

        {/* Current task details */}
        <div className="mt-4 rounded-2xl bg-[#0b0d12] p-4 border border-[#d97706]/30">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Current Task
              </span>
              <p className="text-sm font-bold text-white">
                {task.title}
              </p>
            </div>
            <span className="rounded-full badge-gold px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
              {task.estimatedHours} Hours
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Currently assigned to: <strong className="text-amber-200">{task.assigneeName}</strong> ({task.assigneeRole})
          </p>
        </div>

        {/* AI Workload Recommendation */}
        {recommendedMember && (<div className="mt-4 rounded-2xl bg-gradient-to-r from-[#d97706]/15 to-[#b45309]/10 p-4 border border-[#d97706]/40">
            <div className="flex items-center gap-2 text-[#fbbf24] font-semibold text-xs">
              <Sparkles className="h-4 w-4 text-[#f59e0b]"/>
              <span>Recommended Rebalance Target</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={recommendedMember.userAvatar} alt={recommendedMember.userName} className="h-9 w-9 rounded-full object-cover ring-2 ring-[#d97706]/50"/>
                <div>
                  <p className="text-xs font-bold text-white">
                    {recommendedMember.userName}
                  </p>
                  <p className="text-[11px] text-amber-200/80">
                    Low load: only {recommendedMember.estimatedWeeklyHours}h assigned • {recommendedMember.attendanceRate}% attendance
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => handleDelegate(recommendedMember.userId)} disabled={isSubmitting} className="rounded-xl btn-gold px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-sm disabled:opacity-50">
                1-Click Delegate
              </button>
            </div>
          </div>)}

        {error && (<div className="mt-3 flex items-center gap-2 rounded-xl bg-red-950/40 border border-red-500/40 p-2.5 text-xs text-red-300">
            {error}
          </div>)}

        {/* Or select custom member */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Or Choose from Available Team Members:
          </label>
          <div className="max-h-44 overflow-y-auto space-y-1.5 rounded-xl border border-[#d97706]/30 bg-[#0b0d12] p-2">
            {eligibleMembers.map((m) => (<label key={m.userId} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${selectedAssigneeId === m.userId
                ? "bg-[#d97706]/20 border border-[#f59e0b]/50"
                : "hover:bg-[#1a1f2c]"}`}>
                <div className="flex items-center gap-2.5">
                  <input type="radio" name="assigneeSelect" value={m.userId} checked={selectedAssigneeId === m.userId} onChange={(e) => setSelectedAssigneeId(e.target.value)} className="accent-[#f59e0b]"/>
                  <div>
                    <p className="font-semibold text-white">
                      {m.userName} ({m.clubRole})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {m.estimatedWeeklyHours} hrs assigned • {m.tasksPending} pending tasks
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-amber-300">
                  {m.attendanceRate}% Attendance
                </span>
              </label>))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5 pt-2 border-t border-[#d97706]/20">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#d97706]/30 bg-[#0b0d12] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-[#1a1f2c] hover:text-white transition-colors">
            Cancel
          </button>
          <button type="button" onClick={() => handleDelegate()} disabled={isSubmitting || (!selectedAssigneeId && !recommendedMember)} className="inline-flex items-center gap-1.5 rounded-xl btn-gold px-4 py-2 text-xs font-semibold text-slate-950 shadow-md disabled:opacity-50">
            <ArrowRightLeft className="h-3.5 w-3.5"/>
            {isSubmitting ? "Delegating..." : "Confirm Delegation"}
          </button>
        </div>
      </div>
    </div>);
}
