/**
 * src/lib/sanitize.ts — Input sanitization utilities.
 *
 * Defense-in-depth against XSS, path traversal, and injection.
 * Even though we use Zod for validation, these helpers add a second layer.
 */

/**
 * Sanitize a string for safe HTML display.
 * Escapes <, >, &, ", '.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strip HTML tags from a string.
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize a filename: remove path separators, null bytes, and dangerous patterns.
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components.
  const basename = filename.replace(/^.*[\\/]/, '');
  // Remove null bytes and control characters.
  const clean = basename.replace(/[\x00-\x1f\x7f]/g, '');
  // Remove leading dots (hidden files / directory traversal).
  const noDots = clean.replace(/^\.+/, '');
  // Allow only alphanumeric, dash, underscore, dot.
  const safe = noDots.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Limit length.
  return safe.slice(0, 255) || 'unnamed';
}

/**
 * Validate that a path stays within a base directory (path traversal prevention).
 */
import { resolve, sep } from 'path';

export function isPathSafe(requestedPath: string, basePath: string): boolean {
  const resolved = resolve(basePath, requestedPath);
  const normalizedBase = resolve(basePath);
  return resolved.startsWith(normalizedBase + sep) || resolved === normalizedBase;
}

/**
 * Sanitize a URL for safe redirect (prevent open redirect attacks).
 * Only allows relative URLs or URLs matching the APP_URL origin.
 */
export function sanitizeRedirect(url: string): string {
  // Only allow relative paths starting with /.
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }
  // Allow same-origin absolute URLs.
  const appUrl = process.env.APP_URL || '';
  if (appUrl && url.startsWith(appUrl)) {
    return url;
  }
  // Default to home for anything else.
  return '/';
}

/**
 * Truncate a string to a max length (for logging/display).
 */
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + '...';
}

/**
 * Mask a sensitive value for logging (e.g., emails, partial keys).
 */
export function mask(value: string, visible = 4): string {
  if (value.length <= visible) return '*'.repeat(value.length);
  return value.slice(0, visible) + '*'.repeat(Math.min(value.length - visible, 20));
}
