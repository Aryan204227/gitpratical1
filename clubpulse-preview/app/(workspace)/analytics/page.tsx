import { getDashboardSnapshot } from '@/lib/read-model';
import { NextPageHeading,NextPanel,NextStatus,NextEmpty } from '@/components/NextPrimitives';
import { BarChart3,Database,Shield,Users,CheckCircle2,MessageSquareText } from 'lucide-react';
import { AnalyticsTrendChart } from '@/components/AnalyticsTrendChart';
export const dynamic='force-dynamic';
export default async function AnalyticsPage(){
 const d=await getDashboardSnapshot();const total=Number(d.tasks.total)||0;const completed=Number(d.tasks.completed)||0;const pct=total?Math.round(completed/total*100):null;const avg=d.feedback.average;
 const signals=[{name:'Task completion',value:pct===null?'—':pct+'%',note:completed+' completed / '+total+' tasks',icon:CheckCircle2},{name:'Active members',value:String(d.members),note:'Currently active member records',icon:Users},{name:'Open tasks',value:String(d.tasks.open),note:'Tasks still active or pending',icon:BarChart3},{name:'Rated feedback average',value:avg===null?'Hidden':'★ '+avg,note:avg===null?'Shown only after at least 5 ratings':Number(d.feedback.total)+' rated entries',icon:MessageSquareText}];
 return <div className="next-page-stack"><NextPageHeading eyebrow="INSIGHTS & PRODUCT IMPACT" title={<>Measure participation, not just <em>membership.</em></>} description="Server-rendered analytics calculate from stored tasks and contribution events, with safeguards for interpretation."/>
 <div className="next-metric-grid">{signals.map(s=><article className="next-metric-card" key={s.name}><div className="next-metric-label">{s.name}<span><s.icon size={17}/></span></div><strong>{s.value}</strong><small>{s.note}</small></article>)}</div>
 <div className="next-two-col"><NextPanel title="Participation flow" description="Switch between assignment and completion trends. Values are derived from stored contribution events."><AnalyticsTrendChart points={d.trend.map((p:any)=>({week:String(p.week),assigned:Number(p.assigned)||0,completed:Number(p.completed)||0}))}/></NextPanel>
 <NextPanel title="Measurement safeguards" description="Interpretation is part of product quality."><div className="next-method-list"><div><Database size={17}/><span><strong>Traceable source data</strong><small>Every trend references persisted events; it does not infer effort from presence.</small></span></div><div><Shield size={17}/><span><strong>Feedback privacy</strong><small>Group averages are suppressed below the minimum five responses.</small></span></div><div><Users size={17}/><span><strong>Supportive check-ins</strong><small>Uneven workload is a reason to talk and redistribute work—not label people.</small></span></div></div></NextPanel></div>
 </div>;
}
