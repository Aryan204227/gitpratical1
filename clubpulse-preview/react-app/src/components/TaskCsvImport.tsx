import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle,CheckCircle2,Download,FileUp,LoaderCircle } from 'lucide-react';
import { Panel,InlineAlert } from './Primitives';
import { errorMessage } from '../api/client';
export function TaskCsvImport(){
 const [file,setFile]=useState<File|null>(null);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [success,setSuccess]=useState(false);const client=useQueryClient();
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const formElement=event.currentTarget;if(!file){setMessage('Choose a CSV file first.');setSuccess(false);return;}
  const form=new FormData();form.set('file',file);setBusy(true);setMessage('');
  try{
   const response=await fetch('/api/import/tasks',{method:'POST',body:form,credentials:'same-origin'});const data=await response.json();
   if(!response.ok)throw new Error(data.error||'Import failed.');
   setSuccess(true);setMessage(data.message||('Imported '+data.imported+' tasks.'));setFile(null);
   const input=formElement.querySelector('input[type=file]') as HTMLInputElement|null;if(input)input.value='';
   await Promise.all([client.invalidateQueries({queryKey:['workspace','tasks']}),client.invalidateQueries({queryKey:['workspace','dashboard']})]);
  }catch(error){setSuccess(false);setMessage(errorMessage(error));}
  finally{setBusy(false);}
 }
 return <Panel title="Bulk task import (CSV)" subtitle="Up to 100 demo tasks per file · max 1 MB · transaction-based import"><form className="form-stack" onSubmit={submit}>
  <label>Choose a CSV file<input type="file" accept=".csv,text/csv" onChange={e=>setFile(e.target.files?.[0]??null)}/></label>
  <div className="inline-form"><span className="muted">{file?.name??'No file selected'}</span><a className="button" href="/task-import-template.csv" download><Download size={14}/>CSV template</a><button className="button primary" type="submit" disabled={busy||!file}>{busy?<LoaderCircle size={14} className="spin"/>:<FileUp size={14}/>} {busy?'Importing…':'Import tasks'}</button></div>
  {message&&<InlineAlert tone={success?'success':'error'}>{success?<CheckCircle2 size={14}/>:<AlertCircle size={14}/>} {message}</InlineAlert>}
 </form></Panel>;
}
