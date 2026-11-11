import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  try {
    const env = fs.readFileSync(envPath, 'utf8');
    const match = env.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) dbUrl = match[1];
  } catch (e) {
    console.error('Failed to read .env.local:', e);
  }
}

if (!dbUrl) {
  console.error('No DATABASE_URL found!');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  console.log('--- STARTING COMPREHENSIVE CLUBPULSE SEED ---');
  
  // 1. Ensure Clubs exist
  console.log('Seeding clubs...');
  const clubQueries = [
    { name: 'Tech Society', category: 'Technology', status: 'Active' },
    { name: 'Robotics & AI Club', category: 'Technical', status: 'Active' },
    { name: 'Media & Design Guild', category: 'Creative', status: 'Active' },
    { name: 'Cultural Affairs Council', category: 'Arts & Culture', status: 'Active' }
  ];

  const clubMap = {};
  for (const c of clubQueries) {
    const res = await pool.query(`
      INSERT INTO clubs (name, category, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, status = EXCLUDED.status
      RETURNING id, name;
    `, [c.name, c.category, c.status]);
    clubMap[res.rows[0].name] = res.rows[0].id;
  }
  console.log('Clubs seeded:', clubMap);

  const techClubId = clubMap['Tech Society'];
  const roboticsClubId = clubMap['Robotics & AI Club'];
  const mediaClubId = clubMap['Media & Design Guild'];
  const culturalClubId = clubMap['Cultural Affairs Council'];

  // 2. Ensure Members exist with realistic hours, roles, and status
  console.log('Seeding members...');
  const members = [
    { name: 'Aryan Dadwal', email: 'aryandadwal709@gmail.com', club_id: techClubId, role: 'President & Tech Lead', committed_hours: 10, active: true, on_break: false, days_ago_break: 14 },
    { name: 'Aryan Rajput', email: 'aryanrajput64a0@gmail.com', club_id: techClubId, role: 'Full-Stack Developer', committed_hours: 6, active: true, on_break: false, days_ago_break: 21 },
    { name: 'Rohit Sharma', email: 'rohit.sharma@lpu.in', club_id: techClubId, role: 'Frontend Engineer', committed_hours: 8, active: true, on_break: false, days_ago_break: 10 },
    { name: 'Priya Patel', email: 'priya.patel@lpu.in', club_id: techClubId, role: 'UI/UX Lead', committed_hours: 7, active: true, on_break: false, days_ago_break: 12 },
    { name: 'Aman Verma', email: 'aman.verma@lpu.in', club_id: techClubId, role: 'DevOps & Cloud Engineer', committed_hours: 5, active: true, on_break: false, days_ago_break: 30 },
    { name: 'Sneha Roy', email: 'sneha.roy@lpu.in', club_id: techClubId, role: 'Backend Specialist', committed_hours: 6, active: true, on_break: false, days_ago_break: 18 },
    { name: 'Tanvi Gupta', email: 'tanvi.gupta@lpu.in', club_id: techClubId, role: 'Content & PR Manager', committed_hours: 4, active: true, on_break: false, days_ago_break: 25 },
    { name: 'Kabir Mehta', email: 'kabir.mehta@lpu.in', club_id: techClubId, role: 'Junior Contributor', committed_hours: 4, active: true, on_break: false, days_ago_break: 45 },
    { name: 'Rahul Singh', email: 'rahul.singh@lpu.in', club_id: roboticsClubId, role: 'Robotics Lead', committed_hours: 8, active: true, on_break: false, days_ago_break: 15 },
    { name: 'Ananya Deshmukh', email: 'ananya.d@lpu.in', club_id: roboticsClubId, role: 'Hardware & IoT Engineer', committed_hours: 6, active: true, on_break: true, days_ago_break: 5 },
    { name: 'Simran Kaur', email: 'simran.kaur@lpu.in', club_id: mediaClubId, role: 'Creative Director', committed_hours: 6, active: true, on_break: false, days_ago_break: 14 },
    { name: 'Vicky Anand', email: 'vicky.anand@lpu.in', club_id: culturalClubId, role: 'Cultural Lead', committed_hours: 5, active: true, on_break: false, days_ago_break: 20 }
  ];

  for (const m of members) {
    await pool.query(`
      INSERT INTO members (name, email, club_id, role, active, committed_hours, on_break, last_break_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - ($8 || ' days')::INTERVAL)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        club_id = EXCLUDED.club_id,
        role = EXCLUDED.role,
        active = EXCLUDED.active,
        committed_hours = EXCLUDED.committed_hours,
        on_break = EXCLUDED.on_break,
        last_break_at = EXCLUDED.last_break_at;
    `, [m.name, m.email, m.club_id, m.role, m.active, m.committed_hours, m.on_break, m.days_ago_break]);
  }
  console.log(`Members seeded (${members.length} members).`);

  // 3. Ensure Tasks exist
  console.log('Seeding tasks...');
  const tasks = [
    {
      title: 'Migrate Next.js App Router to Route Handlers',
      description: 'Refactor old pages API routes into Next.js 16 App Router route handlers with proper TypeScript definitions and validation.',
      owner: 'Aryan Dadwal',
      due_days: -2,
      status: 'Completed',
      priority: 'High',
      club_id: techClubId
    },
    {
      title: 'Implement Google OAuth 2.0 & Session Security',
      description: 'Add secure token hashing, anti-CSRF request origin validation, and graceful local development fallback.',
      owner: 'Aryan Dadwal',
      due_days: 3,
      status: 'In progress',
      priority: 'Urgent',
      club_id: techClubId
    },
    {
      title: 'Redesign FairWork Capacity & Burnout Radar',
      description: 'Compute Gini coefficients, load distribution, and alert leads about overloaded members using real database signals.',
      owner: 'Aryan Dadwal',
      due_days: 5,
      status: 'In progress',
      priority: 'High',
      club_id: techClubId
    },
    {
      title: 'Weekly Sprint Review & Hackathon Planning Deck',
      description: 'Prepare sprint presentation slides for the upcoming university hackathon kickoff.',
      owner: 'Aryan Dadwal',
      due_days: 2,
      status: 'To do',
      priority: 'Medium',
      club_id: techClubId
    },
    {
      title: 'Design Dark Mode Glassmorphism Component Library',
      description: 'Build reusable UI components with dark ink-navy background and neon lime highlights following the ClubPulse design system.',
      owner: 'Priya Patel',
      due_days: -5,
      status: 'Completed',
      priority: 'Medium',
      club_id: techClubId
    },
    {
      title: 'Figma to React Component Hierarchy Conversion',
      description: 'Convert mobile recruitment modal and task card wireframes to clean React 19 functional components.',
      owner: 'Priya Patel',
      due_days: 2,
      status: 'In progress',
      priority: 'High',
      club_id: techClubId
    },
    {
      title: 'Set up PostgreSQL Connection Pooling & Healthchecks',
      description: 'Configure pg.Pool connection parameters with max 5 connections and SSL mode for Neon serverless database.',
      owner: 'Aman Verma',
      due_days: -7,
      status: 'Completed',
      priority: 'High',
      club_id: techClubId
    },
    {
      title: 'Automate CI/CD Pipeline with GitHub Actions',
      description: 'Configure automated build checks, linting, and unit test execution on pull requests.',
      owner: 'Aman Verma',
      due_days: 6,
      status: 'To do',
      priority: 'Medium',
      club_id: techClubId
    },
    {
      title: 'Develop Redux Toolkit Store for Offline Cache',
      description: 'Implement slice reducers and selectors for member state and task filter persistence in the INT252 React SPA.',
      owner: 'Rohit Sharma',
      due_days: -4,
      status: 'Completed',
      priority: 'Medium',
      club_id: techClubId
    },
    {
      title: 'Implement React Profiler Performance Metric Watcher',
      description: 'Integrate React Profiler onRender callback with snapshot capture to measure component render timings accurately.',
      owner: 'Rohit Sharma',
      due_days: 4,
      status: 'In progress',
      priority: 'Medium',
      club_id: techClubId
    },
    {
      title: 'Fix Mobile Responsive Drawer Navigation Glitches',
      description: 'Ensure header navigation collapses smoothly on screens under 768px width without scroll lock issues.',
      owner: 'Sneha Roy',
      due_days: -2,
      status: 'Completed',
      priority: 'Medium',
      club_id: techClubId
    },
    {
      title: 'Database Schema Optimization for Contribution Events',
      description: 'Add composite indexes on tasks(due_date), tasks(club_id), and contribution_events(created_at).',
      owner: 'Sneha Roy',
      due_days: 4,
      status: 'In progress',
      priority: 'High',
      club_id: techClubId
    },
    {
      title: 'Campus Tech Fest Hackathon Sponsorship Outreach',
      description: 'Send invitation emails and proposal decks to potential campus sponsors and partner organizations.',
      owner: 'Tanvi Gupta',
      due_days: 3,
      status: 'In progress',
      priority: 'High',
      club_id: techClubId
    },
    {
      title: 'Overdue Server Log Archival & Backup Verification',
      description: 'Archive application request logs older than 90 days and verify automated daily snapshot backups.',
      owner: 'Kabir Mehta',
      due_days: -5,
      status: 'To do',
      priority: 'High',
      club_id: techClubId
    },
    {
      title: 'Prepare Tech Workshop Slide Deck & Live Demos',
      description: 'Slide deck and interactive code examples for the upcoming university React 19 and Next.js workshop.',
      owner: 'Unassigned',
      due_days: 7,
      status: 'To do',
      priority: 'Low',
      club_id: techClubId
    },
    {
      title: 'Assemble Autonomous Line-Follower Robot Chassis',
      description: 'Construct the dual-motor chassis with ultrasonic distance sensor and Arduino micro-controller.',
      owner: 'Rahul Singh',
      due_days: 5,
      status: 'In progress',
      priority: 'High',
      club_id: roboticsClubId
    },
    {
      title: 'Edit Annual Tech Summit Aftermovie & Teaser Reel',
      description: 'Produce a 60-second high-energy vertical teaser video for campus social media channels.',
      owner: 'Simran Kaur',
      due_days: 4,
      status: 'In progress',
      priority: 'Medium',
      club_id: mediaClubId
    },
    {
      title: 'Coordinate Stage Lighting and Sound for Cultural Night',
      description: 'Liaise with university auditorium staff for microphone tests and stage lighting rehearsal schedule.',
      owner: 'Vicky Anand',
      due_days: 8,
      status: 'To do',
      priority: 'Medium',
      club_id: culturalClubId
    }
  ];

  // Clear existing tasks to avoid duplication
  await pool.query('DELETE FROM contribution_events');
  await pool.query('DELETE FROM tasks');

  const taskIdMap = {};
  for (const t of tasks) {
    const dueExpr = `CURRENT_DATE + INTERVAL '${t.due_days} days'`;
    const res = await pool.query(`
      INSERT INTO tasks (title, description, owner, due_date, status, priority, club_id, created_at, updated_at)
      VALUES ($1, $2, $3, ${dueExpr}, $4, $5, $6, NOW() - INTERVAL '10 days', NOW())
      RETURNING id, title;
    `, [t.title, t.description, t.owner, t.status, t.priority, t.club_id]);
    taskIdMap[res.rows[0].title] = res.rows[0].id;
  }
  console.log(`Tasks seeded (${tasks.length} tasks).`);

  // 4. Seed Contribution Events for completed tasks
  console.log('Seeding contribution events...');
  const contributionEvents = [
    { taskTitle: 'Migrate Next.js App Router to Route Handlers', member: 'Aryan Dadwal', event: 'task_completed', points: 25, club_id: techClubId, days_ago: 2 },
    { taskTitle: 'Design Dark Mode Glassmorphism Component Library', member: 'Priya Patel', event: 'task_completed', points: 20, club_id: techClubId, days_ago: 5 },
    { taskTitle: 'Set up PostgreSQL Connection Pooling & Healthchecks', member: 'Aman Verma', event: 'task_completed', points: 25, club_id: techClubId, days_ago: 7 },
    { taskTitle: 'Develop Redux Toolkit Store for Offline Cache', member: 'Rohit Sharma', event: 'task_completed', points: 20, club_id: techClubId, days_ago: 4 },
    { taskTitle: 'Fix Mobile Responsive Drawer Navigation Glitches', member: 'Sneha Roy', event: 'task_completed', points: 15, club_id: techClubId, days_ago: 2 },
    { taskTitle: null, member: 'Aryan Dadwal', event: 'mentoring', points: 20, club_id: techClubId, days_ago: 4 },
    { taskTitle: null, member: 'Aryan Dadwal', event: 'event_attended', points: 15, club_id: techClubId, days_ago: 8 },
    { taskTitle: null, member: 'Aryan Dadwal', event: 'task_completed', points: 20, club_id: techClubId, days_ago: 12 },
    { taskTitle: null, member: 'Rohit Sharma', event: 'event_attended', points: 15, club_id: techClubId, days_ago: 9 },
    { taskTitle: null, member: 'Priya Patel', event: 'mentoring', points: 20, club_id: techClubId, days_ago: 6 },
    { taskTitle: null, member: 'Aman Verma', event: 'event_attended', points: 10, club_id: techClubId, days_ago: 11 },
    { taskTitle: null, member: 'Sneha Roy', event: 'task_completed', points: 15, club_id: techClubId, days_ago: 14 }
  ];

  for (const ce of contributionEvents) {
    const taskId = ce.taskTitle ? taskIdMap[ce.taskTitle] ?? null : null;
    await pool.query(`
      INSERT INTO contribution_events (task_id, club_id, member_name, event_type, points, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW() - ($6 || ' days')::INTERVAL)
    `, [taskId, ce.club_id, ce.member, ce.event, ce.points, ce.days_ago]);
  }
  console.log(`Contribution events seeded (${contributionEvents.length} events).`);

  // 5. Seed Recruitment Openings
  console.log('Seeding recruitment openings...');
  const openings = [
    { title: 'Frontend React / Next.js Developer', club_id: techClubId, status: 'Open' },
    { title: 'UI/UX & Campus Designer', club_id: techClubId, status: 'Open' },
    { title: 'DevOps & Infrastructure Lead', club_id: techClubId, status: 'Open' },
    { title: 'Embedded Systems & IoT Specialist', club_id: roboticsClubId, status: 'Open' },
    { title: 'Video Editor & Motion Designer', club_id: mediaClubId, status: 'Open' }
  ];

  const openingIdMap = {};
  for (const o of openings) {
    const res = await pool.query(`
      INSERT INTO recruitment_openings (title, club_id, status, created_at)
      VALUES ($1, $2, $3, NOW() - INTERVAL '15 days')
      RETURNING id, title;
    `, [o.title, o.club_id, o.status]);
    openingIdMap[res.rows[0].title] = res.rows[0].id;
  }
  console.log('Openings seeded:', openingIdMap);

  // 6. Seed Recruitment Applications
  console.log('Seeding recruitment applications...');
  const applications = [
    {
      openingTitle: 'Frontend React / Next.js Developer',
      applicant_name: 'Aryan Dadwal',
      email: 'aryandadwal709@gmail.com',
      statement: 'Extensive hands-on experience in Next.js 16, React 19, TypeScript, Tailwind CSS, and PostgreSQL database architecture. Excited to lead tech initiatives for the club.',
      status: 'Accepted'
    },
    {
      openingTitle: 'Frontend React / Next.js Developer',
      applicant_name: 'Kunal Verma',
      email: 'kunal.verma@lpu.in',
      statement: 'Built multiple full-stack projects using React, Tailwind CSS, and Node.js. Excited to contribute to student portals and dashboards.',
      status: 'Reviewing'
    },
    {
      openingTitle: 'UI/UX & Campus Designer',
      applicant_name: 'Neha Sharma',
      email: 'neha.sharma@lpu.in',
      statement: 'Proficient in Figma, component design systems, and responsive user interfaces. Love dark mode aesthetics.',
      status: 'Applied'
    },
    {
      openingTitle: 'DevOps & Infrastructure Lead',
      applicant_name: 'Deepak Chawla',
      email: 'deepak.c@lpu.in',
      statement: 'Experienced in Docker, GitHub Actions, AWS EC2, and PostgreSQL connection optimization.',
      status: 'Applied'
    },
    {
      openingTitle: 'Embedded Systems & IoT Specialist',
      applicant_name: 'Harsh Vardhan',
      email: 'harsh.v@lpu.in',
      statement: 'Hands-on experience with ESP32, Arduino, Raspberry Pi, and sensor integration for automated robotics.',
      status: 'Reviewing'
    }
  ];

  for (const app of applications) {
    const openingId = openingIdMap[app.openingTitle];
    if (openingId) {
      await pool.query(`
        INSERT INTO recruitment_applications (opening_id, applicant_name, email, statement, status, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '3 days')
        ON CONFLICT (opening_id, LOWER(email)) DO UPDATE SET
          statement = EXCLUDED.statement,
          status = EXCLUDED.status;
      `, [openingId, app.applicant_name, app.email, app.statement, app.status]);
    }
  }
  console.log(`Applications seeded (${applications.length} applications).`);

  // 7. Seed Feedback Entries (>= 5 entries so average rating shows up!)
  console.log('Seeding feedback entries...');
  await pool.query('DELETE FROM feedback_entries');
  const feedbacks = [
    { topic: 'Sprint Pace and Workload Distribution', rating: 5, comment: 'The new FairWork distribution has made workload much more balanced. Nobody feels burnt out or overloaded.', is_anonymous: true, status: 'Reviewed', club_id: techClubId },
    { topic: 'Weekly Tech Workshops', rating: 5, comment: 'Loved the React 19 and Next.js App Router live coding session! Very practical and directly relevant to courses.', is_anonymous: true, status: 'Reviewed', club_id: techClubId },
    { topic: 'Meeting Timings during exams', rating: 4, comment: 'Could we shift weekend sync meetings to weekday evenings so exam prep is easier?', is_anonymous: false, status: 'Needs review', club_id: techClubId },
    { topic: 'Project Documentation & Onboarding', rating: 4, comment: 'README and setup steps are clear and fast to run on localhost. Setup took less than 5 minutes.', is_anonymous: true, status: 'Reviewed', club_id: techClubId },
    { topic: 'Task deadlines & Kanban Board', rating: 5, comment: 'The Kanban board and task priorities are very clear. Always know what needs to be worked on next.', is_anonymous: true, status: 'Reviewed', club_id: techClubId },
    { topic: 'Campus Hackathon Preparation', rating: 5, comment: 'Great coordination by the club leads. Really excited for the upcoming hackathon sprint.', is_anonymous: true, status: 'Reviewed', club_id: techClubId }
  ];

  for (const fb of feedbacks) {
    await pool.query(`
      INSERT INTO feedback_entries (club_id, topic, rating, comment, is_anonymous, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '4 days')
    `, [fb.club_id, fb.topic, fb.rating, fb.comment, fb.is_anonymous, fb.status]);
  }
  console.log(`Feedback seeded (${feedbacks.length} entries).`);

  // 8. Seed Mood Pulses for users 2..7 so current week pulse count >= 5
  console.log('Seeding mood pulses for current week...');
  const usersRes = await pool.query('SELECT id, name, email FROM users ORDER BY id ASC');
  const userList = usersRes.rows;
  console.log(`Found ${userList.length} users in DB.`);

  // Get user IDs excluding admin (user 1 or aryandadwal709)
  const otherUsers = userList.filter(u => u.email !== 'aryandadwal709@gmail.com');
  const moodValues = [4, 5, 4, 5, 4, 5];

  for (let i = 0; i < otherUsers.length && i < moodValues.length; i++) {
    const u = otherUsers[i];
    const mVal = moodValues[i];
    await pool.query(`
      INSERT INTO mood_pulses (user_id, club_id, week_start, mood, created_at)
      VALUES ($1, $2, date_trunc('week', CURRENT_DATE)::date, $3, NOW() - INTERVAL '1 day')
      ON CONFLICT (user_id, week_start) DO UPDATE SET mood = EXCLUDED.mood;
    `, [u.id, techClubId, mVal]);
  }
  console.log(`Seeded mood pulses for ${Math.min(otherUsers.length, moodValues.length)} users.`);

  console.log('--- COMPREHENSIVE SEED FINISHED SUCCESSFULLY ---');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
