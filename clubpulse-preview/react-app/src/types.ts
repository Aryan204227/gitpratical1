export type Role = 'admin' | 'lead' | 'member';
export type AppUser = { id: number; name: string; email: string; role: Role };
export type Club = { id:number; name:string; category:string; status:string; member_count:number; task_count:number; completed_count:number };
export type Task = { id:number; title:string; description?:string; owner:string; due_date:string|null; status:string; priority:string; club?:string; created_at?:string };
export type WorkspaceRow = { id:number; label:string; detail:string; activity:string; status:string; [key:string]:unknown };
export type DashboardData = { mode:string; storage:string; metrics:{clubs:number;activeMembers:number;tasksCompleted:number;totalTasks:number;openTasks:number;openApplications:number;feedbackCount:number;averageRating:number|null};clubs:Club[];trend:{week:string;tasks:number;completed:number}[];methodologicalNote:string };
