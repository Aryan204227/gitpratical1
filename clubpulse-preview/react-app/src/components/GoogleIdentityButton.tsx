import {useCallback,useEffect,useRef,useState} from 'react';
type Credential={credential:string};type GoogleUser={id:number;name:string;email:string;role:'admin'|'lead'|'member'};
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: Credential) => void;
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

export function GoogleIdentityButton({mode,onSuccess,onError}:{mode:'login'|'register';onSuccess:(user:GoogleUser)=>void;onError:(message:string)=>void}){
 const host=useRef<HTMLDivElement>(null);const [busy,setBusy]=useState(false);const [localError,setLocalError]=useState('');const clientId=import.meta.env.VITE_GOOGLE_CLIENT_ID||'';
 const handleCredential=useCallback(async(response:Credential)=>{setBusy(true);setLocalError('');onError('');try{const result=await fetch('/api/auth/google',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({credential:response.credential})});const data=await result.json().catch(()=>({}));if(!result.ok)throw new Error(data.error||'Google sign-in failed.');onSuccess(data.user as GoogleUser);}catch(error){const message=error instanceof Error?error.message:'Google sign-in failed.';setLocalError(message);onError(message);}finally{setBusy(false);}},[onError,onSuccess]);
 const initialize=useCallback(()=>{if(!clientId||!host.current||!window.google?.accounts?.id)return;host.current.innerHTML='';window.google.accounts.id.initialize({client_id:clientId,callback:handleCredential,auto_select:false});window.google.accounts.id.renderButton(host.current,{type:'standard',theme:'outline',size:'large',shape:'rectangular',text:mode==='login'?'signin_with':'signup_with',logo_alignment:'left',width:320});},[clientId,handleCredential,mode]);
 useEffect(()=>{if(!clientId)return;const existing=document.querySelector<HTMLScriptElement>('script[data-clubpulse-google]');let script=existing;const onLoad=()=>initialize();if(window.google?.accounts?.id){initialize();return;}if(!script){script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.dataset.clubpulseGoogle='true';script.addEventListener('load',onLoad);document.head.appendChild(script);}else script.addEventListener('load',onLoad);return()=>script?.removeEventListener('load',onLoad);},[clientId,initialize]);
 return <div className="cp-google-area">{clientId?<><div ref={host} className="cp-google-host" aria-label="Continue with Google"/>{busy&&<small className="cp-google-status">Verifying Google account securely…</small>}</>:<div className="cp-google-disabled"><strong>Google sign-in not configured</strong><small>Set <code>VITE_GOOGLE_CLIENT_ID</code> in Render Environment and rebuild.</small></div>}{localError&&<p className="cp-google-error" role="alert">{localError}</p>}</div>;
}
