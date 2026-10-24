import { getCurrentUser } from '@/lib/auth';
import { getFeedback } from '@/lib/read-model';
import { FeedbackServerForm } from '@/components/FeedbackServerForm';
import { MoodPulseForm } from '@/components/MoodPulseForm';
import { FeedbackStatusForm } from '@/components/FeedbackStatusForm';
import { NextPageHeading,NextPanel,NextStatus,NextEmpty,NextNotice } from '@/components/NextPrimitives';
export const dynamic='force-dynamic';
export default async function FeedbackPage({searchParams}:{searchParams:Promise<{submitted?:string;updated?:string;error?:string}>}){
 const [user,params]=await Promise.all([getCurrentUser(),searchParams]);const lead=['admin','lead'].includes(user?.role||'');const entries=lead?await getFeedback():[];
 return <div className="next-page-stack"><NextPageHeading eyebrow="MEMBER EXPERIENCE" title={<>Listen early. Improve <em>together.</em></>} description="Feedback should improve the club experience, not rank members or diagnose burnout."/>
 {params.submitted&&<NextNotice tone="success">Feedback submitted to the database. Thank you for helping improve the club.</NextNotice>}{params.updated&&<NextNotice tone="success">Feedback status updated.</NextNotice>}{params.error&&<NextNotice tone="error">The feedback action could not be completed.</NextNotice>}
 <div className="next-two-col"><NextPanel title="Share feedback" description="Anonymous by default. Avoid identifying details."><FeedbackServerForm/></NextPanel>
 {lead?<NextPanel title="Feedback inbox" description="Average ratings stay hidden until five or more rated responses exist.">{entries.length===0?<NextEmpty title="No feedback yet" description="Submitted feedback will appear in this private lead view."/>:<div className="next-feedback-list">{entries.map((f:any)=><article className="next-feedback-item" key={f.id}><div className="next-feedback-head"><strong>{f.topic}</strong><NextStatus status={f.status}/></div><p>{f.comment||'No written comment provided.'}</p><div className="next-feedback-meta"><span>{f.club}</span><span>{f.is_anonymous?'Anonymous':'Named'}</span><span>{f.rating?f.rating+'/5 rating':'No rating'}</span></div><FeedbackStatusForm id={f.id} status={f.status}/></article>)}</div>}</NextPanel>:<NextPanel title="Privacy and trust" description="Feedback access follows the account role."><div className="next-privacy-note"><strong>Confidential by role</strong><p>Members can submit feedback, but the full feedback inbox is only available to administrators and club leads. Small-group averages are hidden until five rated responses exist.</p><p>This public demo is designed for synthetic sample data. Do not enter private student information until you add deployment-specific security review and policies.</p></div></NextPanel>}
 </div>
 <NextPanel title="Weekly mood pulse" description="A private one-tap check-in. Your individual answer is never shown in the lead inbox; team averages require at least five responses."><MoodPulseForm/></NextPanel>
 </div>;
}
