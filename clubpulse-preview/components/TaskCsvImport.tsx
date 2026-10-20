'use client';
import { useState } from 'react';
import { FileUp,Download,CheckCircle2,AlertCircle,LoaderCircle } from 'lucide-react';
export function TaskCsvImport(){
 const [file,setFile]=useState<File|null>(null);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [kind,setKind]=useState<'success'|'error'|null>(null);
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();const formElement=event.currentTarget;if(!file){setMessage('Choose a .csv file first.');setKind('error');return;}
  const body=new FormData();body.set('file',file);setBusy(true);setMessage('');setKind(null);
  try{
   const response=await fetch('/api/import/tasks',{method:'POST',body,credentials:'same-origin'});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||'Import failed.');
   setMessage('Imported '+result.imported+' tasks. Assignment contribution events were recorded.');setKind('success');setFile(null);
   const input=formElement.querySelector('input[type=file]') as HTMLInputElement|null;if(input)input.value='';
   window.location.href='/tasks?imported='+result.imported;
  }catch(error){setMessage(error instanceof Error?error.message:'Could not import this file.');setKind('error');}
  finally{setBusy(false);}
 }
 return <section className="next-csv-import"><div className="next-csv-copy"><span><FileUp size={18}/></span><div><strong>Bulk import tasks (CSV)</strong><p>Upload up to 100 synthetic demo tasks. Each imported task and assignment event is saved atomically.</p></div></div><form onSubmit={submit} className="next-csv-form"><label className="next-file-label">Choose CSV<input type="file" accept=".csv,text/csv" onChange={e=>setFile(e.target.files?.[0]??null)}/></label><span className="next-file-name">{file?.name??'No file selected'}</span><button type="submit" className="next-primary-btn" disabled={busy||!file}>{busy?<LoaderCircle size={14} className="next-spin"/>:<FileUp size={14}/>} {busy?'Importing…':'Import tasks'}</button><a className="next-secondary-btn" href="/task-import-template.csv" download><Download size={14}/> Template</a></form>{message&&<div className={'next-notice '+(kind==='success'?'success':'error')}>{kind==='success'?<CheckCircle2 size={15}/>:<AlertCircle size={15}/>}<span>{message}</span></div>}</section>;
}
