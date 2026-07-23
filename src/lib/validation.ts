/**
 * src/lib/validation.ts — Zod schemas for every API input.
 *
 * Every API route validates its input against these schemas BEFORE any
 * business logic runs. Invalid input returns 422 Unprocessable Entity.
 */

import { z } from 'zod';

// ─── Auth ──────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(12, 'Password must be at least 12 characters').max(128),
  name: z.string().min(1, 'Name is required').max(100).optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(1, 'Password is required').max(128),
});

// ─── Exam ──────────────────────────────────────────────────────────────

export const createExamTypeSchema = z.object({
  code: z.string().min(2).max(50).regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric'),
  name: z.string().min(2).max(200),
  category: z.string().min(2).max(100),
});

export const createPracticeSetSchema = z.object({
  examTypeId: z.string().cuid(),
  title: z.string().min(2).max(300),
  description: z.string().max(2000).optional(),
  durationMin: z.number().int().min(1).max(600),
});

// ─── Attempt ───────────────────────────────────────────────────────────

export const startAttemptSchema = z.object({
  practiceSetId: z.string().cuid(),
});

export const submitAttemptSchema = z.object({
  attemptId: z.string().cuid(),
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.string()), z.array(z.number())])).optional(),
});

// ─── Lead ──────────────────────────────────────────────────────────────

export const leadSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  phone: z.string().max(30).optional().or(z.literal('')),
  examInterest: z.string().max(50).optional().or(z.literal('')),
  message: z.string().max(2000).optional().or(z.literal('')),
});

// ─── Settings ──────────────────────────────────────────────────────────

export const updateSettingSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z_]+$/, 'Key must be lowercase snake_case'),
  value: z.string().max(2000),
});

// ─── Generic ID param ──────────────────────────────────────────────────

export const idParamSchema = z.object({
  id: z.string().cuid(),
});

// ─── Pagination ────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Helper: validate and return error or data ─────────────────────────

import { NextRequest } from 'next/server';

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): ValidationResult<T> {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.issues[0];
  return { success: false, error: firstError?.message ?? 'Validation failed' };
}

export function validateQuery<T>(schema: z.ZodSchema<T>, req: NextRequest): ValidationResult<T> {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const result = schema.safeParse(params);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.issues[0];
  return { success: false, error: firstError?.message ?? 'Validation failed' };
}
