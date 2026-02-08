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
  department_id: z
    .string()
    .uuid('Invalid department ID')
    .optional()
    .nullable(),
  subject_ids: z
    .array(z.string().uuid('Invalid subject ID'))
    .optional()
    .nullable(),
  levels: z
    .array(z.enum(['SL', 'HL']))
    .optional()
    .nullable(),
  year_levels: z
    .array(z.number().int().min(7).max(12))
    .optional()
    .nullable(),
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

// Suggestion validation
export const suggestionSchema = z.object({
  type: z.enum(['general', 'teacher_add', 'teacher_modify']),
  title: z
    .string()
    .max(255, 'Title cannot exceed 255 characters')
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters')
    .transform((text) => sanitizeHtml(text)),
  teacher_name: z
    .string()
    .max(255, 'Teacher name cannot exceed 255 characters')
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),
  department: z
    .string()
    .max(255, 'Department cannot exceed 255 characters')
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),
  subject: z
    .string()
    .max(255, 'Subject cannot exceed 255 characters')
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),
  level: z
    .string()
    .max(10, 'Level too long')
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),
  year_level: z
    .string()
    .max(50, 'Year level too long')
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : val)),
}).superRefine((data, ctx) => {
  if (data.type === 'teacher_add' || data.type === 'teacher_modify') {
    if (!data.teacher_name) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['teacher_name'], message: 'Teacher name is required' });
    }
    if (!data.department) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['department'], message: 'Department is required' });
    }
    if (!data.subject) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['subject'], message: 'Subject is required' });
    }
  }
});

export type SuggestionInput = z.infer<typeof suggestionSchema>;

// Suggestion vote validation
export const suggestionVoteSchema = z.object({
  suggestion_id: z.string().uuid('Invalid suggestion ID'),
  anonymous_id: z.string().min(1, 'Anonymous ID is required').max(255, 'Anonymous ID too long'),
  vote: z.enum(['up', 'down']).nullable(),
});

export type SuggestionVoteInput = z.infer<typeof suggestionVoteSchema>;

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
