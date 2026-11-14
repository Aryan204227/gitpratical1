import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { isSameOriginRequest } from '@/lib/request-origin';
import { ensureDatabase, getPool } from '@/lib/db';
import { getTaskIfAccessible } from '@/lib/task-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function validImage(bytes: Buffer, mime: string) {
  if (mime === 'image/png') return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mime === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === 'image/webp') return bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

async function resolveTask(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) return { response: NextResponse.json({ error: 'Sign in to view task evidence.' }, { status: 401 }) };
  const { id } = await context.params;
  const taskId = Number(id);
  if (!Number.isSafeInteger(taskId) || taskId < 1) {
    return { response: NextResponse.json({ error: 'Invalid task id.' }, { status: 400 }) };
  }
  const task = await getTaskIfAccessible(taskId, user);
  if (!task) return { response: NextResponse.json({ error: 'Task not found or access denied.' }, { status: 404 }) };
  return { user, task, taskId };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await resolveTask(request, context);
    if ('response' in access) return access.response;
    await ensureDatabase();
    const result = await getPool().query(
      `SELECT id,file_name,mime_type,created_at,uploaded_by
       FROM task_evidence WHERE task_id=$1 ORDER BY created_at DESC LIMIT 30`,
      [access.taskId],
    );
    return NextResponse.json({ evidence: result.rows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[task-evidence] Failed to list evidence:', error);
    return NextResponse.json({ error: 'Could not load task evidence.' }, { status: 503 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await resolveTask(request, context);
    if ('response' in access) return access.response;
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Cross-origin requests are not accepted.' }, { status: 403 });
    }
    const form = await request.formData();
    const file = form.get('image');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400 });
    }
    if (file.size < 1 || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Images must be smaller than 2 MB.' }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!validImage(bytes, file.type)) {
      return NextResponse.json({ error: 'Use a valid JPG, PNG or WebP image.' }, { status: 400 });
    }
    await ensureDatabase();
    const result = await getPool().query(
      `INSERT INTO task_evidence(task_id,uploaded_by,file_name,mime_type,image_data)
       VALUES($1,$2,$3,$4,$5)
       RETURNING id,file_name,mime_type,created_at,uploaded_by`,
      [access.taskId, access.user.id, file.name.replace(/[\\r\\n\\0]/g, '').slice(0, 160) || 'task-evidence', file.type, bytes],
    );
    return NextResponse.json({ evidence: result.rows[0] }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[task-evidence] Upload failed:', error);
    return NextResponse.json({ error: 'The image could not be saved. Please try again.' }, { status: 503 });
  }
}
