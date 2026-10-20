import { useState } from 'react';
import { Link,Navigate,useNavigate,useSearchParams } from 'react-router-dom';
import { useMutation,useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { ArrowRight,ShieldCheck,Sparkles } from 'lucide-react';
import { api,errorMessage } from '../api/client';
import { useAuth } from '../state/auth';
import type { AppUser } from '../types';

const loginSchema=z.object({email:z.string().trim().email('Enter a valid email address.'),password:z.string().min(1,'Password is required.')});
const registerSchema=z.object({name:z.string().trim().min(2,'Enter at least 2 characters.').max(80),email:z.string().trim().email('Enter a valid email address.'),password:z.string().min(10,'Use at least 10 characters.').max(128)});
export function AuthPage({mode}:{mode:'login'|'register'}){
 const [name,setName]=useState('');const [email,setEmail]=useState('');const [password,setPassword]=useState('');
 const [error,setError]=useState('');const [notice,setNotice]=useState('');
 const queryClient=useQueryClient();const navigate=useNavigate();const [params]=useSearchParams();const {user}=useAuth();
 const mutation=useMutation({
  mutationFn:async()=>{
   const schema=mode==='login'?loginSchema:registerSchema;
   const parsed=schema.safeParse(mode==='login'?{email,password}:{name,email,password});
   if(!parsed.success)throw new Error(parsed.error.issues[0]?.message||'Please check the form.');
   const result=await api.post(mode==='login'?'/api/auth/login':'/api/auth/register',parsed.data);
   return result.data as {user:AppUser;notice?:string};
  },
  onSuccess:async data=>{queryClient.setQueryData(['auth','me'],data.user);setNotice(data.notice||'Signed in successfully.');navigate(params.get('next')||'/');},
  onError:e=>setError(errorMessage(e))
 });
 if(user)return <Navigate to="/" replace/>;
 return <main className="auth-layout">
  <section className="auth-story"><div className="brand-lockup"><span className="brand-mark">✳</span><span>ClubPulse<small>CLUB CONTRIBUTION OS</small></span></div>
   <div className="auth-story-copy"><span className="overline">BETTER CLUBS, TOGETHER</span><h1>Make every contribution <em>count.</em></h1><p>A transparent workspace for club recruitment, shared task ownership and healthier contribution patterns.</p>
   <div className="auth-benefits"><div><ShieldCheck size={18}/><span>Permission-aware workspace</span></div><div><Sparkles size={18}/><span>Real workflows, not just charts</span></div></div></div>
   <div className="auth-footnote">INT252 + INT257 · Project P18 · Synthetic demo data only</div></section>
  <section className="auth-panel"><div className="auth-card"><span className="overline">{mode==='login'?'WELCOME BACK':'GET STARTED'}</span><h2>{mode==='login'?'Sign in to ClubPulse':'Create your workspace account'}</h2><p className="muted">{mode==='login'?'Continue with your registered email and password.':'The first account on a new database becomes the initial administrator.'}</p>
  <form onSubmit={e=>{e.preventDefault();setError('');setNotice('');mutation.mutate();}} className="form-stack">
   {mode==='register'&&<label>Full name<input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="Your name" required minLength={2}/></label>}
   <label>Email address<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required/></label>
   <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete={mode==='login'?'current-password':'new-password'} placeholder={mode==='login'?'Enter your password':'At least 10 characters'} required minLength={mode==='register'?10:1}/></label>
   {error&&<div className="alert error" role="alert">{error}</div>}{notice&&<div className="alert success" role="status">{notice}</div>}
   <button className="button primary wide" type="submit" disabled={mutation.isPending}>{mutation.isPending?'Please wait…':mode==='login'?'Sign in':'Create account'} <ArrowRight size={16}/></button>
  </form>
  <p className="auth-switch">{mode==='login'?'New to ClubPulse?':'Already registered?'} <Link to={mode==='login'?'/register':'/login'}>{mode==='login'?'Create an account':'Sign in'}</Link></p>
  <p className="tiny-note">Never enter real student personal data in this public demonstration workspace. Account passwords are hashed server-side.</p></div></section>
 </main>;
}
