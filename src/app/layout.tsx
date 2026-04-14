import type { Metadata } from 'next';
import { Courier_Prime, Archivo_Black } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/layout/BottomNav';

const typewriter = Courier_Prime({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-inter', // keeping variables same to avoid breaking css
});

const stylizedHeavy = Archivo_Black({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-fraunces',
});

export const metadata: Metadata = {
  title: 'Âmbar Journal',
  description: 'O seu bullet journal digital, com IA.',
  manifest: '/manifest.json', // PWA preparations
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${typewriter.variable} ${stylizedHeavy.variable} font-sans antialiased bg-fog-100 sm:bg-stone-200`}>
        <div className="mx-auto max-w-md min-h-screen bg-fog-100 relative sm:shadow-2xl overflow-hidden flex flex-col">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
