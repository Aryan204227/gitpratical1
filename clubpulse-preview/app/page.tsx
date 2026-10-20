import Link from 'next/link';
import { ArrowRight, BarChart3, CalendarCheck, CheckCircle2, ClipboardCheck, ClipboardList, HeartHandshake, MessageCircle, ShieldCheck, Target, Users, Workflow } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ClubPulse — Run student clubs with clarity',
  description: 'A practical workspace for college clubs: recruitment, event tasks, contribution history and member feedback in one connected workflow.',
};

const problems = [
  { n: '01', title: 'Work is scattered', text: 'Decisions live in chats, deadlines in spreadsheets and follow-ups in someone’s memory. Small things get missed.' },
  { n: '02', title: 'The same people do everything', text: 'Without visible owners and workload, reliable volunteers quietly inherit every task while others do not know where to help.' },
  { n: '03', title: 'Effort disappears after the event', text: 'New members, handovers and future teams lose the history of what was done, what failed and what should change.' },
];

const workflow = [
  { n: '01', title: 'Bring people in', text: 'Publish club roles, collect applications and review candidates through one clear pipeline.', icon: Users },
  { n: '02', title: 'Give every task an owner', text: 'Make the next action, person responsible, priority and deadline visible before event day.', icon: ClipboardList },
  { n: '03', title: 'Keep a useful record', text: 'Record assignments, completions and onboarding events so handovers are based on evidence.', icon: ClipboardCheck },
  { n: '04', title: 'Improve the next event', text: 'Collect member feedback and agree follow-up actions without exposing small-group responses.', icon: MessageCircle },
];

