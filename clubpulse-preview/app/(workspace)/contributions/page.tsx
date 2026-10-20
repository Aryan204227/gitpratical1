import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getContributions } from '@/lib/read-model';
import { NextPageHeading,NextPanel,NextEmpty,NextStatus } from '@/components/NextPrimitives';
import { Workflow,Download } from 'lucide-react';
export const dynamic='force-dynamic';
export default async function ContributionsPage(){
 const user=await getCurrentUser();if(!user||!['admin','lead'].includes(user.role))redirect('/dashboard?error=forbidden');const events=await getContributions();
 return <div className="next-page-stack"><NextPageHeading eyebrow="CONTRIBUTION HISTORY" title={<>Recognise work behind <em>outcomes.</em></>} description="Each record represents a task or onboarding event saved in the database. The system does not infer effort that was never recorded." action={<span className="next-count-pill">{events.length} events</span>}/>
 <div className="next-trust-strip"><Workflow size={18}/><div><strong>Contribution points are transparent counters.</strong><p>Assigned tasks create 0 points; completion events create 1 recorded point. They are not a personal value or burnout score.</p></div></div>
 <NextPanel title="Recorded event history" description="Administrators and club leads only.">{events.length===0?<NextEmpty title="No events yet" description="Task assignments, completions and accepted recruitment applications will create events."/>:<div className="next-table-wrap"><table className="next-table"><thead><tr><th>Event</th><th>Member</th><th>Club</th><th>Task</th><th>Points</th><th>Recorded</th></tr></thead><tbody>{events.map((e:any)=><tr key={e.id}><td><NextStatus status={e.event_type.replaceAll('_',' ')}/></td><td>{e.member_name}</td><td>{e.club}</td><td>{e.task||'—'}</td><td>{e.points}</td><td>{new Date(e.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}</NextPanel></div>;
}
