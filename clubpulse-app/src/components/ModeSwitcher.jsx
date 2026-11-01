"use client";
import { Database } from "lucide-react";
export default function ModeSwitcher() {
  return <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400" title="Connected application mode: live database records"><Database className="h-3.5 w-3.5" /><span>Live Data</span></div>;
}
