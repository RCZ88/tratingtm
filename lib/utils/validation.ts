/**
 * Input Validation Utilities
 * 
 * Zod schemas for validating user inputs across the application.
 * Used in API routes and forms to ensure data integrity.
 */

import { z } from 'zod';

// Rating validation
export const ratingSchema = z.object({
  teacher_id: z.string().uuid('Invalid teacher ID'),
  stars: z.number().int().min(1, 'Rating must be at least 1 star').max(5, 'Rating cannot exceed 5 stars'),
  anonymous_id: z.string().min(1, 'Anonymous ID is required').max(255, 'Anonymous ID too long'),
});

export type RatingInput = z.infer<typeof ratingSchema>;

// Comment validation
export const commentSchema = z.object({
  teacher_id: z.string().uuid('Invalid teacher ID'),
  comment_text: z
    .string()
    .min(10, 'Comment must be at least 10 characters')
    .max(500, 'Comment cannot exceed 500 characters')
    .transform((text) => sanitizeHtml(text)),
  anonymous_id: z.string().min(1, 'Anonymous ID is required').max(255, 'Anonymous ID too long'),
});

export type CommentInput = z.infer<typeof commentSchema>;

// Comment moderation validation
export const commentModerationSchema = z.object({
  is_approved: z.boolean().optional(),
  is_flagged: z.boolean().optional(),
});

export type CommentModerationInput = z.infer<typeof commentModerationSchema>;

// Teacher validation
export const teacherSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .transform((name) => sanitizeHtml(name)),
  subject: z
    .string()
    .max(100, 'Subject cannot exceed 100 characters')
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),
  department: z
    .string()
    .max(100, 'Department cannot exceed 100 characters')
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),
  bio: z
    .string()
    .max(1000, 'Bio cannot exceed 1000 characters')
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),
  image_url: z
    .string()
    .url('Invalid URL format')
    .max(500, 'URL too long')
    .optional()
    .nullable(),
  is_active: z.boolean().default(true),
});

export type TeacherInput = z.infer<typeof teacherSchema>;

// Teacher update validation (all fields optional)
export const teacherUpdateSchema = teacherSchema.partial();

export type TeacherUpdateInput = z.infer<typeof teacherUpdateSchema>;

// Admin login validation
export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

// UUID validation helper
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z.enum(['name', 'rating', 'department', 'created_at']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// Search validation
export const searchSchema = z.object({
  q: z.string().min(1, 'Search query required').max(100, 'Search query too long'),
  department: z.string().optional(),
});

export type SearchInput = z.infer<typeof searchSchema>;

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Removes all HTML tags and decodes common entities
 */
function sanitizeHtml(input: string): string {
  if (!input) return input;

  return (
    input
      // Remove script tags and their contents
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      // Remove event handlers
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Decode common entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      // Trim whitespace
      .trim()
  );
}

/**
 * Validates data against a Zod schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
  return { success: false, errors };
}

/**
 * Validates partial data (for updates)
 */
export function validatePartial<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  data: unknown
): { success: true; data: Partial<z.infer<typeof schema>> } | { success: false; errors: string[] } {
  const partialSchema = schema.partial();
  return validate(partialSchema, data);
}
