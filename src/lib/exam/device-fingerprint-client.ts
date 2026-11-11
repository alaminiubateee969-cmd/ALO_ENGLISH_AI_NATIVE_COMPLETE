/**
 * src/lib/exam/device-fingerprint-client.ts
 *
 * Client-safe device fingerprint utilities — NO server imports (no db, no fs).
 * This file is safe to import from "use client" components.
 */

export const TAB_SWITCH_WARNING_THRESHOLD = 3;
export const TAB_SWITCH_AUTO_SUBMIT_THRESHOLD = 5;

export type DeviceFingerprint = {
  userAgent: string;
  screen: { width: number; height: number; colorDepth: number };
  timezone: string;
  language: string;
  canvasHash?: string;
  webglHash?: string;
};

/**
 * Collect device fingerprint in the browser.
 * Uses canvas + WebGL + screen + timezone + UA.
 */
export async function collectDeviceFingerprint(): Promise<DeviceFingerprint> {
  if (typeof window === "undefined") {
    return {
      userAgent: "server",
      screen: { width: 0, height: 0, colorDepth: 0 },
      timezone: "UTC",
      language: "en",
    };
  }

  const fp: DeviceFingerprint = {
    userAgent: navigator.userAgent,
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    language: navigator.language || "en",
  };

  // Canvas fingerprint
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#F60";
      ctx.fillRect(0, 0, 200, 50);
      ctx.fillStyle = "#069";
      ctx.fillText("ALO-fingerprint", 2, 2);
      fp.canvasHash = canvas.toDataURL().slice(-32);
    }
  } catch {
    // ignore
  }

  // WebGL fingerprint
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        fp.webglHash = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).slice(0, 32);
      }
    }
  } catch {
    // ignore
  }

  return fp;
}
