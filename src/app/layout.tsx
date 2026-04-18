import type { Metadata, Viewport } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/layout/BottomNav';

const dmSans = DM_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

// Fraunces: serif editorial variável — dá identidade ao produto (títulos).
const fraunces = Fraunces({
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Âmbar Journal',
  description: 'Seu Bullet Journal digital, quente e elegante — com um toque de IA.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Âmbar',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F7EFE3',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${dmSans.variable} ${fraunces.variable} font-sans antialiased bg-paper`}>
        <div className="mx-auto max-w-md min-h-screen bg-background relative sm:shadow-2xl overflow-hidden flex flex-col bg-paper">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
