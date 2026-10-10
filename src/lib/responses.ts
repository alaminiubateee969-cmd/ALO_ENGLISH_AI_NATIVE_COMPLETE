/**
 * src/lib/responses.ts — Consistent API response helpers.
 *
 * Enforces the single response structure required by the production standard:
 *
 *   Success: { success: true,  status: 200, message: "...", data: {} }
 *   Error:   { success: false, status: 400, message: "...", error: "CODE" }
 *
 * Every API route MUST use these helpers — never raw NextResponse.json.
 */

import { NextResponse } from 'next/server';

export type ApiSuccess<T> = {
  success: true;
  status: number;
  message: string;
  data: T;
};

export type ApiError = {
  success: false;
  status: number;
  message: string;
  error: string;
};

/** Standard error codes. */
export const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/** 200 OK with data. */
export function ok<T>(data: T, message = 'Operation completed'): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, status: 200, message, data }, { status: 200 });
}

/** 201 Created with data. */
export function created<T>(data: T, message = 'Resource created'): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, status: 201, message, data }, { status: 201 });
}

/** 400 Bad Request. */
export function badRequest(message: string, error = ERROR_CODES.BAD_REQUEST): NextResponse<ApiError> {
  return NextResponse.json({ success: false, status: 400, message, error }, { status: 400 });
}

/** 401 Unauthorized. */
export function unauthorized(message = 'Authentication required'): NextResponse<ApiError> {
  return NextResponse.json({ success: false, status: 401, message, error: ERROR_CODES.UNAUTHORIZED }, { status: 401 });
}

/** 403 Forbidden. */
export function forbidden(message = 'Insufficient permissions'): NextResponse<ApiError> {
  return NextResponse.json({ success: false, status: 403, message, error: ERROR_CODES.FORBIDDEN }, { status: 403 });
}

/** 404 Not Found. */
export function notFound(message = 'Resource not found'): NextResponse<ApiError> {
  return NextResponse.json({ success: false, status: 404, message, error: ERROR_CODES.NOT_FOUND }, { status: 404 });
}

/** 405 Method Not Allowed. */
export function methodNotAllowed(allowed: string[]): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, status: 405, message: `Method not allowed. Allowed: ${allowed.join(', ')}`, error: ERROR_CODES.METHOD_NOT_ALLOWED },
    { status: 405, headers: { Allow: allowed.join(', ') } }
  );
}

/** 409 Conflict. */
export function conflict(message: string): NextResponse<ApiError> {
  return NextResponse.json({ success: false, status: 409, message, error: ERROR_CODES.CONFLICT }, { status: 409 });
}

/** 422 Unprocessable Entity (validation error). */
export function unprocessable(message: string): NextResponse<ApiError> {
  return NextResponse.json({ success: false, status: 422, message, error: ERROR_CODES.UNPROCESSABLE_ENTITY }, { status: 422 });
}

/** 413 Payload Too Large. */
export function payloadTooLarge(message = 'Request body exceeds the allowed size'): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, status: 413, message, error: ERROR_CODES.PAYLOAD_TOO_LARGE },
    { status: 413, headers: { 'Cache-Control': 'no-store' } }
  );
}

/** 429 Too Many Requests. */
export function rateLimited(message = 'Too many requests. Please try again later.'): NextResponse<ApiError> {
  return NextResponse.json({ success: false, status: 429, message, error: ERROR_CODES.RATE_LIMITED }, { status: 429 });
}

/** 503 Service Unavailable — a required provider/integration is not configured. */
export function serviceUnavailable(message = 'This service is not configured yet'): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, status: 503, message, error: ERROR_CODES.SERVICE_UNAVAILABLE },
    { status: 503, headers: { 'Cache-Control': 'no-store' } }
  );
}

/** 500 Internal Server Error — never leak details. */
export function internalError(message = 'An internal error occurred'): NextResponse<ApiError> {
  return NextResponse.json({ success: false, status: 500, message, error: ERROR_CODES.INTERNAL_ERROR }, { status: 500 });
}

/** Wrap an async handler with try/catch + consistent error response. */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  return handler().catch((err) => {
    console.error('[api-error]', err);

    // Handle AuthError with custom status codes (401, 403).
    if (err && typeof err === 'object' && 'statusCode' in err) {
      const statusCode = (err as { statusCode: number }).statusCode;
      const message = err instanceof Error ? err.message : 'Error';
      if (statusCode === 401) {
        return NextResponse.json({ success: false, status: 401, message, error: ERROR_CODES.UNAUTHORIZED }, { status: 401 });
      }
      if (statusCode === 403) {
        return NextResponse.json({ success: false, status: 403, message, error: ERROR_CODES.FORBIDDEN }, { status: 403 });
      }
    }

    // Never expose the raw error message in production.
    const message = process.env.NODE_ENV === 'production'
      ? 'An internal error occurred'
      : err instanceof Error ? err.message : 'Unknown error';
    return internalError(message);
  });
}
