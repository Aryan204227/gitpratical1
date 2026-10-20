import type { ReactNode } from 'react';
import { ArrowRight,AlertCircle,CheckCircle2,LoaderCircle } from 'lucide-react';
export function NextPageHeading({eyebrow,title,description,action}:{eyebrow:string;title:ReactNode;description:string;action?:ReactNode}){return <header className="next-page-heading"><div><span className="next-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action&&<div className="next-page-action">{action}</div>}</header>;}
export function NextPanel({title,description,children,action}:{title:string;description?:string;children:ReactNode;action?:ReactNode}){return <section className="next-panel"><header className="next-panel-head"><div><h2>{title}</h2>{description&&<p>{description}</p>}</div>{action}</header>{children}</section>;}
export function NextStatus({status}:{status:string}){return <span className={'next-status status-'+status.toLowerCase().replaceAll(' ','-')}>{status}</span>;}
export function NextEmpty({title,description}:{title:string;description:string}){return <div className="next-empty"><CheckCircle2 size={22}/><div><strong>{title}</strong><p>{description}</p></div></div>;}
export function NextNotice({children,tone='info'}:{children:ReactNode;tone?:'info'|'success'|'error'}){return <div className={'next-notice '+tone}>{tone==='success'?<CheckCircle2 size={16}/>:<AlertCircle size={16}/>}<span>{children}</span></div>;}
export function NextLoading(){return <div className="next-empty"><LoaderCircle className="next-spin" size={20}/>Loading records…</div>;}
export function NextTable({headers,children}:{headers:string[];children:ReactNode}){return <div className="next-table-wrap"><table className="next-table"><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;}
export function NextRowLink({href,children}:{href:string;children:ReactNode}){return <a className="next-inline-link" href={href}>{children}<ArrowRight size={14}/></a>;}
