import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getDashboardSnapshot } from '@/lib/read-model';
import { NextPageHeading, NextPanel } from '@/components/NextPrimitives';
import { BarChart3, Database, Shield, Users, CheckCircle2, MessageSquareText } from 'lucide-react';
import { AnalyticsTrendChart } from '@/components/AnalyticsTrendChart';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!['admin', 'superadmin'].includes(user.role)) redirect('/dashboard?error=forbidden');

  const data = await getDashboardSnapshot();
  const total = Number(data.tasks.total) || 0;
  const completed = Number(data.tasks.completed) || 0;
  const percentage = total ? Math.round((completed / total) * 100) : null;
  const average = data.feedback.average;
  const signals = [
    { name: 'Task completion', value: percentage === null ? '—' : percentage + '%', note: completed + ' completed / ' + total + ' tasks', icon: CheckCircle2 },
    { name: 'Active members', value: String(data.members), note: 'Currently active member records', icon: Users },
    { name: 'Open tasks', value: String(data.tasks.open), note: 'Tasks still active or pending', icon: BarChart3 },
    { name: 'Rated feedback average', value: average === null ? 'Hidden' : '★ ' + average, note: average === null ? 'Shown only after at least 5 ratings' : Number(data.feedback.total) + ' rated entries', icon: MessageSquareText },
  ];

  return (
    <div className="next-page-stack">
      <NextPageHeading
        eyebrow="WORKSPACE REPORT"
        title={<>See how the clubs are <em>doing.</em></>}
        description="A workspace-wide summary of saved club, task, participation and feedback records."
      />
      <div className="next-metric-grid">
        {signals.map(signal => (
          <article className="next-metric-card" key={signal.name}>
            <div className="next-metric-label">{signal.name}<span><signal.icon size={17}/></span></div>
            <strong>{signal.value}</strong>
            <small>{signal.note}</small>
          </article>
        ))}
      </div>
      <div className="next-two-col">
        <NextPanel title="Weekly task activity" description="These counts come from task assignment and completion events saved in PostgreSQL.">
          <AnalyticsTrendChart points={data.trend.map((point: any) => ({
            week: String(point.week),
            assigned: Number(point.assigned) || 0,
            completed: Number(point.completed) || 0,
          }))}/>
        </NextPanel>
        <NextPanel title="How to read these numbers" description="The system is designed to support better club decisions, not rank individual students.">
          <div className="next-method-list">
            <div><Database size={17}/><span><strong>Recorded information</strong><small>Charts are built from saved tasks and contribution events.</small></span></div>
            <div><Shield size={17}/><span><strong>Feedback privacy</strong><small>Average ratings are hidden when fewer than five responses exist.</small></span></div>
            <div><Users size={17}/><span><strong>Supportive use</strong><small>High workload is a prompt to offer help and share tasks more fairly.</small></span></div>
          </div>
        </NextPanel>
      </div>
    </div>
  );
}
