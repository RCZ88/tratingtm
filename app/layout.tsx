import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SessionProvider } from '@/components/SessionProvider';
import { AppChrome } from '@/components/AppChrome';
import { ThemeProvider } from '@/components/ui/ThemeProvider';

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

const themeScript = `(() => {
  try {
    const stored = localStorage.getItem('tm-theme');
    const theme = stored || 'system';
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
  } catch (_) {}
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased bg-background text-foreground">
        <SessionProvider>
          <ThemeProvider>
            <AppChrome>{children}</AppChrome>
          </ThemeProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}