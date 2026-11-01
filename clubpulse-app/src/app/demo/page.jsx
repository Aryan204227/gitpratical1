import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function DemoPlaceholderPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-16 dark:bg-[#060911]">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-[#0A0E1A]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
          <Compass className="h-7 w-7" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">ClubPulse preview</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900 dark:text-white">Demo Preview is coming in Phase 2</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Demo personas and sample records are not available yet. This page does not create demo users or connect to the live database.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-100">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-[#00E599] px-5 py-3 text-sm font-black text-slate-950">
            Sign in to Live ClubPulse
          </Link>
        </div>
      </section>
    </main>
  );
}
