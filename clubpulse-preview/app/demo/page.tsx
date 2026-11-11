// Demo mode landing - no auth required
// Shows 4 role cards to explore the demo

import Link from 'next/link';
import { ArrowRight, BarChart3, Building2, Users, GraduationCap, Shield } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Interactive Demo | ClubPulse', robots: { index: false } };

const ROLES = [
  { id: 'superadmin', label: 'Super Admin', icon: Shield, color: '#ff9a5c', desc: 'Full platform control. Manage all clubs, users, analytics.' },
  { id: 'admin', label: 'Club Admin', icon: BarChart3, color: '#a99dff', desc: 'Manage your club, approve applications, monitor health.' },
  { id: 'lead', label: 'Club Lead', icon: Building2, color: '#83e3c3', desc: 'Operational view. Assign tasks, track team performance.' },
  { id: 'member', label: 'Student / Member', icon: GraduationCap, color: '#f2a0bc', desc: 'Student workspace. Browse clubs, apply, track contributions.' },
];

export default function DemoPage() {
  return (
    <main style={{ minHeight:'100vh', background:'#0d0f1b', color:'#f5f5fd', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px' }}>
      <div style={{ textAlign:'center', marginBottom:'40px' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'6px 12px', border:'1px solid #f3ce8830', borderRadius:'8px', background:'#f3ce880a', color:'#f3ce88', fontSize:'10px', fontWeight:800, letterSpacing:'1px', marginBottom:'20px' }}>
          ⚡ DEMO MODE — No account required
        </div>
        <h1 style={{ fontSize:'clamp(32px,5vw,54px)', letterSpacing:'-2px', margin:'0 0 12px', lineHeight:1.05 }}>
          Explore ClubPulse
        </h1>
        <p style={{ color:'#a9abc5', fontSize:'14px', lineHeight:1.8, maxWidth:'520px', margin:'0 auto' }}>
          Choose a role to experience the platform. All demo data is isolated — nothing is saved to the real database.
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'14px', width:'100%', maxWidth:'860px' }}>
        {ROLES.map(r => (
          <Link key={r.id} href={`/demo/${r.id}`} style={{ display:'flex', flexDirection:'column', gap:'12px', padding:'22px', border:'1px solid #2c3048', borderRadius:'14px', background:'#15182a', transition:'border-color .16s, transform .16s', textDecoration:'none', color:'inherit' }}>
            <span style={{ display:'grid', placeItems:'center', width:'42px', height:'42px', borderRadius:'12px', background:`${r.color}18`, color:r.color }}>
              <r.icon size={20} />
            </span>
            <div>
              <div style={{ fontSize:'12px', fontWeight:800, marginBottom:'6px', color:'#f5f5fd' }}>{r.label}</div>
              <p style={{ fontSize:'10px', color:'#9a9cb8', lineHeight:1.7, margin:0 }}>{r.desc}</p>
            </div>
            <span style={{ display:'flex', alignItems:'center', gap:'5px', color:r.color, fontSize:'9px', fontWeight:800, marginTop:'auto' }}>
              Explore as {r.label} <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>

      <div style={{ marginTop:'30px', textAlign:'center' }}>
        <Link href="/login" style={{ color:'#9a9cb8', fontSize:'10px' }}>Have an account? Sign in →</Link>
      </div>
    </main>
  );
}
