'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils/cn';
import { Menu, X, Trophy, Search, Users, Shield, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

/**
 * Navbar Component
 * 
 * Main navigation bar for the public-facing pages.
 * Includes responsive mobile menu and active state indicators.
 */

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const isAdmin = session?.user?.role === 'admin';

  const navItems = [
    { href: '/', label: 'Home', icon: null },
    { href: '/teachers', label: 'Teachers', icon: Users },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/forum', label: 'Forum', icon: MessageSquare },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-9 w-40 sm:w-48">
              <Image
                src="/branding/logo-text.png"
                alt="TM Ratings"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="sr-only">TM Ratings</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex md:items-center md:gap-3">
            <ThemeToggle />
            {isAdmin && (
              <Link href="/admin/dashboard">
                <Button size="sm" variant="outline" leftIcon={<Shield className="h-4 w-4" />}>
                  Admin
                </Button>
              </Link>
            )}
            <Link href="/teachers">
              <Button size="sm">Rate a Teacher</Button>
            </Link>
          </div>

          {/* Mobile Theme Toggle */}
          <div className="mr-2 md:hidden">
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden animate-slide-in">
          <div className="space-y-1 px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                {item.label}
              </Link>
            ))}
            <div className="pt-3 space-y-2">
              <div className="px-4">
                <ThemeToggle className="w-full justify-between" />
              </div>
              {isAdmin && (
                <Link href="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button fullWidth variant="outline" leftIcon={<Shield className="h-4 w-4" />}>
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/teachers" onClick={() => setIsMobileMenuOpen(false)}>
                <Button fullWidth>Rate a Teacher</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export { Navbar };





