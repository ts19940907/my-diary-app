import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';
import Calendar from './components/Calendar';
import { Toaster } from 'react-hot-toast';

// 1. Cognitoの設定（取得したIDに書き換えてください）
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_CLIENT_ID,
      loginWith: {
        email: true // メールアドレスでログインする場合に必須
      }
    }
  }
});

function App() {
  const fetchDiaries = async () => {
    try {
      // 1. Cognitoから「今ログインしている人」のトークンを取得
      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      // 2. リクエストのヘッダーにトークンを乗せて送る
      const response = await fetch('https://your-api-url.com/diaries', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ★これが「通行証」になります
        }
      });

      const data = await response.json();
      // ...取得したデータをStateにセット
    } catch (err) {
      console.error("認証エラーまたは通信エラー:", err);
    }
  };

  return (
    // 2. Authenticatorでアプリ全体を包む
    <Authenticator>
      {({ signOut, user }) => (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <header className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4">
              <h1 className="text-5xl font-black text-slate-900 tracking-tight">
                Work Diary <span className="text-blue-600">v1.0</span>
              </h1>
              <div className="flex sm:flex-row flex-col items-center">
                <span>ようこそ、{user.signInDetails?.loginId} さん</span>
                <button className="w-[40%] sm:w-auto mt-[10px] sm:mt-[0px] sm:ml-[10px] sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all text-white" onClick={signOut}>
                  ログアウト
                </button>
              </div>
            </header>

            {/* --- ここにこれまでの日記投稿・一覧コンポーネントを配置 --- */}
            <main>
              <Calendar getAccessToken={async () => {
                const session = await fetchAuthSession();
                return session.tokens.idToken.toString();
              }} />
            </main>

            <footer className="mt-12 text-center text-slate-400 text-sm">
              &copy; 2026 Diary Tool - AWS SAP Study Project
            </footer>
          </div>
          <Toaster position="top-right" reverseOrder={false} />
        </div>
      )
      }
    </Authenticator >
  );
}

export default App;