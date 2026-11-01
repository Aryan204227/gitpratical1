import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ModeProvider } from "@/context/ModeContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Suspense } from "react";

const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };
export const metadata = {
    title: "ClubPulse – Smart Club Contribution & Transparency Platform",
    description: "Solve inactive club members, prevent overloaded student leader burnout, and provide transparent evidence of delivered activities in college organizations.",
};

export default function RootLayout({ children }) {
    return (
      <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] dark:bg-[#121316] text-slate-900 dark:text-slate-100 selection:bg-blue-100 selection:text-blue-900 transition-colors duration-200 antialiased">
        <ThemeProvider>
          <ModeProvider>
            <AuthProvider>
              <Suspense fallback={<div className="h-[64px] border-b border-slate-200 bg-white"/>}>
                <Navbar />
              </Suspense>
              <main className="flex-1">
                <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading page...</div>}>
                  {children}
                </Suspense>
              </main>
              <Suspense fallback={null}>
                <Footer />
              </Suspense>
            </AuthProvider>
          </ModeProvider>
        </ThemeProvider>
      </body>
    </html>);
}
