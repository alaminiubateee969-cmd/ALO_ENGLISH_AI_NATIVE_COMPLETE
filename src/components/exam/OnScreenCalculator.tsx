"use client";

/**
 * src/components/exam/OnScreenCalculator.tsx
 *
 * ETS POWERPREP-style on-screen calculator for the GRE / GMAT quantitative
 * sections. Rendered as a floating, draggable widget so it overlays the
 * question without claiming column space.
 *
 * Behaviour mirrors the official GRE on-screen calculator:
 *   - Display + transfer bar.
 *   - Digits 0–9, decimal point, sign toggle (+/-).
 *   - Operators +, -, ×, ÷ and the percent modifier.
 *   - Square root of the displayed value.
 *   - Memory: MC, MR, M+, M-.
 *   - C (clear all), CE (clear entry), backspace.
 *   - "Transfer" button copies the display into the focused answer input —
 *     kept off by default in this sandbox build; the platform's lockdown
 *     mode would otherwise block the paste.
 *
 * The widget is controlled: the parent owns `open` so the calculator
 * button can live in the top bar.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calculator, GripVertical, Minus, Plus, X } from "lucide-react";

type CalcState = {
  /** The value currently typed in (string so partial entries like "3." work). */
  entry: string;
  /** Stored left operand (null when no operator is pending). */
  accumulator: number | null;
  /** Pending operator. */
  operator: "+" | "-" | "*" | "/" | null;
  /** True once the user pressed "=" — next digit starts a new entry. */
  justEvaluated: boolean;
  /** Memory cell. */
  memory: number;
};

const INITIAL: CalcState = {
  entry: "0",
  accumulator: null,
  operator: null,
  justEvaluated: false,
  memory: 0,
};

const BUTTON_BASE =
  "h-10 rounded-md text-sm font-medium transition select-none focus:outline-none focus:ring-2 focus:ring-slate-300";
const DIGIT_CLASS = `${BUTTON_BASE} bg-slate-100 text-slate-900 hover:bg-slate-200`;
const OP_CLASS = `${BUTTON_BASE} bg-slate-200 text-slate-900 hover:bg-slate-300`;
const MEMORY_CLASS = `${BUTTON_BASE} bg-amber-50 text-amber-800 text-xs hover:bg-amber-100`;
const ACTION_CLASS = `${BUTTON_BASE} bg-slate-50 text-slate-700 text-xs hover:bg-slate-100`;
const EQUAL_CLASS = `${BUTTON_BASE} bg-slate-900 text-white hover:bg-slate-700`;

/** Format the display: limit to 12 significant digits, no trailing zeros. */
function formatDisplay(value: number): string {
  if (!Number.isFinite(value)) return "Error";
  if (value === 0) return "0";
  // Avoid scientific notation for the typical GRE calc range.
  const abs = Math.abs(value);
  if (abs >= 1e12 || abs < 1e-9) return value.toExponential(6);
  // Round to 10 significant figures and strip trailing zeros.
  const rounded = Number(value.toPrecision(12));
  return String(rounded);
}

function compute(a: number, b: number, op: NonNullable<CalcState["operator"]>): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b === 0 ? NaN : a / b;
  }
}

type OnScreenCalculatorProps = {
  onClose: () => void;
};

