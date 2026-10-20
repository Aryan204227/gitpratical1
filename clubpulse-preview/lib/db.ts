import { Pool } from 'pg';

declare global { var clubPulsePool: Pool | undefined; var clubPulseReady: Promise<void> | undefined; }

export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured. Copy the Internal Database URL from the clubpulse-db dashboard into the clubpulse-live service Environment settings.');
  if (!globalThis.clubPulsePool) {
    globalThis.clubPulsePool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
      ...(process.env.PGSSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
    });
  }
  return globalThis.clubPulsePool;
}

export async function ensureDatabase() {
  if (!globalThis.clubPulseReady) {
    globalThis.clubPulseReady = (async () => {
      const pool = getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clubs (
          id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, category TEXT NOT NULL DEFAULT 'General',
          status TEXT NOT NULL DEFAULT 'Active', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS members (
          id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
          club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL, role TEXT NOT NULL DEFAULT 'Member',
          active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
          owner TEXT NOT NULL DEFAULT 'Unassigned', due_date DATE, status TEXT NOT NULL DEFAULT 'To do',
          priority TEXT NOT NULL DEFAULT 'Medium', club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS recruitment_openings (
          id SERIAL PRIMARY KEY, title TEXT NOT NULL, club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
          applicant_count INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'Open',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS recruitment_applications (
          id SERIAL PRIMARY KEY, opening_id INTEGER NOT NULL REFERENCES recruitment_openings(id) ON DELETE CASCADE,
          applicant_name TEXT NOT NULL, email TEXT NOT NULL, statement TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'Applied', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS feedback_entries (
          id SERIAL PRIMARY KEY, club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
          topic TEXT NOT NULL, rating INTEGER CHECK (rating BETWEEN 1 AND 5), comment TEXT NOT NULL DEFAULT '',
          is_anonymous BOOLEAN NOT NULL DEFAULT TRUE, status TEXT NOT NULL DEFAULT 'Needs review',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS contribution_events (
          id SERIAL PRIMARY KEY, task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
          club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL, member_name TEXT NOT NULL DEFAULT 'Unassigned',
          event_type TEXT NOT NULL, points INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);
        CREATE INDEX IF NOT EXISTS tasks_club_id_idx ON tasks(club_id);
        CREATE INDEX IF NOT EXISTS contributions_created_at_idx ON contribution_events(created_at);
      `);
      await pool.query(`
        INSERT INTO clubs(name, category) VALUES
          ('Tech Society','Technology'), ('Design Collective','Design'), ('Robotics Club','Engineering'), ('Cultural Circle','Culture')
        ON CONFLICT(name) DO NOTHING;
        INSERT INTO members(name,email,club_id,role) SELECT 'Priya Sharma','priya.demo@clubpulse.invalid',id,'Lead' FROM clubs WHERE name='Tech Society' ON CONFLICT(email) DO NOTHING;
        INSERT INTO members(name,email,club_id,role) SELECT 'Rahul Kumar','rahul.demo@clubpulse.invalid',id,'Member' FROM clubs WHERE name='Design Collective' ON CONFLICT(email) DO NOTHING;
        INSERT INTO members(name,email,club_id,role) SELECT 'Neha Mehta','neha.demo@clubpulse.invalid',id,'Member' FROM clubs WHERE name='Cultural Circle' ON CONFLICT(email) DO NOTHING;
        INSERT INTO tasks(title,owner,due_date,status,priority,club_id)
          SELECT 'Workshop planning','Priya Sharma',CURRENT_DATE+2,'In progress','High',id FROM clubs WHERE name='Tech Society'
          AND NOT EXISTS(SELECT 1 FROM tasks WHERE title='Workshop planning');
        INSERT INTO tasks(title,owner,due_date,status,priority,club_id)
          SELECT 'Website updates','Rahul Kumar',CURRENT_DATE+3,'To do','Medium',id FROM clubs WHERE name='Design Collective'
          AND NOT EXISTS(SELECT 1 FROM tasks WHERE title='Website updates');
        INSERT INTO tasks(title,owner,due_date,status,priority,club_id)
          SELECT 'Event report','Neha Mehta',CURRENT_DATE-1,'Completed','Low',id FROM clubs WHERE name='Cultural Circle'
          AND NOT EXISTS(SELECT 1 FROM tasks WHERE title='Event report');
        INSERT INTO recruitment_openings(title,club_id,applicant_count,status)
          SELECT 'Frontend volunteer',id,6,'Review' FROM clubs WHERE name='Tech Society'
          AND NOT EXISTS(SELECT 1 FROM recruitment_openings WHERE title='Frontend volunteer');
        INSERT INTO recruitment_openings(title,club_id,applicant_count,status)
          SELECT 'Visual designer',id,4,'Open' FROM clubs WHERE name='Design Collective'
          AND NOT EXISTS(SELECT 1 FROM recruitment_openings WHERE title='Visual designer');
        INSERT INTO recruitment_openings(title,club_id,applicant_count,status)
          SELECT 'Event coordinator',id,8,'Open' FROM clubs WHERE name='Cultural Circle'
          AND NOT EXISTS(SELECT 1 FROM recruitment_openings WHERE title='Event coordinator');
        INSERT INTO recruitment_applications(opening_id,applicant_name,email,statement,status)
          SELECT o.id,'Aarav Singh','aarav.demo@clubpulse.invalid','Interested in contributing to the club website.','Applied' FROM recruitment_openings o WHERE o.title='Frontend volunteer'
          AND NOT EXISTS(SELECT 1 FROM recruitment_applications WHERE email='aarav.demo@clubpulse.invalid' AND opening_id=o.id);
        INSERT INTO recruitment_applications(opening_id,applicant_name,email,statement,status)
          SELECT o.id,'Meera Nair','meera.demo@clubpulse.invalid','I enjoy visual design and collaborative projects.','Reviewing' FROM recruitment_openings o WHERE o.title='Visual designer'
          AND NOT EXISTS(SELECT 1 FROM recruitment_applications WHERE email='meera.demo@clubpulse.invalid' AND opening_id=o.id);
        INSERT INTO feedback_entries(club_id,topic,rating,comment,is_anonymous,status)
          SELECT id,'Event planning clarity',4,'More clarity on ownership would help.',TRUE,'Needs review' FROM clubs WHERE name='Tech Society'
          AND NOT EXISTS(SELECT 1 FROM feedback_entries WHERE topic='Event planning clarity');
        INSERT INTO feedback_entries(club_id,topic,rating,comment,is_anonymous,status)
          SELECT id,'Task distribution',5,'Task ownership felt balanced this month.',TRUE,'Reviewed' FROM clubs WHERE name='Design Collective'
          AND NOT EXISTS(SELECT 1 FROM feedback_entries WHERE topic='Task distribution');
        INSERT INTO contribution_events(task_id,club_id,member_name,event_type,points)
          SELECT t.id,t.club_id,t.owner,'task_assigned',0 FROM tasks t
          WHERE NOT EXISTS(SELECT 1 FROM contribution_events e WHERE e.task_id=t.id AND e.event_type='task_assigned');
        INSERT INTO contribution_events(task_id,club_id,member_name,event_type,points)
          SELECT t.id,t.club_id,t.owner,'task_completed',1 FROM tasks t WHERE t.status='Completed'
          AND NOT EXISTS(SELECT 1 FROM contribution_events e WHERE e.task_id=t.id AND e.event_type='task_completed');
      `);
    })().catch((error) => { globalThis.clubPulseReady = undefined; throw error; });
  }
  await globalThis.clubPulseReady;
}
