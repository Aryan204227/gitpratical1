"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StudentDashboardPage from "@/app/dashboard/student/page";

export default function StudentDashboardAlias() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push("/login?redirect=/student/dashboard");
    }
  }, [currentUser, isLoading, router]);

  return <StudentDashboardPage />;
}
