'use client';

import * as React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useTheme, type ThemeMode } from '@/components/ui/ThemeProvider';

const options: Array<{ value: ThemeMode; label: string; icon: React.ElementType }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop },
];

const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-border bg-background/80 p-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur',
        className
      )}
      role="radiogroup"
      aria-label="Theme"
    >
      {options.map((option) => {
        const isActive = theme === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(option.value)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 transition-colors',
              isActive
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export { ThemeToggle };