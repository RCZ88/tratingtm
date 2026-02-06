'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Textarea Component
 * 
 * A styled textarea component with support for labels, error messages,
 * character counting, and auto-resize functionality.
 */

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharacterCount?: boolean;
  maxLength?: number;
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      showCharacterCount = false,
      maxLength,
      autoResize = false,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaId = React.useId();
    const [characterCount, setCharacterCount] = React.useState(
      props.value?.toString().length || props.defaultValue?.toString().length || 0
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharacterCount(e.target.value.length);
      
      if (autoResize) {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }
      
      onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'flex min-h-[100px] w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 resize-y',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            autoResize && 'resize-none overflow-hidden',
            className
          )}
          maxLength={maxLength}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
        <div className="mt-1.5 flex items-center justify-between">
          {error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : helperText ? (
            <p className="text-sm text-slate-500">{helperText}</p>
          ) : (
            <span />
          )}
          {showCharacterCount && maxLength && (
            <p
              className={cn(
                'text-sm',
                characterCount > maxLength * 0.9 ? 'text-amber-600' : 'text-slate-400'
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

Textarea.displayName = 'Textarea';

export { Textarea };
