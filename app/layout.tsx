import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { Analytics } from '@vercel/analytics/next';
import { SessionProvider } from '@/components/SessionProvider';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

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
      <body className={`${manrope.className} antialiased`}>
        <SessionProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
