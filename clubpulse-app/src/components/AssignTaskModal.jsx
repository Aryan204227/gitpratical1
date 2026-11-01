"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, PlusCircle, AlertTriangle } from "lucide-react";
export default function AssignTaskModal({ clubId, clubName, members, isOpen, onClose, onSuccess, }) {
    const { currentUser } = useAuth();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("logistics");
    const [assigneeId, setAssigneeId] = useState(members[0]?.userId || "");
    const [priority, setPriority] = useState("medium");
    const [estimatedHours, setEstimatedHours] = useState(0);
    const [dueDate, setDueDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    if (!isOpen)
        return null;
    const selectedMember = members.find((m) => m.userId === assigneeId);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !assigneeId || !dueDate || estimatedHours < 1) {
            setError("Please provide a task title, assignee, due date and a positive hour estimate.");
            return;
        }
        setIsSubmitting(true);
        setError("");
        try {
            const assignee = members.find((m) => m.userId === assigneeId);
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clubId,
                    clubName,
                    title,
                    description,
                    category,
                    assigneeId,
                    assigneeName: assignee?.userName || "Member",
                    assigneeRole: assignee?.clubRole || "Member",
                    assigneeAvatar: assignee?.userAvatar || "",
                    assignedById: currentUser.id,
                    assignedByName: currentUser.name,
                    priority,
                    estimatedHours,
                    dueDate,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to create task");
            }
            onSuccess();
            onClose();
        }
        catch (err) {
            setError(err.message || "Failed to create task");
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
          <h3 className="text-base font-bold text-white">
            Assign Responsibility / Task
          </h3>
          <p className="text-xs text-slate-400">
            {clubName} • Intelligent Workload Distribution
          </p>
        </div>

        {error && (<div className="mt-3 flex items-center gap-2 rounded-xl bg-red-950/40 border border-red-500/40 p-2.5 text-xs text-red-300">
            <p>{error}</p>
          </div>)}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Task Title
            </label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Design Event Promotional Banner" className="w-full rounded-xl border border-[#d97706]/25 bg-[#0b0d12] p-2.5 text-xs text-white focus:border-[#f59e0b] focus:outline-none placeholder:text-slate-500"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-[#d97706]/25 bg-[#0b0d12] p-2.5 text-xs text-white focus:border-[#f59e0b] focus:outline-none">
                <option value="logistics">Logistics & Venue</option>
                <option value="marketing">Marketing & Outreach</option>
                <option value="technical">Technical / Coding</option>
                <option value="event_prep">Event Operations</option>
                <option value="content">Content & Curriculum</option>
                <option value="sponsorship">Sponsorship & Finance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Priority
              </label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-xl border border-[#d97706]/25 bg-[#0b0d12] p-2.5 text-xs text-white focus:border-[#f59e0b] focus:outline-none">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Assignee Selection with Workload Health Indicator */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Assignee (Check Workload to Avoid Overload)
            </label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full rounded-xl border border-[#d97706]/25 bg-[#0b0d12] p-2.5 text-xs text-white focus:border-[#f59e0b] focus:outline-none">
              {members.map((m) => (<option key={m.userId} value={m.userId}>
                  {m.userName} ({m.clubRole}) — {m.estimatedWeeklyHours}h load ({m.tasksPending} pending)
                  {m.status === "on_leave" ? " [ON LEAVE]" : ""}
                </option>))}
            </select>

            {selectedMember && selectedMember.estimatedWeeklyHours >= 18 && (<div className="mt-2 flex items-center gap-2 rounded-xl bg-amber-950/40 border border-amber-500/40 p-2.5 text-xs text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400"/>
                <p>
                  <strong>Workload Warning:</strong> {selectedMember.userName} already has{" "}
                  {selectedMember.estimatedWeeklyHours} hrs assigned. Consider delegating to a member with lower workload to prevent burnout!
                </p>
              </div>)}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estimated Workload
              </label>
              <div className="flex items-center gap-2">
                <input type="number" min={1} max={25} required value={estimatedHours || ""} onChange={(e) => setEstimatedHours(Number(e.target.value))} className="w-full rounded-xl border border-[#d97706]/25 bg-[#0b0d12] p-2.5 text-xs text-white focus:border-[#f59e0b] focus:outline-none"/>
                <span className="text-xs text-slate-400 whitespace-nowrap">Hours</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Due Date
              </label>
              <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-xl border border-[#d97706]/25 bg-[#0b0d12] p-2.5 text-xs text-white focus:border-[#f59e0b] focus:outline-none"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Instructions & Deliverable Description
            </label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide context, required files, or expected deliverables..." className="w-full rounded-xl border border-[#d97706]/25 bg-[#0b0d12] p-2.5 text-xs text-white focus:border-[#f59e0b] focus:outline-none placeholder:text-slate-500"/>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-[#d97706]/30 bg-[#0b0d12] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-[#1a1f2c] hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-1.5 rounded-xl btn-gold px-4 py-2 text-xs font-semibold text-slate-950 shadow-md disabled:opacity-50">
              <PlusCircle className="h-3.5 w-3.5"/>
              {isSubmitting ? "Assigning..." : "Assign Task"}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
