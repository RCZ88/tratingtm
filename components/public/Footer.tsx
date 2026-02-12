'use client';

import * as React from 'react';
import Link from 'next/link';
import { GraduationCap, Github, Twitter, Mail } from 'lucide-react';

/**
 * Footer Component
 * 
 * Site footer with links, copyright, and social icons.
 */

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: 'Browse Teachers', href: '/teachers' },
      { label: 'Leaderboard', href: '/leaderboard' },
      { label: 'Search', href: '/search' },
      { label: 'Suggestions', href: '/suggestions' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Terms of Service', href: '/legal/terms' },
      { label: 'Guidelines', href: '/legal/guidelines' },
    ],
    admin: [
      { label: 'Admin Login', href: '/admin/login' },
    ],
  };

  return (
    <footer className="border-t border-border bg-emerald-500/10">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-foreground">
                TM Ratings
              </span>
            </Link>
            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-200">
              TunasMuda School
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Anonymous platform for students to rate and review their teachers.
              Help others find the best educators.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Platform
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-emerald-700 dark:text-emerald-200 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Legal
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-emerald-700 dark:text-emerald-200 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Administration
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.admin.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-emerald-700 dark:text-emerald-200 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            {currentYear} TunasMuda School. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-muted-foreground hover:text-muted-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-muted-foreground transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-muted-foreground transition-colors"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export { Footer };





