"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AdminClubDetailRedirect() {
  const params = useParams();
  const router = useRouter();
  useEffect(() => {
    if (params?.id) router.replace(`/clubs/${params.id}`);
  }, [params, router]);
  return <div className="min-h-screen grid place-items-center text-sm text-slate-500">Opening live club record…</div>;
}
