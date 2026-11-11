/**
 * src/lib/exam/device-fingerprint.ts
 *
 * Device verification for the ALO exam platform.
 *
 * The browser collects a fingerprint (userAgent, screen geometry, timezone,
 * language, hardware concurrency, canvas hash) and ships it to
 * POST /api/attempts/start, which freezes it onto the Attempt row. The
 * server never trusts the browser clock — it does not trust the device
 * payload either: `deviceId` is computed server-side from the validated
 * JSON, so a malicious client cannot spoof another learner's device.
 *
 * Same-device reuse detection is informational only. A real proctored exam
 * blocks a known device on a second concurrent attempt; here we only log
 * and expose the count so the platform can flag suspicious patterns
 * without blocking legitimate re-takes on a shared laptop.
 *
 * The module is isomorphic: the collector function only touches DOM APIs
 * inside its own body (so importing it from a server module is safe), but
 * it must only be CALLED from the client.
 */

import { db } from "@/lib/db";
import { z } from "zod";

/** Maximum bytes the start API will persist as `deviceFingerprint` JSON. */
export const DEVICE_FINGERPRINT_MAX_BYTES = 4096;
/** Length of the truncated SHA-256 hash used as `deviceId`. */
export const DEVICE_ID_LENGTH = 16;
/** Events that trigger a "tab switch" in the proctoring detector. */
export const TAB_SWITCH_WARNING_THRESHOLD = 3;
export const TAB_SWITCH_AUTO_SUBMIT_THRESHOLD = 5;

/** Shape of the validated fingerprint payload a client sends to /start. */
export const DeviceFingerprintSchema = z.object({
  userAgent: z.string().max(512),
  platform: z.string().max(128).optional(),
  vendor: z.string().max(128).optional(),
  language: z.string().max(64).optional(),
  languages: z.array(z.string().max(64)).max(8).optional(),
  screen: z
    .object({
      width: z.number().int().nonnegative(),
      height: z.number().int().nonnegative(),
      availWidth: z.number().int().nonnegative().optional(),
      availHeight: z.number().int().nonnegative().optional(),
      colorDepth: z.number().int().nonnegative().optional(),
      pixelDepth: z.number().int().nonnegative().optional(),
    })
    .optional(),
  viewport: z
    .object({
      width: z.number().int().nonnegative(),
      height: z.number().int().nonnegative(),
      devicePixelRatio: z.number().positive().optional(),
    })
    .optional(),
  timezone: z.string().max(128).optional(),
  timezoneOffsetMin: z.number().int().optional(),
  hardwareConcurrency: z.number().int().nonnegative().optional(),
  deviceMemoryGB: z.number().nonnegative().optional(),
  touchPoints: z.number().int().nonnegative().optional(),
  doNotTrack: z.string().max(8).optional(),
  cookieEnabled: z.boolean().optional(),
  online: z.boolean().optional(),
  /** Stable canvas hash collected via OffscreenCanvas/HTMLCanvasElement. */
  canvasHash: z.string().max(128).optional(),
  /** Stable WebGL hash, when available. */
  webglHash: z.string().max(128).optional(),
  /** Audio context hash (subtle). Optional. */
  audioHash: z.string().max(128).optional(),
  /** Random per-browser sessionId — NOT a stable identifier; included so the
   *  server can spot a payload that lost its stable signals. */
  sessionId: z.string().max(64).optional(),
  /** ISO date the client collected the fingerprint. */
  collectedAt: z.string().max(64).optional(),
});

export type DeviceFingerprint = z.infer<typeof DeviceFingerprintSchema>;

/** A normalized summary returned to the start API for audit/display. */
export type DeviceFingerprintSummary = {
  deviceId: string;
  fingerprintJson: string;
  byteLength: number;
  /** Best-effort human label (e.g. "Chrome 124 on macOS"). */
  label: string;
};

/**
 * Compute a stable, short, hex device id from the fingerprint payload.
 *
 * The hash deliberately excludes anything that drifts between sessions on
 * the same device (viewport size, sessionId, online state, collectedAt) so
 * the same laptop produces the same id across reloads. The remaining
 * stable fields (UA, screen, timezone, language, canvas hash) are joined
 * in a fixed order and hashed with the Web Crypto API when available, or
 * with a small FNV-1a fallback (used only when SubtleCrypto is missing,
 * which is rare on a modern browser).
 *
 * Pure function — safe to call from either server or client. The start
 * route MUST call this to derive `deviceId` from the validated JSON, so a
 * malicious client cannot spoof another learner's device id.
 */
