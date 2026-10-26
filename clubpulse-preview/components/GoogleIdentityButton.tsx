'use client';
import Script from 'next/script';
import {useCallback,useRef,useState} from 'react';
type GoogleCredential={credential:string};
type GoogleUser={id:number;name:string;email:string;role:'admin'|'lead'|'member'};
type Mode='login'|'register'|'link';
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredential) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number | boolean>
          ) => void;
        };
      };
    };
  }
}

export function GoogleIdentityButton({mode,clientId:providedClientId,onSuccess,onError}:{mode:Mode;clientId?:string;onSuccess?:(data:{user?:GoogleUser;linked?:boolean;message?:string})=>void;onError?:(message:string)=>void}){
 const host=useRef<HTMLDivElement>(null);const [busy,setBusy]=useState(false);const [localError,setLocalError]=useState('');
 const clientId=providedClientId||process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID||'';
 const handleCredential=useCallback(async(response:GoogleCredential)=>{
  if(!response.credential)return;setBusy(true);setLocalError('');onError?.('');
  try{const endpoint=mode==='link'?'/api/auth/google/link':'/api/auth/google';const result=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({credential:response.credential})});const body=await result.json().catch(()=>({}));if(!result.ok)throw new Error(body.error||'Google sign-in failed.');onSuccess?.(body);}
  catch(error){const message=error instanceof Error?error.message:'Google sign-in failed. Try again.';setLocalError(message);onError?.(message);}finally{setBusy(false);}
 },[mode,onError,onSuccess]);
 const initialize=useCallback(()=>{if(!clientId||!host.current||!window.google?.accounts?.id)return;host.current.innerHTML='';window.google.accounts.id.initialize({client_id:clientId,callback:handleCredential,auto_select:false});window.google.accounts.id.renderButton(host.current,{type:'standard',theme:'outline',size:'large',shape:'rectangular',text:mode==='link'?'continue_with':mode==='login'?'signin_with':'signup_with',logo_alignment:'left',width:320});},[clientId,handleCredential,mode]);
 return <div className="cp-google-area">
 {clientId?<><Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={initialize}/><div ref={host} className="cp-google-host" aria-label="Continue with Google"/>{busy&&<small className="cp-google-status">Verifying Google account securely…</small>}</>:<div className="cp-google-disabled" role="status"><strong>Google sign-in not configured</strong><small>Add <code>GOOGLE_CLIENT_ID</code> and <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in Render Environment, then redeploy.</small></div>}
 {localError&&<p className="cp-google-error" role="alert">{localError}</p>}
 </div>;
}
