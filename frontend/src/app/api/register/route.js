import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, ensureDb } from '@/lib/db';
import { users } from '@/lib/schema';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上にしてください' },
        { status: 400 },
      );
    }

    await ensureDb();

    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(users).values({
      email: email.trim().toLowerCase(),
      passwordHash,
    });

    return NextResponse.json({ message: '登録が完了しました' }, { status: 201 });
  } catch (error) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 409 },
      );
    }

    console.error('Register error:', error);
    return NextResponse.json({ error: '登録に失敗しました' }, { status: 500 });
  }
}