export function OnScreenCalculator({ onClose }: OnScreenCalculatorProps) {
  // The component is mounted on demand by the parent (rendered only while
  // the calculator toggle is on), so useState initialisers give the "reset
  // on every open" behaviour for free — no effect required.
  const [state, setState] = useState<CalcState>(INITIAL);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: typeof window !== "undefined" ? Math.max(8, window.innerWidth - 320) : 600,
    y: typeof window !== "undefined" ? Math.max(8, window.innerHeight - 460) : 120,
  });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  // Keep the widget inside the viewport on resize.
  useEffect(() => {
    const onResize = () => {
      const W = 280;
      const H = 360;
      setPosition((p) => ({
        x: Math.min(p.x, window.innerWidth - W - 8),
        y: Math.min(p.y, window.innerHeight - H - 8),
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const display = useMemo(() => {
    if (state.entry === "Error") return "Error";
    // Show the entry verbatim while typing; otherwise format numerically.
    if (state.entry === "" || state.entry === "-") return state.entry || "0";
    if (state.entry.endsWith(".")) return state.entry;
    return state.entry;
  }, [state.entry]);

  const inputDigit = useCallback((d: string) => {
    setState((s) => {
      if (s.entry === "Error") return { ...INITIAL, entry: d };
      if (s.justEvaluated) return { ...INITIAL, entry: d };
      // Limit to 12 digits to avoid overflow.
      const withoutSign = s.entry.replace("-", "");
      if (withoutSign.replace(".", "").length >= 12) return s;
      if (s.entry === "0") return { ...s, entry: d };
      if (s.entry === "-0") return { ...s, entry: `-${d}` };
      return { ...s, entry: s.entry + d };
    });
  }, []);

  const inputDot = useCallback(() => {
    setState((s) => {
      if (s.entry === "Error") return { ...INITIAL, entry: "0." };
      if (s.justEvaluated) return { ...INITIAL, entry: "0." };
      if (s.entry.includes(".")) return s;
      if (s.entry === "" || s.entry === "0") return { ...s, entry: "0." };
      if (s.entry === "-") return { ...s, entry: "-0." };
      return { ...s, entry: s.entry + "." };
    });
  }, []);

  const toggleSign = useCallback(() => {
    setState((s) => {
      if (s.entry === "Error" || s.entry === "0") return s;
      if (s.entry.startsWith("-")) return { ...s, entry: s.entry.slice(1) };
      return { ...s, entry: `-${s.entry}` };
    });
  }, []);

  const backspace = useCallback(() => {
    setState((s) => {
      if (s.entry === "Error") return INITIAL;
      if (s.justEvaluated) return INITIAL;
      if (s.entry.length <= 1 || (s.entry.length === 2 && s.entry.startsWith("-"))) {
        return { ...s, entry: "0" };
      }
      return { ...s, entry: s.entry.slice(0, -1) };
    });
  }, []);

  const clearAll = useCallback(() => setState(INITIAL), []);
  const clearEntry = useCallback(() => {
    setState((s) => ({ ...s, entry: "0", justEvaluated: false }));
  }, []);

  const applyOperator = useCallback((op: NonNullable<CalcState["operator"]>) => {
    setState((s) => {
      const value = Number.parseFloat(s.entry);
      if (!Number.isFinite(value)) return { ...INITIAL, entry: "Error" };
      if (s.accumulator === null || s.justEvaluated) {
        return { ...INITIAL, accumulator: value, operator: op, entry: formatDisplay(value), memory: s.memory };
      }
      if (s.operator) {
        const result = compute(s.accumulator, value, s.operator);
        if (!Number.isFinite(result)) return { ...INITIAL, entry: "Error", memory: s.memory };
        return { ...INITIAL, accumulator: result, operator: op, entry: formatDisplay(result), memory: s.memory };
      }
      return { ...s, accumulator: value, operator: op };
    });
  }, []);

  const evaluate = useCallback(() => {
    setState((s) => {
      if (s.operator === null || s.accumulator === null) return s;
      const value = Number.parseFloat(s.entry);
      if (!Number.isFinite(value)) return { ...INITIAL, entry: "Error", memory: s.memory };
      const result = compute(s.accumulator, value, s.operator);
      if (!Number.isFinite(result)) return { ...INITIAL, entry: "Error", memory: s.memory };
      return {
        ...INITIAL,
        entry: formatDisplay(result),
        accumulator: result,
        justEvaluated: true,
        memory: s.memory,
      };
    });
  }, []);

  const sqrt = useCallback(() => {
    setState((s) => {
      const value = Number.parseFloat(s.entry);
      if (!Number.isFinite(value) || value < 0) return { ...INITIAL, entry: "Error", memory: s.memory };
      return { ...s, entry: formatDisplay(Math.sqrt(value)), justEvaluated: true };
    });
  }, []);

  const percent = useCallback(() => {
    setState((s) => {
      const value = Number.parseFloat(s.entry);
      if (!Number.isFinite(value)) return { ...INITIAL, entry: "Error", memory: s.memory };
      // If an operator is pending, percent is "X% of the accumulator";
      // otherwise it is just value / 100.
      const result = s.accumulator !== null && s.operator ? (s.accumulator * value) / 100 : value / 100;
      return { ...s, entry: formatDisplay(result), justEvaluated: false };
    });
  }, []);

  // ─── Memory ───────────────────────────────────────────────────────────
  const memoryClear = useCallback(() => setState((s) => ({ ...s, memory: 0 })), []);
  const memoryRecall = useCallback(() => {
    setState((s) => ({ ...s, entry: formatDisplay(s.memory), justEvaluated: true }));
  }, []);
  const memoryAdd = useCallback(() => {
    setState((s) => {
      const value = Number.parseFloat(s.entry);
      if (!Number.isFinite(value)) return s;
      return { ...s, memory: s.memory + value, justEvaluated: true };
    });
  }, []);
  const memorySubtract = useCallback(() => {
    setState((s) => {
      const value = Number.parseFloat(s.entry);
      if (!Number.isFinite(value)) return s;
      return { ...s, memory: s.memory - value, justEvaluated: true };
    });
  }, []);

  // ─── Dragging the widget by its title bar ─────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: position.x,
      baseY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [position.x, position.y]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: Math.max(8, Math.min(window.innerWidth - 280 - 8, dragRef.current.baseX + dx)),
      y: Math.max(8, Math.min(window.innerHeight - 360 - 8, dragRef.current.baseY + dy)),
    });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  return (
    <div
      role="dialog"
      aria-label="On-screen calculator"
      className="fixed z-50 w-[280px] rounded-xl border border-slate-300 bg-white shadow-2xl"
      style={{ left: position.x, top: position.y }}
    >
      {/* Title bar — drag handle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="flex cursor-grab items-center justify-between rounded-t-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white active:cursor-grabbing"
      >
        <span className="flex items-center gap-2">
          <GripVertical className="h-3.5 w-3.5 opacity-70" />
          <Calculator className="h-4 w-4" />
          Calculator
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close calculator"
          className="rounded p-1 hover:bg-white/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-3">
        {/* Display */}
        <div className="mb-2 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-right">
          <div className="font-mono text-xs text-slate-400 h-4">
            {state.accumulator !== null && state.operator
              ? `${formatDisplay(state.accumulator)} ${state.operator === "*" ? "×" : state.operator === "/" ? "÷" : state.operator}`
              : state.memory !== 0
                ? "M"
                : ""}
          </div>
          <div
            className="font-mono text-2xl font-semibold text-slate-900 break-all"
            aria-live="polite"
            aria-atomic="true"
          >
            {display}
          </div>
        </div>

        {/* Memory row */}
        <div className="mb-2 grid grid-cols-4 gap-1">
          <button type="button" className={MEMORY_CLASS} onClick={memoryClear} aria-label="Memory clear">MC</button>
          <button type="button" className={MEMORY_CLASS} onClick={memoryRecall} aria-label="Memory recall">MR</button>
          <button type="button" className={MEMORY_CLASS} onClick={memoryAdd} aria-label="Memory plus">
            <Plus className="mx-auto h-3 w-3" />M
          </button>
          <button type="button" className={MEMORY_CLASS} onClick={memorySubtract} aria-label="Memory minus">
            <Minus className="mx-auto h-3 w-3" />M
          </button>
        </div>

        {/* Main pad */}
        <div className="grid grid-cols-4 gap-1">
          <button type="button" className={ACTION_CLASS} onClick={backspace} aria-label="Backspace">←</button>
          <button type="button" className={ACTION_CLASS} onClick={clearEntry} aria-label="Clear entry">CE</button>
          <button type="button" className={ACTION_CLASS} onClick={clearAll} aria-label="Clear all">C</button>
          <button type="button" className={ACTION_CLASS} onClick={sqrt} aria-label="Square root">√</button>

          <button type="button" className={DIGIT_CLASS} onClick={() => inputDigit("7")}>7</button>
          <button type="button" className={DIGIT_CLASS} onClick={() => inputDigit("8")}>8</button>
          <button type="button" className={DIGIT_CLASS} onClick={() => inputDigit("9")}>9</button>
          <button type="button" className={OP_CLASS} onClick={() => applyOperator("/")} aria-label="Divide">÷</button>

          <button type="button" className={DIGIT_CLASS} onClick={() => inputDigit("4")}>4</button>
          <button type="button" className={DIGIT_CLASS} onClick={() => inputDigit("5")}>5</button>
          <button type="button" className={DIGIT_CLASS} onClick={() => inputDigit("6")}>6</button>
          <button type="button" className={OP_CLASS} onClick={() => applyOperator("*")} aria-label="Multiply">×</button>

          <button type="button" className={DIGIT_CLASS} onClick={() => inputDigit("1")}>1</button>
          <button type="button" className={DIGIT_CLASS} onClick={() => inputDigit("2")}>2</button>
          <button type="button" className={DIGIT_CLASS} onClick={() => inputDigit("3")}>3</button>
          <button type="button" className={OP_CLASS} onClick={() => applyOperator("-")} aria-label="Subtract">−</button>

          <button type="button" className={DIGIT_CLASS} onClick={toggleSign} aria-label="Toggle sign">±</button>
          <button type="button" className={DIGIT_CLASS} onClick={() => inputDigit("0")}>0</button>
          <button type="button" className={DIGIT_CLASS} onClick={inputDot} aria-label="Decimal point">.</button>
          <button type="button" className={OP_CLASS} onClick={() => applyOperator("+")} aria-label="Add">+</button>

          <button type="button" className={`${EQUAL_CLASS} col-span-3`} onClick={evaluate} aria-label="Equals">=</button>
          <button type="button" className={ACTION_CLASS} onClick={percent} aria-label="Percent">%</button>
        </div>

        <p className="mt-2 text-center text-[10px] text-slate-400">
          Drag the title bar to move. Calculator resets when closed.
        </p>
      </div>
    </div>
  );
}

export default OnScreenCalculator;
