'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3, Users, CheckSquare, MessageSquareText, Building2, ArrowRight,
  Flame, Activity, Target, CheckCircle2, AlertCircle, Clock, RotateCcw,
  Shield, HeartPulse, Ghost, PauseCircle, Sparkles, UserPlus, FileText
} from 'lucide-react';

const INITIAL_DEMO_DATA = {
  clubs: [
    { id: 1, name: 'Tech Society', members: 18, tasks: 24, completed: 17, category: 'Technology', status: 'Active' },
    { id: 2, name: 'Design Collective', members: 12, tasks: 19, completed: 14, category: 'Creative & Media', status: 'Active' },
    { id: 3, name: 'Robotics Club', members: 9, tasks: 21, completed: 16, category: 'Engineering', status: 'Active' },
    { id: 4, name: 'Cultural Circle', members: 8, tasks: 15, completed: 10, category: 'Culture & Arts', status: 'Active' },
    { id: 5, name: 'Data Science Guild', members: 7, tasks: 12, completed: 8, category: 'Analytics', status: 'Active' },
  ],
  tasks: [
    { id: 1, title: 'Annual Hackathon Registration Portal', owner: 'Sanya Iyer', status: 'In progress', priority: 'Urgent', due_date: '2026-11-06', club: 'Tech Society', effort: 5 },
    { id: 2, title: 'Server Infrastructure & SSL Migration', owner: 'Sanya Iyer', status: 'In progress', priority: 'High', due_date: '2026-11-08', club: 'Tech Society', effort: 4 },
    { id: 3, title: 'Sponsorship Pitch Deck for Tech Fest', owner: 'Sanya Iyer', status: 'In progress', priority: 'High', due_date: '2026-11-09', club: 'Tech Society', effort: 4 },
    { id: 4, title: 'Social Media Banner Design for Induction', owner: 'Priya Sharma', status: 'Completed', priority: 'Medium', due_date: '2026-11-02', club: 'Design Collective', effort: 3 },
    { id: 5, title: 'Autonomous Bot Sensor Calibration', owner: 'Dev Kapoor', status: 'Overdue', priority: 'Urgent', due_date: '2026-10-28', club: 'Robotics Club', effort: 6 },
    { id: 6, title: 'Workshop Planning: Intro to PyTorch', owner: 'Neha Mehta', status: 'To do', priority: 'Medium', due_date: '2026-11-14', club: 'Data Science Guild', effort: 3 },
    { id: 7, title: 'Event Budget Reconciliation', owner: 'Unassigned', status: 'To do', priority: 'High', due_date: '2026-11-12', club: 'Tech Society', effort: 2 },
    { id: 8, title: 'Volunteer Onboarding Orientation Slides', owner: 'Rahul Kumar', status: 'In progress', priority: 'Low', due_date: '2026-11-18', club: 'Tech Society', effort: 2 },
  ],
  members: [
    { id: 1, name: 'Sanya Iyer', email: 'sanya@university.edu', club: 'Tech Society', role: 'Club Lead', status: 'Active', pulseScore: 92, openTasks: 6, daysInactive: 1, workloadSignal: 'At Risk', workloadRiskScore: 78 },
    { id: 2, name: 'Priya Sharma', email: 'priya@university.edu', club: 'Design Collective', role: 'Club Lead', status: 'Active', pulseScore: 88, openTasks: 3, daysInactive: 2, workloadSignal: 'Healthy', workloadRiskScore: 24 },
    { id: 3, name: 'Rahul Kumar', email: 'rahul@university.edu', club: 'Tech Society', role: 'Member', status: 'Drifting', pulseScore: 42, openTasks: 1, daysInactive: 16, workloadSignal: 'Healthy', workloadRiskScore: 12 },
    { id: 4, name: 'Arjun Patel', email: 'arjun@university.edu', club: 'Cultural Circle', role: 'Member', status: 'Ghost', pulseScore: 8, openTasks: 0, daysInactive: 28, workloadSignal: 'Healthy', workloadRiskScore: 0 },
    { id: 5, name: 'Karan Singh', email: 'karan@university.edu', club: 'Data Science Guild', role: 'Member', status: 'On Break', pulseScore: 50, openTasks: 0, daysInactive: 0, workloadSignal: 'On break', workloadRiskScore: null },
    { id: 6, name: 'Neha Mehta', email: 'neha@university.edu', club: 'Data Science Guild', role: 'Member', status: 'Active', pulseScore: 76, openTasks: 2, daysInactive: 3, workloadSignal: 'Healthy', workloadRiskScore: 18 },
  ],
  applications: [
    { id: 1, applicant_name: 'Vikram Nair', email: 'vikram@university.edu', opening: 'Full-Stack Developer Intern', club: 'Tech Society', status: 'Reviewing', statement: 'Passionate about Next.js and Postgres, contributed to open-source campus apps.' },
    { id: 2, applicant_name: 'Meera Joshi', email: 'meera@university.edu', opening: 'Visual Designer', club: 'Design Collective', status: 'Applied', statement: 'Specialized in Figma UI design and 3D illustrations for student marketing campaigns.' },
    { id: 3, applicant_name: 'Dev Kapoor', email: 'dev@university.edu', opening: 'Hardware Engineer', club: 'Robotics Club', status: 'Accepted', statement: 'Embedded systems engineer experienced in STM32 and ROS.' },
  ],
  fairwork: {
    gini: 0.44,
    topTwoShare: 67,
    overloadedLead: 'Sanya Iyer',
    recommendedAssignee: 'Vikram Nair',
    explanation: 'Lead Sanya Iyer currently manages 6 active tasks (78% workload risk signal). Member Vikram Nair was recently accepted into Tech Society and has 0 active assignments. Rebalancing 2 tasks will reduce team Gini from 0.44 to 0.26.'
  }
};

