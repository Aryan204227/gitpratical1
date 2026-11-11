export type ClubDirectoryRow = {
  id: number | string;
  name: string;
  category?: string | null;
  status?: string | null;
  description?: string | null;
  lead_name?: string | null;
  member_count?: number | string | null;
  task_count?: number | string | null;
  completed_count?: number | string | null;
  [key: string]: unknown;
};
export type ClubDirectoryFilters = {
  query?: string;
  category?: string;
  status?: string;
  sort?: string;
  page?: number | string;
  pageSize?: number;
};
export declare function filterClubDirectory<T extends ClubDirectoryRow>(
  clubs: T[],
  filters?: ClubDirectoryFilters
): { items: T[]; total: number; page: number; pageSize: number; pageCount: number };
