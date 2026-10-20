import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'ClubPulse — Club Contribution OS', description: 'Club management, recruitment, task ownership and contribution analytics.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#10111f' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
