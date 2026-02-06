import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RateMyTeacher - Anonymous Teacher Ratings',
  description: 'Rate and review your teachers anonymously. Help other students find the best educators.',
  keywords: ['teacher ratings', 'professor reviews', 'anonymous ratings', 'education'],
  authors: [{ name: 'RateMyTeacher' }],
  openGraph: {
    title: 'RateMyTeacher - Anonymous Teacher Ratings',
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
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
