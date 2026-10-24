import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { Pool } from 'pg';
import { parsePositiveId } from '../lib/task-validation.mjs';

function loadLocalEnv() {
  // Match Next.js env-file precedence without printing any values.
  for (const file of ['.env.development.local', '.env.local', '.env.development', '.env']) {
    if (!existsSync(file)) continue;
    for (const rawLine of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const normalized = line.startsWith('export ') ? line.slice(7) : line;
      const separator = normalized.indexOf('=');
      if (separator < 1) continue;
      const key = normalized.slice(0, separator).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) continue;
      let value = normalized.slice(separator + 1).trim();
      if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

function localOnlyUrl(value) {
  const url = new URL(value);
  if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname)) {
    throw new Error('Safety check: this verification script only targets localhost. Do not point it at production.');
  }
  return url;
}

async function jsonResponse(response) {
  return response.json().catch(() => ({}));
}

async function pingClubPulse(baseUrl) {
  try {
    const response = await fetch(new URL('/api/health', baseUrl), { signal: AbortSignal.timeout(1500) });
    const body = await jsonResponse(response);
    return body.application === 'ClubPulse' ? body : null;
  } catch {
    return null;
  }
}

function startDevServer() {
  console.log('No ClubPulse server detected on the configured localhost URL; starting Next.js dev server...');
  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'npm.cmd' : 'npm';
  return spawn(command, ['run', 'dev', '--', '--hostname', '127.0.0.1'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    shell: isWindows,
  });
}

async function waitForClubPulse(baseUrl, child) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child?.exitCode !== null && child?.exitCode !== undefined) {
      throw new Error('The Next.js dev server exited before becoming ready. Check the server output above.');
    }
    const health = await pingClubPulse(baseUrl);
    if (health) return health;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Timed out waiting for ClubPulse. Check DATABASE_URL and the Next.js server output.');
}

function readSessionCookie(response) {
  const header = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie().find((value) => value.startsWith('clubpulse_session='))
    : response.headers.get('set-cookie');
  if (!header) return null;
  return header.split(';', 1)[0];
}

async function cleanupTask(pool, taskId, taskTitle) {
  if (!pool || !taskTitle) return;
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    let id = taskId;
    if (id) {
      const exact = await client.query('SELECT id FROM tasks WHERE id = $1 AND title = $2', [id, taskTitle]);
      if (!exact.rowCount) id = null;
    }
    if (!id) {
      const found = await client.query(
        'SELECT id FROM tasks WHERE title = $1 ORDER BY created_at DESC LIMIT 1',
        [taskTitle],
      );
      id = found.rows[0]?.id;
    }
    if (id) {
      // Confirm the unique title before deleting any event, so a bad response
      // can never cause events from an unrelated task to be removed.
      const exact = await client.query('SELECT id FROM tasks WHERE id = $1 AND title = $2', [id, taskTitle]);
      if (exact.rowCount) {
        await client.query('DELETE FROM contribution_events WHERE task_id = $1', [id]);
        await client.query('DELETE FROM tasks WHERE id = $1 AND title = $2', [id, taskTitle]);
      } else {
        throw new Error('Cleanup refused because the task ID/title pair did not match.');
      }
    }
    await client.query('COMMIT');
    if (id) console.log('Cleanup complete: removed the temporary task and its contribution event.');
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.warn('WARNING: automatic cleanup failed. Remove the uniquely titled verification task from the configured test database.', error instanceof Error ? error.message : '');
  } finally {
    client?.release();
  }
}