export default function DemoRolePage({ params }: { params: Promise<{ role: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const currentRole = ['admin', 'lead', 'member', 'superadmin'].includes(resolvedParams.role)
    ? resolvedParams.role
    : 'admin';

  const [demoState, setDemoState] = useState(INITIAL_DEMO_DATA);
  const [rebalanced, setRebalanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'recruitment' | 'fairwork'>('overview');

  function handleRebalance() {
    setDemoState(prev => {
      const updatedTasks = prev.tasks.map(t => {
        if (t.id === 2 || t.id === 3) {
          return { ...t, owner: 'Vikram Nair' };
        }
        return t;
      });
      const updatedMembers = prev.members.map(m => {
        if (m.name === 'Sanya Iyer') return { ...m, openTasks: 4, workloadSignal: 'Watch', workloadRiskScore: 48 };
        return m;
      });
      return {
        ...prev,
        tasks: updatedTasks,
        members: updatedMembers,
        fairwork: {
          ...prev.fairwork,
          gini: 0.26,
          topTwoShare: 44,
          explanation: 'Demo preview: two sample tasks are shown under a different owner. No database records were changed.'
        }
      };
    });
    setRebalanced(true);
  }

  function handleReset() {
    setDemoState(INITIAL_DEMO_DATA);
    setRebalanced(false);
  }

  function handleApplicationDecision(appId: number, status: 'Accepted' | 'Rejected') {
    setDemoState(prev => ({
      ...prev,
      applications: prev.applications.map(a => a.id === appId ? { ...a, status } : a)
    }));
  }

  const roleTitle = currentRole === 'admin'
    ? 'Club Administrator'
    : currentRole === 'lead'
      ? 'Club Lead Operations'
      : currentRole === 'member'
        ? 'Student Contributor'
        : 'Super Admin Overview';

  return (
    <div style={{ minHeight: '100vh', background: '#10111f', color: '#f3f4fc', fontFamily: 'Inter, sans-serif' }}>
      {/* DEMO HEADER BAR */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
        padding: '10px 24px', background: '#141526', borderBottom: '1px solid #2d2e49'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 8px', borderRadius: '6px',
            background: 'rgba(255, 154, 92, 0.15)', color: '#ff9a5c', border: '1px solid rgba(255, 154, 92, 0.3)',
            fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px'
          }}>
            SAMPLE WORKSPACE
          </span>
          <span style={{ fontSize: '11px', color: '#9b9db9' }}>
            Viewing as: <strong style={{ color: '#f3f4fc' }}>{roleTitle}</strong>
          </span>
        </div>

        {/* ROLE SWITCHER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', color: '#777a9b', textTransform: 'uppercase', letterSpacing: '1px' }}>Switch Role:</span>
          {(['admin', 'lead', 'member'] as const).map(r => (
            <Link
              key={r}
              href={`/demo/${r}`}
              style={{
                padding: '5px 10px', borderRadius: '7px',
                fontSize: '10px', fontWeight: 700,
                border: r === currentRole ? '1px solid #a097ff' : '1px solid #2d2e49',
                background: r === currentRole ? 'rgba(160, 151, 255, 0.15)' : '#1a1b2f',
                color: r === currentRole ? '#a097ff' : '#9b9db9',
                textDecoration: 'none'
              }}
            >
              {r === 'admin' ? 'Club Admin' : r === 'lead' ? 'Club Lead' : 'Student'}
            </Link>
          ))}
          <button
            onClick={handleReset}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '5px 10px', borderRadius: '7px',
              fontSize: '10px', fontWeight: 700,
              border: '1px solid #2d2e49', background: '#1a1b2f', color: '#ffcb7a',
              cursor: 'pointer'
            }}
            title="Reset demo data to initial state"
          >
            <RotateCcw size={12} /> Reset Demo
          </button>
          <Link
            href="/dashboard"
            style={{
              padding: '5px 12px', borderRadius: '7px',
              fontSize: '10px', fontWeight: 800,
              background: 'linear-gradient(130deg, #9a8cff, #7465e8)', color: '#fff',
              textDecoration: 'none'
            }}
          >
            Exit to Live Mode →
          </Link>
        </div>
      </header>

      {/* DEMO MAIN CONTENT */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px clamp(16px, 3vw, 36px)' }}>
        {/* TOP NOTICE */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
          padding: '12px 18px', marginBottom: '22px', borderRadius: '12px',
          background: 'rgba(160, 151, 255, 0.06)', border: '1px solid rgba(160, 151, 255, 0.2)'
        }}>
          <div>
            <strong style={{ fontSize: '11px', color: '#a097ff' }}>Fictional sample records</strong>
            <p style={{ margin: '3px 0 0', fontSize: '10px', color: '#9b9db9', lineHeight: 1.6 }}>
              This workspace uses fictional records to preview role-based screens. Changes are temporary and never affect the live database.
            </p>
          </div>
          <span style={{ fontSize: '10px', color: '#75dba5', fontWeight: 700 }}>● Temporary sample data</span>
        </div>

        {/* ROLE-SPECIFIC HERO BANNER */}
        <section style={{
          padding: '22px 24px', borderRadius: '16px',
          background: 'radial-gradient(ellipse at 85% 30%, rgba(160, 151, 255, 0.12), transparent 45%), linear-gradient(145deg, #1a1b2f, #141526)',
          border: '1px solid #2d2e49', marginBottom: '20px'
        }}>
          <span style={{ fontSize: '9px', letterSpacing: '1.8px', color: '#a097ff', fontWeight: 850, textTransform: 'uppercase' }}>
            {currentRole === 'admin' ? 'STRATEGIC CLUB ADMINISTRATION' : currentRole === 'lead' ? 'OPERATIONAL LEAD HUB' : 'STUDENT PERSONAL WORKSPACE'}
          </span>
          <h1 style={{ fontSize: 'clamp(24px, 3.2vw, 34px)', letterSpacing: '-1.2px', margin: '8px 0 8px' }}>
            {currentRole === 'admin' && <>Club Overview — <em style={{ fontStyle: 'normal', color: '#a097ff' }}>Tech Society</em></>}
            {currentRole === 'lead' && <>Lead Operations — <em style={{ fontStyle: 'normal', color: '#75dba5' }}>Task Delivery &amp; FairWork</em></>}
            {currentRole === 'member' && <>Welcome back, <em style={{ fontStyle: 'normal', color: '#a097ff' }}>Rahul Kumar!</em></>}
          </h1>
          <p style={{ fontSize: '11px', color: '#9b9db9', margin: 0, maxWidth: '680px', lineHeight: 1.75 }}>
            {currentRole === 'admin' && 'Track member participation recency, identify inactive drift before students ghost, and monitor task completion health across all club activities.'}
            {currentRole === 'lead' && 'Assign tasks, monitor workload concentration, avoid sustained overload, and redistribute deliverables to available contributors.'}
            {currentRole === 'member' && 'View your assigned deliverables, track your contribution points, browse university clubs, and submit anonymous feedback or weekly mood check-ins.'}
          </p>
        </section>

        {/* METRICS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {currentRole === 'member' ? (
            <>
              <div style={{ padding: '14px 16px', background: '#1a1b2f', border: '1px solid #2d2e49', borderRadius: '12px' }}>
                <div style={{ fontSize: '10px', color: '#9b9db9', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  My Assigned Tasks <CheckSquare size={16} color="#a097ff" />
                </div>
                <strong style={{ display: 'block', fontSize: '26px', margin: '8px 0 4px', color: '#f3f4fc' }}>1</strong>
                <small style={{ color: '#9b9db9', fontSize: '9px' }}>Volunteer Onboarding Slides</small>
              </div>
              <div style={{ padding: '14px 16px', background: '#1a1b2f', border: '1px solid #2d2e49', borderRadius: '12px' }}>
                <div style={{ fontSize: '10px', color: '#9b9db9', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  Contribution Points <Sparkles size={16} color="#75dba5" />
                </div>
                <strong style={{ display: 'block', fontSize: '26px', margin: '8px 0 4px', color: '#75dba5' }}>140</strong>
                <small style={{ color: '#9b9db9', fontSize: '9px' }}>Verified contribution events</small>
              </div>
              <div style={{ padding: '14px 16px', background: '#1a1b2f', border: '1px solid #2d2e49', borderRadius: '12px' }}>
                <div style={{ fontSize: '10px', color: '#9b9db9', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  Participation Recency <Activity size={16} color="#ffcb7a" />
                </div>
                <strong style={{ display: 'block', fontSize: '26px', margin: '8px 0 4px', color: '#ffcb7a' }}>Drifting</strong>
                <small style={{ color: '#9b9db9', fontSize: '9px' }}>16 days since last task completion</small>
              </div>
              <div style={{ padding: '14px 16px', background: '#1a1b2f', border: '1px solid #2d2e49', borderRadius: '12px' }}>
                <div style={{ fontSize: '10px', color: '#9b9db9', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  Club Membership <Building2 size={16} color="#a097ff" />
                </div>
                <strong style={{ display: 'block', fontSize: '20px', margin: '10px 0 4px', color: '#f3f4fc' }}>Tech Society</strong>
                <small style={{ color: '#9b9db9', fontSize: '9px' }}>Role: Active Volunteer</small>
              </div>
            </>
          ) : (
            <>
              <div style={{ padding: '14px 16px', background: '#1a1b2f', border: '1px solid #2d2e49', borderRadius: '12px' }}>
                <div style={{ fontSize: '10px', color: '#9b9db9', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  Total Members <Users size={16} color="#a097ff" />
                </div>
                <strong style={{ display: 'block', fontSize: '26px', margin: '8px 0 4px', color: '#f3f4fc' }}>{demoState.members.length}</strong>
                <small style={{ color: '#9b9db9', fontSize: '9px' }}>3 Active · 1 Drifting · 1 Ghost · 1 Break</small>
              </div>
              <div style={{ padding: '14px 16px', background: '#1a1b2f', border: '1px solid #2d2e49', borderRadius: '12px' }}>
                <div style={{ fontSize: '10px', color: '#9b9db9', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  Active Tasks <CheckSquare size={16} color="#75dba5" />
                </div>
                <strong style={{ display: 'block', fontSize: '26px', margin: '8px 0 4px', color: '#f3f4fc' }}>{demoState.tasks.filter(t => t.status !== 'Completed').length}</strong>
                <small style={{ color: '#9b9db9', fontSize: '9px' }}>1 overdue · 1 unassigned</small>
              </div>
              <div style={{ padding: '14px 16px', background: '#1a1b2f', border: '1px solid #2d2e49', borderRadius: '12px' }}>
                <div style={{ fontSize: '10px', color: '#9b9db9', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  FairWork Gini Index <Flame size={16} color={demoState.fairwork.gini > 0.4 ? '#ff9a5c' : '#75dba5'} />
                </div>
                <strong style={{ display: 'block', fontSize: '26px', margin: '8px 0 4px', color: demoState.fairwork.gini > 0.4 ? '#ff9a5c' : '#75dba5' }}>
                  {Math.round(demoState.fairwork.gini * 100)}/100
                </strong>
                <small style={{ color: '#9b9db9', fontSize: '9px' }}>Top 2 hold {demoState.fairwork.topTwoShare}% of load</small>
              </div>
              <div style={{ padding: '14px 16px', background: '#1a1b2f', border: '1px solid #2d2e49', borderRadius: '12px' }}>
                <div style={{ fontSize: '10px', color: '#9b9db9', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  Applications Queue <Target size={16} color="#f2a0bc" />
                </div>
                <strong style={{ display: 'block', fontSize: '26px', margin: '8px 0 4px', color: '#f2a0bc' }}>{demoState.applications.length}</strong>
                <small style={{ color: '#9b9db9', fontSize: '9px' }}>1 Reviewing · 1 Applied · 1 Accepted</small>
              </div>
            </>
          )}
        </div>

        {/* FAIRWORK REBALANCE ALERT BANNER (If lead or admin) */}
        {currentRole !== 'member' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px',
            padding: '14px 18px', marginBottom: '22px', borderRadius: '12px',
            background: rebalanced ? 'rgba(117, 219, 165, 0.08)' : 'rgba(255, 154, 92, 0.08)',
            border: rebalanced ? '1px solid rgba(117, 219, 165, 0.3)' : '1px solid rgba(255, 154, 92, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Flame size={20} color={rebalanced ? '#75dba5' : '#ff9a5c'} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '11px', color: rebalanced ? '#75dba5' : '#ff9a5c' }}>
                  {rebalanced ? 'Demo preview updated — nothing was saved' : 'FairWork Warning: Lead Overload Detected'}
                </strong>
                <p style={{ margin: '3px 0 0', fontSize: '10px', color: '#9b9db9', lineHeight: 1.6, maxWidth: '820px' }}>
                  {demoState.fairwork.explanation}
                </p>
              </div>
            </div>
            {!rebalanced && (
              <button
                onClick={handleRebalance}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px',
                  background: 'linear-gradient(130deg, #ff9a5c, #e67e22)', color: '#fff',
                  border: 'none', fontSize: '10px', fontWeight: 800, cursor: 'pointer'
                }}
              >
                Preview suggested handover →
              </button>
            )}
          </div>
        )}

        {/* TWO COLUMN GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 0.75fr)', gap: '18px', alignItems: 'start' }}>
          {/* LEFT COLUMN: TASKS / KANBAN */}
          <div style={{ background: '#1a1b2f', border: '1px solid #2d2e49', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '12px', margin: '0 0 4px', letterSpacing: '-0.2px' }}>
                  {currentRole === 'member' ? 'My Assigned Deliverables' : 'Club Task Board &amp; Deliverables'}
                </h2>
                <p style={{ fontSize: '9px', color: '#9b9db9', margin: 0 }}>
                  Live status, owner accountability, and deadlines.
                </p>
              </div>
              <span style={{ fontSize: '8px', padding: '4px 8px', borderRadius: '6px', background: '#202139', border: '1px solid #2d2e49', color: '#9b9db9' }}>
                {demoState.tasks.length} total tasks
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(currentRole === 'member' ? demoState.tasks.filter(t => t.owner === 'Rahul Kumar') : demoState.tasks).map(task => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                    padding: '10px 14px', background: '#202139', border: '1px solid #2d2e49', borderRadius: '9px'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '10px', color: '#f3f4fc', overflowWrap: 'anywhere' }}>{task.title}</strong>
                      <span style={{
                        fontSize: '7px', fontWeight: 800, padding: '2px 5px', borderRadius: '4px',
                        background: task.priority === 'Urgent' ? 'rgba(242, 160, 188, 0.15)' : 'rgba(255, 203, 122, 0.15)',
                        color: task.priority === 'Urgent' ? '#f2a0bc' : '#ffcb7a'
                      }}>
                        {task.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: '8px', color: '#9b9db9', marginTop: '4px' }}>
                      Owner: <strong style={{ color: task.owner === 'Sanya Iyer' ? '#ff9a5c' : '#f3f4fc' }}>{task.owner}</strong> · Due: {task.due_date} · Effort: {task.effort}h · {task.club}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '8px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px',
                    background: task.status === 'Completed' ? 'rgba(117, 219, 165, 0.1)' : task.status === 'Overdue' ? 'rgba(242, 160, 188, 0.1)' : 'rgba(255, 203, 122, 0.1)',
                    color: task.status === 'Completed' ? '#75dba5' : task.status === 'Overdue' ? '#f2a0bc' : '#ffcb7a',
                    border: '1px solid #2d2e49'
                  }}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: GHOST RADAR & RECRUITMENT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentRole !== 'member' && (
              <>
            {/* GHOST RADAR */}
            <div style={{ background: '#1a1b2f', border: '1px solid #2d2e49', borderRadius: '14px', padding: '18px' }}>
              <div style={{ marginBottom: '14px' }}>
                <h2 style={{ fontSize: '12px', margin: '0 0 4px', letterSpacing: '-0.2px' }}>Ghost Radar (Participation Intelligence)</h2>
                <p style={{ fontSize: '9px', color: '#9b9db9', margin: 0 }}>
                  21-day inactivity decay detection. Supportive check-ins before students disengage.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {demoState.members.map(member => (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', background: '#202139', border: '1px solid #2d2e49', borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        display: 'grid', placeItems: 'center', width: '28px', height: '28px', borderRadius: '8px',
                        background: member.status === 'Ghost' ? 'rgba(242, 160, 188, 0.2)' : member.status === 'Drifting' ? 'rgba(255, 203, 122, 0.2)' : 'rgba(160, 151, 255, 0.2)',
                        color: member.status === 'Ghost' ? '#f2a0bc' : member.status === 'Drifting' ? '#ffcb7a' : '#a097ff',
                        fontSize: '9px', fontWeight: 800
                      }}>
                        {member.name.slice(0, 1)}
                      </span>
                      <div>
                        <strong style={{ fontSize: '9px', color: '#f3f4fc' }}>{member.name}</strong>
                        <div style={{ fontSize: '7.5px', color: '#9b9db9' }}>
                          {member.status === 'Ghost' ? '28 days without contribution' : member.status === 'Drifting' ? '16 days without contribution' : member.status === 'On Break' ? 'Approved study break' : `${member.openTasks} active tasks · Lead`}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '7.5px', fontWeight: 800, padding: '3px 6px', borderRadius: '5px',
                      background: member.status === 'Active' ? 'rgba(117, 219, 165, 0.15)' : member.status === 'Ghost' ? 'rgba(242, 160, 188, 0.15)' : 'rgba(255, 203, 122, 0.15)',
                      color: member.status === 'Active' ? '#75dba5' : member.status === 'Ghost' ? '#f2a0bc' : '#ffcb7a'
                    }}>
                      {member.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

              </>
            )}

            {currentRole !== 'member' && (
              <>
            {/* RECRUITMENT PIPELINE */}
            <div style={{ background: '#1a1b2f', border: '1px solid #2d2e49', borderRadius: '14px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '12px', margin: '0 0 4px', letterSpacing: '-0.2px' }}>Recruitment Pipeline</h2>
                  <p style={{ fontSize: '9px', color: '#9b9db9', margin: 0 }}>
                    Applicant reviews &amp; automated onboarding into membership.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {demoState.applications.map(app => (
                  <div
                    key={app.id}
                    style={{
                      padding: '10px 12px', background: '#202139', border: '1px solid #2d2e49', borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '9px', color: '#f3f4fc' }}>{app.applicant_name}</strong>
                      <span style={{
                        fontSize: '7.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                        background: app.status === 'Accepted' ? 'rgba(117, 219, 165, 0.15)' : app.status === 'Reviewing' ? 'rgba(255, 203, 122, 0.15)' : 'rgba(160, 151, 255, 0.15)',
                        color: app.status === 'Accepted' ? '#75dba5' : app.status === 'Reviewing' ? '#ffcb7a' : '#a097ff'
                      }}>
                        {app.status}
                      </span>
                    </div>
                    <small style={{ display: 'block', color: '#9b9db9', fontSize: '8px', margin: '3px 0 6px' }}>
                      {app.opening} · {app.club}
                    </small>
                    <p style={{ fontSize: '8px', color: '#777a9b', margin: '0 0 8px', fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{app.statement}"
                    </p>
                    {currentRole !== 'member' && app.status !== 'Accepted' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleApplicationDecision(app.id, 'Accepted')}
                          style={{
                            padding: '4px 8px', borderRadius: '5px',
                            background: 'rgba(117, 219, 165, 0.15)', border: '1px solid rgba(117, 219, 165, 0.3)',
                            color: '#75dba5', fontSize: '8px', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          Preview approval
                        </button>
                        <button
                          onClick={() => handleApplicationDecision(app.id, 'Rejected')}
                          style={{
                            padding: '4px 8px', borderRadius: '5px',
                            background: 'rgba(242, 160, 188, 0.1)', border: '1px solid rgba(242, 160, 188, 0.25)',
                            color: '#f2a0bc', fontSize: '8px', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          Preview decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
