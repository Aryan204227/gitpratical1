'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, CheckCircle2, Send } from 'lucide-react';

export function ApplicationSubmitForm({ openingId }: { openingId: number }) {
  const router = useRouter();
  const [statement, setStatement] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'success' | 'error' | ''>('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setTone('');
    try {
      const response = await fetch('/api/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ kind: 'application', openingId, statement: statement.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Could not submit your application.');
      setDone(true);
      setTone('success');
      setMessage('Application submitted. A club lead can review it in the recruitment queue.');
      setStatement('');
      router.refresh();
    } catch (error) {
      setTone('error');
      setMessage(error instanceof Error ? error.message : 'Could not submit your application.');
    } finally {
      setBusy(false);
    }
  }

  if (done) return <div className="next-application-success" role="status"><CheckCircle2 size={15}/><span><strong>Application submitted</strong><small>The club lead can now review your application.</small></span></div>;

  return <form className="next-apply-form" onSubmit={submit}>
    <label htmlFor={`application-statement-${openingId}`}>Why are you interested? <span>Optional · max 1,500 characters</span></label>
    <textarea id={`application-statement-${openingId}`} value={statement} onChange={event => setStatement(event.target.value)} maxLength={1500} rows={2} placeholder="Share the skills or contribution you want to bring…"/>
    {message&&<p className={`next-apply-message ${tone==='error'?'is-error':'is-success'}`} role="alert">{message}</p>}
    <button type="submit" className="next-apply-btn" disabled={busy}>{busy?'Submitting…':'Apply to this role'} <ArrowRight size={14}/></button>
  </form>;
}
