import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names and merges Tailwind classes efficiently
 * Uses clsx for conditional classes and tailwind-merge to resolve conflicts
 * 
 * @param inputs - Class values to combine
 * @returns Merged class string
 * 
 * @example
 * cn('px-2 py-1', 'px-4') // returns 'py-1 px-4'
 * cn('btn', { 'btn-active': isActive }, className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
