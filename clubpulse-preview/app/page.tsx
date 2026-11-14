import Link from 'next/link';
import { getLandingStats } from '@/lib/read-model';
import { ArrowRight, BarChart3, CheckCircle2, ClipboardCheck, ClipboardList, HeartHandshake, MessageCircle, ShieldCheck, Users, Workflow } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ClubPulse — A better way to run a student club',
  description: 'A student club workspace for recruitment, task assignments, contribution records and member feedback.',
};

const problems = [
  { n: '01', title: 'Nobody knows who owns the next step', text: 'Event plans move between group chats and spreadsheets. Tasks get missed when an owner or deadline is unclear.' },
  { n: '02', title: 'A few students carry most of the work', text: 'The same volunteers often take on every urgent job. Leads need a simple way to see workload before it becomes too much.' },
  { n: '03', title: 'The next team starts from zero', text: 'When an event ends, useful work history and feedback are easy to lose. The next organisers repeat the same mistakes.' },
];

const workflow = [
  { n: '01', title: 'Recruit', text: 'Create a club profile, publish an opening and review student applications.', icon: Users },
  { n: '02', title: 'Assign', text: 'Create a task with an owner, a short work brief, priority and due date.', icon: ClipboardList },
  { n: '03', title: 'Record', text: 'Update progress, attach work evidence and keep a contribution history.', icon: ClipboardCheck },
  { n: '04', title: 'Improve', text: 'Collect feedback and review how tasks were shared before the next event.', icon: MessageCircle },
];

