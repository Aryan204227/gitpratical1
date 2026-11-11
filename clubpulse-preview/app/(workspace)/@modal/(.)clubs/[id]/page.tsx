import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckSquare, Users, X } from 'lucide-react';
import { getClubWithDetails } from '@/lib/read-model';
import { NextStatus } from '@/components/NextPrimitives';

export const dynamic = 'force-dynamic';

export default async function InterceptedClubModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clubId = Number(id);
  if (!Number.isInteger(clubId) || clubId < 1) notFound();

  const club = await getClubWithDetails(clubId);
  if (!club) notFound();

  const taskPct = club.task_count > 0 ? Math.round((club.completed_count / club.task_count) * 100) : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(6, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          width: 'min(520px, 100%)',
          background: 'var(--cp-panel, #121829)',
          border: '1px solid rgba(198, 255, 61, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--cp-lime, #c6ff3d)', fontWeight: 700, letterSpacing: '1px' }}>
              INTERCEPTED PREVIEW · {club.category.toUpperCase()}
            </span>
            <h2 style={{ margin: '0.25rem 0', fontSize: '1.4rem', color: '#e4f8ff' }}>{club.name}</h2>
          </div>
          <Link
            href="/clubs"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '0.4rem',
              color: '#8fa3bf',
              display: 'grid',
              placeItems: 'center',
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(21, 44, 59, 0.4)', padding: '0.75rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#8fa3bf', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Users size={13} /> Active Members
            </span>
            <strong style={{ fontSize: '1.2rem', color: '#e4f8ff' }}>{club.member_count}</strong>
          </div>
          <div style={{ background: 'rgba(21, 44, 59, 0.4)', padding: '0.75rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#8fa3bf', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CheckSquare size={13} /> Completion Rate
            </span>
            <strong style={{ fontSize: '1.2rem', color: '#e4f8ff' }}>{taskPct === null ? '—' : `${taskPct}%`}</strong>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.8rem', color: '#8fa3bf', fontWeight: 600 }}>Status</span>
          <div style={{ marginTop: '0.3rem' }}>
            <NextStatus status={club.status} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Link href="/clubs" className="next-secondary-btn" style={{ fontSize: '0.85rem' }}>
            Dismiss
          </Link>
          <Link href={`/clubs/${club.id}`} className="next-primary-btn" style={{ fontSize: '0.85rem' }}>
            Full Club Profile <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
