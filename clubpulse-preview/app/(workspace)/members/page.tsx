import { redirect } from 'next/navigation';
import { Users,Workflow } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getMembers } from '@/lib/read-model';
import { NextPageHeading,NextPanel,NextStatus,NextEmpty } from '@/components/NextPrimitives';
export const dynamic='force-dynamic';
export default async function MembersPage(){
 const user=await getCurrentUser();if(!user||!['admin','lead'].includes(user.role))redirect('/dashboard?error=forbidden');
 const members=await getMembers();
 return <div className="next-page-stack"><NextPageHeading eyebrow="PEOPLE & ONBOARDING" title={<>Every member has a <em>story.</em></>} description="Review onboarding and recorded contribution events, not membership counts alone." action={<span className="next-count-pill">{members.length} member records</span>}/><NextPanel title="Member directory" description="Only administrators and club leads can view personal directory fields.">{members.length===0?<NextEmpty title="No members yet" description="Accepted recruitment applicants can be onboarded automatically."/>:<div className="next-table-wrap"><table className="next-table"><thead><tr><th>Member</th><th>Club</th><th>Role</th><th>Contribution events</th><th>Status</th></tr></thead><tbody>{members.map((m:any)=><tr key={m.id}><td><div className="next-member-cell"><span className="next-avatar">{m.name.slice(0,1)}</span><span><strong>{m.name}</strong><small>{m.email}</small></span></div></td><td>{m.club}</td><td><NextStatus status={m.role}/></td><td><span className="next-number-cell"><Workflow size={13}/>{m.contribution_count}</span></td><td><NextStatus status={m.active?'Active':'Inactive'}/></td></tr>)}</tbody></table></div>}</NextPanel></div>;
}
