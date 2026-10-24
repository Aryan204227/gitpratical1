import {redirect} from 'next/navigation';
import {getCurrentUser} from '@/lib/auth';
import {ensureDatabase,getPool} from '@/lib/db';
import {NextPageHeading,NextPanel} from '@/components/NextPrimitives';
import {AccountSecurityPanel} from '@/components/AccountSecurityPanel';
export const dynamic='force-dynamic';
export default async function AccountSecurityPage(){
 const user=await getCurrentUser();if(!user)redirect('/login?next=%2Fsettings%2Fsecurity');
 await ensureDatabase();
 const linked=await getPool().query('SELECT google_sub FROM users WHERE id=$1',[user.id]);
 return <div className="next-page-stack"><NextPageHeading eyebrow="IDENTITY & ACCESS" title={<>Account <em>security.</em></>} description="Manage sign-in methods and revoke sessions from one place."/><NextPanel title="Authentication & sessions" description="Google account linking requires the same verified email address."><AccountSecurityPanel email={user.email} googleLinked={Boolean(linked.rows[0]?.google_sub)}/></NextPanel></div>;
}
