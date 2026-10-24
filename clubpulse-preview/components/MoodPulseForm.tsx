'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, HeartPulse, LoaderCircle, ShieldCheck } from 'lucide-react';

type PulseResult = {
  submitted?: boolean;
  mood?: number | null;
  teamPulse?: { available: boolean; average: number | null; label: string };
  error?: string;
};
const moods = [
  { value: 1, face: '😣', label: 'Rough', hint: 'I need some support' },
  { value: 2, face: '😕', label: 'Low', hint: 'A tough week' },
  { value: 3, face: '😐', label: 'Okay', hint: 'Managing for now' },
  { value: 4, face: '🙂', label: 'Good', hint: 'Doing alright' },
  { value: 5, face: '✨', label: 'Great', hint: 'Feeling supported' },
];

export function MoodPulseForm() {
  const [mood, setMood] = useState<number | null>(null);
  const [savedMood, setSavedMood] = useState<number | null>(null);
  const [teamPulse, setTeamPulse] = useState<PulseResult['teamPulse']>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/mood', { credentials: 'same-origin', signal: controller.signal, cache: 'no-store' });
        const data = await response.json().catch(() => ({})) as PulseResult;
        if (!response.ok) throw new Error(data.error || 'Could not load this week’s pulse.');
        setSavedMood(typeof data.mood === 'number' ? data.mood : null);
        setMood(typeof data.mood === 'number' ? data.mood : null);
        setTeamPulse(data.teamPulse);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Could not load this week’s pulse.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mood === null || saving) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/mood', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string; saved?: boolean; mood?: number; message?: string };
      if (!response.ok) throw new Error(data.error || 'Could not save your pulse.');
      setSavedMood(data.mood ?? mood);
      setSuccess(data.message || 'Weekly pulse saved.');
      const refresh = await fetch('/api/mood', { credentials: 'same-origin', cache: 'no-store' });
      if (refresh.ok) {
        const latest = await refresh.json() as PulseResult;
        setTeamPulse(latest.teamPulse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your pulse.');
    } finally {
      setSaving(false);
    }
  }

  return <section className="next-mood-pulse" aria-labelledby="mood-pulse-title">
    <header className="next-mood-head">
      <span className="next-mood-icon"><HeartPulse size={18} /></span>
      <div><span className="next-eyebrow">WEEKLY CHECK-IN</span><h3 id="mood-pulse-title">How has club life felt this week?</h3><p>One tap. No explanation required. Update your answer any time this week.</p></div>
    </header>
    {loading ? <div className="next-mood-loading" role="status"><LoaderCircle className="next-spin" size={16} /> Loading your pulse…</div> :
      <form onSubmit={submit}>
        <fieldset className="next-mood-options" disabled={saving}>
          <legend className="next-mood-legend">Choose the feeling that fits best</legend>
          {moods.map(item => <label className={'next-mood-choice' + (mood === item.value ? ' selected' : '')} key={item.value}>
            <input type="radio" name="weeklyMood" value={item.value} checked={mood === item.value} onChange={() => setMood(item.value)} />
            <span className="next-mood-face" aria-hidden="true">{item.face}</span>
            <strong>{item.label}</strong>
            <small>{item.hint}</small>
          </label>)}
        </fieldset>
        <div className="next-mood-footer">
          <p><ShieldCheck size={14} /> Your individual mood is private. Leads only see a group average after 5+ responses.</p>
          <button className="next-mood-submit" type="submit" disabled={saving || mood === null || loading}>
            {saving ? <><LoaderCircle size={14} className="next-spin" /> Saving…</> : <><CheckCircle2 size={14} /> {savedMood === null ? 'Save this week’s pulse' : 'Update my pulse'}</>}
          </button>
        </div>
      </form>
    }
    {teamPulse && <div className="next-team-pulse" aria-live="polite">
      {teamPulse.available && teamPulse.average !== null ? <><span className="next-team-pulse-value">{teamPulse.average}<small>/5</small></span><span><strong>Team pulse</strong><small>{teamPulse.label}</small></span></> : <><span className="next-team-pulse-lock"><ShieldCheck size={15} /></span><span><strong>Team pulse stays private for now</strong><small>{teamPulse.label}</small></span></>}
    </div>}
    {success && <p className="next-mood-message success" role="status"><CheckCircle2 size={14}/>{success}</p>}
    {error && <p className="next-mood-message error" role="alert">{error}</p>}
  </section>;
}
