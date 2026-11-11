'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Activity, BarChart3, BriefcaseBusiness, Building2, CheckSquare, Database,
  Flame, LayoutDashboard, LogOut, MessageSquareText, Moon, PanelLeft,
  Settings2, Shield, Sun, Users, Workflow,
} from 'lucide-react';
import type { CurrentUser } from '@/lib/auth';

type Item = { href: string; label: string; icon: typeof BarChart3 };

const adminItems: Item[] = [
  { href: '/dashboard',         label: 'Overview',       icon: BarChart3 },
  { href: '/clubs',             label: 'Clubs',           icon: Building2 },
  { href: '/members',           label: 'Members',         icon: Users },
  { href: '/recruitment',       label: 'Recruitment',     icon: BriefcaseBusiness },
  { href: '/tasks',             label: 'Tasks',           icon: CheckSquare },
  { href: '/fairwork',          label: 'FairWork Engine', icon: Flame },
  { href: '/contributions',     label: 'Contributions',   icon: Workflow },
  { href: '/feedback',          label: 'Feedback',        icon: MessageSquareText },
  { href: '/analytics',         label: 'Analytics',       icon: Activity },
  { href: '/settings/security', label: 'Account',         icon: Settings2 },
];

const leadItems: Item[] = [
  { href: '/dashboard',         label: 'My Dashboard', icon: LayoutDashboard },
  { href: '/tasks',             label: 'Tasks',        icon: CheckSquare },
  { href: '/members',           label: 'Team',         icon: Users },
  { href: '/recruitment',       label: 'Recruitment',  icon: BriefcaseBusiness },
  { href: '/fairwork',          label: 'FairWork',     icon: Flame },
  { href: '/feedback',          label: 'Feedback',     icon: MessageSquareText },
  { href: '/settings/security', label: 'Account',      icon: Settings2 },
];

const memberItems: Item[] = [
  { href: '/dashboard',         label: 'My Workspace',  icon: LayoutDashboard },
  { href: '/clubs',             label: 'Browse Clubs',  icon: Building2 },
  { href: '/recruitment',       label: 'Openings',      icon: BriefcaseBusiness },
  { href: '/tasks',             label: 'My Tasks',      icon: CheckSquare },
  { href: '/feedback',          label: 'Feedback',      icon: MessageSquareText },
  { href: '/settings/security', label: 'Account',       icon: Settings2 },
];

function getRoleLabel(role: string): string {
  if (role === 'superadmin') return 'Super Admin';
  if (role === 'admin') return 'Administrator';
  if (role === 'lead') return 'Club Lead';
  return 'Member';
}

function getNavItems(role: string): Item[] {
  if (role === 'superadmin' || role === 'admin') return adminItems;
  if (role === 'lead') return leadItems;
  return memberItems;
}

export function NextAppShell({
  user,
  children,
  insights,
  modal,
}: {
  user: CurrentUser;
  children: React.ReactNode;
  insights: React.ReactNode;
  modal: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const [compact, setCompact] = useState(false);
  const [light, setLight] = useState(false);
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
      setPending(false);
    }
  }

  const navItems = getNavItems(user.role);
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';

  return (
    <div className={'next-workspace ' + (compact ? 'compact' : '') + (light ? ' light' : '')}>
      <aside className="next-sidebar">
        <Link href="/dashboard" className="next-brand">
          <span className="next-brand-mark">✳</span>
          <span>ClubPulse<small>CLUB CONTRIBUTION OS</small></span>
        </Link>

        <div className="next-nav-label">WORKSPACE</div>
        <nav>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={'next-nav-link ' + (path === item.href || path.startsWith(item.href + '/') ? 'active' : '')}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {isAdmin && (
          <>
            <div className="next-nav-label">PLATFORM ADMIN</div>
            <nav>
              <Link
                href="/users"
                className={'next-nav-link ' + (path === '/users' || path.startsWith('/users/') ? 'active' : '')}
              >
                <Shield size={17} />
                <span>Users</span>
              </Link>
            </nav>
          </>
        )}

        <div className="next-sidebar-spacer" />

        <div className="next-health-note">
          <span><Database size={14} /> DATABASE WORKSPACE</span>
          <p>No auto-generated sample records. Only authorized data you enter appears in analytics.</p>
        </div>

        <div className="next-user-row">
          <span className="next-avatar">
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </span>
          <span className="next-user-meta">
            <b>{user.name}</b>
            <small>{getRoleLabel(user.role)}</small>
          </span>
          <button
            className="next-icon-btn"
            onClick={logout}
            disabled={pending}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <main className="next-main">
        <header className="next-topbar">
          <div>
            <span className="next-breadcrumb">
              CLUBPULSE <i>/</i> <b>{path.split('/').filter(Boolean).join(' / ').toUpperCase() || 'OVERVIEW'}</b>
            </span>
          </div>
          <div className="next-top-actions">
            <span className="next-top-pill" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', gap: '5px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block', flexShrink: 0 }} />
              LIVE
            </span>
            <Link href="/demo" className="next-top-pill">Demo</Link>
            <button className="next-icon-btn" onClick={() => setCompact(v => !v)} aria-label="Toggle sidebar">
              <PanelLeft size={16} />
            </button>
            <button className="next-icon-btn" onClick={() => setLight(v => !v)} aria-label="Toggle light mode">
              {light ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <span className="next-avatar small">{user.name.slice(0, 1).toUpperCase()}</span>
          </div>
        </header>
        <div className="next-content">{children}{insights}</div>
        <footer className="next-footer">
          <span>ClubPulse · INT252 + INT257 · P18</span>
          <span>SSR + App Router · API + PostgreSQL · role-checked workspace</span>
        </footer>
      </main>
      {modal}
    </div>
  );
}
