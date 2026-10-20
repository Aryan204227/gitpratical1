import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NextAuthForm } from '@/components/NextAuthForm';
export const metadata:Metadata={title:'Sign in | ClubPulse',robots:{index:false,follow:false}};
export default function LoginPage(){return <Suspense fallback={<main className="next-loading">Loading sign-in form…</main>}><NextAuthForm mode="login"/></Suspense>;}
