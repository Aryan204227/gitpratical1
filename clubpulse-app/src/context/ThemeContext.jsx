"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "dark",
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
  mounted: false,
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("dark");
  const [mounted, setMounted] = useState(false);

  // Synchronously update DOM classes and attributes for instant response
  const applyThemeToDOM = (mode) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const body = document.body;

    if (mode === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";

      if (body) {
        body.classList.add("dark");
        body.classList.remove("light");
        body.setAttribute("data-theme", "dark");
      }
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";

      if (body) {
        body.classList.remove("dark");
        body.classList.add("light");
        body.setAttribute("data-theme", "light");
      }
    }
  };

  useEffect(() => {
    // 1. Initial read from localStorage on mount
    let initialTheme = "dark";
    try {
      const saved = localStorage.getItem("clubpulse-theme");
      if (saved === "light" || saved === "dark") {
        initialTheme = saved;
      }
    } catch (e) {}

    setThemeState(initialTheme);
    applyThemeToDOM(initialTheme);
    setMounted(true);
  }, []);

  // 2. Reactively apply whenever theme state changes
  useEffect(() => {
    if (mounted) {
      applyThemeToDOM(theme);
      try {
        localStorage.setItem("clubpulse-theme", theme);
      } catch (e) {}
    }
  }, [theme, mounted]);

  const setTheme = (newTheme) => {
    const validTheme = newTheme === "light" ? "light" : "dark";
    applyThemeToDOM(validTheme);
    try {
      localStorage.setItem("clubpulse-theme", validTheme);
    } catch (e) {}
    setThemeState(validTheme);
  };

  const toggleTheme = () => {
    setThemeState((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      applyThemeToDOM(nextTheme);
      try {
        localStorage.setItem("clubpulse-theme", nextTheme);
      } catch (e) {}
      return nextTheme;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        toggleTheme,
        setTheme,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
