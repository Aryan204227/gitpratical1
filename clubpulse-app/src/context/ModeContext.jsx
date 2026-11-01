"use client";
import { createContext, useContext } from "react";

// Production data mode is intentionally fixed to MongoDB-backed live records.
const ModeContext = createContext({ mode: "live", setMode: () => {} });
export function ModeProvider({ children }) {
  return <ModeContext.Provider value={{ mode: "live", setMode: () => {} }}>{children}</ModeContext.Provider>;
}
export function useMode() { return useContext(ModeContext); }
