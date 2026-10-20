import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
type ThemeContextValue = { theme:'dark'|'light'; toggleTheme:()=>void };
const ThemeContext=createContext<ThemeContextValue|undefined>(undefined);
export function ThemeProvider({children}:{children:ReactNode}){
  const [theme,setTheme]=useState<'dark'|'light'>(()=>{try{return localStorage.getItem('clubpulse-theme')==='light'?'light':'dark';}catch{return 'dark';}});
  useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem('clubpulse-theme',theme);}catch{/* storage can be disabled */}},[theme]);
  const value=useMemo(()=>({theme,toggleTheme:()=>setTheme(current=>current==='dark'?'light':'dark')}),[theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme(){const context=useContext(ThemeContext);if(!context)throw new Error('useTheme must be used within ThemeProvider');return context;}
