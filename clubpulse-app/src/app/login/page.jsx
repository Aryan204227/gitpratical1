"use client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  GraduationCap,
  Shield,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

// Official 4-color Google Icon
function GoogleIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const tabParam = searchParams.get("tab");
  const { isDark } = useTheme();

  const {
    loginWithFirebaseGoogle,
    loginWithFirebaseEmail,
    registerWithFirebaseEmail,
    requestPasswordReset,
  } = useAuth();

  // Mode: "login" | "register"
  const [mode, setMode] = useState(tabParam === "register" ? "register" : "login");

  // Selected Role: "student" | "admin"
  const [selectedRole, setSelectedRole] = useState("student");

  // Sign In inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up inputs
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [year, setYear] = useState("2nd Year");

  // Forgot Password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  // Feedback & Loading
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleRouteRedirect = (role) => {
    if (redirectParam) {
      router.push(redirectParam);
      return;
    }
    const targetRole = role || selectedRole;
    if (targetRole === "admin") {
      router.push("/dashboard/admin");
    } else {
      router.push("/dashboard/student");
    }
  };

  // Google Authentication
  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsGoogleLoading(true);

    try {
      const result = await loginWithFirebaseGoogle(selectedRole);
      setSuccessMessage(result.message || `Signed in with Google as ${result.user.name}`);
      const targetRole = result.user?.role || selectedRole;
      setTimeout(() => {
        handleRouteRedirect(targetRole);
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || "Google authentication failed. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Email & Password Sign In
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setIsLoading(true);

    try {
      const targetRole = result.user?.role || selectedRole;
      setTimeout(() => {
        handleRouteRedirect(targetRole);
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || "Invalid email or password. Please verify and try again.");
      setIsLoading(false);
    }
  };

  // Email & Password Sign Up
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!regEmail || !regPassword || !regName) {
      setErrorMessage("Please fill in your name, campus email, and password.");
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage("Password must be at least 10 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerWithFirebaseEmail({
        email: regEmail,
        password: regPassword,
        name: regName,
        department,
        role: selectedRole,
        bio: selectedRole === "admin" ? "Campus administration coordinator." : "Student community member.",
      });

      setSuccessMessage(`Account created successfully for ${result.user.name}! Redirecting...`);
      setTimeout(() => {
        handleRouteRedirect(selectedRole, selectedRole === "admin" ? "/dashboard/admin" : "/dashboard/student");
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || "Failed to create account. Please check your information.");
      setIsLoading(false);
    }
  };

  // Password Reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetMessage("");

    if (!resetEmail || !resetEmail.includes("@")) {
      setResetError("Please provide a valid email address.");
      return;
    }

    setResetLoading(true);

    try {
      const res = await requestPasswordReset(resetEmail);
      setResetMessage(res.message || `Password reset instructions sent to ${resetEmail}.`);
      setTimeout(() => {
        setShowForgotModal(false);
        setResetMessage("");
      }, 2500);
    } catch (err) {
      setResetError(err.message || "Could not dispatch password reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#EDF1F7] dark:bg-[#060911] transition-colors duration-300">
      {/* LEFT COLUMN: Campus Photography Hero */}
      <div className="relative w-full md:w-1/2 min-h-[380px] md:min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden">
        {/* Background Image & Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80')`,
          }}
        />
        {/* Deep modern gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950/40" />

        {/* Top Brand Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight">
              ClubPulse
            </h1>
            <p className="text-[11px] font-medium tracking-wide text-blue-200 uppercase">
              Discover · Join · Contribute
            </p>
          </div>
        </div>

        {/* Bottom Inspiring Typography */}
        <div className="relative z-10 max-w-lg mt-auto pt-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            <span>Campus Community Platform</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight space-y-1">
            <span className="block">Build Connections</span>
            <span className="block text-blue-300">Make an Impact</span>
            <span className="block text-slate-200">Be a Part of Something Bigger.</span>
          </h2>
          <p className="mt-4 text-sm text-slate-300/90 leading-relaxed font-normal">
            The unified system empowering student leaders, engaging active members, and providing verifiable transparency directly to campus administration.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Exact Reference Login Card */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 bg-white md:bg-[#EDF1F7] dark:bg-[#060911] relative transition-colors duration-300 overflow-y-auto">
        {/* Top-Right Theme Toggle */}
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        {/* Main Floating Login Card (Matches Reference Screenshot) */}
        <div className="w-full max-w-[440px] my-auto rounded-[32px] bg-white dark:bg-[#0A0E1A] border border-slate-200 dark:border-blue-950/70 p-6 sm:p-8 shadow-2xl shadow-slate-300/50 dark:shadow-black/80 backdrop-blur-xl relative transition-all duration-300">
          {/* Ambient Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-blue-600/10 rounded-[34px] blur-xl -z-10 pointer-events-none" />

          {/* Card Title & Subtitle */}
          <div className="text-left mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {mode === "register" ? "Create an account" : "Welcome back"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1.5 font-normal">
              {mode === "register"
                ? "Start your university leadership & club journey."
                : "Sign in to continue your ClubPulse journey."}
            </p>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          {/* Role Selector Tabs (Student vs Admin) */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Login as Student */}
            <button
              type="button"
              onClick={() => setSelectedRole("student")}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                selectedRole === "student"
                  ? "border-2 border-blue-500 bg-blue-50 dark:bg-[#0E1A33] shadow-md shadow-blue-500/20 ring-1 ring-blue-500/40"
                  : "border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0B0F19] hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#0E1322]"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  selectedRole === "student"
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                    : "bg-slate-200 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400"
                }`}
              >
                <GraduationCap className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                  Login as Student
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-tight truncate">
                  Join clubs & track activity
                </span>
              </div>
            </button>

            {/* Login as Admin */}
            <button
              type="button"
              onClick={() => setSelectedRole("admin")}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                selectedRole === "admin"
                  ? "border-2 border-blue-500 bg-blue-50 dark:bg-[#0E1A33] shadow-md shadow-blue-500/20 ring-1 ring-blue-500/40"
                  : "border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0B0F19] hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#0E1322]"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  selectedRole === "admin"
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                    : "bg-slate-200 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Shield className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                  Login as Admin
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-tight truncate">
                  Manage clubs & activities
                </span>
              </div>
            </button>
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-3 px-4 rounded-2xl bg-slate-50 dark:bg-[#0D1220] hover:bg-slate-100 dark:hover:bg-[#12182B] border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between transition-all group cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              {isGoogleLoading ? (
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              ) : (
                <GoogleIcon className="h-5 w-5" />
              )}
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white text-center flex-1">
              {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
          </button>

          {/* OR CONTINUE WITH EMAIL Divider */}
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800/80" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-[#0A0E1A] px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 select-none">
                OR CONTINUE WITH EMAIL
              </span>
            </div>
          </div>

          {/* Login or Register Form */}
          {mode === "login" ? (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full pl-11 pr-11 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mint Green Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-5 py-3.5 px-4 rounded-2xl bg-[#00E599] hover:bg-[#00D48D] text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-[#00E599]/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? "Signing in..." : "Sign In"}</span>
                {!isLoading && <ArrowRight className="h-4 w-4 stroke-[2.5]" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailSignUp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ayush Sharma"
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Campus Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@campus.edu"
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 10 characters"
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3.5 px-4 rounded-2xl bg-[#00E599] hover:bg-[#00D48D] text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-[#00E599]/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? "Creating account..." : "Create Account"}</span>
                {!isLoading && <ArrowRight className="h-4 w-4 stroke-[2.5]" />}
              </button>
            </form>
          )}

          {/* Mode Switch Link */}
          <div className="text-center mt-5 text-xs text-slate-500 dark:text-slate-400">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold transition-colors cursor-pointer ml-1"
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold transition-colors cursor-pointer ml-1"
                >
                  Sign In
                </button>
              </>
            )}
          </div>

          {/* Footer Divider & Links */}
          <div className="w-full border-t border-slate-200 dark:border-slate-800/60 mt-6 mb-4" />

          <div className="flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <Link href="/about" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <Link href="/about" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0E1A] p-6 sm:p-7 shadow-2xl text-slate-800 dark:text-slate-200">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="h-4 w-4" />
              <span>Password Recovery</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Reset your password</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter your registered campus email address and we'll send a secure password reset link.
            </p>

            {resetError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
                <span>{resetError}</span>
              </div>
            )}
            {resetMessage && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{resetMessage}</span>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@campus.edu"
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#00E599] hover:bg-[#00D48D] text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060911] flex items-center justify-center text-slate-400 text-xs">
          Loading authentication portal...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
