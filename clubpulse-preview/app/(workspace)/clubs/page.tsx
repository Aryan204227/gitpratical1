import Link from 'next/link';
import { ArrowRight, ClipboardList, Users, Search, X } from 'lucide-react';
import { getClubs } from '@/lib/read-model';
import { getCurrentUser } from '@/lib/auth';
import { ClubServerForm } from '@/components/ClubServerForm';
import { NextPageHeading, NextPanel, NextStatus, NextEmpty, NextNotice } from '@/components/NextPrimitives';
import { filterClubDirectory } from '@/lib/club-directory.mjs';

type PageSearch = Promise<{
  q?: string; category?: string; status?: string; sort?: string; page?: string;
  created?: string; archived?: string; error?: string;
}>;

function pageHref(values: { q: string; category: string; status: string; sort: string; page: number }) {
  const params = new URLSearchParams();
  if (values.q) params.set('q', values.q);
  if (values.category !== 'all') params.set('category', values.category);
  if (values.status !== 'current') params.set('status', values.status);
  if (values.sort !== 'name') params.set('sort', values.sort);
  params.set('page', String(values.page));
  return '/clubs?' + params.toString();
}

export const dynamic = 'force-dynamic';

export default async function ClubsPage({ searchParams }: { searchParams: PageSearch }) {
  const params = await searchParams;
  const [clubs, user] = await Promise.all([getClubs(), getCurrentUser()]);
  const canCreate = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'lead';
  const q = (params.q || '').trim().slice(0, 120);
  const category = params.category || 'all';
  const status = params.status || 'current';
  const sort = params.sort || 'name';
  const directory = filterClubDirectory(clubs, { query: q, category, status, sort, page: params.page || 1, pageSize: 9 });
  const categories = [...new Set(clubs.map((club: any) => String(club.category || 'General')))].sort((a, b) => a.localeCompare(b));

  return (
    <div className="next-page-stack">
      <NextPageHeading
        eyebrow="CLUB DIRECTORY"
        title={<>Find your <em>people.</em></>}
        description="Explore club profiles, active teams, open roles and workload. Search the directory or narrow it by category and status."
        action={<span className="next-count-pill">{directory.total} matching clubs</span>}
      />
      {params.created && <NextNotice tone="success">Club profile created and linked to this workspace.</NextNotice>}
      {params.archived && <NextNotice tone="success">Club archived. Its tasks, members and contribution history were preserved.</NextNotice>}
      {params.error === 'duplicate' && <NextNotice tone="error">A club with that name already exists.</NextNotice>}
      {params.error === 'invalid-club' && <NextNotice tone="error">Check the club name and profile fields, then try again.</NextNotice>}
      {params.error === 'invalid-profile' && <NextNotice tone="error">Some profile fields are invalid. Check the contact email and website URL.</NextNotice>}

      {canCreate && (
        <NextPanel title="Create a club profile" description="Add useful public information. A lead-created club is automatically linked to that lead's account.">
          <ClubServerForm />
        </NextPanel>
      )}

      <NextPanel title="Explore clubs" description={`${clubs.length} saved profiles · records are queried from PostgreSQL on each request.`}>
        <form method="get" action="/clubs" className="club-directory-filters">
          <label className="club-search-field"><span>Search clubs</span><div><Search size={16}/><input name="q" type="search" maxLength={120} placeholder="Search name, description or lead…" defaultValue={q}/></div></label>
          <label><span>Category</span><select name="category" defaultValue={category}><option value="all">All categories</option>{categories.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Status</span><select name="status" defaultValue={status}><option value="current">Current clubs</option><option value="all">All statuses</option><option value="active">Active</option><option value="recruiting">Recruiting</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select></label>
          <label><span>Sort by</span><select name="sort" defaultValue={sort}><option value="name">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="members">Most members</option><option value="tasks">Most tasks</option><option value="completion">Task completion</option></select></label>
          <div className="club-filter-actions"><button className="next-primary-btn" type="submit">Apply filters</button><Link href="/clubs" className="next-inline-link"><X size={14}/> Clear</Link></div>
        </form>

        {directory.total === 0 ? (
          <NextEmpty title="No clubs match these filters" description="Try another search term or clear one of the filters." />
        ) : (
          <>
            <div className="next-directory-grid">
              {directory.items.map((club: any) => {
                const percent = Number(club.task_count) > 0 ? Math.round(Number(club.completed_count) / Number(club.task_count) * 100) : null;
                return (
                  <Link href={'/clubs/' + club.id} key={club.id} className="next-directory-card cp-club-card">
                    <div className="cp-club-card-top">
                      <span className="cp-club-card-monogram" aria-hidden="true">{String(club.name || 'C').trim().slice(0, 2).toUpperCase()}</span>
                      <span className="cp-club-card-category">{club.category || 'General'}</span>
                    </div>
                    <div className="next-directory-head"><span className="next-club-mark big">{String(club.name || 'C').slice(0,1)}</span><NextStatus status={club.status}/></div>
                    <h3>{club.name}</h3>
                    <p>{club.category || 'General'}</p>
                    <div className="club-card-description">{club.description || 'A student community building projects, events and shared experiences.'}</div>
                    <div className="club-card-lead">Lead · {club.lead_name || 'Not assigned'}</div>
                    <div className="next-directory-stats">
                      <span><Users size={14}/>{club.member_count} members</span>
                      <span><ClipboardList size={14}/>{club.task_count} tasks</span>
                    </div>
                    <div className="next-progress"><i style={{width:(percent ?? 0)+'%'}}/></div>
                    <small>{percent === null ? 'No task data yet' : percent + '% tasks completed'}<span>{club.open_roles || 0} open roles</span><ArrowRight size={13}/></small>
                  </Link>
                );
              })}
            </div>
            <div className="club-directory-pagination">
              <span>Page {directory.page} of {directory.pageCount} · {directory.total} clubs</span>
              <div>
                {directory.page > 1 && <Link href={pageHref({q,category,status,sort,page:directory.page-1})}>Previous</Link>}
                {directory.page < directory.pageCount && <Link href={pageHref({q,category,status,sort,page:directory.page+1})}>Next <ArrowRight size={13}/></Link>}
              </div>
            </div>
          </>
        )}
      </NextPanel>
    </div>
  );
}
