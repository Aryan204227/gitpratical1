import { useEffect,useState } from 'react';
import { api } from '../api/client';
type Health={database:'connected'|'disconnected';status:'ok'|'degraded';error?:string};
export function useApiHealth(){
 const [health,setHealth]=useState<Health|null>(null);
 const [checking,setChecking]=useState(true);
 useEffect(()=>{
  const controller=new AbortController();
  api.get('/api/health',{signal:controller.signal}).then(r=>setHealth(r.data)).catch((e:unknown)=>{
   if((e as {name?:string})?.name!=='CanceledError')setHealth({database:'disconnected',status:'degraded',error:'API unavailable'});
  }).finally(()=>{if(!controller.signal.aborted)setChecking(false);});
  return()=>controller.abort();
 },[]);
 return {health,checking};
}
