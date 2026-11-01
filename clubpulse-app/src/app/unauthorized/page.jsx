"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldAlert,
  GraduationCap,
  ArrowLeft,
  LogOut,
  Lock,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  const handleAuthorizeDean = () => {
    router.push("/login?tab=login");
  };

  const handleSignOutAndLogin = async () => {
    try {
      await logout();
      router.push("/login?tab=login");
    } catch (err) {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between p-6 sm:p-10 font-sans">
      {/* Top Navbar */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-extrabold text-slate-900 tracking-tight leading-none block">
              ClubPulse
            </span>
            <span className="text-[10px] font-semibold text-slate-500 block">
              Campus Security
            </span>
          </div>
        </Link>

        {currentUser && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {currentUser.role?.toUpperCase() || "STUDENT"} ROLE
              </p>
            </div>
            <button
              onClick={handleSignOutAndLogin}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Switch Account</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Restrict Box */}
      <main className="max-w-lg mx-auto w-full my-auto py-12 text-center animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-xl shadow-slate-200/50">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-6 shadow-sm">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200/80 mb-3 tracking-wide">
            403 · ACCESS DENIED
          </span>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Administrator Clearance Required
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            The Dean &amp; Admin Console contains restricted university governance, funding disbursements, and audit logs. Your authenticated account (
            <span className="font-semibold text-slate-800">
              {currentUser?.email || "current session"}
            </span>
            ) has <span className="font-bold text-blue-600">Student</span> access permissions and cannot view this panel.
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Lock className="h-4 w-4 text-blue-600 shrink-0" />
              <span>How are Administrator accounts authorized?</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Dean and Admin privileges cannot be self-selected. They are authorized by university administration via verified email domains or IT whitelist credentials.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/dashboard/student"
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Student Portal</span>
            </Link>

            <button
              onClick={handleAuthorizeDean}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign in as Dean</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400">
        ClubPulse Campus Security &amp; Access Governance
      </footer>
    </div>
  );
}
