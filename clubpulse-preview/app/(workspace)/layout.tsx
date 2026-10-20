import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { NextAppShell } from '@/components/NextAppShell';
export default async function WorkspaceLayout({children,insights,modal}:{children:React.ReactNode;insights:React.ReactNode;modal:React.ReactNode}){
 const user=await getCurrentUser();
 if(!user)redirect('/login');
 return <NextAppShell user={user} insights={insights} modal={modal}>{children}</NextAppShell>;
}
