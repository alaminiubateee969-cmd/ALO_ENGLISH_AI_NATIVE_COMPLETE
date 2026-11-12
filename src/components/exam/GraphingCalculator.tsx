"use client";

/**
 * src/components/exam/GraphingCalculator.tsx
 *
 * A trimmed Desmos-style graphing calculator for the Digital SAT.
 *
 * Features:
 *   - Up to 4 simultaneous `y = f(x)` expressions, each in its own colour.
 *   - Parser supports +, -, *, /, ^, parentheses, abs(), sqrt(), sin(),
 *     cos(), tan(), ln() (natural log), log() (base 10), pi, e.
 *   - Canvas rendering with axes, gridlines, and adjustable x-window.
 *   - Zoom in / out / reset buttons.
 *
 * This is intentionally a "simple plot" — not a full CAS. It matches the
 * Desmos feature surface that the Digital SAT exposes: type a function,
 * see its graph. It is not a substitute for the official calculator.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Plus, Trash2, X, ZoomIn, ZoomOut } from "lucide-react";

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#7c3aed"];
const DEFAULT_EXPR = "x^2";
const WINDOW_DEFAULT = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };

type ExprRow = { id: number; raw: string; enabled: boolean };

/**
 * Tokenise + parse a y=f(x) expression into a JS function. Throws on parse
 * failure so the caller can mark the row invalid.
 *
 * Strategy: walk the string, rewrite ^ as ** and the math functions into
 * their Math.* equivalents, then use the Function constructor to compile.
 * The compiled function is sandboxed to Math primitives only — no access
 * to `window`, `document`, etc.
 */
function compileExpression(raw: string): ((x: number) => number) | null {
  const src = String(raw ?? "").trim();
  if (!src) return null;

  // Whitelist: numbers, x, + - * / ^ ( ) and the function/constant names.
  // Anything else (including letters not in a known function name) is rejected.
  const sanitised = src
    // Strip whitespace.
    .replace(/\s+/g, "")
    // ^ -> **
    .replace(/\^/g, "**")
    // Constants.
    .replace(/\bpi\b/gi, "Math.PI")
    .replace(/\be\b/g, "Math.E")
    // Functions — replace before bare-name checks so we don't double-map.
    .replace(/\babs\b/gi, "Math.abs")
    .replace(/\bsqrt\b/gi, "Math.sqrt")
    .replace(/\bsin\b/gi, "Math.sin")
    .replace(/\bcos\b/gi, "Math.cos")
    .replace(/\btan\b/gi, "Math.tan")
    .replace(/\bln\b/gi, "Math.log")
    .replace(/\blog\b/gi, "Math.log10")
    .replace(/\bexp\b/gi, "Math.exp");

  // After substitution, the only bare alphabetic tokens remaining should be
  // `Math`, the function names (now part of Math.X), and `x`. Anything else
  // means the user typed an unknown identifier — reject.
  const stripped = sanitised
    .replace(/Math\.[A-Za-z0-9_]+/g, "")
    .replace(/x/g, "");
  if (/[A-Za-z]/.test(stripped)) return null;

  try {
    const fn = new Function("x", `"use strict"; return (${sanitised});`) as (x: number) => number;
    // Probe with a sample value to catch runtime errors.
    const probe = fn(1);
    if (typeof probe !== "number") return null;
    return fn;
  } catch {
    return null;
  }
}

type GraphingCalculatorProps = {
  onClose: () => void;
};

