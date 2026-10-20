import type {ReactNode} from 'react';
import {X} from 'lucide-react';
export function Modal({title,description,onClose,children}:{title:string;description:string;onClose:()=>void;children:ReactNode}){
 return <div className="modal-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
  <section className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
   <header className="modal-heading"><div><h2>{title}</h2><p>{description}</p></div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18}/></button></header>
   {children}
  </section>
 </div>;
}
