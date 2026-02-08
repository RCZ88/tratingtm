import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SessionProvider } from '@/components/SessionProvider';
import { AppChrome } from '@/components/AppChrome';

export const metadata: Metadata = {
  title: 'TM Ratings',
  description: 'Rate and review your teachers anonymously. Help other students find the best educators.',
  keywords: ['teacher ratings', 'teacher reviews', 'anonymous ratings', 'education'],
  authors: [{ name: 'TunasMuda School' }],
  openGraph: {
    title: 'TM Ratings',
    description: 'Rate and review your teachers anonymously.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>
          <AppChrome>{children}</AppChrome>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
