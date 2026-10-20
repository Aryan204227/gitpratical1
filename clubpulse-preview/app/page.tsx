'use client';
import { useEffect, useState } from 'react';
export default function HomePage() {
  const [health, setHealth] = useState<'checking'|'online'|'offline'>('checking');
  useEffect(() => { fetch('/api/health', {cache:'no-store'}).then(async r => { const d = await r.json(); setHealth(r.ok && d.database === 'connected' ? 'online' : 'offline'); }).catch(() => setHealth('offline')); }, []);
  return <main className="frame-shell"><div className={`connection-pill ${health}`}><span />{health === 'checking' ? 'Checking backend…' : health === 'online' ? 'API + database connected' : 'Backend needs database configuration'}</div><iframe src="/preview.html" title="ClubPulse interactive workspace" className="preview-frame" /></main>;
}