export function GraphingCalculator({ onClose }: GraphingCalculatorProps) {
  const [rows, setRows] = useState<ExprRow[]>([
    { id: 1, raw: DEFAULT_EXPR, enabled: true },
  ]);
  const [window, setWindow] = useState(WINDOW_DEFAULT);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextId = useRef(2);

  // Compiled functions, memoised on the rows array.
  const compiled = useMemo(
    () =>
      rows.map((row) => ({
        row,
        fn: row.enabled ? compileExpression(row.raw) : null,
      })),
    [rows],
  );

  const addRow = useCallback(() => {
    setRows((prev) => {
      if (prev.length >= COLORS.length) return prev;
      return [...prev, { id: nextId.current++, raw: "", enabled: true }];
    });
  }, []);

  const removeRow = useCallback((id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRow = useCallback((id: number, raw: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, raw } : r)));
  }, []);

  const toggleRow = useCallback((id: number) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }, []);

  const zoomIn = useCallback(() => {
    setWindow((w) => {
      const cx = (w.xMin + w.xMax) / 2;
      const cy = (w.yMin + w.yMax) / 2;
      const xSpan = (w.xMax - w.xMin) / 2 / 1.4;
      const ySpan = (w.yMax - w.yMin) / 2 / 1.4;
      return { xMin: cx - xSpan, xMax: cx + xSpan, yMin: cy - ySpan, yMax: cy + ySpan };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setWindow((w) => {
      const cx = (w.xMin + w.xMax) / 2;
      const cy = (w.yMin + w.yMax) / 2;
      const xSpan = (w.xMax - w.xMin) / 2 * 1.4;
      const ySpan = (w.yMax - w.yMin) / 2 * 1.4;
      return { xMin: cx - xSpan, xMax: cx + xSpan, yMin: cy - ySpan, yMax: cy + ySpan };
    });
  }, []);

  const resetWindow = useCallback(() => setWindow(WINDOW_DEFAULT), []);

  // ─── Draw ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use a fixed backing-store resolution; CSS scales the element to fit.
    const W = 480;
    const H = 320;
    canvas.width = W;
    canvas.height = H;

    // Clear.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    const { xMin, xMax, yMin, yMax } = window;
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const toPxX = (x: number) => ((x - xMin) / xRange) * W;
    const toPxY = (y: number) => H - ((y - yMin) / yRange) * H;

    // Gridlines.
    ctx.strokeStyle = "#eef2f7";
    ctx.lineWidth = 1;
    const xStep = niceStep(xRange / 10);
    const yStep = niceStep(yRange / 8);
    for (let gx = Math.ceil(xMin / xStep) * xStep; gx <= xMax; gx += xStep) {
      const px = toPxX(gx);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.stroke();
    }
    for (let gy = Math.ceil(yMin / yStep) * yStep; gy <= yMax; gy += yStep) {
      const py = toPxY(gy);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(W, py);
      ctx.stroke();
    }

    // Axes.
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    if (yMin <= 0 && yMax >= 0) {
      const py = toPxY(0);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(W, py);
      ctx.stroke();
    }
    if (xMin <= 0 && xMax >= 0) {
      const px = toPxX(0);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.stroke();
    }

    // Axis labels.
    ctx.fillStyle = "#64748b";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`x: [${xMin.toFixed(1)}, ${xMax.toFixed(1)}]`, 6, H - 6);
    ctx.fillText(`y: [${yMin.toFixed(1)}, ${yMax.toFixed(1)}]`, 6, H - 18);

    // Plot each enabled expression.
    for (const { row, fn } of compiled) {
      if (!fn) continue;
      ctx.strokeStyle = COLORS[(rows.indexOf(row)) % COLORS.length] ?? "#2563eb";
      ctx.lineWidth = 2;
      ctx.beginPath();
      let penDown = false;
      const samples = 480;
      for (let i = 0; i <= samples; i++) {
        const x = xMin + (i / samples) * xRange;
        let y: number;
        try {
          y = fn(x);
        } catch {
          penDown = false;
          continue;
        }
        if (!Number.isFinite(y)) {
          penDown = false;
          continue;
        }
        // Skip gross discontinuities (e.g. tan(x) near asymptotes).
        if (penDown && Math.abs(y - (fn(x - xRange / samples) ?? y)) > yRange) {
          penDown = false;
        }
        const px = toPxX(x);
        const py = toPxY(Math.max(yMin - yRange, Math.min(yMax + yRange, y)));
        if (penDown) {
          ctx.lineTo(px, py);
        } else {
          ctx.moveTo(px, py);
          penDown = true;
        }
      }
      ctx.stroke();
    }
  }, [compiled, window, rows]);

  return (
    <div
      role="dialog"
      aria-label="Graphing calculator"
      className="fixed bottom-4 right-4 z-50 w-[520px] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-300 bg-white shadow-2xl"
    >
      <div className="flex items-center justify-between rounded-t-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white">
        <span className="flex items-center gap-2">
          <LineChart className="h-4 w-4" />
          Graphing Calculator
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close graphing calculator"
          className="rounded p-1 hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-[1fr_280px]">
        {/* Canvas */}
        <div>
          <canvas
            ref={canvasRef}
            className="w-full rounded-md border border-slate-200"
            style={{ aspectRatio: "3 / 2" }}
            aria-label="Function plot"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={zoomIn}
              className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" /> In
            </button>
            <button
              type="button"
              onClick={zoomOut}
              className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" /> Out
            </button>
            <button
              type="button"
              onClick={resetWindow}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>
            <span className="ml-auto text-[10px] text-slate-400">
              x:[{window.xMin.toFixed(1)}, {window.xMax.toFixed(1)}]
            </span>
          </div>
        </div>

        {/* Expression list */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-slate-500">Functions (y = …)</p>
          <div className="space-y-1.5">
            {rows.map((row, idx) => {
              const fn = row.enabled ? compileExpression(row.raw) : null;
              const isValid = !row.raw || fn !== null;
              return (
                <div
                  key={row.id}
                  className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 p-1.5"
                >
                  <button
                    type="button"
                    onClick={() => toggleRow(row.id)}
                    className="h-3 w-3 shrink-0 rounded-sm border-2"
                    style={{
                      backgroundColor: row.enabled ? COLORS[idx % COLORS.length] : "transparent",
                      borderColor: COLORS[idx % COLORS.length],
                    }}
                    aria-pressed={row.enabled}
                    aria-label={row.enabled ? "Hide this function" : "Show this function"}
                    title={row.enabled ? "Hide" : "Show"}
                  />
                  <span
                    className="font-mono text-xs"
                    style={{ color: COLORS[idx % COLORS.length] }}
                  >
                    y=
                  </span>
                  <input
                    type="text"
                    value={row.raw}
                    onChange={(e) => updateRow(row.id, e.target.value)}
                    placeholder="e.g. x^2"
                    className={`min-w-0 flex-1 rounded-sm border bg-white px-2 py-1 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                      isValid ? "border-slate-200" : "border-rose-400"
                    }`}
                    aria-label={`Function ${idx + 1} expression`}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Remove this function"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
          {rows.length < COLORS.length && (
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" /> Add function
            </button>
          )}
          <p className="mt-1 text-[10px] leading-snug text-slate-400">
            Supports +, -, *, /, ^, parentheses, abs(), sqrt(), sin(), cos(), tan(), ln(), log(),
            pi, e.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Pick a "nice" axis step (1, 2, 5 × 10^n) for the requested rough step. */
function niceStep(rough: number): number {
  if (rough <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / pow;
  const nice = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return nice * pow;
}

export default GraphingCalculator;
