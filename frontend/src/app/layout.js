import './globals.css';

export const metadata = {
  title: 'Work Diary',
  description: '業務日報カレンダーアプリ',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