export const dynamic = 'force-dynamic';
export default async function LandingPage() {
  let liveStats: { clubs: number; tasks: number; events: number } | null = null;
  if (process.env.DATABASE_URL) {
    try { liveStats = await getLandingStats(); } catch { liveStats = null; }
  }

  return (
    <main className="cp-landing">
      <header className="cp-nav">
        <Link href="/" className="next-brand" aria-label="ClubPulse home">
          <span className="next-brand-mark">CP</span>
          <span>ClubPulse<small>STUDENT CLUB WORKSPACE</small></span>
        </Link>
        <nav className="cp-nav-links" aria-label="Main navigation">
          <a href="#problem">The problem</a>
          <a href="#workflow">How it works</a>
          <Link href="/demo">Demo</Link>
          <a href="#modules">Modules</a>
        </nav>
        <div className="cp-nav-actions">
          <Link href="/login" className="cp-signin">Sign in</Link>
          <Link href="/register" className="cp-nav-cta">Open workspace <ArrowRight size={14}/></Link>
        </div>
      </header>

      <section className="cp-hero">
        <div className="cp-hero-copy">
          <div className="cp-kicker"><span className="cp-kicker-dot"/> INT252 + INT257 · PROJECT P18</div>
          <h1>A better way to run a <em>student club.</em></h1>
          <p className="cp-hero-lead">ClubPulse keeps recruitment, tasks and member feedback in one place. Organisers can see who is doing what, follow progress and share work more fairly—without relying on scattered chats and spreadsheets.</p>
          <div className="cp-hero-actions">
            <Link href="/demo" className="cp-primary">Explore the demo <ArrowRight size={16}/></Link>
            <Link href="/login" className="cp-secondary">Sign in to your workspace</Link>
          </div>
          <div className="cp-proof-points">
            <span><CheckCircle2 size={15}/> Clear task ownership</span>
            <span><CheckCircle2 size={15}/> Recorded contributions</span>
            <span><ShieldCheck size={15}/> Private member feedback</span>
          </div>
          {liveStats && <div className="cp-live-stats" aria-label="Saved workspace totals">
            <div><strong>{liveStats.clubs.toLocaleString('en-IN')}</strong><small>CLUBS</small></div>
            <div><strong>{liveStats.tasks.toLocaleString('en-IN')}</strong><small>TASKS</small></div>
            <div><strong>{liveStats.events.toLocaleString('en-IN')}</strong><small>RECORDED EVENTS</small></div>
          </div>}
        </div>

        <div className="cp-product-visual cp-landing-workflow" aria-label="ClubPulse workflow preview">
          <div className="cp-landing-workflow-head">
            <span>THE WORKFLOW</span>
            <strong>From joining a club to finishing a task</strong>
            <small>Each step creates a record the team can use later.</small>
          </div>
          <div className="cp-landing-workflow-row">
            <span>01</span><div><strong>People & recruitment</strong><small>Club profiles, applications and member onboarding</small></div><Users size={18}/>
          </div>
          <div className="cp-landing-workflow-row">
            <span>02</span><div><strong>Tasks & contributions</strong><small>Owners, work briefs, deadlines and progress photos</small></div><ClipboardList size={18}/>
          </div>
          <div className="cp-landing-workflow-row">
            <span>03</span><div><strong>Feedback & workload</strong><small>Member feedback and FairWork review suggestions</small></div><BarChart3 size={18}/>
          </div>
          <div className="cp-landing-workflow-foot">
            <span>REACT</span><span>NEXT.JS</span><span>POSTGRESQL</span>
          </div>
        </div>
      </section>

      <section className="cp-problem-section" id="problem">
        <div className="cp-section-intro">
          <span className="cp-eyebrow">WHY WE BUILT IT</span>
          <h2>Club work should not depend on the <em>same three people.</em></h2>
          <p>This project focuses on a common campus problem: work is hard to track, responsibilities are uneven and handovers are often incomplete.</p>
        </div>
        <div className="cp-problem-grid">
          {problems.map(problem => <article className="cp-problem-card" key={problem.n}>
            <span className="cp-card-number">{problem.n}</span><h3>{problem.title}</h3><p>{problem.text}</p>
          </article>)}
        </div>
      </section>

      <section className="cp-workflow-section" id="workflow">
        <div className="cp-section-intro cp-centered">
          <span className="cp-eyebrow">HOW A CLUB USES IT</span>
          <h2>Four steps. <em>One shared workspace.</em></h2>
          <p>The modules follow the way a student club actually works, from recruitment to the next event.</p>
        </div>
        <div className="cp-workflow-grid">
          {workflow.map(step => <article className="cp-workflow-card" key={step.n}>
            <div className="cp-workflow-card-top"><span className="cp-workflow-icon"><step.icon size={19}/></span><span>{step.n} / 04</span></div>
            <h3>{step.title}</h3><p>{step.text}</p>
          </article>)}
        </div>
      </section>

      <section className="cp-modules-section" id="modules">
        <div className="cp-section-intro">
          <span className="cp-eyebrow">PROJECT MODULES</span>
          <h2>Everything has a <em>clear place.</em></h2>
          <p>These are the working areas of the project. Open the demo to explore the role-based screens.</p>
        </div>
        <div className="cp-modules-grid">
          <Link href="/clubs" className="cp-module-card"><span className="cp-module-icon"><Users size={19}/></span><div><h3>Club & recruitment</h3><p>Club profiles, openings, applications and member onboarding.</p></div><ArrowRight size={16}/></Link>
          <Link href="/tasks" className="cp-module-card"><span className="cp-module-icon"><ClipboardList size={19}/></span><div><h3>Tasks & contributions</h3><p>Task ownership, deadlines, progress and contribution records.</p></div><ArrowRight size={16}/></Link>
          <Link href="/feedback" className="cp-module-card"><span className="cp-module-icon"><HeartHandshake size={19}/></span><div><h3>Feedback & analytics</h3><p>Member feedback, workload patterns and follow-up actions.</p></div><ArrowRight size={16}/></Link>
        </div>
      </section>

      <section className="cp-trust-section" id="trust">
        <div className="cp-trust-mark"><ShieldCheck size={25}/></div>
        <div className="cp-trust-copy">
          <span className="cp-eyebrow">A NOTE ON FAIRNESS</span>
          <h2>Numbers should help the team, not judge a student.</h2>
          <p>Contribution points represent recorded tasks and events. Workload signals are prompts for a lead to check in and offer help—not a diagnosis or a ranking of people. Small-group feedback averages stay hidden until five ratings exist.</p>
        </div>
        <div className="cp-trust-rule">
          <span><CheckCircle2 size={16}/> Clear task history</span>
          <span><CheckCircle2 size={16}/> Reviewed handovers</span>
          <span><CheckCircle2 size={16}/> Role-based access</span>
        </div>
      </section>

      <section className="cp-final-cta">
        <div><span className="cp-eyebrow">TRY THE PROJECT</span><h2>Start with a club. <em>See the workflow.</em></h2><p>Use the demo to understand the screens, then sign in to work with your own club records.</p></div>
        <Link href="/demo" className="cp-primary">Open the demo <ArrowRight size={16}/></Link>
      </section>

      <footer className="cp-footer">
        <Link href="/" className="next-brand"><span className="next-brand-mark">CP</span><span>ClubPulse<small>INT252 + INT257 · P18</small></span></Link>
        <div className="cp-footer-links"><Link href="/login">Sign in</Link><Link href="/register">Create account</Link><a href="#trust">Fairness & privacy</a></div>
        <p>Student project · React + Next.js · PostgreSQL</p>
      </footer>
    </main>
  );
}