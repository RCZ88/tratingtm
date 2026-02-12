'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';

const STORAGE_KEY = 'tm-hide-public-nav';

const AppChrome: React.FC<React.PropsWithChildren> = ({ children }) => {
  const pathname = usePathname();
  const [hidePublicNav, setHidePublicNav] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setHidePublicNav(stored === 'true');

    const handleToggle = () => {
      const nextStored = window.localStorage.getItem(STORAGE_KEY);
      setHidePublicNav(nextStored === 'true');
    };

    window.addEventListener('storage', handleToggle);
    window.addEventListener('tm-public-nav-toggle', handleToggle as EventListener);

    return () => {
      window.removeEventListener('storage', handleToggle);
      window.removeEventListener('tm-public-nav-toggle', handleToggle as EventListener);
    };
  }, []);

  const isAdminRoute = pathname.startsWith('/admin');
  const shouldHideNavbar = isAdminRoute && hidePublicNav;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {!shouldHideNavbar && <Navbar />}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export { AppChrome, STORAGE_KEY };