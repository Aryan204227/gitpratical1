import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft,ArrowRight,ClipboardList,Users } from 'lucide-react';
import { getClub,getTasks } from '@/lib/read-model';
import { NextPageHeading,NextPanel,NextStatus,NextEmpty } from '@/components/NextPrimitives';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
 const {id}=await params;const number=Number(id);
 if(!Number.isInteger(number)||number<1)return {title:'Club not found | ClubPulse'};
 const club=await getClub(number);
 if(!club)return {title:'Club not found | ClubPulse',robots:{index:false,follow:false}};
 return {title:club.name+' | ClubPulse',description:club.category+' club profile: '+club.member_count+' active members and '+club.task_count+' tracked tasks.',robots:{index:false,follow:false}};
}
export default async function ClubDetailsPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const numeric=Number(id);if(!Number.isInteger(numeric)||numeric<1)notFound();
 const [club,tasks]=await Promise.all([getClub(numeric),getTasks(400)]);if(!club)notFound();
 const clubTasks=tasks.filter((t:any)=>t.club===club.name);
 return <div className="next-page-stack"><Link href="/clubs" className="next-back-link"><ArrowLeft size={14}/> Back to clubs</Link><NextPageHeading eyebrow={'CLUB PROFILE · '+club.category.toUpperCase()} title={<>Club <em>profile.</em></>} description="Dynamic App Router route: the club identifier is read from the URL and used in a parameterized database query." action={<NextStatus status={club.status}/>}/><section className="cp-club-detail-hero">
 <div className="cp-club-detail-copy"><span className="next-eyebrow">CLUB WORLD / {club.category.toUpperCase()}</span><h2>{club.name}<em>.</em></h2><p>A live club profile connected to its actual member records, assigned tasks and completion history.</p><div className="cp-club-detail-facts"><span><Users size={14}/>{club.member_count} active members</span><span><ClipboardList size={14}/>{club.task_count} tracked tasks</span></div></div>
 <div className="cp-club-detail-scene" role="img" aria-label={`Abstract 3D illustration for ${club.name}`}><i className="cp-club-detail-planet"/><i className="cp-club-detail-ring ring-a"/><i className="cp-club-detail-ring ring-b"/><div className="cp-club-detail-island"><i className="deck-back"/><i className="deck-front"/><i className="tower tower-a"/><i className="tower tower-b"/><i className="tower tower-c"/><i className="spire"/></div><span className="cp-club-detail-orbit-label">CLUBPULSE / FIELD UNIT</span></div>
 </section><div className="next-metric-grid"><article className="next-metric-card"><div className="next-metric-label">Active members<span><Users size={17}/></span></div><strong>{club.member_count}</strong><small>Current active membership</small></article><article className="next-metric-card"><div className="next-metric-label">Tasks tracked<span><ClipboardList size={17}/></span></div><strong>{club.task_count}</strong><small>Tasks assigned to this club</small></article><article className="next-metric-card"><div className="next-metric-label">Completed<span><ArrowRight size={17}/></span></div><strong>{club.completed_count}</strong><small>Completed task records</small></article><article className="next-metric-card"><div className="next-metric-label">Completion rate<span><ClipboardList size={17}/></span></div><strong>{club.task_count?Math.round(club.completed_count/club.task_count*100)+'%':'—'}</strong><small>Descriptive activity signal only</small></article></div>
 <NextPanel title="Club task list" description="This view joins tasks by the selected club's record.">{clubTasks.length===0?<NextEmpty title="No tasks assigned" description="A lead can create a task and assign ownership from the task workspace."/>:<div className="next-table-wrap"><table className="next-table"><thead><tr><th>Task</th><th>Owner</th><th>Due date</th><th>Status</th><th>Details</th></tr></thead><tbody>{clubTasks.map((t:any)=><tr key={t.id}><td>{t.title}</td><td>{t.owner}</td><td>{t.due_date||'No deadline'}</td><td><NextStatus status={t.status}/></td><td><Link className="next-inline-link" href={'/tasks/'+t.id}>Open <ArrowRight size={13}/></Link></td></tr>)}</tbody></table></div>}</NextPanel></div>;
}
