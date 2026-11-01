"use client";
import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ variant = "segmented", className = "" }) {
  const { theme, isDark, toggleTheme, setTheme, mounted } = useTheme();

  // If unmounted during SSR, use 'dark' as default fallback to avoid hydration jump
  const currentDark = mounted ? isDark : true;

  // Variant 1: Compact Floating Icon Button
  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => toggleTheme()}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 border shadow-xs ${
          currentDark
            ? "bg-[#1C1E26] text-[#D2F863] border-white/10 hover:border-[#D2F863]/60 hover:bg-[#252834]"
            : "bg-white text-amber-500 border-slate-200 hover:border-amber-400 hover:bg-slate-50"
        } ${className}`}
        title={`Current: ${currentDark ? "Dark" : "Light"} mode. Click to toggle.`}
        aria-label="Toggle dark and light mode"
      >
        {currentDark ? (
          <Moon className="h-4 w-4 fill-[#D2F863]/20" />
        ) : (
          <Sun className="h-4 w-4 fill-amber-500/20" />
        )}
      </button>
    );
  }

  // Variant 2: Sliding Pill Switch
  if (variant === "switch") {
    return (
      <button
        type="button"
        onClick={() => toggleTheme()}
        className={`relative inline-flex items-center h-8 w-16 rounded-full p-1 cursor-pointer transition-colors duration-300 select-none shadow-inner border ${
          currentDark
            ? "bg-[#18191E] border-white/15"
            : "bg-slate-200 border-slate-300"
        } ${className}`}
        title={`Toggle theme (Currently ${currentDark ? "Dark" : "Light"})`}
        aria-label="Toggle theme switch"
      >
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 shadow-md ${
            currentDark
              ? "translate-x-8 bg-[#D2F863] text-slate-950"
              : "translate-x-0 bg-white text-amber-500"
          }`}
        >
          {currentDark ? (
            <Moon className="h-3.5 w-3.5 stroke-[2.5]" />
          ) : (
            <Sun className="h-3.5 w-3.5 stroke-[2.5]" />
          )}
        </span>
      </button>
    );
  }

  // Default: Dual-Segmented Pill [ ☀️ Light | 🌙 Dark ]
  // Ultra-clear, unmistakable, accessible, and gives 100% confidence to user that both modes are available
  return (
    <div
      className={`inline-flex items-center p-1 rounded-full transition-all duration-300 shadow-xs border select-none ${
        currentDark
          ? "bg-[#14151B] border-white/10"
          : "bg-slate-200/90 border-slate-300/80"
      } ${className}`}
      role="radiogroup"
      aria-label="Theme mode toggle"
    >
      {/* Light Option Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setTheme("light");
        }}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] font-black transition-all duration-200 cursor-pointer active:scale-95 ${
          !currentDark
            ? "bg-white text-slate-900 shadow-md shadow-black/5"
            : "text-slate-400 hover:text-white"
        }`}
        title="Switch to Light Mode"
        aria-checked={!currentDark}
        role="radio"
      >
        <Sun
          className={`h-3.5 w-3.5 transition-colors ${
            !currentDark ? "text-amber-500 fill-amber-500/20 stroke-[2.5]" : "stroke-2"
          }`}
        />
        <span className="tracking-tight">Light</span>
      </button>

      {/* Dark Option Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setTheme("dark");
        }}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] font-black transition-all duration-200 cursor-pointer active:scale-95 ${
          currentDark
            ? "bg-[#D2F863] text-slate-950 shadow-md shadow-[#D2F863]/20"
            : "text-slate-600 hover:text-slate-900"
        }`}
        title="Switch to Dark Mode"
        aria-checked={currentDark}
        role="radio"
      >
        <Moon
          className={`h-3.5 w-3.5 transition-colors ${
            currentDark ? "text-slate-950 fill-slate-950/20 stroke-[2.5]" : "stroke-2"
          }`}
        />
        <span className="tracking-tight">Dark</span>
      </button>
    </div>
  );
}
