"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  Search,
  LogOut,
  ChevronDown,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import ModeSwitcher from "@/components/ModeSwitcher";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    currentUser,
    logout,
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!mounted) {
    return null;
  }

  // Hide Navbar completely on role selector / login, unauthorized, and Admin Dashboard (which has its own full sidebar)
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/dashboard/admin")
  ) {
    return null;
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/clubs?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 h-[64px] bg-white dark:bg-[#18191E] border-b border-slate-200/90 dark:border-white/10 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard/student" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                Club<span className="text-blue-600 dark:text-[#D2F863]">Pulse</span>
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-[13px] font-medium text-slate-600 dark:text-slate-300">
            <Link
              href="/dashboard/student"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === "/dashboard/student"
                  ? "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-[#D2F863] font-semibold"
                  : "hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
            >
              Home
            </Link>
            <Link
              href="/clubs"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith("/clubs")
                  ? "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-[#D2F863] font-semibold"
                  : "hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
            >
              Clubs
            </Link>
            <Link
              href="/recruitment"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === "/recruitment"
                  ? "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-[#D2F863] font-semibold"
                  : "hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
            >
              Recruitment
            </Link>
            <Link
              href="/activity"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === "/activity" || pathname === "/my-activity"
                  ? "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-[#D2F863] font-semibold"
                  : "hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
            >
              My Activity
            </Link>
            <Link
              href="/about"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === "/about" || pathname === "/transparency"
                  ? "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-[#D2F863] font-semibold"
                  : "hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
            >
              About
            </Link>
          </nav>
        </div>

        {/* Search Bar & Right Actions */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clubs..."
              className="w-48 lg:w-64 pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </form>

          {/* Global Mode Switcher */}
          <ModeSwitcher />

          {/* Dark / Light Mode Toggle Button */}
          <ThemeToggle />

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#18191E] border border-slate-200 dark:border-white/10 p-3 shadow-xl z-50 animate-in fade-in-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-blue-600 dark:text-[#D2F863] hover:underline text-[11px] font-medium cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="mt-2 max-h-60 overflow-y-auto space-y-2 text-xs">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                          n.read
                            ? "bg-transparent text-slate-500 dark:text-slate-400"
                            : "bg-blue-50/70 dark:bg-white/5 text-slate-800 dark:text-white border-l-2 border-blue-600 dark:border-[#D2F863]"
                        }`}
                      >
                        <p className="font-semibold text-xs">{n.title || n.message}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : "Just now"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-slate-400 dark:text-slate-500 text-xs">
                      No new notifications
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-[#D2F863] overflow-hidden">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{currentUser?.name ? currentUser.name.charAt(0) : "U"}</span>
                )}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                  {currentUser?.name || "Account"}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize leading-tight">
                  Student
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 hidden md:inline" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#18191E] border border-slate-200 dark:border-white/10 p-2 shadow-xl z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10 mb-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser?.name || "Account"}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Student Account</p>
                </div>
                <Link
                  href="/dashboard/student"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-[#D2F863] hover:bg-blue-50 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  My Dashboard
                </Link>
                <Link
                  href="/activity"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-[#D2F863] hover:bg-blue-50 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  My Activity & Proofs
                </Link>
                <Link
                  href="/"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  Role Selector
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                    router.push("/");
                  }}
                  className="w-full text-left flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
