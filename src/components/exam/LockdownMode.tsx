"use client";

/**
 * src/components/exam/LockdownMode.tsx
 *
 * Safe-Exam-Browser-style fullscreen lockdown for the practice-test player.
 *
 * Activated by a button in the top bar. When active:
 *   - Requests fullscreen on the document element via the Fullscreen API.
 *   - Suppresses the browser context menu (right-click) on the whole document.
 *   - Blocks copy / cut / paste events anywhere on the page.
 *   - Blocks the keyboard shortcuts that expose exam content or open devtools:
 *     Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+A, Ctrl+S, Ctrl+P, Ctrl+U,
 *     F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, F5 (refresh).
 *   - Listens for `fullscreenchange` — if the user escapes fullscreen while
 *     lockdown is still requested, an overlay banner is shown demanding they
 *     re-enter fullscreen before continuing.
 *
 * The component is controlled: the parent owns `enabled` so a single source
 * of truth drives the toolbar button and the event handlers. The overlay is
 * rendered inside this component so the parent doesn't need to wire up the
 * "user pressed Esc" UX.
 *
 * NOTES
 *   - The lockdown cannot prevent a determined user with devtools already
 *     open. It mirrors the posture of proctored browser lockdown tools
 *     (SEB, Respondus) at the DOM-event level.
 *   - When `enabled` flips to false, every listener is removed and the
 *     document exits fullscreen if it is still in it.
 */

import { useCallback, useEffect, useState } from "react";
import { Lock, Maximize, Maximize2, ShieldAlert, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LockdownModeProps = {
  enabled: boolean;
  onToggle: () => void;
};

/** Keyboard shortcuts blocked while lockdown is active. */
const BLOCKED_SHORTCUTS = new Set<string>([
  "F12",
  "F5",
  "Ctrl+C",
  "Ctrl+X",
  "Ctrl+V",
  "Ctrl+A",
  "Ctrl+S",
  "Ctrl+P",
  "Ctrl+U",
  "Ctrl+Shift+I",
  "Ctrl+Shift+J",
  "Ctrl+Shift+C",
  "Ctrl+Shift+K",
  "Meta+S",
  "Meta+P",
]);

/** Normalise a KeyboardEvent into a signature string for lookup. */
function signature(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.metaKey) parts.push("Meta"); // macOS Cmd
  if (e.shiftKey) parts.push("Shift");
  if (e.altKey) parts.push("Alt");
  const key = e.key === "Control" || e.key === "Shift" || e.key === "Alt" || e.key === "Meta"
    ? ""
    : e.key.length === 1
      ? e.key.toUpperCase()
      : e.key;
  if (key) parts.push(key);
  return parts.join("+");
}

