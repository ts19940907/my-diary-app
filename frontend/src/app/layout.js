import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'Work Diary',
  description: '業務日報カレンダーアプリ',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
