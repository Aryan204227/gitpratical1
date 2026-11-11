import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { NextAppShell } from '@/components/NextAppShell';

const ALLOWED_ROLES = ['superadmin', 'admin', 'lead', 'member'] as const;

export default async function WorkspaceLayout({
  children,
  insights,
  modal,
}: {
  children: React.ReactNode;
  insights: React.ReactNode;
  modal: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || !ALLOWED_ROLES.includes(user.role as any)) redirect('/login');
  return (
    <NextAppShell user={user} insights={insights} modal={modal}>
      {children}
    </NextAppShell>
  );
}