export async function deriveDeviceId(fp: DeviceFingerprint): Promise<string> {
  const stable: Record<string, unknown> = {
    ua: fp.userAgent,
    platform: fp.platform ?? null,
    vendor: fp.vendor ?? null,
    language: fp.language ?? null,
    languages: fp.languages ?? null,
    screen: fp.screen ?? null,
    tz: fp.timezone ?? null,
    tzOff: fp.timezoneOffsetMin ?? null,
    hw: fp.hardwareConcurrency ?? null,
    mem: fp.deviceMemoryGB ?? null,
    touch: fp.touchPoints ?? null,
    dnt: fp.doNotTrack ?? null,
    cookie: fp.cookieEnabled ?? null,
    canvas: fp.canvasHash ?? null,
    webgl: fp.webglHash ?? null,
    audio: fp.audioHash ?? null,
  };
  const payload = JSON.stringify(stable, Object.keys(stable).sort());

  // Prefer SubtleCrypto. In a server module this resolves to the Node
  // implementation; in a browser to the WebCrypto polyfill. Either way the
  // digest is SHA-256, so the id is reproducible across both sides.
  try {
    const digest = await sha256Hex(payload);
    return digest.slice(0, DEVICE_ID_LENGTH);
  } catch {
    // Fallback: FNV-1a over the same payload. Collisions are very unlikely
    // in practice (2^32 hash space, ~16 hex chars picked from the output).
    return fnv1aHex(payload).slice(0, DEVICE_ID_LENGTH);
  }
}

/** Stable, human-readable label for audit / display surfaces. */
export function describeDevice(fp: DeviceFingerprint): string {
  const ua = fp.userAgent;
  const browser = detectBrowser(ua);
  const os = detectOS(ua, fp.platform);
  return `${browser} on ${os}`.trim();
}

/**
 * Server-side informational check: how many prior attempts by this user
 * were taken from the same device id? Never blocks; just returns the count
 * and the most recent prior attempt's timestamp so the start API can
 * include a `deviceReuse` notice in its response (and the audit log).
 *
 * Only counts attempts that were actually started (any status). The
 * current attempt's id, if provided, is excluded so resuming a started
 * attempt does not flag itself.
 */
export async function detectDeviceReuse(
  userId: string,
  deviceId: string,
  excludeAttemptId?: string,
): Promise<{ reuseCount: number; lastSeenAt: Date | null }> {
  if (!deviceId) return { reuseCount: 0, lastSeenAt: null };
  const rows = await db.attempt.findMany({
    where: {
      userId,
      deviceId,
      ...(excludeAttemptId ? { id: { not: excludeAttemptId } } : {}),
    },
    select: { startedAt: true },
    orderBy: { startedAt: "desc" },
    take: 1,
  });
  const total = await db.attempt.count({
    where: {
      userId,
      deviceId,
      ...(excludeAttemptId ? { id: { not: excludeAttemptId } } : {}),
    },
  });
  return { reuseCount: total, lastSeenAt: rows[0]?.startedAt ?? null };
}

// ─── Browser-only collector ─────────────────────────────────────────────
//
// `collectDeviceFingerprint` reaches into window/navigator/screen/canvas.
// It MUST only be CALLED from a client component. Importing this module
// from a server file is safe — the DOM references are inside function
// bodies, not evaluated at import time.

/**
 * Collect a device fingerprint from the current browser.
 *
 * Returns the raw fingerprint object plus the derived `deviceId`. The
 * caller (startTest in practice-test/page.tsx) ships both to the start
 * API, but the server re-derives the id from the JSON, so tampering with
 * the id field is harmless.
 *
 * Throws a descriptive error if called outside a browser context.
 */
export async function collectDeviceFingerprint(): Promise<{
  fingerprint: DeviceFingerprint;
  deviceId: string;
  summary: DeviceFingerprintSummary;
}> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    throw new Error(
      "collectDeviceFingerprint() can only be called from a browser context.",
    );
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    userAgentData?: { platform?: string; brands?: Array<{ brand: string; version: string }> };
  };
  const screenObj = (typeof screen !== "undefined" ? screen : null) as Screen | null;

  const viewport = {
    width: window.innerWidth || 0,
    height: window.innerHeight || 0,
    devicePixelRatio: window.devicePixelRatio || 1,
  };

  const sessionId = ensureBrowserSessionId();

  const fingerprint: DeviceFingerprint = {
    userAgent: navigator.userAgent || "unknown",
    platform: nav.platform || nav.userAgentData?.platform || undefined,
    vendor: navigator.vendor || undefined,
    language: navigator.language || undefined,
    languages: Array.from(navigator.languages ?? []),
    screen: screenObj
      ? {
          width: screenObj.width,
          height: screenObj.height,
          availWidth: screenObj.availWidth,
          availHeight: screenObj.availHeight,
          colorDepth: screenObj.colorDepth,
          pixelDepth: screenObj.pixelDepth,
        }
      : undefined,
    viewport,
    timezone: tryTimezone(),
    timezoneOffsetMin: new Date().getTimezoneOffset(),
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemoryGB: typeof nav.deviceMemory === "number" ? nav.deviceMemory : undefined,
    touchPoints: navigator.maxTouchPoints ?? 0,
    doNotTrack: navigator.doNotTrack ?? undefined,
    cookieEnabled: navigator.cookieEnabled,
    online: navigator.onLine,
    canvasHash: await collectCanvasHash(),
    webglHash: collectWebglHash(),
    audioHash: undefined,
    sessionId,
    collectedAt: new Date().toISOString(),
  };

  const deviceId = await deriveDeviceId(fingerprint);
  const fingerprintJson = JSON.stringify(fingerprint);
  return {
    fingerprint,
    deviceId,
    summary: {
      deviceId,
      fingerprintJson,
      byteLength: fingerprintJson.length,
      label: describeDevice(fingerprint),
    },
  };
}

