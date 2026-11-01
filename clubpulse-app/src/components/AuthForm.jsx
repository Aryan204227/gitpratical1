"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import ThemeToggle from "@/components/ThemeToggle";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

function AuthFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const initialTab = searchParams.get("tab");
  const configured = isFirebaseConfigured();
  const {
    loginWithFirebaseGoogle,
    loginWithFirebaseEmail,
    registerWithFirebaseEmail,
    resendVerificationEmail,
    requestPasswordReset,
  } = useAuth();

  const [mode, setMode] = useState(initialTab === "register" ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [year, setYear] = useState("2nd Year");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  function redirectByRole(role) {
    if (redirectParam?.startsWith("/") && !redirectParam.startsWith("//")) {
      router.push(redirectParam);
      return;
    }
    const destination = role === "admin"
      ? "/dashboard/admin"
      : role === "leader"
        ? "/dashboard/leader"
        : "/dashboard/student";
    router.push(destination);
  }

  async function handleEmailSignIn(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!email.trim() || !password) {
      setErrorMessage("Enter your email address and password.");
      return;
    }

    setBusy(true);
    try {
      const result = await loginWithFirebaseEmail(email.trim(), password);
      setSuccessMessage(`Welcome back, ${result.user.name}.`);
      redirectByRole(result.user.role);
    } catch (error) {
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setVerificationEmail(email.trim());
        setVerificationRequired(true);
      }
      setErrorMessage(error.message || "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailSignUp(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage("Enter your name, campus email and password.");
      return;
    }

    setBusy(true);
    try {
      const result = await registerWithFirebaseEmail({
        name: name.trim(),
        email: email.trim(),
        password,
        department,
        year,
      });
      if (result.needsEmailVerification) {
        setVerificationEmail(result.email || email.trim());
        setVerificationRequired(true);
        setSuccessMessage("Check your email for the Firebase verification link.");
        return;
      }
      setSuccessMessage("Your account has been created.");
      redirectByRole(result.user.role);
    } catch (error) {
      setErrorMessage(error.message || "Registration failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setErrorMessage("");
    setGoogleBusy(true);
    try {
      const result = await loginWithFirebaseGoogle();
      redirectByRole(result.user.role);
    } catch (error) {
      setErrorMessage(error.message || "Google sign-in failed.");
    } finally {
      setGoogleBusy(false);
    }
  }

  async function handleResendVerification() {
    setErrorMessage("");
    setResendMessage("");
    try {
      const result = await resendVerificationEmail();
      setResendMessage(result.message);
    } catch (error) {
      setErrorMessage(error.message || "Could not resend the verification email.");
    }
  }

  async function handlePasswordReset(event) {
    event.preventDefault();
    setResetError("");
    setResetMessage("");
    if (!resetEmail.includes("@")) {
      setResetError("Enter a valid email address.");
      return;
    }

    setResetBusy(true);
    try {
      const result = await requestPasswordReset(resetEmail);
      setResetMessage(result.message);
    } catch (error) {
      setResetError(error.message || "Could not send the password reset email.");
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#EDF1F7] dark:bg-[#060911]">
      <section className="relative w-full md:w-1/2 min-h-[300px] md:min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950/40" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">ClubPulse</h1>
            <p className="text-[11px] font-medium tracking-wide text-blue-200 uppercase">Discover · Join · Contribute</p>
          </div>
        </div>
        <div className="relative z-10 max-w-lg mt-auto pt-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" /> Campus Community Platform
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Build Connections <span className="text-blue-300">Make an Impact.</span>
          </h2>
          <p className="mt-4 text-sm text-slate-300/90 leading-relaxed">
            Sign in to manage your club work, participation and verified contributions.
          </p>
        </div>
      </section>

      <section className="w-full md:w-1/2 min-h-screen flex flex-col justify-center items-center p-6 sm:p-10 bg-white md:bg-[#EDF1F7] dark:bg-[#060911] relative">
        <div className="absolute top-6 right-6"><ThemeToggle /></div>
        <div className="w-full max-w-[440px] rounded-[32px] bg-white dark:bg-[#0A0E1A] border border-slate-200 dark:border-blue-950/70 p-6 sm:p-8 shadow-2xl relative">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {verificationRequired ? (mode === "register" ? "Check your email" : "Verify your email") : mode === "register" ? "Create an account" : "Welcome back"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1.5">
              {verificationRequired
                ? `A verification link was sent to ${verificationEmail}. Verify your email, then sign in.`
                : mode === "register"
                  ? "Create your student account with Firebase Authentication."
                  : "Sign in to continue your ClubPulse journey."}
            </p>
          </div>

          {!configured && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200">
              Firebase is not configured, see README setup.
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> <span>{successMessage}</span>
            </div>
          )}

          {verificationRequired ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 p-4 text-sm text-slate-700 dark:text-slate-300">
                Open the message from Firebase Authentication and follow its verification link. ClubPulse will not create a login session until the email is verified.
              </div>
              {resendMessage && <p className="text-sm text-emerald-600 dark:text-emerald-300">{resendMessage}</p>}
              <button type="button" onClick={handleResendVerification} className="w-full py-3 rounded-xl bg-[#00E599] text-slate-950 font-bold text-sm">
                Resend verification email
              </button>
              <button type="button" onClick={() => { setVerificationRequired(false); setMode("login"); setErrorMessage(""); setSuccessMessage(""); }} className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200">
                I have verified my email — go to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="mb-5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 px-3 py-2 text-[11px] text-blue-800 dark:text-blue-200">
                ClubPulse assigns access based on your account. You cannot select an administrator role here.
              </div>

              <button type="button" onClick={handleGoogleSignIn} disabled={googleBusy} className="w-full py-3 px-4 rounded-2xl bg-slate-50 dark:bg-[#0D1220] border border-slate-200 dark:border-slate-800 flex items-center justify-between disabled:opacity-50">
                <GoogleIcon />
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">{googleBusy ? "Connecting to Google..." : "Continue with Google"}</span>
                {googleBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
              </button>

              <div className="relative my-5 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800" /></div>
                <span className="relative bg-white dark:bg-[#0A0E1A] px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Or continue with email</span>
              </div>

              {mode === "login" ? (
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Email address
                    <span className="relative mt-1.5 block">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white" />
                    </span>
                  </label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <span className="flex justify-between">Password <button type="button" onClick={() => { setResetEmail(email); setShowReset(true); }} className="text-blue-600 dark:text-blue-400">Forgot password?</button></span>
                    <span className="relative mt-1.5 block">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" className="w-full pl-11 pr-11 py-3 rounded-xl bg-slate-50 dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white" />
                      <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400" aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </span>
                  </label>
                  <button type="submit" disabled={busy} className="w-full py-3.5 rounded-xl bg-[#00E599] hover:bg-[#00D48D] text-slate-950 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {busy ? "Signing in..." : "Sign in"} {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleEmailSignUp} className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Full name<input type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Your full name" className="mt-1.5 w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white" /></label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Campus email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" className="mt-1.5 w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white" /></label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="At least 6 characters" className="mt-1.5 w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white" /></label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Department<input type="text" value={department} onChange={(event) => setDepartment(event.target.value)} className="mt-1.5 w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white" /></label>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Year<select value={year} onChange={(event) => setYear(event.target.value)} className="mt-1.5 w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white"><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>Graduate</option></select></label>
                  <button type="submit" disabled={busy} className="w-full py-3.5 rounded-xl bg-[#00E599] hover:bg-[#00D48D] text-slate-950 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {busy ? "Creating account..." : "Create account"} {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>
              )}

              <div className="text-center mt-5 text-xs text-slate-500 dark:text-slate-400">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}
                <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErrorMessage(""); setSuccessMessage(""); }} className="ml-1 text-blue-600 dark:text-blue-400 font-bold hover:underline">
                  {mode === "login" ? "Create account" : "Sign in"}
                </button>
              </div>
            </>
          )}

          <div className="border-t border-slate-200 dark:border-slate-800 mt-6 pt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
            <Link href="/about" className="hover:text-slate-600 dark:hover:text-slate-300">Terms</Link>
            <span>|</span>
            <Link href="/about" className="hover:text-slate-600 dark:hover:text-slate-300">Privacy</Link>
          </div>
        </div>
      </section>

      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0E1A] p-6 shadow-2xl">
            <button type="button" onClick={() => setShowReset(false)} className="absolute top-4 right-4 text-slate-400" aria-label="Close password reset"><X className="h-4 w-4" /></button>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Reset your password</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">A secure reset link will be sent by Firebase Authentication.</p>
            {resetError && <p className="mt-4 text-xs text-rose-600">{resetError}</p>}
            {resetMessage && <p className="mt-4 text-xs text-emerald-600">{resetMessage}</p>}
            <form onSubmit={handlePasswordReset} className="mt-5 space-y-4">
              <input type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} placeholder="Email address" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white" />
              <button type="submit" disabled={resetBusy} className="w-full py-3 rounded-xl bg-[#00E599] text-slate-950 text-sm font-bold disabled:opacity-50">{resetBusy ? "Sending..." : "Send reset link"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuthForm() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060911] flex items-center justify-center text-slate-400 text-xs">Loading sign-in...</div>}>
      <AuthFormContent />
    </Suspense>
  );
}
