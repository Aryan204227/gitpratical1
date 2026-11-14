import { spawn } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

function parseDatabaseUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { throw new Error('DATABASE_URL is not a valid PostgreSQL URL.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL must use postgres:// or postgresql://.');
  if (!url.hostname || !url.pathname || url.pathname === '/') throw new Error('DATABASE_URL must include a database name.');
  return {
    host: url.hostname,
    port: url.port || '5432',
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    sslmode: url.searchParams.get('sslmode'),
  };
}

function runPgDump(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.PG_DUMP_BIN || 'pg_dump', args, { env, stdio: 'inherit', windowsHide: true });
    child.once('error', (error) => reject(new Error(`Could not start pg_dump: ${error.message}. Install PostgreSQL client tools and ensure pg_dump is on PATH.`)));
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`pg_dump failed (exit=${code ?? 'null'}, signal=${signal ?? 'none'}).`)));
  });
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. Load it from a private local environment file; never commit credentials.');
  const db = parseDatabaseUrl(process.env.DATABASE_URL);
  const remote = !['localhost', '127.0.0.1', '::1'].includes(db.host.replace(/^\[|\]$/g, ''));
  if (remote && process.env.ALLOW_REMOTE_BACKUP !== 'true') {
    throw new Error('Refusing remote database backup without explicit ALLOW_REMOTE_BACKUP=true. This guard prevents accidental access to production.');
  }

  const directory = path.resolve(process.env.BACKUP_DIR || 'backups');
  await mkdir(directory, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const output = path.join(directory, `clubpulse-${stamp}.dump`);
  const args = [
    '--format=custom', '--no-owner', '--no-acl', '--no-password',
    '--host', db.host, '--port', db.port, '--username', db.user,
    '--dbname', db.database, '--file', output,
  ];
  const env = { ...process.env, PGPASSWORD: db.password };
  if (db.sslmode) env.PGSSLMODE = db.sslmode;
  try {
    await runPgDump(args, env);
    const details = await stat(output);
    if (details.size === 0) throw new Error('pg_dump produced an empty backup file.');
    console.log(`Backup created: ${output}`);
    console.log(`Size: ${details.size} bytes`);
    console.log('Restore command: pg_restore --clean --if-exists --no-owner --no-acl --dbname="$DATABASE_URL" <backup-file>');
  } catch (error) {
    throw error;
  }
}

main().catch((error) => {
  console.error(`Backup failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  process.exitCode = 1;
});
