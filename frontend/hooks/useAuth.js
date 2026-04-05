import { fetchAuthSession } from 'aws-amplify/auth';

export const useAuth = () => {
  const getAccessToken = async () => {
    try {
      const session = await fetchAuthSession();
      // IDトークン（ユーザー属性含む）を取得
      return session.tokens.idToken.toString();
    } catch (err) {
      console.error("トークン取得失敗:", err);
      return null;
    }
  };

  return { getAccessToken };
};