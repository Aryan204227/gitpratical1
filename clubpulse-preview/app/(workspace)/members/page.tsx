import { redirect } from 'next/navigation';
import { Workflow, UserCheck, UserPlus } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getClubs, getMembers } from '@/lib/read-model';
import { canManageClub } from '@/lib/club-access';
import { AddMemberForm } from '@/components/AddMemberForm';
import { NextPageHeading, NextPanel, NextStatus, NextEmpty } from '@/components/NextPrimitives';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const user = await getCurrentUser();
  if (!user || !['admin', 'superadmin', 'lead'].includes(user.role)) {
    redirect('/dashboard?error=forbidden');
  }

  const [members, allClubs] = await Promise.all([getMembers(user), getClubs()]);
  const clubs = user.role === 'admin' || user.role === 'superadmin'
    ? allClubs.filter((club: any) => club.status !== 'Archived')
    : (await Promise.all(allClubs.map(async (club: any) => (
        await canManageClub(user, Number(club.id)) && club.status !== 'Archived' ? club : null
      )))).filter(Boolean) as Array<{ id: number; name: string; status: string }>;

  return (
    <div className="next-page-stack">
      <NextPageHeading
        eyebrow="TEAM & STUDENTS"
        title={<>Manage your <em>members.</em></>}
        description="Add students to a club, check whether they have created an account, and see their recorded contribution history."
        action={<span className="next-count-pill">{members.length} students</span>}
      />

      <NextPanel title="Add a student" description="Use the student's name, college email and the club they are joining. Their login is created separately by the student.">
        <AddMemberForm clubs={clubs.map((club: any) => ({ id: Number(club.id), name: String(club.name) }))} />
      </NextPanel>

      <NextPanel title="Student list" description="This list is saved in PostgreSQL. A sign-up using the same email automatically connects to the student's club record.">
        {members.length === 0 ? (
          <NextEmpty
            title="No students added yet"
            description="Add your first student above, or publish a club opening and onboard an accepted applicant from Recruitment."
          />
        ) : (
          <div className="next-table-wrap">
            <table className="next-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Club</th>
                  <th>Role</th>
                  <th>Account</th>
                  <th>Contributions</th>
                  <th>Membership</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member: any) => (
                  <tr key={member.id}>
                    <td>
                      <div className="next-member-cell">
                        <span className="next-avatar">{String(member.name).slice(0, 1).toUpperCase()}</span>
                        <span><strong>{member.name}</strong><small>{member.email}</small></span>
                      </div>
                    </td>
                    <td>{member.club}</td>
                    <td><NextStatus status={member.role} /></td>
                    <td>
                      {member.has_account
                        ? <span className="next-success-inline"><UserCheck size={13} /> Registered</span>
                        : <span className="next-subtle">Needs sign-up</span>}
                    </td>
                    <td><span className="next-number-cell"><Workflow size={13} />{member.contribution_count}</span></td>
                    <td><NextStatus status={member.active ? 'Active' : 'Inactive'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NextPanel>

      <div className="next-privacy-note">
        <strong><UserPlus size={14} /> Simple student onboarding</strong>
        <p>Adding a student saves their club membership. It does not create a password or send an email. The student must register at <a href="/register">/register</a> with the same email address. After sign-in, their club membership and tasks assigned to their roster name will appear in their workspace.</p>
      </div>
    </div>
  );
}
