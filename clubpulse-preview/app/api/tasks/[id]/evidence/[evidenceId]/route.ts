import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { ensureDatabase, getPool } from '@/lib/db';
import { getTaskIfAccessible } from '@/lib/task-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ id: string; evidenceId: string }> }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Sign in to view this image.' }, { status: 401 });
    const { id, evidenceId } = await context.params;
    const taskId = Number(id);
    const mediaId = Number(evidenceId);
    if (!Number.isSafeInteger(taskId) || taskId < 1 || !Number.isSafeInteger(mediaId) || mediaId < 1) {
      return NextResponse.json({ error: 'Invalid image reference.' }, { status: 400 });
    }
    const task = await getTaskIfAccessible(taskId, user);
    if (!task) return NextResponse.json({ error: 'Task not found or access denied.' }, { status: 404 });
    await ensureDatabase();
    const result = await getPool().query(
      'SELECT image_data,mime_type FROM task_evidence WHERE id=$1 AND task_id=$2 LIMIT 1',
      [mediaId, taskId],
    );
    if (!result.rowCount) return NextResponse.json({ error: 'Image not found.' }, { status: 404 });
    const image = Buffer.from(result.rows[0].image_data);
    return new NextResponse(image, {
      headers: {
        'Content-Type': result.rows[0].mime_type,
        'Content-Length': String(image.length),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error) {
    console.error('[task-evidence] Image read failed:', error);
    return NextResponse.json({ error: 'Could not load this image.' }, { status: 503 });
  }
}
