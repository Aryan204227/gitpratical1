import { updateApplicationStatusAction } from '@/app/actions';
export function ApplicationStatusForm({id,status}:{id:number;status:string}){
 const next=status==='Applied'?'Reviewing':status==='Reviewing'?'Accepted':'';
 if(!next)return <span className={'next-status status-'+status.toLowerCase()}>{status}</span>;
 return <form action={updateApplicationStatusAction} className="next-row-form"><input type="hidden" name="applicationId" value={id}/><button className="next-small-btn" name="status" value={next} type="submit">{next==='Accepted'?'Accept & onboard':'Start review'}</button>{status!=='Accepted'&&<button className="next-small-btn danger" name="status" value="Rejected" type="submit">Reject</button>}</form>;
}
