"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ApplyClubModal from "@/components/ApplyClubModal";
import {
  Users,
  Zap,
  Calendar,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Megaphone,
  Briefcase,
  Share2,
  Bookmark,
  Award,
  ChevronRight,
  Mail,
  MapPin,
} from "lucide-react";

export default function ClubDetailPage() {
  const params = useParams();
  const clubId = params.id;
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState("recruitment");
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedRoleForApply, setSelectedRoleForApply] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const [club, setClub] = useState(null);
  const [currentRecruitments, setCurrentRecruitments] = useState([]);
  const [pastRecruitments] = useState([]);
  const [clubLeaders, setClubLeaders] = useState([]);
  const [clubEvents, setClubEvents] = useState([]);
  const [clubEvidence, setClubEvidence] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    async function fetchClub() {
      try {
        const response = await fetch(`/api/clubs/${clubId}`);
        const data = await response.json();
        if (!response.ok || !data.success || !data.club) throw new Error(data.error || "Club not found.");
        if (cancelled) return;
        const record = data.club;
        setClubLeaders(data.leaders || []);
        setClubEvents(data.events || []);
        setClubEvidence(data.evidence || []);
        setClub({
          id: String(record._id || record.id),
          name: record.name,
          tagline: record.tagLine || "",
          tags: [record.category, ...(Array.isArray(record.requirements) ? record.requirements : [])].filter(Boolean),
          members: data.membersCount || 0,
          activeMembers: data.activeMembersCount || 0,
          eventsConducted: (data.events || []).length,
          trustScore: Number(record.trustScore) || 0,
          transparencyTier: record.transparencyTier || "Under Review",
          banner: record.banner || "",
          description: record.description || "",
          contactEmail: record.contactEmail || "Not provided",
          meetingSchedule: record.meetingSchedule || "Not provided",
          presidentName: record.presidentName || "Not assigned",
        });
        setCurrentRecruitments(record.recruitmentOpen ? [{
          id: String(record._id || record.id),
          title: "Membership Applications",
          tracks: (record.requirements || []).join(" · ") || "Open to interested campus members",
          status: "Open",
          daysRemaining: record.recruitmentDeadline ? `Deadline: ${record.recruitmentDeadline}` : "No deadline set",
          icon: Megaphone,
          iconBg: "bg-blue-100 text-blue-600",
        }] : []);
      } catch (error) {
        if (!cancelled) setLoadError(error.message || "Failed to load club details.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchClub();
    return () => { cancelled = true; };
  }, [clubId]);

  const handleApplySuccess = () => {
    setToastMessage("Application submitted! Club leads will review your portfolio.");
    setTimeout(() => setToastMessage(""), 4500);
  };

  const handleOpenModal = (roleTitle) => {
    setSelectedRoleForApply("General Member");
    setIsApplyModalOpen(true);
  };

  if (isLoading) return <div className="min-h-screen grid place-items-center text-sm text-slate-500">Loading club records…</div>;
  if (!club) return <div className="min-h-screen grid place-items-center p-8 text-center"><div><h1 className="text-xl font-bold">Club not found</h1><p className="mt-2 text-sm text-slate-500">{loadError || "This club record is not available."}</p><Link href="/clubs" className="inline-block mt-4 text-blue-600 underline">Return to clubs</Link></div></div>;

  return (
    <div className="bg-[#EDF1F7] dark:bg-[#121316] text-slate-900 dark:text-slate-100 min-h-screen pb-20 pt-4 transition-colors duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Link href="/dashboard/student" className="hover:text-blue-600 dark:hover:text-[#D2F863]">
            Student Dashboard
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
          <Link href="/clubs" className="hover:text-blue-600 dark:hover:text-[#D2F863]">
            Clubs
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
          <span className="text-slate-800 dark:text-white font-semibold">{club.name}</span>
        </div>

        {/* HERO CARD WITH COVER BANNER */}
        <section className="bg-white dark:bg-[#14151B] rounded-3xl border border-slate-200/90 dark:border-white/10 overflow-hidden shadow-xs transition-colors duration-300">
          {/* Cover Photo */}
          <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
            {club.banner && <img src={club.banner} alt={club.name} className="w-full h-full object-cover opacity-90" />}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          </div>

          {/* Profile Header Details */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-6">
              {/* Avatar + Title */}
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-blue-600 border-4 border-white dark:border-[#14151B] shadow-md flex items-center justify-center text-white shrink-0">
                  <Zap className="h-12 w-12" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    {club.name}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {club.tagline}
                  </p>
                  {/* Category Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {club.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-[#D2F863] border border-blue-200/60 dark:border-blue-900/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenModal("General Member / Core")}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Apply for Recruitment</span>
                </button>

              </div>
            </div>

            {/* Key Statistics Bar */}
            <div className="pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 leading-none">
                    {club.members}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Members</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 leading-none">
                    {club.activeMembers}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Active Members</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 leading-none">
                    {club.eventsConducted}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Events Conducted</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 leading-none flex items-center gap-1">
                    <span>{club.trustScore}</span>
                    <span className="text-xs text-amber-500 font-normal">/ 100</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Trust Score</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {["Overview", "Members", "Events", "Recruitment", "Achievements"].map((tab) => {
            const key = tab.toLowerCase();
            const isActive = activeTab === key;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENTS */}
        {activeTab === "recruitment" && (
          <div className="space-y-6">
            {/* Current Recruitments */}
            <div className="space-y-3.5">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Current Recruitments
              </h2>

              {currentRecruitments.map((rec) => {
                const IconComp = rec.icon;
                return (
                  <div
                    key={rec.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${rec.iconBg}`}>
                        <IconComp className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-sm font-bold text-slate-900">
                            {rec.title}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            {rec.status}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {rec.daysRemaining}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          {rec.tracks}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenModal(rec.title)}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Past Recruitments */}
            <div className="space-y-3.5 pt-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Past Recruitments
              </h2>

              {pastRecruitments.length === 0 ? <p className="text-sm text-slate-500">No closed recruitment history is recorded for this club.</p> : pastRecruitments.map((rec) => {
                const IconComp = rec.icon;
                return (
                  <div
                    key={rec.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-80"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                        <IconComp className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-700">
                            {rec.title}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {rec.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{rec.date}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setToastMessage("Archived recruitment record viewed.");
                        setTimeout(() => setToastMessage(""), 2000);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 transition-colors self-start sm:self-auto"
                    >
                      View Details
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "overview" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#14151B] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4 transition-colors">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">About the Club</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
              {club.description}
            </p>
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-[#D2F863]" />
                <span>Weekly Meetings: {club.meetingSchedule}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600 dark:text-[#D2F863]" />
                <span>Contact: {club.contactEmail}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Leadership & Active Roster</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {clubLeaders.length === 0 ? <p className="col-span-full text-sm text-slate-500">No leadership roles are recorded for this club yet.</p> : clubLeaders.map((leader) => <div key={leader._id || leader.userId} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80"><span className="text-[11px] font-bold text-blue-600 uppercase">{leader.clubRole || "Club member"}</span><h4 className="text-sm font-bold text-slate-900 mt-1">{leader.userName || "Member"}</h4><p className="text-xs text-slate-500">{leader.userEmail || "Contact not provided"}</p></div>)}
            </div>
          </div>
        )}

        {activeTab === "events" && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Conducted & Upcoming Events</h2>
            <div className="space-y-3">
              {clubEvents.length === 0 ? <p className="text-sm text-slate-500">No events have been recorded for this club.</p> : clubEvents.map((event) => <div key={event._id || event.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4"><div><h4 className="text-sm font-bold text-slate-900">{event.title}</h4><p className="text-xs text-slate-500">{event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "Date not supplied"} · {event.location || "Location not supplied"}</p></div><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{Array.isArray(event.attendees) ? event.attendees.length : 0} RSVPs</span></div>)}
            </div>
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Verified Badges & Dean Standing</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80"><Award className="h-8 w-8 text-amber-500 shrink-0" /><div><h4 className="text-sm font-bold text-slate-900">{club.transparencyTier}</h4><p className="text-xs text-slate-600">Current trust score: {club.trustScore}/100. This score is calculated from recorded promises, verified evidence and active membership retention.</p></div></div>
              {clubEvidence.filter((item) => item.status === "verified").length === 0 ? <p className="text-sm text-slate-500">No evidence has been verified for this club yet.</p> : clubEvidence.filter((item) => item.status === "verified").map((item) => <div key={item._id || item.id} className="rounded-xl border border-slate-200 p-3"><p className="text-sm font-semibold">{item.title}</p><p className="text-xs text-slate-500">{item.date || item.submittedAt}</p></div>)}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Application Modal */}
      <ApplyClubModal
        club={club}
        initialRole={selectedRoleForApply}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={handleApplySuccess}
      />
    </div>
  );
}
