'use client';

import { useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';
import { Toaster } from 'react-hot-toast';
import Calendar from './Calendar';
import { configureAmplify } from '@/lib/amplify-config';

export default function DiaryApp() {
  useEffect(() => {
    configureAmplify();
  }, []);

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="min-h-screen bg-slate-50 px-4 py-12">
          <div className="mx-auto max-w-5xl">
            <header className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
              <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                Work Diary <span className="text-blue-600">v2.0</span>
              </h1>
              <div className="flex flex-col items-center sm:flex-row">
                <span>ようこそ、{user.signInDetails?.loginId} さん</span>
                <button
                  className="mt-[10px] w-[40%] rounded-lg bg-blue-600 py-2 font-bold text-white transition-all hover:bg-blue-700 sm:ml-[10px] sm:mt-0 sm:w-auto sm:px-6"
                  onClick={signOut}
                >
                  ログアウト
                </button>
              </div>
            </header>

            <main>
              <Calendar
                getAccessToken={async () => {
                  const session = await fetchAuthSession();
                  return session.tokens.idToken.toString();
                }}
              />
            </main>

            <footer className="mt-12 text-center text-sm text-slate-400">
              &copy; 2026 Diary Tool - AWS SAP Study Project
            </footer>
          </div>
          <Toaster position="top-right" reverseOrder={false} />
        </div>
      )}
    </Authenticator>
  );
}
