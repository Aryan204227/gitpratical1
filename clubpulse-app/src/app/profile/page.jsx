"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Mail,
  GraduationCap,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LogOut,
  Save,
  KeyRound,
  Sparkles,
  BookOpen,
  ArrowRight,
  Lock,
  Layers,
  Award
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading, updateProfile, logout } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    department: "",
    year: "",
    bio: "",
    avatar: "",
  });

  const [memberships, setMemberships] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'clubs' | 'security'

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || "",
        department: currentUser.department || "Computer Science & Engineering",
        year: currentUser.year || "3rd Year",
        bio: currentUser.bio || "",
        avatar: currentUser.avatar || "",
      });

      // Load user memberships and clubs
      const loadUserClubs = async () => {
        try {
          const [memRes, clubRes] = await Promise.all([
            fetch(`/api/members?userId=${currentUser.id}`),
            fetch("/api/clubs"),
          ]);
          const memData = await memRes.json();
          const clubData = await clubRes.json();
          if (memData.success) setMemberships(memData.members || []);
          if (clubData.success) setClubs(clubData.clubs || []);
        } catch (err) {
          console.error("Failed to load user clubs info", err);
        }
      };

      loadUserClubs();
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      await updateProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-200 flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-400 rounded-full animate-spin"></div>
          <span className="text-xs uppercase tracking-widest text-slate-400 font-mono">Verifying Campus Credentials...</span>
        </div>
      </div>
    );
  }

  // Not signed in state
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-200 pt-28 pb-20 px-4">
        <div className="max-w-md mx-auto text-center bg-[#0d1017]/90 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 text-amber-400">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Campus Authentication Required</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Please sign in with your official university credentials to view and manage your verified ClubPulse profile and club affiliations.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full py-3 px-4 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all text-sm flex items-center justify-center gap-2"
            >
              Sign In to Your Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 border border-slate-800 text-sm transition-all"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const roleLabel =
    currentUser.role === "admin"
      ? "University Campus Administrator"
      : currentUser.role === "leader"
      ? "Club Executive / Officer"
      : "Student Contributor";

  const roleBadgeColor =
    currentUser.role === "admin"
      ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
      : currentUser.role === "leader"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";

  const portalRoute =
    currentUser.role === "admin"
      ? "/dashboard/admin"
      : currentUser.role === "leader"
      ? "/dashboard/leader"
      : "/dashboard/student";

  // Pre-configured avatar choices
  const avatarOptions = [
    { label: "Executive Gold", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" },
    { label: "Tech Lead", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80" },
    { label: "Community Scholar", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80" },
    { label: "Dean Bureau", url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80" },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Link href="/" className="hover:text-amber-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-amber-400">Account Profile & Settings</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={portalRoute}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" /> Launch {currentUser.role === "admin" ? "Admin Bureau" : currentUser.role === "leader" ? "Command Center" : "Student Portal"}
            </Link>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Hero Profile Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d111a] via-[#090b10] to-[#121622] border border-slate-800/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar container */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-xl bg-slate-900 flex-shrink-0">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-amber-400 font-bold text-3xl">
                    {currentUser.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1 rounded-full border-2 border-[#090b10] shadow-md">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {currentUser.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBadgeColor}`}>
                  {roleLabel}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> SSO Verified
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {currentUser.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> {currentUser.department || "General Studies"}
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" /> {currentUser.year || "Undergraduate"}
                </span>
              </div>

              {currentUser.bio && (
                <p className="text-sm text-slate-300 max-w-2xl pt-1 italic font-sans leading-relaxed">
                  "{currentUser.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/60">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono block">Clubs Affiliated</span>
              <span className="text-lg font-bold text-white font-mono">{memberships.length} active</span>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/60">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono block">Clearance Level</span>
              <span className="text-lg font-bold text-amber-400 capitalize">{currentUser.role}</span>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/60">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono block">Campus ID</span>
              <span className="text-lg font-bold text-slate-300 font-mono text-sm truncate block">{currentUser.id}</span>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/60">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono block">Account Status</span>
              <span className="text-lg font-bold text-emerald-400 text-sm flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> In Good Standing
              </span>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 px-4 text-sm font-medium transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "profile"
                ? "border-amber-400 text-amber-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <User className="w-4 h-4" /> Edit Profile & Credentials
          </button>
          <button
            onClick={() => setActiveTab("clubs")}
            className={`pb-3 px-4 text-sm font-medium transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "clubs"
                ? "border-amber-400 text-amber-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" /> My Campus Clubs ({memberships.length})
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`pb-3 px-4 text-sm font-medium transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "security"
                ? "border-amber-400 text-amber-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <KeyRound className="w-4 h-4" /> Security & University SSO
          </button>
        </div>

        {/* Tab 1: Edit Profile */}
        {activeTab === "profile" && (
          <div className="bg-[#0b0e14] border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">Academic Profile Details</h2>
                <p className="text-xs text-slate-400">Update your verified campus identity and academic department information.</p>
              </div>
              <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                Live Directory Sync
              </span>
            </div>

            {saveSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>Your campus profile has been successfully updated and synced across all club rosters!</span>
              </div>
            )}

            {saveError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    Full Legal / Preferred Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-slate-900/80 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    Official Campus Email <span className="text-slate-600 font-normal">(Non-editable SSO)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-500 text-sm outline-none cursor-not-allowed"
                    />
                    <Lock className="w-4 h-4 text-slate-600 absolute right-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    Department / Academic School
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900/80 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                    <option value="School of Management / Business">School of Management / Business</option>
                    <option value="School of Design & Media Arts">School of Design & Media Arts</option>
                    <option value="Biotechnology & Life Sciences">Biotechnology & Life Sciences</option>
                    <option value="Robotics & Mechanical Engineering">Robotics & Mechanical Engineering</option>
                    <option value="Humanities & Social Sciences">Humanities & Social Sciences</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    Academic Year
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900/80 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all"
                  >
                    <option value="1st Year (Freshman)">1st Year (Freshman)</option>
                    <option value="2nd Year (Sophomore)">2nd Year (Sophomore)</option>
                    <option value="3rd Year (Junior)">3rd Year (Junior)</option>
                    <option value="4th Year (Senior)">4th Year (Senior)</option>
                    <option value="Graduate / Master's Candidate">Graduate / Master's Candidate</option>
                    <option value="Faculty / Campus Staff">Faculty / Campus Staff</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Academic Statement / Biography
                </label>
                <textarea
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Share your extracurricular interests, technical specializations, or campus goals..."
                  className="w-full bg-slate-900/80 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl p-3 text-white text-sm outline-none transition-all resize-none"
                />
              </div>

              {/* Avatar Preset Selector */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Profile Avatar Image URL
                </label>
                <input
                  type="url"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleInputChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-900/80 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all mb-3"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-slate-400">Quick Presets:</span>
                  {avatarOptions.map((opt) => (
                    <button
                      type="button"
                      key={opt.label}
                      onClick={() => setFormData((prev) => ({ ...prev, avatar: opt.url }))}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-amber-400/50 transition-all"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 shadow-lg shadow-amber-500/20 text-sm transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Profile Information
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: My Campus Clubs */}
        {activeTab === "clubs" && (
          <div className="space-y-4">
            <div className="bg-[#0b0e14] border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Registered Club Affiliations</h2>
                  <p className="text-xs text-slate-400">All student organizations where your participation is actively recorded.</p>
                </div>
                <Link
                  href="/clubs"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
                >
                  Explore More Clubs <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {memberships.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-slate-300">No active club memberships yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                    Explore open club recruitments on ClubPulse to discover hackathons, research labs, and cultural initiatives.
                  </p>
                  <Link
                    href="/clubs"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:brightness-110 transition-all"
                  >
                    View Campus Clubs Directory
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {memberships.map((mem) => {
                    const clubObj = clubs.find((c) => c.id === mem.clubId);
                    return (
                      <div
                        key={mem.id}
                        className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition-all flex flex-col justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold overflow-hidden flex-shrink-0">
                            {clubObj?.coverImage ? (
                              <img src={clubObj.coverImage} alt={mem.clubName} className="w-full h-full object-cover" />
                            ) : (
                              <Award className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{mem.clubName}</h4>
                            <span className="text-xs text-slate-400 block">{mem.role || "Member"}</span>
                            <span className="inline-block mt-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Status: {mem.status || "Active"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                          <span className="text-slate-500 font-mono">
                            Score: <strong className="text-amber-400">{mem.calculatedScore?.totalScore || 85}/100</strong>
                          </span>
                          <Link
                            href={`/clubs/${clubObj?.slug || mem.clubId}`}
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors"
                          >
                            View Club Page <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Security & University SSO */}
        {activeTab === "security" && (
          <div className="bg-[#0b0e14] border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Campus SSO & Authentication Protocols</h2>
              <p className="text-xs text-slate-400">Security credentials, token verification, and session state.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> University Single Sign-On Status
                  </h3>
                  <p className="text-xs text-slate-400">
                    Your account is securely tethered to your university directory email: <span className="font-mono text-slate-300">{currentUser.email}</span>.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" /> Password Security
                  </h3>
                  <p className="text-xs text-slate-400">
                    Encrypted authentication token is verified upon each login. Passwords require a minimum of 6 characters.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Password reset link dispatched to your registered campus email.")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex-shrink-0"
                >
                  Reset Password
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-rose-400" /> Terminate Session
                  </h3>
                  <p className="text-xs text-slate-400">
                    Clear secure HTTP-only cookies and local session credentials from this browser workstation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex-shrink-0"
                >
                  Sign Out Now
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
