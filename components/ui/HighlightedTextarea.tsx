'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import type { ProfanityMatch } from '@/lib/utils/profanity';

export interface HighlightedTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharacterCount?: boolean;
  maxLength?: number;
  highlightRanges?: ProfanityMatch[];
}

const HighlightedTextarea = React.forwardRef<HTMLTextAreaElement, HighlightedTextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      showCharacterCount = false,
      maxLength,
      highlightRanges = [],
      onChange,
      value,
      ...props
    },
    ref
  ) => {
    const textareaId = React.useId();
    const [characterCount, setCharacterCount] = React.useState(
      value?.toString().length || props.defaultValue?.toString().length || 0
    );
    const overlayRef = React.useRef<HTMLDivElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharacterCount(e.target.value.length);
      onChange?.(e);
    };

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
      if (overlayRef.current) {
        overlayRef.current.scrollTop = e.currentTarget.scrollTop;
        overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
      }
    };

    const textValue = typeof value === 'string' ? value : value?.toString() ?? '';

    const highlightNodes = React.useMemo(() => {
      if (!textValue) {
        return (
          <span className="text-muted-foreground">
            {props.placeholder || ''}
          </span>
        );
      }

      if (!highlightRanges.length) {
        return textValue;
      }

      const segments: React.ReactNode[] = [];
      let cursor = 0;
      const sorted = [...highlightRanges].sort((a, b) => a.start - b.start);

      sorted.forEach((match, index) => {
        if (match.start > cursor) {
          segments.push(textValue.slice(cursor, match.start));
        }
        segments.push(
          <span
            key={`${match.start}-${match.end}-${index}`}
            className="underline decoration-wavy decoration-red-500"
          >
            {textValue.slice(match.start, match.end)}
          </span>
        );
        cursor = Math.max(cursor, match.end);
      });

      if (cursor < textValue.length) {
        segments.push(textValue.slice(cursor));
      }

      return segments;
    }, [textValue, highlightRanges, props.placeholder]);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-2 block text-sm font-medium text-foreground"
          >
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <div
            ref={overlayRef}
            className={cn(
              'pointer-events-none absolute inset-0 overflow-hidden rounded-lg border border-transparent px-4 py-3 text-sm text-foreground',
              'whitespace-pre-wrap break-words'
            )}
            aria-hidden="true"
          >
            {highlightNodes}
          </div>
          <textarea
            id={textareaId}
            ref={textareaRef}
            className={cn(
              'relative z-10 flex min-h-[100px] w-full rounded-lg border border-border bg-transparent px-4 py-3 text-sm text-transparent caret-slate-900 placeholder:text-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground resize-y',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            maxLength={maxLength}
            onChange={handleChange}
            onScroll={handleScroll}
            value={value}
            {...props}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          {error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : helperText ? (
            <p className="text-sm text-muted-foreground">{helperText}</p>
          ) : (
            <span />
          )}
          {showCharacterCount && maxLength && (
            <p
              className={cn(
                'text-sm',
                characterCount > maxLength * 0.9 ? 'text-amber-600' : 'text-muted-foreground'
              )}
            >
              {characterCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

HighlightedTextarea.displayName = 'HighlightedTextarea';

export { HighlightedTextarea };



