import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getFeedbackClubs, getFeedbackForUser } from '@/lib/read-model';
import { FeedbackServerForm } from '@/components/FeedbackServerForm';
import { MoodPulseForm } from '@/components/MoodPulseForm';
import { FeedbackStatusForm } from '@/components/FeedbackStatusForm';
import { NextPageHeading, NextPanel, NextStatus, NextEmpty, NextNotice } from '@/components/NextPrimitives';

export const dynamic = 'force-dynamic';

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; updated?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const canReview = ['admin', 'superadmin', 'lead'].includes(user.role);
  const [clubs, entries, params] = await Promise.all([
    getFeedbackClubs(user),
    canReview ? getFeedbackForUser(user) : Promise.resolve([]),
    searchParams,
  ]);

  return (
    <div className="next-page-stack">
      <NextPageHeading
        eyebrow="FEEDBACK"
        title={<>Help your club <em>improve.</em></>}
        description="Share a useful suggestion or rating. Members can submit feedback; leads can review feedback for the clubs they manage."
      />

      {params.submitted && <NextNotice tone="success">Feedback saved. Thank you for helping improve your club.</NextNotice>}
      {params.updated && <NextNotice tone="success">Feedback status updated.</NextNotice>}
      {params.error && <NextNotice tone="error">Feedback could not be saved. Check the details and try again.</NextNotice>}

      <div className="next-two-col">
        <NextPanel title="Share feedback" description="Anonymous by default. Do not include private or identifying details.">
          <FeedbackServerForm clubs={clubs.map((club: any) => ({ id: Number(club.id), name: String(club.name) }))}/>
        </NextPanel>

        {canReview ? (
          <NextPanel title="Feedback to review" description="Only feedback for your clubs is shown to a lead. Small-group averages remain hidden until five ratings exist.">
            {entries.length === 0 ? (
              <NextEmpty title="No feedback yet" description="New feedback from club members will appear here."/>
            ) : (
              <div className="next-feedback-list">
                {entries.map((entry: any) => (
                  <article className="next-feedback-item" key={entry.id}>
                    <div className="next-feedback-head">
                      <strong>{entry.topic}</strong>
                      <NextStatus status={entry.status}/>
                    </div>
                    <p>{entry.comment || 'No written comment provided.'}</p>
                    <div className="next-feedback-meta">
                      <span>{entry.club}</span>
                      <span>{entry.is_anonymous ? 'Anonymous' : 'Named'}</span>
                      <span>{entry.rating ? entry.rating + '/5 rating' : 'No rating'}</span>
                    </div>
                    <FeedbackStatusForm id={entry.id} status={entry.status}/>
                  </article>
                ))}
              </div>
            )}
          </NextPanel>
        ) : (
          <NextPanel title="Your privacy" description="Your personal weekly mood response is not shown to club leads.">
            <div className="next-privacy-note">
              <strong>Share safely</strong>
              <p>Feedback helps improve activities and coordination. You can submit it anonymously. Group rating averages are hidden until at least five ratings exist.</p>
            </div>
          </NextPanel>
        )}
      </div>

      <NextPanel title="Weekly check-in" description="Choose a mood score from 1 to 5. Your individual response stays private; a group average is shown only when at least five responses exist.">
        <MoodPulseForm/>
      </NextPanel>
    </div>
  );
}
