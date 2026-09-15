import AudioPrimer from '@/components/AudioPrimer';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '汉字任务 HanziQuest',
  description: 'A story-driven 华文 game for the UEC 初中 track.',
  applicationName: 'HanziQuest',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#131a26',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Unlocks speech on the first tap, for the screens that speak without
            being asked - a listening question, a chapter reading itself. */}
        <AudioPrimer />
        {children}
      </body>
    </html>
  );
}