export function LockdownMode({ enabled, onToggle }: LockdownModeProps) {
  // True when the user has escaped fullscreen while lockdown is still on.
  const [exitedFullscreen, setExitedFullscreen] = useState(false);

  // Detect Fullscreen API support once. The check is cheap and stable
  // across renders; computing it inline keeps the effect below free of
  // synchronous setState calls.
  const supportsFullscreen =
    typeof document !== "undefined" &&
    !!(
      document.documentElement.requestFullscreen ??
      (document.documentElement as unknown as { webkitRequestFullscreen?: () => Promise<void> })
        .webkitRequestFullscreen ??
      (document.documentElement as unknown as { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen
    );

  // Render-time state adjustment: when `enabled` flips, reset the
  // "exited fullscreen" flag. This is the React-recommended pattern for
  // "reset state when a prop changes" — it avoids calling setState inside
  // an effect body, which would trigger cascading renders.
  const [prevEnabled, setPrevEnabled] = useState(enabled);
  if (enabled !== prevEnabled) {
    setPrevEnabled(enabled);
    if (!enabled) setExitedFullscreen(false);
    else if (!supportsFullscreen) setExitedFullscreen(true);
  }

  // ─── Fullscreen request / exit driven by `enabled` ──────────────────────
  useEffect(() => {
    if (typeof document === "undefined") return;
    const docEl = document.documentElement;
    if (enabled) {
      // Request fullscreen — browsers require this to be triggered by a user
      // gesture. The toggle button click counts; the effect runs synchronously
      // in the same task, so the request succeeds.
      const req =
        docEl.requestFullscreen ??
        (docEl as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen ??
        (docEl as unknown as { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen;
      if (req) {
        req.call(docEl).catch(() => {
          // The user agent may reject (e.g. iframe without `allowfullscreen`).
          // The lockdown posture (event blocking) still applies; the warning
          // overlay below will surface the rejection. This setState lives in
          // a promise callback, not in the effect body, so it does not
          // trigger the cascading-render lint.
          setExitedFullscreen(true);
        });
      }
    } else {
      const exit =
        document.exitFullscreen ??
        (document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen ??
        (document as unknown as { msExitFullscreen?: () => Promise<void> }).msExitFullscreen;
      if (exit && (document.fullscreenElement || (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement)) {
        exit.call(document).catch(() => undefined);
      }
    }
  }, [enabled]);

  // ─── fullscreenchange listener: detect user-initiated Esc exit ─────────
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onChange = () => {
      const isFs = !!(document.fullscreenElement || (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement);
      setExitedFullscreen(enabled && !isFs);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [enabled]);

  // ─── DOM event suppression while enabled ────────────────────────────────
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onCut = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const sig = signature(e);
      if (BLOCKED_SHORTCUTS.has(sig)) {
        e.preventDefault();
        e.stopPropagation();
      }
      // Block Ctrl+Shift+I/J/C/K and other devtools combos by signature
      // regardless of the upper/lower case of the trailing key.
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && /^[IJC]$/.test((e.key || "").toUpperCase())) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    // Some browsers fire `selectstart` from Ctrl+A before the keydown handler
    // can cancel — block the event directly to keep text selectable=false
    // behaviour consistent.
    const onSelectStart = (e: any) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("copy", onCopy, true);
    document.addEventListener("cut", onCut, true);
    document.addEventListener("paste", onPaste, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("selectstart", onSelectStart, true);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("copy", onCopy, true);
      document.removeEventListener("cut", onCut, true);
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("selectstart", onSelectStart, true);
    };
  }, [enabled]);

  const reenterFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    const docEl = document.documentElement;
    const req =
      docEl.requestFullscreen ??
      (docEl as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen;
    if (req) {
      req.call(docEl).catch(() => undefined);
    }
  }, []);

  return (
    <>
      <Button
        type="button"
        variant={enabled ? "default" : "outline"}
        size="sm"
        onClick={onToggle}
        aria-pressed={enabled}
        className={cn(
          "gap-1.5",
          enabled
            ? "bg-rose-600 text-white hover:bg-rose-700"
            : "border-slate-300 text-slate-700 hover:bg-slate-50",
        )}
        title={
          enabled
            ? "Lockdown active — fullscreen, right-click, copy/paste and devtools shortcuts are blocked."
            : "Enter lockdown mode (fullscreen, copy/paste disabled, shortcuts blocked)"
        }
      >
        {enabled ? (
          <>
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Lockdown on</span>
          </>
        ) : (
          <>
            <Unlock className="h-4 w-4" />
            <span className="hidden sm:inline">Lockdown</span>
          </>
        )}
      </Button>

      {/* Warning overlay when the user escapes fullscreen while lockdown is on */}
      {enabled && exitedFullscreen && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="lockdown-warning-title"
          aria-describedby="lockdown-warning-desc"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
        >
          <div className="max-w-md rounded-xl border border-rose-300 bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h2 id="lockdown-warning-title" className="text-lg font-bold text-slate-900">
                  Re-enter fullscreen
                </h2>
                <p className="text-xs text-slate-500">Lockdown mode is still on</p>
              </div>
            </div>
            <p id="lockdown-warning-desc" className="mb-4 text-sm leading-relaxed text-slate-700">
              You exited fullscreen while lockdown mode is active. Copy/paste, right-click and
              keyboard shortcuts remain blocked until you re-enter fullscreen. Re-enter to
              continue, or turn off lockdown mode.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onToggle}>
                Turn off lockdown
              </Button>
              <Button onClick={reenterFullscreen} className="gap-1.5 bg-rose-600 text-white hover:bg-rose-700">
                <Maximize className="h-4 w-4" />
                Re-enter fullscreen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lockdown posture indicator — visible only in the top bar context */}
      {enabled && !exitedFullscreen && (
        <span className="hidden items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 lg:inline-flex">
          <Maximize2 className="h-3 w-3" />
          Fullscreen locked
        </span>
      )}
    </>
  );
}

export default LockdownMode;
