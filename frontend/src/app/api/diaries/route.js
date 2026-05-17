import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db, ensureDb } from '@/lib/db';
import { diaries } from '@/lib/schema';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  await ensureDb();

  const rows = await db
    .select()
    .from(diaries)
    .where(eq(diaries.userEmail, session.user.email));

  return NextResponse.json(rows);
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await request.json();
  const { date, work, issue, solution, summary } = body;

  if (!date) {
    return NextResponse.json({ error: '日付は必須です' }, { status: 400 });
  }

  await ensureDb();

  const [existing] = await db
    .select()
    .from(diaries)
    .where(and(eq(diaries.date, date), eq(diaries.userEmail, session.user.email)))
    .limit(1);

  if (existing) {
    await db
      .update(diaries)
      .set({ work, issue, solution, summary })
      .where(eq(diaries.id, existing.id));
    const [updated] = await db
      .select()
      .from(diaries)
      .where(eq(diaries.id, existing.id));
    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(diaries)
    .values({
      userEmail: session.user.email,
      date,
      work,
      issue,
      solution,
      summary,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
