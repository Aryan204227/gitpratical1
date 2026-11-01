"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Hide on login/role selector and admin dashboard
  if (pathname === "/" || pathname === "/login" || pathname.startsWith("/dashboard/admin")) {
    return null;
  }

  return (
    <footer className="w-full border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#18191E] py-6 text-slate-500 dark:text-slate-400 text-xs mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-[#D2F863]" />
          <span className="text-slate-600 dark:text-slate-300">ClubPulse — University Campus Club Operating System</span>
        </div>
        <div className="flex items-center gap-6 font-medium text-slate-600 dark:text-slate-400">
          <Link href="/clubs" className="hover:text-blue-600 dark:hover:text-[#D2F863] transition-colors">
            Clubs Directory
          </Link>
          <Link href="/dashboard/student" className="hover:text-blue-600 dark:hover:text-[#D2F863] transition-colors">
            Student Dashboard
          </Link>
          <Link href="/dashboard/admin" className="hover:text-blue-600 dark:hover:text-[#D2F863] transition-colors">
            Dean Console
          </Link>
        </div>
      </div>
    </footer>
  );
}
