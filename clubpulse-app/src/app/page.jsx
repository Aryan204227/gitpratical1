import Link from "next/link";
import { ArrowRight, Compass, GraduationCap } from "lucide-react";

export default function HomePage() {
  return (
    <section className="min-h-[calc(100vh-9rem)] flex items-center justify-center px-6 py-16 bg-slate-50 dark:bg-[#060911]">
      <div className="max-w-3xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
          <GraduationCap className="h-8 w-8" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-400">University Club Contribution Platform</p>
        <h1 className="mt-4 text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white">ClubPulse</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          Make club participation visible, distribute work fairly, and recognise verified contributions across campus.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/demo" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 px-6 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900">
            <Compass className="h-4 w-4" /> Explore Demo Preview
          </Link>
          <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#00E599] px-6 py-3.5 text-sm font-black text-slate-950 hover:bg-[#00D48D]">
            Sign in to Live ClubPulse <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-5 text-xs text-slate-500 dark:text-slate-500">The demo preview is a placeholder until Phase 2.</p>
      </div>
    </section>
  );
}