async function main() {
  loadLocalEnv();

  const baseUrl = localOnlyUrl(process.env.CLUBPULSE_BASE_URL || 'http://127.0.0.1:3000');
  const email = process.env.CLUBPULSE_TEST_EMAIL;
  const password = process.env.CLUBPULSE_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Set CLUBPULSE_TEST_EMAIL and CLUBPULSE_TEST_PASSWORD in your untracked .env.local file. Use an existing admin/lead account; do not paste credentials into chat.',
    );
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing from the local environment. Configure a dedicated test database before running this verifier.');
  }
  let databaseHost;
  try {
    databaseHost = new URL(process.env.DATABASE_URL).hostname.replace(/^\[|\]$/g, '');
  } catch {
    throw new Error('DATABASE_URL is not a valid PostgreSQL connection URL.');
  }
  const localDatabaseHosts = new Set(['localhost', '127.0.0.1', '::1']);
  if (!localDatabaseHosts.has(databaseHost) && process.env.CLUBPULSE_ALLOW_REMOTE_TEST_DB !== '1') {
    throw new Error(
      'Safety check: DATABASE_URL points to a remote database. Use a dedicated non-production test database, then set CLUBPULSE_ALLOW_REMOTE_TEST_DB=1 locally to explicitly allow the test.',
    );
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ...(process.env.PGSSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  let child = null;
  let cookie = null;
  let testTaskId = null;
  let testTaskTitle = null;

  try {
    let health = await pingClubPulse(baseUrl);
    if (!health) {
      // The package dev script is configured for port 3000. A custom URL is
      // supported only when the caller has already started that server.
      child = startDevServer();
      health = await waitForClubPulse(baseUrl, child);
    }
    assert.equal(health.application, 'ClubPulse', 'The target must be ClubPulse.');
    assert.equal(health.database, 'connected', 'The database must be connected before testing task persistence.');

    const origin = baseUrl.origin;
    const loginResponse = await fetch(new URL('/api/auth/login', baseUrl), {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const loginBody = await jsonResponse(loginResponse);
    assert.equal(loginResponse.status, 200, `Login failed (HTTP ${loginResponse.status}): ${loginBody.error || 'check the test account'}`);
    assert.ok(['admin', 'lead'].includes(loginBody.user?.role), 'The test account must have admin or lead role.');
    cookie = readSessionCookie(loginResponse);
    assert.ok(cookie, 'Login did not return the ClubPulse session cookie.');

    const headers = {
      Origin: origin,
      Cookie: cookie,
      'Content-Type': 'application/json',
    };

    const clubsResponse = await fetch(new URL('/api/clubs', baseUrl), { headers: { Cookie: cookie } });
    const clubsBody = await jsonResponse(clubsResponse);
    assert.equal(clubsResponse.status, 200, `Could not read clubs (HTTP ${clubsResponse.status}).`);
    const clubs = Array.isArray(clubsBody.clubs) ? clubsBody.clubs : [];
    assert.ok(clubs.length > 0, 'No clubs exist in the local database; create a real club before running this test.');

    const configuredClubId = process.env.CLUBPULSE_TEST_CLUB_ID
      ? parsePositiveId(process.env.CLUBPULSE_TEST_CLUB_ID)
      : null;
    if (process.env.CLUBPULSE_TEST_CLUB_ID && configuredClubId === null) {
      throw new Error('CLUBPULSE_TEST_CLUB_ID must be a positive integer.');
    }
    const club = configuredClubId === null
      ? (clubs.find((item) => item.status === 'Active') || clubs[0])
      : clubs.find((item) => Number(item.id) === configuredClubId);
    assert.ok(club, 'The selected CLUBPULSE_TEST_CLUB_ID does not match a club returned by the API.');

    const invalidClubIds = new Set(clubs.map((item) => Number(item.id)));
    let nonExistentClubId = 2_147_483_647;
    while (invalidClubIds.has(nonExistentClubId) && nonExistentClubId > 0) nonExistentClubId--;
    assert.ok(nonExistentClubId > 0, 'Could not identify a non-existent club ID for validation.');

    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    testTaskTitle = `[LOCAL VERIFY clubId] ${stamp}`;
    const createResponse = await fetch(new URL('/api/tasks', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: testTaskTitle,
        owner: loginBody.user.name,
        dueDate: new Date().toISOString().slice(0, 10),
        priority: 'Medium',
        clubId: Number(club.id),
      }),
    });
    const createBody = await jsonResponse(createResponse);
    assert.equal(createResponse.status, 201, `Task creation failed (HTTP ${createResponse.status}): ${createBody.error || 'no API error message'}`);
    testTaskId = Number(createBody.task?.id);
    assert.ok(Number.isSafeInteger(testTaskId) && testTaskId > 0, 'Create response did not return a valid task ID.');
    assert.equal(Number(createBody.task?.clubId), Number(club.id), 'Create response clubId does not match the requested club.');

    // Re-read the exact task through a separate authenticated HTTP request.
    const readResponse = await fetch(new URL(`/api/tasks/${testTaskId}`, baseUrl), {
      headers: { Cookie: cookie },
    });
    const readBody = await jsonResponse(readResponse);
    assert.equal(readResponse.status, 200, `Could not re-read task #${testTaskId} (HTTP ${readResponse.status}): ${readBody.error || ''}`);
    assert.equal(Number(readBody.task?.id), testTaskId, 'Fresh task read returned a different ID.');
    assert.equal(Number(readBody.task?.clubId), Number(club.id), 'Persisted clubId differs from the selected club.');
    assert.equal(readBody.task?.club, club.name, 'The persisted task does not join back to the selected club name.');

    const invalidResponse = await fetch(new URL('/api/tasks', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: `[LOCAL VERIFY invalid clubId] ${stamp}`,
        owner: loginBody.user.name,
        dueDate: new Date().toISOString().slice(0, 10),
        priority: 'Medium',
        clubId: nonExistentClubId,
      }),
    });
    const invalidBody = await jsonResponse(invalidResponse);
    assert.equal(invalidResponse.status, 400, `Non-existent clubId should return 400, got ${invalidResponse.status}: ${invalidBody.error || ''}`);

    const missingResponse = await fetch(new URL('/api/tasks', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: `[LOCAL VERIFY missing clubId] ${stamp}`,
        owner: loginBody.user.name,
        dueDate: new Date().toISOString().slice(0, 10),
        priority: 'Medium',
      }),
    });
    assert.equal(missingResponse.status, 400, `Missing clubId should return 400, got ${missingResponse.status}.`);

    console.log('PASS: logged in with an admin/lead account.');
    console.log(`PASS: task #${testTaskId} was created for club ${club.name} (id=${club.id}).`);
    console.log('PASS: a fresh GET /api/tasks/:id returned the same clubId and joined club name.');
    console.log('PASS: non-existent and missing clubId values were rejected with HTTP 400.');
  } finally {
    await cleanupTask(pool, testTaskId, testTaskTitle);
    if (pool) await pool.end().catch(() => {});
    if (child) {
      if (process.platform === 'win32' && child.pid) {
        spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    }
  }
}

main().catch((error) => {
  console.error('FAIL: task clubId verification did not pass.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
