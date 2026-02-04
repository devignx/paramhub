import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ParamHub - URL-Powered Micro Tools',
  description: 'Generate beautiful shareable cards, countdowns, QR codes, and more - all encoded in the URL. No database required.',
  keywords: ['url tools', 'shareable cards', 'qr generator', 'countdown', 'invoice generator', 'greeting cards', 'pomodoro', 'wifi qr'],
  authors: [{ name: 'ParamHub' }],
  openGraph: {
    title: 'ParamHub - URL-Powered Micro Tools',
    description: 'Generate beautiful shareable cards, countdowns, QR codes, and more - all encoded in the URL.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ParamHub - URL-Powered Micro Tools',
    description: 'Generate beautiful shareable cards, countdowns, QR codes, and more - all encoded in the URL.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
