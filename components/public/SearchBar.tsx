'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, X } from 'lucide-react';

/**
 * SearchBar Component
 * 
 * Search input with submit button and clear functionality.
 * Supports both inline and full-page search modes.
 */

export interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showButton?: boolean;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  initialValue = '',
  placeholder = 'Search teachers...',
  onSearch,
  className,
  size = 'md',
  showButton = true,
  autoFocus = false,
}) => {
  const router = useRouter();
  const [query, setQuery] = React.useState(initialValue);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedQuery = query.trim();
    
    if (onSearch) {
      onSearch(trimmedQuery);
    } else {
      // Default behavior: navigate to search page
      if (trimmedQuery) {
        router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const sizes = {
    sm: 'h-9',
    md: 'h-11',
    lg: 'h-12',
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex items-center gap-2', className)}
    >
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-lg border border-border bg-card pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            sizes[size]
          )}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {showButton && (
        <Button type="submit" size={size}>
          Search
        </Button>
      )}
    </form>
  );
};

export { SearchBar };



