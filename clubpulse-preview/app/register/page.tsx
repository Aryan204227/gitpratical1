import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NextAuthForm } from '@/components/NextAuthForm';
export const metadata:Metadata={title:'Register | ClubPulse',robots:{index:false,follow:false}};
export default function RegisterPage(){return <Suspense fallback={<main className="next-loading">Loading registration form…</main>}><NextAuthForm mode="register"/></Suspense>;}
