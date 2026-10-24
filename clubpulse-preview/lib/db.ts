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
          password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','lead','member')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS sessions (
          id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
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
      `);
      await pool.query(`
        INSERT INTO clubs(name, category) VALUES
          ('Tech Society','Technology'), ('Design Collective','Design'), ('Robotics Club','Engineering'), ('Cultural Circle','Culture'), ('Data Science Guild','Technology'), ('Entrepreneurship Cell','Business')
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
      await pool.query(`
        WITH demo_names(n,name) AS (
          VALUES
          (1,'Aarav Sharma'),
          (2,'Ananya Patel'),
          (3,'Arjun Singh'),
          (4,'Aditi Verma'),
          (5,'Vihaan Gupta'),
          (6,'Diya Mehta'),
          (7,'Reyansh Kumar'),
          (8,'Isha Malhotra'),
          (9,'Advik Joshi'),
          (10,'Saanvi Rao'),
          (11,'Kabir Chawla'),
          (12,'Meera Nair'),
          (13,'Rohan Kapoor'),
          (14,'Kavya Singh'),
          (15,'Ishaan Shah'),
          (16,'Myra Das'),
          (17,'Dev Mishra'),
          (18,'Sara Khanna'),
          (19,'Dhruv Jain'),
          (20,'Naina Bhat'),
          (21,'Krish Arora'),
          (22,'Tara Menon'),
          (23,'Yash Sethi'),
          (24,'Kiara Iyer'),
          (25,'Atharv Kulkarni'),
          (26,'Riya Desai'),
          (27,'Vivaan Bose'),
          (28,'Anika Reddy'),
          (29,'Aditya Gill'),
          (30,'Pihu Saxena'),
          (31,'Shaurya Thakur'),
          (32,'Avni Ghosh'),
          (33,'Manav Sood'),
          (34,'Zara Fernandes'),
          (35,'Parth Agarwal'),
          (36,'Aisha Qureshi'),
          (37,'Rudra Sen'),
          (38,'Simran Kaur'),
          (39,'Neil Thomas'),
          (40,'Prisha Banerjee'),
          (41,'Samarth Rao'),
          (42,'Aanya Bansal'),
          (43,'Omkar Patil'),
          (44,'Kriti Sinha'),
          (45,'Aryan Bedi'),
          (46,'Tanvi Jha'),
          (47,'Lakshya Arora'),
          (48,'Sneha Pillai'),
          (49,'Viraj Deshmukh'),
          (50,'Nidhi Kapoor'),
          (51,'Harsh Vora'),
          (52,'Saloni Tripathi'),
          (53,'Kunal Kohli'),
          (54,'Ishita Roy'),
          (55,'Veer Malhotra'),
          (56,'Avika Jain'),
          (57,'Abeer Khurana'),
          (58,'Manya Arora'),
          (59,'Rehan Ansari'),
          (60,'Radhika Menon'),
          (61,'Yuvaan Khanna'),
          (62,'Ritika Sethi'),
          (63,'Keshav Dutta'),
          (64,'Shanaya Paul'),
          (65,'Siddharth Bose'),
          (66,'Leela Menon'),
          (67,'Pranav Tandon'),
          (68,'Jhanvi Mehta'),
          (69,'Aman Bhatia'),
          (70,'Pooja Nair')
        )
        INSERT INTO members(name,email,club_id,role,committed_hours,on_break,return_date,last_break_at,created_at)
        SELECT dn.name,
          'student' || LPAD(dn.n::text,3,'0') || '.demo@clubpulse.invalid',
          c.id,
          CASE WHEN dn.n IN (1,2,3,4,5,18,29,41) THEN 'Lead' ELSE 'Member' END,
          CASE WHEN dn.n % 7 = 0 THEN 6 ELSE 3 + (dn.n % 3) END,
          dn.n IN (69,70),
          CASE WHEN dn.n IN (69,70) THEN CURRENT_DATE + 14 ELSE NULL END,
          CASE WHEN dn.n BETWEEN 1 AND 4 THEN NOW() - INTERVAL '35 days'
               WHEN dn.n IN (69,70) THEN NOW() - INTERVAL '1 day'
               ELSE NOW() - ((dn.n % 14) + 2) * INTERVAL '1 day' END,
          NOW() - ((dn.n % 45) + 25) * INTERVAL '1 day'
        FROM demo_names dn
        JOIN LATERAL (
          SELECT id FROM clubs ORDER BY id LIMIT 1 OFFSET ((dn.n - 1) % 6)
        ) c ON TRUE
        ON CONFLICT(email) DO NOTHING;
      `);

      await pool.query(`
        WITH generated AS (
          SELECT g AS task_n,
            CASE WHEN g <= 90 THEN ((g - 1) % 70) + 1 ELSE g - 90 END AS member_n,
            CASE WHEN g <= 90 THEN NOW() - (90 - g) * INTERVAL '1 day'
                 ELSE NOW() - (105 - g) * INTERVAL '1 day' END AS created_at
          FROM generate_series(1,105) AS g
        ),
        task_seed AS (
          SELECT generated.task_n, generated.member_n, generated.created_at,
            m.name AS owner, m.club_id,
            CASE
              WHEN generated.member_n BETWEEN 61 AND 70 THEN
                CASE WHEN generated.task_n % 2 = 0 THEN 'To do' ELSE 'In progress' END
              WHEN generated.task_n % 4 IN (0,1) THEN 'Completed'
              WHEN generated.task_n % 4 = 2 THEN 'In progress'
              ELSE 'To do'
            END AS status,
            CASE WHEN generated.task_n % 5 = 0 THEN 'Urgent'
                 WHEN generated.task_n % 5 = 1 THEN 'High'
                 WHEN generated.task_n % 5 = 2 THEN 'Medium'
                 ELSE 'Low' END AS priority,
            1 + (generated.task_n % 5) AS effort_weight
          FROM generated
          JOIN members m ON m.email =
            'student' || LPAD(generated.member_n::text,3,'0') || '.demo@clubpulse.invalid'
        )
        INSERT INTO tasks(title,description,owner,due_date,status,priority,club_id,effort_weight,created_at,updated_at)
        SELECT 'Demo task ' || LPAD(task_n::text,3,'0'),
          'Synthetic coursework record. Use this task to explore fair ownership and contribution history.',
          owner,
          created_at::date + CASE WHEN task_n % 4 = 0 THEN 1 ELSE 3 END,
          status,priority,club_id,effort_weight,created_at,
          CASE WHEN status='Completed' THEN created_at + INTERVAL '2 days' ELSE created_at END
        FROM task_seed
        WHERE NOT EXISTS(SELECT 1 FROM tasks t WHERE t.title='Demo task ' || LPAD(task_seed.task_n::text,3,'0'));
      `);

      await pool.query(`
        INSERT INTO contribution_events(task_id,club_id,member_name,event_type,points,created_at)
        SELECT t.id,t.club_id,t.owner,'task_assigned',0,t.created_at
        FROM tasks t
        WHERE t.title LIKE 'Demo task %'
          AND NOT EXISTS(SELECT 1 FROM contribution_events e WHERE e.task_id=t.id AND e.event_type='task_assigned');
        INSERT INTO contribution_events(task_id,club_id,member_name,event_type,points,created_at)
        SELECT t.id,t.club_id,t.owner,'task_completed',
          ROUND(t.effort_weight * CASE WHEN t.due_date < (t.created_at + INTERVAL '2 days')::date THEN 0.6 ELSE 1 END,2),
          t.created_at + INTERVAL '2 days'
        FROM tasks t
        WHERE t.title LIKE 'Demo task %' AND t.status='Completed'
          AND NOT EXISTS(SELECT 1 FROM contribution_events e WHERE e.task_id=t.id AND e.event_type='task_completed');
      `);
    })().catch((error) => { globalThis.clubPulseReady = undefined; throw error; });
  }
  await globalThis.clubPulseReady;
}
