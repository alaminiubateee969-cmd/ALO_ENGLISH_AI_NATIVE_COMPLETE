"use client";

/**
 * src/components/exam/AnswerEliminator.tsx
 *
 * College Board Bluebook-style answer eliminator for the Digital SAT.
 *
 * Each answer option renders with a small "X" affordance on the left.
 * Clicking the X crosses the option out (strike-through + dimmed) without
 * selecting it. The candidate can still select an eliminated option (the
 * eliminator is a scratch layer, not a guard) — matching Bluebook, which
 * lets you change your mind.
 *
 * The component is presentation-only: it calls `onToggleEliminate(idx)` and
 * reads `eliminated` (a Set<number>) back. The parent owns the state so
 * the eliminator can be persisted across question navigation alongside
 * the answer.
 */

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AnswerEliminatorProps = {
  /** Parsed option strings, in display order. */
  options: string[];
  /** Currently selected option index, or null/undefined if none. */
  selected: string | null | undefined;
  /** Set of eliminated option indices for THIS question. */
  eliminated: Set<number>;
  /** Toggle elimination on an option. */
  onToggleEliminate: (index: number) => void;
  /** Select an option (parent's existing setAnswer handler). */
  onSelect: (index: number) => void;
  /** Optional label for the option group. */
  label?: string;
};

export function AnswerEliminator({
  options,
  selected,
  eliminated,
  onToggleEliminate,
  onSelect,
  label,
}: AnswerEliminatorProps) {
  return (
    <div role="radiogroup" aria-label={label ?? "Answer choices"} className="space-y-2">
      {label && (
        <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      )}
      {options.map((opt, idx) => {
        const isEliminated = eliminated.has(idx);
        const isSelected = String(selected) === String(idx);
        const letter = String.fromCharCode(65 + idx);
        const inputId = `opt-${idx}`;
        return (
          <div
            key={idx}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg border p-3 transition",
              isSelected
                ? "border-blue-500 bg-blue-50"
                : isEliminated
                  ? "border-slate-200 bg-slate-50 opacity-60"
                  : "border-slate-200 bg-white hover:bg-slate-50",
            )}
          >
            {/* Eliminate (X) button — left of the option letter */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleEliminate(idx);
              }}
              aria-pressed={isEliminated}
              aria-label={
                isEliminated
                  ? `Restore option ${letter}`
                  : `Eliminate option ${letter}`
              }
              title={isEliminated ? "Restore option" : "Eliminate option"}
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs transition",
                isEliminated
                  ? "border-red-300 bg-red-100 text-red-600 hover:bg-red-200"
                  : "border-slate-300 text-slate-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:border-red-300 hover:text-red-500",
              )}
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Custom radio control + label */}
            <label
              htmlFor={inputId}
              className={cn(
                "flex flex-1 cursor-pointer items-center gap-3",
                isEliminated && "line-through decoration-slate-400 decoration-2",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition",
                  isSelected
                    ? "border-blue-500 bg-blue-500"
                    : "border-slate-300 bg-white",
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </span>
              <span className="font-medium text-slate-700">{letter}.</span>
              <span className={cn("text-slate-700", isEliminated && "text-slate-400")}>
                {opt}
              </span>
            </label>
            {/* Native radio for accessibility + form semantics */}
            <input
              id={inputId}
              type="radio"
              name="answer-eliminator"
              value={idx}
              checked={isSelected}
              onChange={() => onSelect(idx)}
              className="sr-only"
            />
          </div>
        );
      })}
      {eliminated.size > 0 && (
        <p className="mt-1 text-xs text-slate-400">
          {eliminated.size} option{eliminated.size === 1 ? "" : "s"} eliminated. Click the X again to restore.
        </p>
      )}
    </div>
  );
}

export default AnswerEliminator;
