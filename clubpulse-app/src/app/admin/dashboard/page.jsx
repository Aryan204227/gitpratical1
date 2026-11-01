"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminDashboardPage from "@/app/dashboard/admin/page";

export default function AdminDashboardAlias() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) {
        router.push("/login?redirect=/admin/dashboard");
      } else if (currentUser.role !== "admin") {
        router.push("/unauthorized");
      }
    }
  }, [currentUser, isLoading, router]);

  // If loading or unauthorized, don't show admin contents
  if (isLoading || !currentUser || currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#121316] flex flex-col items-center justify-center text-white text-xs gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#D2F863] border-t-transparent animate-spin" />
        <p className="font-semibold text-slate-400">Verifying administrator clearance...</p>
      </div>
    );
  }

  return <AdminDashboardPage />;
}
