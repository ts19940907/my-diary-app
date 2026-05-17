'use client';

import { useSession, signOut } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import Calendar from './Calendar';
import LoginForm from './LoginForm';
import FullPageSpinner from './FullPageSpinner';

export default function DiaryApp() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50">
        <FullPageSpinner />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <LoginForm />
        <Toaster position="top-right" reverseOrder={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Work Diary <span className="text-blue-600">v2.0</span>
          </h1>
          <div className="flex flex-col items-center sm:flex-row">
            <span>ようこそ、{session.user.email} さん</span>
            <button
              className="mt-[10px] w-[40%] rounded-lg bg-blue-600 py-2 font-bold text-white transition-all hover:bg-blue-700 sm:ml-[10px] sm:mt-0 sm:w-auto sm:px-6"
              onClick={() => signOut()}
            >
              ログアウト
            </button>
          </div>
        </header>

        <main>
          <Calendar />
        </main>

        <footer className="mt-12 text-center text-sm text-slate-400">
          &copy; 2026 Work Diary
        </footer>
      </div>
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
