import type { ReactNode,ButtonHTMLAttributes } from 'react';
import { AlertCircle,CheckCircle2,LoaderCircle,Search } from 'lucide-react';
export function PageHeading({eyebrow,title,description,actions}:{eyebrow:string;title:ReactNode;description:string;actions?:ReactNode}){
 return <div className="page-heading"><div><div className="overline">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{actions&&<div className="heading-actions">{actions}</div>}</div>;
}
export function Button({children,className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{children:ReactNode;className?:string}){
 return <button className={'button '+className} {...props}>{children}</button>;
}
export function StatusPill({status}:{status:string}){
 const cls=status.toLowerCase().replaceAll(' ','-');
 return <span className={'status-pill '+cls}>{status}</span>;
}
export function LoadingState({label='Loading workspace data…'}:{label?:string}){
 return <div className="state-panel"><LoaderCircle size={24} className="spin"/><span>{label}</span></div>;
}
export function ErrorState({message,onRetry}:{message:string;onRetry?:()=>void}){
 return <div className="state-panel error-state"><AlertCircle size={22}/><span>{message}</span>{onRetry&&<button className="button small" onClick={onRetry}>Try again</button>}</div>;
}
export function EmptyState({title,description}:{title:string;description:string}){
 return <div className="state-panel"><CheckCircle2 size={22}/><div><strong>{title}</strong><p>{description}</p></div></div>;
}
export function SearchInput({value,onChange,placeholder='Search records…'}:{value:string;onChange:(value:string)=>void;placeholder?:string}){
 return <div className="search-field"><Search size={16}/><input aria-label={placeholder} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>;
}
export function Panel({title,subtitle,actions,children,className=''}:{title:string;subtitle?:string;actions?:ReactNode;children:ReactNode;className?:string}){
 return <section className={'panel '+className}><header className="panel-heading"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{actions&&<div className="panel-actions">{actions}</div>}</header>{children}</section>;
}
export function InlineAlert({children,tone='error'}:{children:ReactNode;tone?:'error'|'success'|'info'}){
 return <div className={'alert '+tone} role={tone==='error'?'alert':'status'}>{children}</div>;
}