export default function LandingPage() {
  return (
    <main className="cp-landing">
      <header className="cp-nav">
        <Link href="/" className="next-brand" aria-label="ClubPulse home">
          <span className="next-brand-mark">✳</span>
          <span>ClubPulse<small>STUDENT CLUB OPERATIONS</small></span>
        </Link>
        <nav className="cp-nav-links" aria-label="Main navigation">
          <a href="#problem">The problem</a><a href="#workflow">How it works</a><a href="#trust">Privacy</a>
        </nav>
        <div className="cp-nav-actions"><Link href="/login" className="cp-signin">Sign in</Link><Link href="/register" className="cp-nav-cta">Open workspace <ArrowRight size={15}/></Link></div>
      </header>

      <section className="cp-hero">
        <div className="cp-hero-copy">
          <div className="cp-kicker"><span className="cp-kicker-dot"/> BUILT FOR COLLEGE CLUBS, SOCIETIES & EVENT TEAMS</div>
          <h1>Good clubs shouldn’t run on <em>last-minute messages.</em></h1>
          <p className="cp-hero-lead">ClubPulse gives student teams one place to recruit members, assign event work, track what got done and learn from feedback—so work does not fall on the same two people.</p>
          <div className="cp-hero-actions"><Link href="/register" className="cp-primary">Create a workspace <ArrowRight size={16}/></Link><a href="#workflow" className="cp-secondary">See the real workflow <Workflow size={16}/></a></div>
          <div className="cp-proof-points"><span><CheckCircle2 size={15}/> Clear owners & deadlines</span><span><CheckCircle2 size={15}/> Traceable handovers</span><span><ShieldCheck size={15}/> Feedback privacy guardrails</span></div>
        </div>

        <div className="cp-product-visual" aria-label="Illustrative sample task board showing owners, statuses and due dates">
          <div className="cp-orbit cp-orbit-one"/><div className="cp-orbit cp-orbit-two"/>
          <div className="cp-board">
            <div className="cp-board-top"><div className="cp-board-brand"><span>✳</span><div><strong>Club workspace</strong><small>EVENT READINESS</small></div></div><span className="cp-sample-tag">SAMPLE VIEW</span></div>
            <div className="cp-board-title"><div><small>THIS WEEK’S WORK</small><h2>Make the next step obvious.</h2></div><span className="cp-board-icon"><CalendarCheck size={18}/></span></div>
            <div className="cp-task-row"><span className="cp-task-check done"><CheckCircle2 size={14}/></span><div className="cp-task-copy"><strong>Confirm venue & equipment</strong><small>Event operations · Owner: Aanya</small></div><span className="cp-state cp-state-green">In progress</span></div>
            <div className="cp-task-row"><span className="cp-task-check"><ClipboardList size={14}/></span><div className="cp-task-copy"><strong>Prepare volunteer briefing</strong><small>People team · Owner: Kabir</small></div><span className="cp-state cp-state-amber">To do</span></div>
            <div className="cp-task-row"><span className="cp-task-check"><MessageCircle size={14}/></span><div className="cp-task-copy"><strong>Capture post-event learnings</strong><small>Team reflection · Owner: Everyone</small></div><span className="cp-state cp-state-violet">Planned</span></div>
            <div className="cp-board-flow"><span>ROLE</span><i/><span>OWNER</span><i/><span>PROOF</span><i/><span>IMPROVE</span></div>
            <p className="cp-sample-note">Illustrative records only—not live club data.</p>
          </div>
          <div className="cp-floating-note"><span><Target size={15}/></span><div><strong>Ownership, not blame.</strong><small>Make it easier to ask for help early.</small></div></div>
        </div>
      </section>

      <section className="cp-problem-section" id="problem">
        <div className="cp-section-intro"><span className="cp-eyebrow">THE CAMPUS PROBLEM</span><h2>It’s not a motivation problem.<br/><em>It’s a visibility problem.</em></h2><p>When a club grows, the informal way of working stops being enough. ClubPulse turns the invisible coordination into simple, shared steps.</p></div>
        <div className="cp-problem-grid">{problems.map((p)=><article className="cp-problem-card" key={p.n}><span className="cp-card-number">{p.n}</span><h3>{p.title}</h3><p>{p.text}</p></article>)}</div>
      </section>

      <section className="cp-workflow-section" id="workflow">
        <div className="cp-section-intro cp-centered"><span className="cp-eyebrow">ONE CONNECTED WORKFLOW</span><h2>From “who’s doing this?” to <em>“here’s the next step.”</em></h2><p>Each module supports the next one. No fake activity scores—just actions your team records and can follow up on.</p></div>
        <div className="cp-workflow-grid">{workflow.map((w)=><article className="cp-workflow-card" key={w.n}><div className="cp-workflow-card-top"><span className="cp-workflow-icon"><w.icon size={19}/></span><span>{w.n} / 04</span></div><h3>{w.title}</h3><p>{w.text}</p></article>)}</div>
      </section>

      <section className="cp-modules-section">
        <div className="cp-section-intro"><span className="cp-eyebrow">BUILT TO BE USED, NOT JUST SHOWN</span><h2>Tools for the work your club <em>actually does.</em></h2></div>
        <div className="cp-modules-grid">
          <Link href="/clubs" className="cp-module-card"><span className="cp-module-icon"><Users size={19}/></span><div><h3>Club directory</h3><p>Keep profiles, club ownership and team workload connected.</p></div><ArrowRight size={16}/></Link>
          <Link href="/recruitment" className="cp-module-card"><span className="cp-module-icon"><HeartHandshake size={19}/></span><div><h3>Recruitment pipeline</h3><p>Review applicants, make decisions and onboard accepted candidates.</p></div><ArrowRight size={16}/></Link>
          <Link href="/tasks" className="cp-module-card"><span className="cp-module-icon"><ClipboardList size={19}/></span><div><h3>Event task board</h3><p>Clarify the owner, status, priority and due date for real tasks.</p></div><ArrowRight size={16}/></Link>
          <Link href="/contributions" className="cp-module-card"><span className="cp-module-icon"><BarChart3 size={19}/></span><div><h3>Contribution history</h3><p>Use recorded work for handovers and recognition—not popularity rankings.</p></div><ArrowRight size={16}/></Link>
          <Link href="/feedback" className="cp-module-card"><span className="cp-module-icon"><MessageCircle size={19}/></span><div><h3>Member feedback</h3><p>Raise issues early and turn feedback into follow-up actions.</p></div><ArrowRight size={16}/></Link>
          <Link href="/analytics" className="cp-module-card"><span className="cp-module-icon"><Workflow size={19}/></span><div><h3>Team insights</h3><p>Review group-level patterns with small-group privacy safeguards.</p></div><ArrowRight size={16}/></Link>
        </div>
      </section>

      <section className="cp-trust-section" id="trust">
        <div className="cp-trust-mark"><ShieldCheck size={25}/></div><div className="cp-trust-copy"><span className="cp-eyebrow">FAIRNESS & PRIVACY</span><h2>Visibility without surveillance.</h2><p>Feedback is anonymous by default. Small-group rating averages stay hidden until five or more rated responses exist. Recorded points represent specific events—not effort, talent or personal worth.</p></div><div className="cp-trust-rule"><span><CheckCircle2 size={16}/> No invented productivity scores</span><span><CheckCircle2 size={16}/> Clear contribution event history</span><span><CheckCircle2 size={16}/> Role-aware access to private records</span></div>
      </section>

      <section className="cp-final-cta"><div><span className="cp-eyebrow">START WITH ONE CLUB. ONE EVENT.</span><h2>Make the next event easier<br/>for <em>the whole team.</em></h2><p>Start with a real opening or task, assign an owner and build a record your next team can use.</p></div><Link href="/register" className="cp-primary">Set up your workspace <ArrowRight size={16}/></Link></section>

      <footer className="cp-footer"><Link href="/" className="next-brand"><span className="next-brand-mark">✳</span><span>ClubPulse<small>STUDENT CLUB OPERATIONS</small></span></Link><div className="cp-footer-links"><Link href="/login">Sign in</Link><Link href="/register">Create account</Link><a href="#trust">Privacy approach</a></div><p>INT252 + INT257 coursework · Synthetic demo records · Verify database setup before real campus use.</p></footer>
    </main>
  );
}
