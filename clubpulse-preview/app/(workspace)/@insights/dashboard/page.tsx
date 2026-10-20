import Link from 'next/link';
import { ArrowRight,Shield,Users,CheckCircle2 } from 'lucide-react';
import { getDashboardSnapshot } from '@/lib/read-model';
export const dynamic='force-dynamic';
export default async function DashboardInsightsSlot(){
 const d=await getDashboardSnapshot();const total=Number(d.tasks.total)||0;const completed=Number(d.tasks.completed)||0;const completion=total?Math.round(completed/total*100):null;
 return <aside className="next-parallel-insight"><div className="next-parallel-icon"><Shield size={17}/></div><div className="next-parallel-body"><span className="next-eyebrow">PARALLEL ROUTE SLOT</span><h3>Quick workspace signals</h3><p>This panel is rendered from the <code>@insights</code> parallel slot in the App Router layout.</p><div className="next-parallel-metrics"><span><Users size={14}/>{d.members} members</span><span><CheckCircle2 size={14}/>{completion===null?'—':completion+'%'} task completion</span></div><Link href="/analytics" className="next-inline-link">Open analytics <ArrowRight size={13}/></Link></div></aside>;
}
