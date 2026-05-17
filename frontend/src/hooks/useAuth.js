'use client';

import { fetchAuthSession } from 'aws-amplify/auth';

export function useAuth() {
  const getAccessToken = async () => {
    try {
      const session = await fetchAuthSession();
      return session.tokens.idToken.toString();
    } catch (err) {
      console.error('トークン取得失敗:', err);
      return null;
    }
  };

  return { getAccessToken };
}