/**
 * Stable per-tab session id, used only to spot a payload that lost its
 * stable signals (e.g. fingerprint library failed). NOT a stable
 * identifier across reloads.
 */
function ensureBrowserSessionId(): string {
  try {
    const KEY = "alo.device.sessionId";
    let id = window.sessionStorage.getItem(KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      window.sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

function tryTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Canvas fingerprint. Renders a fixed scene with mixed glyphs and reads
 * back the pixel data; a hash of that string is highly stable for a given
 * (GPU, OS, font set, browser version) tuple.
 */
async function collectCanvasHash(): Promise<string | undefined> {
  try {
    if (typeof document === "undefined") return undefined;
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.textBaseline = "top";
    ctx.font = "16px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 240, 60);
    ctx.fillStyle = "#069";
    ctx.fillText("ALO-Device-Probe: Ω≈ç√∫˜µ≤≥÷", 2, 2);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("ALO-Device-Probe: Ω≈ç√∫˜µ≤≥÷", 4, 4);
    const dataUrl = canvas.toDataURL();
    return (await sha256Hex(dataUrl)).slice(0, 32);
  } catch {
    return undefined;
  }
}

/** WebGL fingerprint: vendor + renderer strings, hashed. */
function collectWebglHash(): string | undefined {
  try {
    if (typeof document === "undefined") return undefined;
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return undefined;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const vendor = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : null;
    const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null;
    const payload = `${vendor ?? ""}|${renderer ?? ""}`;
    // Synchronous hash: WebGL is browser-only, so we can use a tiny sync
    // hash here without pulling SubtleCrypto.
    return fnv1aHex(payload).slice(0, 32);
  } catch {
    return undefined;
  }
}

// ─── Hash helpers ────────────────────────────────────────────────────────

async function sha256Hex(input: string): Promise<string> {
  const cryptoObj =
    (typeof globalThis !== "undefined" && (globalThis as { crypto?: Crypto }).crypto) || undefined;
  if (!cryptoObj?.subtle) throw new Error("SubtleCrypto unavailable");
  const bytes = new TextEncoder().encode(input);
  const digest = await cryptoObj.subtle.digest("SHA-256", bytes);
  return bufToHex(new Uint8Array(digest));
}

function bufToHex(buf: Uint8Array): string {
  let out = "";
  for (let i = 0; i < buf.length; i++) {
    out += buf[i].toString(16).padStart(2, "0");
  }
  return out;
}

/** FNV-1a (32-bit) hex hash. Synchronous; used only as a fallback. */
function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // 32-bit FNV multiplier, with JS bitwise wrap.
    hash = Math.imul(hash, 0x01000193);
  }
  // Two passes to widen the output without a second dependency.
  let h2 = hash >>> 0;
  let hash2 = 0x811c9dc5;
  const s = String(h2) + "|" + input.length;
  for (let i = 0; i < s.length; i++) {
    hash2 ^= s.charCodeAt(i);
    hash2 = Math.imul(hash2, 0x01000193);
  }
  return (h2.toString(16).padStart(8, "0") + (hash2 >>> 0).toString(16).padStart(8, "0")).slice(
    0,
    DEVICE_ID_LENGTH,
  );
}

// ─── UA parsing (very small — only for the human label) ──────────────────

function detectBrowser(ua: string): string {
  const tests: Array<[string, RegExp, string]> = [
    ["Edge", /Edg\/(\d+)/, "Edge"],
    ["Opera", /OPR\/(\d+)/, "Opera"],
    ["Chrome", /Chrome\/(\d+)/, "Chrome"],
    ["Firefox", /Firefox\/(\d+)/, "Firefox"],
    ["Safari", /Version\/(\d+).*Safari/, "Safari"],
  ];
  for (const [, re, name] of tests) {
    const m = ua.match(re);
    if (m) return `${name} ${m[1] ?? ""}`.trim();
  }
  return "Unknown browser";
}

function detectOS(ua: string, platform?: string): string {
  const uaLower = ua.toLowerCase();
  if (uaLower.includes("android")) return "Android";
  if (uaLower.includes("iphone") || uaLower.includes("ipad")) return "iOS";
  if (uaLower.includes("mac os") || uaLower.includes("macintosh") || platform === "MacIntel") {
    return "macOS";
  }
  if (uaLower.includes("windows")) return "Windows";
  if (uaLower.includes("linux") || platform === "Linux") return "Linux";
  return "Unknown OS";
}
