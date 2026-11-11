import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, Search } from 'lucide-react';

export function PageHeading({ eyebrow, title, description, actions }: { eyebrow: string; title: ReactNode; description: string; actions?: ReactNode }) {
  return (
    <div className="page-heading flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="overline tracking-widest uppercase">{eyebrow}</div>
        <h1 className="font-extrabold tracking-tight truncate">{title}</h1>
        <p className="max-w-2xl leading-relaxed">{description}</p>
      </div>
      {actions && <div className="heading-actions flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Button({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; className?: string }) {
  return (
    <button className={'button transition-colors duration-150 inline-flex items-center justify-center ' + className} {...props}>
      {children}
    </button>
  );
}

export function StatusPill({ status }: { status: string }) {
  const cls = status.toLowerCase().replaceAll(' ', '-');
  return <span className={'status-pill inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ' + cls}>{status}</span>;
}

export function LoadingState({ label = 'Loading workspace data…' }: { label?: string }) {
  return (
    <div className="state-panel flex items-center justify-center gap-3">
      <LoaderCircle size={24} className="spin animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-panel error-state flex items-center justify-center gap-2">
      <AlertCircle size={22} className="shrink-0" />
      <span>{message}</span>
      {onRetry && (
        <button className="button small transition-all duration-150" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="state-panel flex items-center justify-center gap-3">
      <CheckCircle2 size={22} className="shrink-0 text-emerald-400" />
      <div>
        <strong className="block font-semibold">{title}</strong>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search records…' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div className="search-field flex items-center gap-2">
      <Search size={16} className="shrink-0" />
      <input aria-label={placeholder} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="bg-transparent outline-none w-full" />
    </div>
  );
}

export function Panel({ title, subtitle, actions, children, className = '' }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={'panel ' + className}>
      <header className="panel-heading flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold truncate">{title}</h2>
          {subtitle && <p className="text-xs leading-normal">{subtitle}</p>}
        </div>
        {actions && <div className="panel-actions flex items-center gap-2 shrink-0">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

export function InlineAlert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'success' | 'info' }) {
  return (
    <div className={'alert rounded-md px-3 py-2 text-xs ' + tone} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
