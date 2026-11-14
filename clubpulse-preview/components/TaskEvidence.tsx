'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ImagePlus, LoaderCircle, Upload, Images } from 'lucide-react';

type EvidenceItem = { id: number; file_name: string; mime_type: string; created_at: string; uploaded_by: number | null };

export function TaskEvidence({ taskId }: { taskId: number }) {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/evidence`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load evidence.');
      setItems(Array.isArray(data.evidence) ? data.evidence : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load evidence.');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    const formElement = event.currentTarget;
    event.preventDefault();
    if (!file) {
      setMessage('Choose a photo first.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const body = new FormData();
      body.append('image', file);
      const response = await fetch(`/api/tasks/${taskId}/evidence`, { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed.');
      setFile(null);
      formElement.reset();
      setMessage('Photo saved to this task.');
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="task-evidence">
      <div className="task-evidence-heading">
        <div><Images size={17}/><strong>Work photos</strong><span>{items.length} saved</span></div>
        <small>Upload a real photo showing progress or the finished work. JPG, PNG or WebP · up to 2 MB.</small>
      </div>
      <form className="task-evidence-upload" onSubmit={submit}>
        <label className="task-evidence-picker">
          <ImagePlus size={17}/>
          <span>{file ? file.name : 'Choose a work photo'}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setFile(event.target.files?.[0] || null)} />
        </label>
        <button className="next-primary-btn" type="submit" disabled={!file || saving}>
          {saving ? <><LoaderCircle size={15}/> Saving…</> : <><Upload size={15}/> Upload photo</>}
        </button>
      </form>
      {message && <p className="task-evidence-message" role="status">{message}</p>}
      {loading ? <p className="next-subtle">Loading photos…</p> : items.length === 0 ? (
        <div className="task-evidence-empty">No work photos yet. Add a real photo when there is progress to show.</div>
      ) : (
        <div className="task-evidence-grid">
          {items.map(item => (
            <figure key={item.id}>
              <a href={`/api/tasks/${taskId}/evidence/${item.id}`} target="_blank" rel="noreferrer">
                <img src={`/api/tasks/${taskId}/evidence/${item.id}`} alt={item.file_name || 'Task work evidence'} loading="lazy"/>
              </a>
              <figcaption>{new Date(item.created_at).toLocaleString()}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
