import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { NextAppShell } from '@/components/NextAppShell';
export default async function WorkspaceLayout({children}:{children:React.ReactNode}){
 const user=await getCurrentUser();
 if(!user)redirect('/login');
 return <NextAppShell user={user}>{children}</NextAppShell>;
}
