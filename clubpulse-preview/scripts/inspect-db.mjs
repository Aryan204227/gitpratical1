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

console.log('Connecting to DB host:', dbUrl ? dbUrl.split('@')[1]?.split('/')[0] : 'NONE');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const tables = ['users', 'clubs', 'members', 'tasks', 'recruitment_openings', 'recruitment_applications', 'feedback_entries', 'mood_pulses', 'contribution_events'];
  for (const t of tables) {
    try {
      const res = await pool.query(`SELECT COUNT(*) FROM ${t}`);
      console.log(`${t}: ${res.rows[0].count}`);
    } catch(e) {
      console.log(`${t} error:`, e.message);
    }
  }
  const users = await pool.query('SELECT id, name, email, role FROM users');
  console.log('Users in DB:', users.rows);
  const clubs = await pool.query('SELECT id, name, category, status FROM clubs');
  console.log('Clubs in DB:', clubs.rows);
  const tasks = await pool.query('SELECT id, title, owner, status, club_id FROM tasks LIMIT 10');
  console.log('Sample Tasks in DB:', tasks.rows);
  await pool.end();
}

run();
