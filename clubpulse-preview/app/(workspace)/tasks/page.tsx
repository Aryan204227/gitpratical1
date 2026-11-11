import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Clock3 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getClubs, getTasks } from '@/lib/read-model';
import { TaskServerForm } from '@/components/TaskServerForm';
import { TaskBoard } from '@/components/TaskBoard';
import { TaskCsvImport } from '@/components/TaskCsvImport';
import { NextPageHeading,NextPanel,NextEmpty,NextNotice } from '@/components/NextPrimitives';
export const dynamic='force-dynamic';
export default async function TasksPage({searchParams}:{searchParams:Promise<{created?:string;updated?:string;imported?:string;error?:string}>}){
 const [user,tasks,clubs,params]=await Promise.all([getCurrentUser(),getTasks(),getClubs(),searchParams]);if(!user)redirect('/login');const lead=['admin','lead'].includes(user.role);
 return <div className="next-page-stack"><NextPageHeading eyebrow="TASK & CONTRIBUTION SERVICE" title={<>Make work <em>visible.</em></>} description="Tasks carry ownership, deadlines and status changes. Each assignment and completion is recorded as a contribution event." action={<span className="next-count-pill">{tasks.length} tasks stored</span>}/>
 {params.created&&<NextNotice tone="success">Task saved and a task-assigned contribution event was recorded.</NextNotice>}{params.imported&&<NextNotice tone="success">Imported {params.imported} CSV tasks. Refresh the table to see all rows.</NextNotice>}{params.updated&&<NextNotice tone="success">Task status updated; the completion event was recorded when applicable.</NextNotice>}{params.error&&<NextNotice tone="error">Task action failed validation or permission checks ({params.error}).</NextNotice>}
 <div className="next-two-col"><NextPanel title={lead?'Create a task':'Task creation is lead-managed'} description={lead?'This Server Action validates the submitted form on the server and writes to PostgreSQL.':'Review assignments and update tasks assigned to your account. A club lead creates or reassigns work.'}>{lead?<TaskServerForm clubs={clubs}/>:<div className="next-empty"><Clock3 size={20}/>Task assignment requires a club lead or administrator.</div>}</NextPanel><NextPanel title="Workflow trace" description="Recruitment → assignments → events → analytics"><div className="next-process-list"><div><span>01</span><p><b>Assign</b><small>Every saved task generates task_assigned.</small></p></div><div><span>02</span><p><b>Complete</b><small>The owner or lead updates progress; a first move to Completed records one event.</small></p></div><div><span>03</span><p><b>Reflect</b><small>Group trends update from stored events, not invented activity.</small></p></div></div></NextPanel></div>
 {lead&&<NextPanel title="Bulk task import" description="CSV file uploads are validated on the server and saved in one database transaction."><TaskCsvImport/></NextPanel>}
 <NextPanel title="Task command board" description="Move real tasks between workflow stages. Status updates are persisted by the API; the server records completion events once per transition."><TaskBoard initialTasks={tasks} userName={user.name} canManageAll={lead}/></NextPanel></div>;
}
