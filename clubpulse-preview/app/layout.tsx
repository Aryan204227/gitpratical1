import type { Metadata, Viewport } from 'next';
import './globals.css';
import './reference-theme.css';
import './clubpulse-product-theme.css';
export const metadata: Metadata = { title: 'ClubPulse — Student Club Workspace', description: 'A student-built workspace for club recruitment, task coordination, contribution history and member feedback.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#070b12' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
