import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db, ensureDb } from '@/lib/db';
import { diaries } from '@/lib/schema';

export async function DELETE(_request, { params }) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { date } = await params;
  await ensureDb();

  const [existing] = await db
    .select()
    .from(diaries)
    .where(and(eq(diaries.date, date), eq(diaries.userEmail, session.user.email)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: '記録が見つかりません' }, { status: 404 });
  }

  await db.delete(diaries).where(eq(diaries.id, existing.id));

  return NextResponse.json({ message: 'Deleted successfully' });
}
