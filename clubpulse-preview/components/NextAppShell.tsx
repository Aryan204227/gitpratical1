'use client';
import Link from 'next/link';
import { usePathname,useRouter } from 'next/navigation';
import { useState } from 'react';
import { Activity,BarChart3,BookOpen,BriefcaseBusiness,CheckSquare,Command,GitBranch,LogOut,Menu,MessageSquareText,PanelLeft,Shield,Users,Workflow,Sun,Moon,Database } from 'lucide-react';
import type { CurrentUser } from '@/lib/auth';
type Item={href:string;label:string;icon:typeof BarChart3;roles?:string[]};
const items:Item[]=[
 {href:'/dashboard',label:'Overview',icon:BarChart3},
 {href:'/clubs',label:'Clubs',icon:Command},
 {href:'/members',label:'Members',icon:Users,roles:['admin','lead']},
 {href:'/recruitment',label:'Recruitment',icon:BriefcaseBusiness},
 {href:'/tasks',label:'Tasks',icon:CheckSquare},
 {href:'/contributions',label:'Contributions',icon:Workflow,roles:['admin','lead']},
 {href:'/feedback',label:'Feedback',icon:MessageSquareText},
 {href:'/analytics',label:'Analytics',icon:Activity,roles:['admin','lead']},
 {href:'/labs/rendering',label:'Next.js Lab',icon:GitBranch},
];
export function NextAppShell({user,children}:{user:CurrentUser;children:React.ReactNode}){
 const path=usePathname();const router=useRouter();const [compact,setCompact]=useState(false);const [light,setLight]=useState(false);const [pending,setPending]=useState(false);
 async function logout(){setPending(true);try{await fetch('/api/auth/logout',{method:'POST'});}finally{router.push('/login');router.refresh();setPending(false);}}
 return <div className={'next-workspace '+(compact?'compact':'')+(light?' light':'')}>
  <aside className="next-sidebar"><Link href="/dashboard" className="next-brand"><span className="next-brand-mark">✳</span><span>ClubPulse<small>CLUB CONTRIBUTION OS</small></span></Link>
   <div className="next-nav-label">WORKSPACE</div><nav>{items.filter(item=>!item.roles||item.roles.includes(user.role)).map(item=><Link key={item.href} href={item.href} className={'next-nav-link '+(path===item.href||path.startsWith(item.href+'/')?'active':'')}><item.icon size={17}/><span>{item.label}</span></Link>)}</nav>
   <div className="next-nav-label">LEARNING</div><nav><Link href="/labs/rendering" className={'next-nav-link '+(path.startsWith('/labs/rendering')?'active':'')}><BookOpen size={17}/><span>Rendering strategies</span></Link><Link href="/labs/architecture" className={'next-nav-link '+(path.startsWith('/labs/architecture')?'active':'')}><Shield size={17}/><span>Architecture lab</span></Link><a href="/react/index.html#/" className="next-nav-link"><Command size={17}/><span>React + Vite SPA</span></a></nav>
   <div className="next-sidebar-spacer"/>
   <div className="next-health-note"><span><Database size={14}/> DATABASE WORKSPACE</span><p>Use synthetic demo records. Never add real student personal data until the demo is access-controlled and reviewed.</p></div>
   <div className="next-user-row"><span className="next-avatar">{user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</span><span className="next-user-meta"><b>{user.name}</b><small>{user.role==='admin'?'Administrator':user.role==='lead'?'Club lead':'Member'}</small></span><button className="next-icon-btn" onClick={logout} disabled={pending} aria-label="Sign out" title="Sign out"><LogOut size={15}/></button></div>
  </aside>
  <main className="next-main"><header className="next-topbar"><div><span className="next-breadcrumb">CLUBPULSE <i>/</i> <b>{path.split('/').filter(Boolean).join(' / ').toUpperCase()||'OVERVIEW'}</b></span></div><div className="next-top-actions"><a className="next-top-pill" href="/react/index.html#/">React/Vite <Command size={13}/></a><button className="next-icon-btn" onClick={()=>setCompact(v=>!v)} aria-label="Toggle sidebar"><PanelLeft size={16}/></button><button className="next-icon-btn" onClick={()=>setLight(v=>!v)} aria-label="Toggle light mode">{light?<Moon size={16}/>:<Sun size={16}/>}</button><span className="next-avatar small">{user.name.slice(0,1).toUpperCase()}</span></div></header><div className="next-content">{children}</div><footer className="next-footer"><span>ClubPulse · INT252 + INT257 · P18</span><span>SSR + App Router · API + PostgreSQL · RBAC demo</span></footer></main>
 </div>;
}
