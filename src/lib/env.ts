/**
 * src/lib/env.ts - Runtime environment validation.
 *
 * Validates required environment variables at startup. On Hostinger Node.js
 * Web Apps, variables like PORT, APP_URL are injected by the platform - we
 * provide safe defaults so the app boots without hard failures and then
 * logs what is missing.
 *
 * Data paths (DATABASE_URL, UPLOAD_DIR, BACKUP_DIR) are normalized to absolute
 * paths here, because the generated standalone server chdir's into
 * `.next/standalone` and a relative path would otherwise resolve inside the
 * build output. See src/lib/paths.ts.
 */

import { randomBytes } from 'node:crypto';
import { isAbsolute } from 'node:path';
import { getBackupDir, getDataRoot, getUploadDir, resolveDatabaseUrl } from './paths';

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
  { key: 'DATABASE_URL', required: true, description: 'Database connection string (SQLite file:/absolute/path or MySQL mysql://...)' },
  { key: 'AUTH_SECRET', required: false, default: '', description: '32+ char session signing secret (auto-generated if missing in dev)' },
  { key: 'NEXTAUTH_URL', required: false, description: 'NextAuth base URL' },
  { key: 'GROQ_API_KEY', required: false, description: 'Optional Groq AI key' },
  { key: 'APP_DATA_DIR', required: false, description: 'Absolute directory for data that must survive a redeploy (defaults to the app root)' },
  // UPLOAD_DIR / BACKUP_DIR have no literal default: they are resolved by
  // src/lib/paths.ts so they land under the data root rather than under
  // .next/standalone (see the note at the top of this file).
  { key: 'UPLOAD_DIR', required: false, description: 'Upload directory (defaults to <data root>/upload)' },
  { key: 'BACKUP_DIR', required: false, description: 'Backup directory (defaults to <data root>/db/backup)' },
  { key: 'LANGUAGETOOL_URL', required: false, description: 'Optional self-hosted LanguageTool endpoint for writing-practice grammar feedback (empty = disabled)' },
  { key: 'WHATSAPP_APP_SECRET', required: false, description: 'Meta app secret for WhatsApp Cloud webhook signature verification (empty = webhooks refused)' },
  { key: 'META_APP_SECRET', required: false, description: 'Meta app secret for Messenger and Instagram webhook verification' },
  { key: 'SMS_WEBHOOK_SECRET', required: false, description: 'Shared secret for SMS provider webhook verification' },
  { key: 'WHATSAPP_VERIFY_TOKEN', required: false, description: 'Token echoed during the WhatsApp subscription handshake' },
];

function validateEnv(): Record<string, string> {
  const errors: string[] = [];
  const env: Record<string, string> = {};

  // Captured before normalization so we can tell the operator whether the host
  // panel gave us a relative path (which is the configuration that silently
  // loses the database on a redeploy).
  const configuredDatabaseUrl = process.env.DATABASE_URL ?? '';

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

  // ─── Normalize data paths ───────────────────────────────────────────────
  // The generated standalone server runs `process.chdir(__dirname)`, so
  // `process.cwd()` at runtime is `<app>/.next/standalone`. A relative
  // DATABASE_URL would open a database inside the build output — a directory
  // the deploy pipeline replaces on every push. Resolve everything to an
  // absolute path under the data root before Prisma is constructed.
  const resolvedDatabaseUrl = resolveDatabaseUrl(configuredDatabaseUrl);
  if (resolvedDatabaseUrl) env.DATABASE_URL = resolvedDatabaseUrl;
  env.UPLOAD_DIR = getUploadDir();
  env.BACKUP_DIR = getBackupDir();
  process.env.UPLOAD_DIR = env.UPLOAD_DIR;
  process.env.BACKUP_DIR = env.BACKUP_DIR;

  const sqliteSpecifier = configuredDatabaseUrl.startsWith('file:')
    ? configuredDatabaseUrl.slice('file:'.length).split('?')[0]
    : '';
  if (sqliteSpecifier && sqliteSpecifier !== ':memory:' && !isAbsolute(sqliteSpecifier)) {
    errors.push(
      `  - DATABASE_URL is a relative path ("${configuredDatabaseUrl}"). It was resolved to ` +
        `"${env.DATABASE_URL}" for this run, but set an absolute path in the host panel so the ` +
        `database is unaffected by where the server process is started.`,
    );
  }
  if (env.APP_DATA_DIR && !isAbsolute(env.APP_DATA_DIR)) {
    errors.push(`  - APP_DATA_DIR must be an absolute path (got "${env.APP_DATA_DIR}")`);
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

  // One line so a deploy log always shows where this release keeps its data.
  // When a production site reports an empty database, this is the first thing
  // to compare against the host panel's configuration.
  console.log(
    `[env] data root: ${getDataRoot()}\n` +
      `[env] database:  ${env.DATABASE_URL || '(unset)'}\n` +
      `[env] uploads:   ${env.UPLOAD_DIR}\n` +
      `[env] backups:   ${env.BACKUP_DIR}`,
  );

  return env;
}

export const env = validateEnv();
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
