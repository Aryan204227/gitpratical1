import { useCallback,useEffect } from 'react';
import { NavLink,Outlet,useLocation,useNavigate } from 'react-router-dom';
import { Activity,BarChart3,BookOpen,BriefcaseBusiness,CheckSquare,Command,GitBranch,LogOut,MessageSquareText,Moon,PanelLeft,Shield,Sun,Users,Workflow } from 'lucide-react';
import { useMutation,useQueryClient } from '@tanstack/react-query';
import { api,errorMessage } from '../api/client';
import { useAuth } from '../state/auth';
import { useTheme } from '../state/theme';
import { useUiStore } from '../state/uiStore';
import { ApiBadge } from './ApiBadge';

const navItems=[
 {to:'/',label:'Overview',icon:BarChart3,end:true},
 {to:'/clubs',label:'Clubs',icon:Command},
 {to:'/members',label:'Members',icon:Users,roles:['admin','lead']},
 {to:'/recruitment',label:'Recruitment',icon:BriefcaseBusiness},
 {to:'/tasks',label:'Tasks',icon:CheckSquare},
 {to:'/contributions',label:'Contributions',icon:Workflow,roles:['admin','lead']},
 {to:'/feedback',label:'Feedback',icon:MessageSquareText},
 {to:'/analytics',label:'Analytics',icon:Activity,roles:['admin','lead']},
];
export function WorkspaceShell(){
 const {user}=useAuth();const location=useLocation();const {theme,toggleTheme}=useTheme();const {compact,toggleCompact}=useUiStore();const navigate=useNavigate();const client=useQueryClient();
 const logout=useMutation({mutationFn:()=>api.post('/api/auth/logout'),onSuccess:async()=>{client.setQueryData(['auth','me'],null);await client.clear();navigate('/login');},onError:e=>window.alert(errorMessage(e))});
 const handleKey=useCallback((e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.querySelector<HTMLInputElement>('[data-global-search]')?.focus();}},[]);
 useEffect(()=>{window.addEventListener('keydown',handleKey);return()=>window.removeEventListener('keydown',handleKey);},[handleKey]);
 return <div className={'workspace '+(compact?'compact':'')}>
  <aside className="sidebar">
   <NavLink to="/" className="brand-lockup"><span className="brand-mark">✳</span><span>ClubPulse<small>CLUB CONTRIBUTION OS</small></span></NavLink>
   <div className="sidebar-label">WORKSPACE</div><nav className="side-nav" aria-label="Workspace navigation">{navItems.filter(item=>!item.roles||item.roles.includes(user?.role||'member')).map(item=><NavLink key={item.to} to={item.to} end={item.end} className={({isActive})=>'nav-link '+(isActive?'active':'')} title={compact?item.label:undefined}><item.icon size={18}/><span>{item.label}</span>{item.label==='Tasks'&&<small className="nav-shortcut">↵</small>}</NavLink>)}</nav>
   <div className="sidebar-label lab-label">LEARNING LABS</div><nav className="side-nav" aria-label="Syllabus learning labs"><NavLink to="/labs/react" className={({isActive})=>'nav-link '+(isActive?'active':'')}><BookOpen size={18}/><span>React Fundamentals</span></NavLink><NavLink to="/labs/nextjs" className={({isActive})=>'nav-link '+(isActive?'active':'')}><GitBranch size={18}/><span>Next.js Engineering</span></NavLink></nav>
   <a className="nav-link" href="/settings/security" title="Account security"><Shield size={18}/><span>Account security</span></a>
   <div className="sidebar-spacer"/>
   <div className="sidebar-status"><ApiBadge/><p>No auto-generated sample records. Only authorized data you enter appears in analytics.</p></div>
   <div className="sidebar-user"><div className="avatar">{(user?.name||'U').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()}</div><div className="user-meta"><strong>{user?.name||'User'}</strong><small>{user?.role==='admin'?'Administrator':user?.role==='lead'?'Club lead':'Member'}</small></div><button className="icon-button logout-button" aria-label="Sign out" title="Sign out" onClick={()=>logout.mutate()} disabled={logout.isPending}><LogOut size={16}/></button></div>
  </aside>
  <main className="workspace-main">
   <header className="topbar"><div className="mobile-brand"><span className="brand-mark">✳</span><strong>ClubPulse</strong></div><div className="crumb">Workspace <span>/</span> <strong>{location.pathname==='/'?'Overview':location.pathname.split('/').filter(Boolean).map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' / ')}</strong></div><div className="topbar-actions"><label className="global-search"><Command size={14}/><input data-global-search aria-label="Quick search" placeholder="Search in this view…"/><kbd>⌘ K</kbd></label><button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">{theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}</button><button className="icon-button" onClick={toggleCompact} aria-label="Toggle compact sidebar" title="Toggle sidebar width"><PanelLeft size={17}/></button><div className="topbar-avatar">{(user?.name||'U').slice(0,1).toUpperCase()}</div></div></header>
   <div className="workspace-content"><Outlet/></div>
   <footer className="workspace-footer"><span>ClubPulse · INT252 + INT257 · P18</span><span>Contribution signals guide check-ins; they are not burnout diagnoses.</span></footer>
  </main>
 </div>;
}
