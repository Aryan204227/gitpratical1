import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight,X,Users,ClipboardList } from 'lucide-react';
import { getClub } from '@/lib/read-model';
import { NextStatus } from '@/components/NextPrimitives';
export const dynamic='force-dynamic';
export default async function InterceptedClubModal({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const number=Number(id);if(!Number.isInteger(number)||number<1)notFound();
 const club=await getClub(number);if(!club)notFound();
 const percentage=club.task_count?Math.round(club.completed_count/club.task_count*100):null;
 return <div className="next-modal-root"><Link className="next-modal-backdrop" href="/clubs" aria-label="Close club quick view"/><section className="next-intercept-modal" role="dialog" aria-modal="true" aria-labelledby="interceptedClubTitle"><header><span className="next-club-mark big">{club.name.slice(0,1)}</span><Link href="/clubs" className="next-icon-btn" aria-label="Close modal"><X size={16}/></Link></header><span className="next-eyebrow">INTERCEPTING ROUTE · CLUB PREVIEW</span><h2 id="interceptedClubTitle">{club.name}</h2><p className="next-intercept-category">{club.category}</p><div className="next-intercept-stats"><div><Users size={16}/><span><b>{club.member_count}</b><small>Active members</small></span></div><div><ClipboardList size={16}/><span><b>{club.task_count}</b><small>Tasks tracked</small></span></div><div><ArrowRight size={16}/><span><b>{percentage===null?'—':percentage+'%'}</b><small>Completion rate</small></span></div></div><div className="next-intercept-footer"><NextStatus status={club.status}/><Link href={'/clubs/'+club.id} className="next-primary-btn">Open full profile <ArrowRight size={14}/></Link></div><p className="next-subtle">Client navigation to this URL opens a modal. Refreshing the URL loads the full dynamic club page instead.</p></section></div>;
}
