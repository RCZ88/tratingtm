'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  BarChart3, 
  LogOut,
  Shield,
  Settings,
  Menu,
  X,
  Lightbulb,
  Bell,
  ArrowUpRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { STORAGE_KEY } from '@/components/AppChrome';

/**
 * AdminNav Component
 * 
 * Navigation bar for the admin panel with user info and logout.
 */

interface AdminNavProps {
  user?: {
    email?: string | null;
    role?: string;
  };
}

const AdminNav: React.FC<AdminNavProps> = ({ user }) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [hidePublicNav, setHidePublicNav] = React.useState(false);

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/teachers', label: 'Academics', icon: Users },
    { href: '/admin/comments', label: 'Comments', icon: MessageSquare },
    { href: '/admin/suggestions', label: 'Suggestions', icon: Lightbulb },
    { href: '/admin/updates', label: 'Updates', icon: Bell },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setHidePublicNav(stored === 'true');
  }, []);

  const togglePublicNav = () => {
    const nextValue = !hidePublicNav;
    setHidePublicNav(nextValue);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(nextValue));
      window.dispatchEvent(new Event('tm-public-nav-toggle'));
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <span className="hidden text-lg font-bold text-foreground sm:block">
            TM Ratings Admin
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="hidden md:flex md:items-center md:gap-4">
          <ThemeToggle />
          {user?.email && (
            <span className="text-sm text-muted-foreground">{user.email}</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={togglePublicNav}
            leftIcon={hidePublicNav ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          >
            {hidePublicNav ? 'Show Public Nav' : 'Hide Public Nav'}
          </Button>
          <Link href="/" className="inline-flex">
            <Button variant="outline" size="sm" leftIcon={<ArrowUpRight className="h-4 w-4" />}>
              View Site
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Logout
          </Button>
        </div>

        {/* Mobile Theme Toggle */}
        <div className="mr-2 md:hidden">
          <ThemeToggle />
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent md:hidden"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
            <div className="border-t border-border pt-4 mt-4 space-y-2">
              <div className="px-4">
                <ThemeToggle className="w-full justify-between" />
              </div>
              {user?.email && (
                <p className="px-4 py-2 text-sm text-muted-foreground">{user.email}</p>
              )}
              <button
                onClick={togglePublicNav}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-foreground hover:bg-accent"
              >
                {hidePublicNav ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                {hidePublicNav ? 'Show Public Nav' : 'Hide Public Nav'}
              </button>
              <Link
                href="/"
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-foreground hover:bg-accent"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ArrowUpRight className="h-5 w-5" />
                View Site
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-red-500 hover:bg-red-500/10"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export { AdminNav };



