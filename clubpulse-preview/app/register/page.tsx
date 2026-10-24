import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NextAuthForm } from '@/components/NextAuthForm';
const googleClientId=process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID||process.env.GOOGLE_CLIENT_ID||'';
export const metadata:Metadata={title:'Register | ClubPulse',robots:{index:false,follow:false}};
export default function RegisterPage(){return <Suspense fallback={<main className="next-loading">Loading registration form…</main>}><NextAuthForm mode="register" googleClientId={googleClientId}/></Suspense>;}
