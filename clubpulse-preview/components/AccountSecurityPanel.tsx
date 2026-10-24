'use client';
import {useState} from 'react';
import {ShieldCheck,Link2,CheckCircle2,LogOut} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {GoogleIdentityButton} from '@/components/GoogleIdentityButton';
export function AccountSecurityPanel({email,googleLinked}:{email:string;googleLinked:boolean}){
 const [linked,setLinked]=useState(googleLinked);const [message,setMessage]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const router=useRouter();
 async function revokeSessions(){if(!window.confirm('Sign out this account from every device, including this one?'))return;setBusy(true);setError('');setMessage('');try{const response=await fetch('/api/auth/sessions/revoke-all',{method:'POST',credentials:'same-origin'});const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not revoke sessions.');router.push('/login');router.refresh();}catch(e){setError(e instanceof Error?e.message:'Could not revoke sessions.');}finally{setBusy(false);}}
 return <div className="cp-security-stack">
 <section className="cp-security-card"><div className="cp-security-icon"><ShieldCheck size={21}/></div><div className="cp-security-copy"><span className="next-eyebrow">ACCOUNT IDENTITY</span><h3>{email}</h3><p>Sessions use random server-generated tokens stored as hashes and HttpOnly/SameSite cookies. Google linking requires a verified email matching this account.</p></div></section>
 <section className="cp-security-card"><div className="cp-security-icon"><Link2 size={21}/></div><div className="cp-security-copy"><span className="next-eyebrow">GOOGLE SIGN-IN</span><h3>{linked?'Google account linked':'Link Google sign-in'}</h3><p>{linked?'A Google identity is linked to this account.':'Link a verified Google identity with the same email address to use Google for future sign-ins.'}</p>{linked?<div className="cp-security-linked"><CheckCircle2 size={15}/> Linked identity verified</div>:<GoogleIdentityButton mode="link" onSuccess={data=>{setLinked(Boolean(data.linked));setMessage(data.message||'Google account linked.');setError('');}} onError={setError}/>}{message&&<p className="cp-security-success" role="status">{message}</p>}{error&&<p className="cp-security-error" role="alert">{error}</p>}</div></section>
 <section className="cp-security-card"><div className="cp-security-icon warning"><LogOut size={21}/></div><div className="cp-security-copy"><span className="next-eyebrow">SESSION CONTROL</span><h3>Sign out everywhere</h3><p>Revoke all active sessions for this account. You will be signed out on this device too.</p><button className="cp-security-revoke" onClick={revokeSessions} disabled={busy}>{busy?'Revoking sessions…':'Revoke all sessions'}</button></div></section>
 <p className="cp-security-footnote">These are application security controls, not a formal security certification. Use only approved data and rotate bootstrap secrets after initial setup.</p>
 </div>;
}
