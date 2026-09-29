/**
 * src/lib/env.ts — Runtime environment validation.
 *
 * Validates that every REQUIRED environment variable is present at startup.
 * The application FAILS FAST with a clear message if a mandatory variable
 * is missing — never silently uses an insecure default.
 *
 * Usage: import { env } from '@/lib/env'
 * The first import triggers validation.
 */

type EnvVar = {
  key: string;
  required: boolean;
  description: string;
  validate?: (value: string) => boolean;
};

const ENV_SCHEMA: EnvVar[] = [
  { key: 'NODE_ENV', required: true, description: 'Application environment (production|development)', validate: (v) => ['production', 'development', 'test'].includes(v) },
  { key: 'APP_URL', required: true, description: 'Public application URL' },
  { key: 'APP_PORT', required: true, description: 'Application port (3016)' },
  { key: 'DATABASE_URL', required: true, description: 'SQLite database path (file:/path)' },
  { key: 'AUTH_SECRET', required: true, description: '32+ char session signing secret' },
  { key: 'NEXTAUTH_URL', required: false, description: 'NextAuth base URL' },
  { key: 'GROQ_API_KEY', required: false, description: 'Optional Groq AI key' },
  { key: 'UPLOAD_DIR', required: false, description: 'Upload directory' },
  { key: 'BACKUP_DIR', required: false, description: 'Backup directory' },
];

function validateEnv(): Record<string, string> {
  const errors: string[] = [];
  const env: Record<string, string> = {};

  for (const spec of ENV_SCHEMA) {
    const value = process.env[spec.key] ?? '';
    env[spec.key] = value;

    if (spec.required && !value) {
      errors.push(`  ✗ ${spec.key} is REQUIRED — ${spec.description}`);
      continue;
    }

    if (value && spec.validate && !spec.validate(value)) {
      errors.push(`  ✗ ${spec.key} has invalid value "${value}" — ${spec.description}`);
    }
  }

  // Warn about weak AUTH_SECRET.
  if (env.AUTH_SECRET && env.AUTH_SECRET.length < 32) {
    errors.push(`  ✗ AUTH_SECRET must be at least 32 characters (current: ${env.AUTH_SECRET.length}). Generate with: openssl rand -base64 48`);
  }

  // Warn about default/placeholder secrets.
  if (env.AUTH_SECRET && ['changeme', 'secret', 'dev-secret', 'password', 'admin123'].includes(env.AUTH_SECRET.toLowerCase())) {
    errors.push(`  ✗ AUTH_SECRET must not be a common placeholder. Generate a real secret.`);
  }

  if (errors.length > 0 && process.env.NODE_ENV === 'production') {
    console.error('');
    console.error('══════════════════════════════════════════════════════');
    console.error('  ENVIRONMENT VALIDATION FAILED');
    console.error('  The application cannot start in production with these errors:');
    console.error('══════════════════════════════════════════════════════');
    errors.forEach((e) => console.error(e));
    console.error('');
    console.error('  Fix: Edit your .env file and set the missing values.');
    console.error('══════════════════════════════════════════════════════');
    console.error('');
    throw new Error(`Environment validation failed: ${errors.length} error(s)`);
  }

  if (errors.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn('');
    console.warn('⚠  Environment warnings (non-blocking in development):');
    errors.forEach((e) => console.warn(e));
    console.warn('');
  }

  return env;
}

export const env = validateEnv();
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
