import { redirect } from 'next/navigation';
import { BriefcaseBusiness, CheckCircle2, Users } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getApplicationsForUser, getClubs, getOpeningsForUser } from '@/lib/read-model';
import { canManageClub } from '@/lib/club-access';
import { NextPageHeading, NextPanel, NextStatus, NextEmpty, NextNotice } from '@/components/NextPrimitives';
import { OpeningServerForm } from '@/components/OpeningServerForm';
import { ApplicationSubmitForm } from '@/components/ApplicationSubmitForm';
import { ApplicationStatusForm } from '@/components/ApplicationStatusForm';

export const dynamic = 'force-dynamic';

export default async function RecruitmentPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const isAdmin = user.role === 'admin' || user.role === 'superadmin';
  const canManageRecruitment = isAdmin || user.role === 'lead';
  const [openings, allClubs, applications, params] = await Promise.all([
    getOpeningsForUser(user),
    getClubs(),
    canManageRecruitment ? getApplicationsForUser(user) : Promise.resolve([]),
    searchParams,
  ]);

  const manageableClubs = isAdmin
    ? allClubs.filter((club: any) => club.status !== 'Archived')
    : user.role === 'lead'
      ? (await Promise.all(allClubs.map(async (club: any) =>
          await canManageClub(user, Number(club.id)) && club.status !== 'Archived' ? club : null
        ))).filter(Boolean) as Array<{ id: number; name: string; status: string }>
      : [];

  return (
    <div className="next-page-stack">
      <NextPageHeading
        eyebrow="RECRUITMENT"
        title={<>Find the right <em>people.</em></>}
        description={canManageRecruitment
          ? 'Publish roles for your club, review applications and accept students into the team.'
          : 'Browse open club roles and send an application using your signed-in account.'}
        action={<span className="next-count-pill">{openings.length} open role records</span>}
      />

      {params.created && <NextNotice tone="success">The role opening was saved to the database.</NextNotice>}
      {params.updated && <NextNotice tone="success">The application stage was saved. Accepted students are added to the club roster.</NextNotice>}
      {params.error === 'forbidden' && <NextNotice tone="error">You can only manage recruitment for clubs assigned to you.</NextNotice>}
      {params.error === 'already-member' && <NextNotice tone="error">This student is already listed in another club. The existing membership was kept unchanged.</NextNotice>}
      {params.error && !['forbidden', 'already-member'].includes(params.error) && <NextNotice tone="error">The recruitment action could not be completed. Check the details and try again.</NextNotice>}

      <div className="next-workflow-rail">
        <div><span>01</span><strong>Publish</strong><small>Create an opening</small></div>
        <i>→</i>
        <div><span>02</span><strong>Apply</strong><small>Students send interest</small></div>
        <i>→</i>
        <div><span>03</span><strong>Review</strong><small>Lead decides</small></div>
        <i>→</i>
        <div><span>04</span><strong>Join</strong><small>Roster is updated</small></div>
      </div>

      {canManageRecruitment && (
        <NextPanel title="Publish a role" description="Choose one of the clubs you manage and add a clear role title.">
          {manageableClubs.length
            ? <OpeningServerForm clubs={manageableClubs.map((club: any) => ({ id: Number(club.id), name: String(club.name) }))} />
            : <NextEmpty title="No club available to manage" description="Create a club or ask an administrator to assign you as its lead before publishing a role." />}
        </NextPanel>
      )}

      <NextPanel
        title={canManageRecruitment ? 'Published openings' : 'Open roles'}
        description={canManageRecruitment ? 'These openings belong to the clubs you can manage.' : 'Choose a role and explain why you would like to join.'}
      >
        {openings.length === 0 ? (
          <NextEmpty
            title="No open roles right now"
            description={canManageRecruitment ? 'Publish a role above when your club needs help.' : 'Check again later or contact a club lead.'}
          />
        ) : (
          <div className="next-role-grid">
            {openings.map((opening: any) => (
              <article className="next-role-card" key={opening.id}>
                <div className="next-role-head">
                  <span className="next-role-icon"><BriefcaseBusiness size={18}/></span>
                  <NextStatus status={opening.status}/>
                </div>
                <h3>{opening.title}</h3>
                <p>{opening.club || 'Club'}</p>
                <div className="next-role-foot">
                  {canManageRecruitment && <span><Users size={14}/>{opening.applicant_count} applicants</span>}
                  <small>Created {new Date(opening.created_at).toLocaleDateString()}</small>
                </div>
                {!canManageRecruitment && ['Open', 'Review'].includes(opening.status) && (
                  <ApplicationSubmitForm openingId={Number(opening.id)}/>
                )}
                {!canManageRecruitment && !['Open', 'Review'].includes(opening.status) && (
                  <p className="next-subtle next-opening-closed">Applications are closed for this role.</p>
                )}
              </article>
            ))}
          </div>
        )}
      </NextPanel>

      {canManageRecruitment && (
        <NextPanel title="Applications to review" description="Accepting a student adds them to the selected club's member list.">
          {applications.length === 0 ? (
            <NextEmpty title="No applications yet" description="New applications will appear here."/>
          ) : (
            <div className="next-table-wrap">
              <table className="next-table">
                <thead><tr><th>Applicant</th><th>Role</th><th>Club</th><th>Status</th><th>Decision</th></tr></thead>
                <tbody>
                  {applications.map((application: any) => (
                    <tr key={application.id}>
                      <td>
                        <div className="next-member-cell">
                          <span className="next-avatar">{String(application.applicant_name).slice(0, 1).toUpperCase()}</span>
                          <span><strong>{application.applicant_name}</strong><small>{application.email}</small></span>
                        </div>
                      </td>
                      <td>{application.opening}</td>
                      <td>{application.club}</td>
                      <td><NextStatus status={application.status}/></td>
                      <td>
                        {application.status === 'Accepted'
                          ? <span className="next-success-inline"><CheckCircle2 size={14}/>Added to team</span>
                          : application.status === 'Rejected'
                            ? <NextStatus status="Rejected"/>
                            : <ApplicationStatusForm id={application.id} status={application.status}/>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </NextPanel>
      )}

      <div className="next-notice info">
        <Users size={16}/>
        <span>Students apply with their own registered account. An accepted applicant is added to the club roster; the lead does not need to create a password for them.</span>
      </div>
    </div>
  );
}
