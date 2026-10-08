/**
 * src/lib/env.ts - Runtime environment validation.
 *
 * Validates required environment variables at startup. On Hostinger Node.js
 * Web Apps, variables like PORT, APP_URL are injected by the platform - we
 * provide safe defaults so the app boots without hard failures and then
 * logs what is missing.
 */

import { randomBytes } from 'node:crypto';

type EnvVar = {
  key: string;
  required: boolean;
  description: string;
  default?: string;
  validate?: (value: string) => boolean;
};

const ENV_SCHEMA: EnvVar[] = [
  { key: 'NODE_ENV', required: false, default: 'production', description: 'Application environment (production|development|test)', validate: (v) => ['production', 'development', 'test'].includes(v) },
  { key: 'APP_URL', required: false, default: 'https://english.aloeducation.com', description: 'Public application URL' },
  { key: 'APP_PORT', required: false, default: '3000', description: 'Application port (3000)' },
  { key: 'PORT', required: false, description: 'Application port (set by Hostinger)' },
  { key: 'DATABASE_URL', required: true, description: 'Database connection string (SQLite file:path or MySQL mysql://...)' },
  { key: 'AUTH_SECRET', required: false, default: '', description: '32+ char session signing secret (auto-generated if missing in dev)' },
  { key: 'NEXTAUTH_URL', required: false, description: 'NextAuth base URL' },
  { key: 'GROQ_API_KEY', required: false, description: 'Optional Groq AI key' },
  { key: 'UPLOAD_DIR', required: false, default: './upload', description: 'Upload directory' },
  { key: 'BACKUP_DIR', required: false, default: './db/backup', description: 'Backup directory' },
];

function validateEnv(): Record<string, string> {
  const errors: string[] = [];
  const env: Record<string, string> = {};

  for (const spec of ENV_SCHEMA) {
    let value = process.env[spec.key] ?? '';
    if (!value && spec.default) value = spec.default;
    env[spec.key] = value;

    if (spec.required && !value) {
      errors.push(`  - ${spec.key} is REQUIRED - ${spec.description}`);
      continue;
    }

    if (value && spec.validate && !spec.validate(value)) {
      errors.push(`  - ${spec.key} has invalid value - ${spec.description}`);
    }
  }

  // Auto-generate AUTH_SECRET if not set and we're not in production, or warn.
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32) {
    if (env.NODE_ENV === 'production') {
      errors.push('  - AUTH_SECRET must be at least 32 characters. Set it in Hostinger panel. Generate with: openssl rand -base64 48');
    } else {
      // Dev-only fallback so local runs do not need a secret configured.
      // Deliberately random, not deterministic: sessions do not survive a
      // restart, and that is acceptable outside production.
      const fallback = randomBytes(48).toString('base64');
      env.AUTH_SECRET = fallback;
      process.env.AUTH_SECRET = fallback;
      console.warn('[env] Generated dev AUTH_SECRET (set a real one for production)');
    }
  }

  // Apply defaults for NODE_ENV, APP_URL, APP_PORT.
  if (!env.NODE_ENV) env.NODE_ENV = 'production';
  if (!env.APP_PORT && env.PORT) env.APP_PORT = env.PORT;
  if (!env.APP_PORT) env.APP_PORT = '3000';
  process.env.PORT = env.APP_PORT;

  if (errors.length > 0 && env.NODE_ENV === 'production') {
    console.error('');
    console.error('======================================================');
    console.error('  ENVIRONMENT VALIDATION FAILED');
    console.error('======================================================');
    errors.forEach((e) => console.error(e));
    console.error('');
    // Don't throw in production - let the app start and log.
    console.error('Starting anyway - set the missing variables in Hostinger panel.');
    console.error('');
  } else if (errors.length > 0) {
    console.warn('');
    console.warn('Environment warnings (non-blocking in development):');
    errors.forEach((e) => console.warn(e));
    console.warn('');
  }

  return env;
}

export const env = validateEnv();
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
