'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Bell
} from 'lucide-react';

/**
 * AdminSidebar Component
 * 
 * Collapsible sidebar for admin navigation.
 * Can be used as an alternative to top navigation.
 */

interface AdminSidebarProps {
  className?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ className }) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/teachers', label: 'Academics', icon: Users },
    { href: '/admin/comments', label: 'Comments', icon: MessageSquare },
    { href: '/admin/forum', label: 'Forum', icon: MessageSquare },
    { href: '/admin/suggestions', label: 'Suggestions', icon: Lightbulb },
    { href: '/admin/updates', label: 'Updates', icon: Bell },
{ href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-card transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Toggle Button */}
      <div className="flex h-16 items-center justify-end border-b border-border px-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
                : 'text-muted-foreground hover:bg-emerald-500/10 hover:text-foreground',
              isCollapsed && 'justify-center'
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t border-border p-4">
          <p className="text-xs text-muted-foreground">
            TM Ratings Admin v1.0
          </p>
        </div>
      )}
    </aside>
  );
};

export { AdminSidebar };






