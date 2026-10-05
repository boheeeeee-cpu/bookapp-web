import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '독서 기록',
  description: '나의 독서 기록 앱',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
