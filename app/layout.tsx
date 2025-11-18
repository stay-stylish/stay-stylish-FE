import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { KakaoScriptLoader } from './KakaoScriptLoader'; // ✅ 여기 추가

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stay-Stylish',
  description: 'AI 기반 개인화 OOTD 추천 플랫폼',
  generator: 'v0.app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Analytics />

        {/* ✅ Kakao SDK 로더 (클라이언트 컴포넌트) */}
        <KakaoScriptLoader />
      </body>
    </html>
  );
}
