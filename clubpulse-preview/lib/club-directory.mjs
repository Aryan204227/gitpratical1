function normalise(value) {
  return String(value ?? '').trim().toLocaleLowerCase();
}

function completionPercent(club) {
  const total = Number(club.task_count) || 0;
  return total > 0 ? (Number(club.completed_count) || 0) / total : -1;
}

export function filterClubDirectory(clubs, filters = {}) {
  const query = normalise(filters.query);
  const category = normalise(filters.category);
  const status = normalise(filters.status || 'current');
  const sort = normalise(filters.sort || 'name');
  const pageSize = Math.min(30, Math.max(1, Number(filters.pageSize) || 9));
  const requestedPage = Math.max(1, Number.parseInt(String(filters.page || '1'), 10) || 1);

  let rows = [...clubs];
  if (query) {
    rows = rows.filter((club) =>
      [club.name, club.category, club.description, club.lead_name]
        .some((value) => normalise(value).includes(query)),
    );
  }
  if (category && category !== 'all') {
    rows = rows.filter((club) => normalise(club.category) === category);
  }
  if (status === 'current') {
    rows = rows.filter((club) => normalise(club.status) !== 'archived');
  } else if (status !== 'all') {
    rows = rows.filter((club) => normalise(club.status) === status);
  }

  const compareName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''));
  if (sort === 'members') {
    rows.sort((a, b) => (Number(b.member_count) || 0) - (Number(a.member_count) || 0) || compareName(a, b));
  } else if (sort === 'tasks') {
    rows.sort((a, b) => (Number(b.task_count) || 0) - (Number(a.task_count) || 0) || compareName(a, b));
  } else if (sort === 'completion') {
    rows.sort((a, b) => completionPercent(b) - completionPercent(a) || compareName(a, b));
  } else if (sort === 'name-desc') {
    rows.sort((a, b) => compareName(b, a));
  } else {
    rows.sort(compareName);
  }

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const start = (page - 1) * pageSize;
  return { items: rows.slice(start, start + pageSize), total, page, pageSize, pageCount };
}
