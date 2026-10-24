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
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
          password_hash TEXT, google_sub TEXT, role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','lead','member')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS sessions (
          id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_unique ON users(google_sub) WHERE google_sub IS NOT NULL;
        CREATE TABLE IF NOT EXISTS auth_rate_limits (bucket_key TEXT PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 0, window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
        CREATE INDEX IF NOT EXISTS auth_rate_limits_window_idx ON auth_rate_limits(window_started_at);
        CREATE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions(token_hash);
        CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
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
        CREATE TABLE IF NOT EXISTS mood_pulses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
          week_start DATE NOT NULL,
          mood SMALLINT NOT NULL CHECK(mood BETWEEN 1 AND 5),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(user_id,week_start)
        );
        CREATE INDEX IF NOT EXISTS mood_pulses_week_idx ON mood_pulses(week_start);
        CREATE TABLE IF NOT EXISTS contribution_events (
          id SERIAL PRIMARY KEY, task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
          club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL, member_name TEXT NOT NULL DEFAULT 'Unassigned',
          event_type TEXT NOT NULL, points INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS recruitment_applications_opening_email_unique ON recruitment_applications(opening_id,LOWER(email));
        CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);
        CREATE INDEX IF NOT EXISTS tasks_club_id_idx ON tasks(club_id);
        CREATE INDEX IF NOT EXISTS contributions_created_at_idx ON contribution_events(created_at);
        ALTER TABLE members ADD COLUMN IF NOT EXISTS on_break BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE members ADD COLUMN IF NOT EXISTS return_date DATE;
        ALTER TABLE members ADD COLUMN IF NOT EXISTS committed_hours NUMERIC(4,1) NOT NULL DEFAULT 4;
        ALTER TABLE members ADD COLUMN IF NOT EXISTS last_break_at TIMESTAMPTZ;
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS effort_weight INTEGER NOT NULL DEFAULT 3;
        ALTER TABLE contribution_events ALTER COLUMN points TYPE NUMERIC(8,2) USING points::numeric;
        CREATE TABLE IF NOT EXISTS clubpulse_migrations (
          id TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      // One-time migration: remove synthetic records inserted by older demo builds.
      // Real records are preserved unless they match the old seed's explicit identifiers.
      const migrationClient = await pool.connect();
      try {
        await migrationClient.query('BEGIN');
        await migrationClient.query('SELECT pg_advisory_xact_lock(20261024, 1)');
        const cleanupApplied = await migrationClient.query(
          'SELECT 1 FROM clubpulse_migrations WHERE id = $1',
          ['remove-synthetic-demo-seed-v1'],
        );
        if (!cleanupApplied.rowCount) {
          await migrationClient.query(`
            DELETE FROM recruitment_applications
            WHERE LOWER(email) LIKE '%@clubpulse.invalid';
          `);
          await migrationClient.query(`
            DELETE FROM contribution_events
            WHERE LOWER(member_name) IN (
              SELECT LOWER(name) FROM members WHERE LOWER(email) LIKE '%@clubpulse.invalid'
            )
            OR task_id IN (
              SELECT id FROM tasks
              WHERE title LIKE 'Demo task %'
                 OR (title='Workshop planning' AND owner='Priya Sharma')
                 OR (title='Website updates' AND owner='Rahul Kumar')
                 OR (title='Event report' AND owner='Neha Mehta')
            );
          `);
          await migrationClient.query(`
            DELETE FROM tasks
            WHERE title LIKE 'Demo task %'
               OR (title='Workshop planning' AND owner='Priya Sharma')
               OR (title='Website updates' AND owner='Rahul Kumar')
               OR (title='Event report' AND owner='Neha Mehta');
          `);
          await migrationClient.query(`
            DELETE FROM members WHERE LOWER(email) LIKE '%@clubpulse.invalid';
          `);
          await migrationClient.query(`
            DELETE FROM feedback_entries
            WHERE (topic='Event planning clarity' AND comment='More clarity on ownership would help.')
               OR (topic='Task distribution' AND comment='Task ownership felt balanced this month.');
          `);
          await migrationClient.query(`
            DELETE FROM recruitment_openings o
            USING clubs c
            WHERE c.id=o.club_id
              AND ((c.name='Tech Society' AND o.title='Frontend volunteer')
                OR (c.name='Design Collective' AND o.title='Visual designer')
                OR (c.name='Cultural Circle' AND o.title='Event coordinator'))
              AND NOT EXISTS (
                SELECT 1 FROM recruitment_applications a
                WHERE a.opening_id=o.id
              );
          `);
          await migrationClient.query(`
            DELETE FROM clubs c
            WHERE c.name IN (
              'Tech Society','Design Collective','Robotics Club',
              'Cultural Circle','Data Science Guild','Entrepreneurship Cell'
            )
            AND NOT EXISTS (SELECT 1 FROM members m WHERE m.club_id=c.id)
            AND NOT EXISTS (SELECT 1 FROM tasks t WHERE t.club_id=c.id)
            AND NOT EXISTS (SELECT 1 FROM recruitment_openings o WHERE o.club_id=c.id)
            AND NOT EXISTS (SELECT 1 FROM feedback_entries f WHERE f.club_id=c.id)
            AND NOT EXISTS (SELECT 1 FROM contribution_events e WHERE e.club_id=c.id);
          `);
          await migrationClient.query(
            'INSERT INTO clubpulse_migrations(id) VALUES ($1) ON CONFLICT (id) DO NOTHING',
            ['remove-synthetic-demo-seed-v1'],
          );
        }
        await migrationClient.query('COMMIT');
      } catch (error) {
        await migrationClient.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        migrationClient.release();
      }
    })().catch((error) => { globalThis.clubPulseReady = undefined; throw error; });
  }
  await globalThis.clubPulseReady;
}
