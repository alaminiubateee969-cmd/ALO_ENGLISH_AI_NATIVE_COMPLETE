"use client";

/**
 * src/components/exam/ModuleIndicator.tsx
 *
 * College Board Bluebook-style module indicator for the Digital SAT.
 *
 * Each SAT section is split into two stages (Module 1 and Module 2). The
 * second module's difficulty is selected by the candidate's performance on
 * the first — this component surfaces which module the candidate is in so
 * they can pace themselves.
 *
 * Two flavours:
 *   - <ModuleBadge> — a small chip ("Module 1 / 2") for the section tab.
 *   - <ModuleIndicator> — a larger two-pip indicator with the module
 *     number and the section name, for the question-card header.
 *
 * The parent computes which module the candidate is in (based on the
 * question index relative to the section's midpoint) and passes it in.
 */

import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

type ModuleBadgeProps = {
  module: 1 | 2;
  className?: string;
};

/** Small chip for the section tab / palette. */
export function ModuleBadge({ module, className }: ModuleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        module === 1
          ? "bg-slate-200 text-slate-700"
          : "bg-emerald-100 text-emerald-700",
        className,
      )}
      aria-label={`Module ${module}`}
    >
      <Layers className="h-3 w-3" />
      M{module}
    </span>
  );
}

type ModuleIndicatorProps = {
  module: 1 | 2;
  sectionName?: string;
  /** Total questions across both modules of this section. */
  totalInSection?: number;
  /** Position of the current question inside the section (1-based). */
  positionInSection?: number;
};

/** Larger two-pip indicator for the question-card header. */
export function ModuleIndicator({
  module,
  sectionName,
  totalInSection,
  positionInSection,
}: ModuleIndicatorProps) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5"
      aria-label={`Currently in Module ${module}${sectionName ? ` of ${sectionName}` : ""}`}
    >
      <Layers className="h-4 w-4 text-slate-500" />
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
            module === 1 ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-500",
          )}
        >
          1
        </span>
        <span className="text-slate-300">→</span>
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
            module === 2 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500",
          )}
        >
          2
        </span>
      </div>
      <div className="text-xs leading-tight text-slate-600">
        <p className="font-semibold text-slate-800">Module {module}</p>
        {sectionName && (
          <p className="text-[10px] text-slate-500">
            {sectionName.replace(/_/g, " ").toLowerCase()}
            {typeof positionInSection === "number" && typeof totalInSection === "number"
              ? ` · Q${positionInSection}/${totalInSection}`
              : ""}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Derive the module number from the candidate's position inside a section.
 *
 * The Digital SAT splits each section into two modules of equal length.
 * The first half of the section is Module 1; the second half is Module 2.
 * Returns 1 for an empty section or odd splits.
 */
export function moduleForPosition(
  position: number,
  totalInSection: number,
): 1 | 2 {
  if (totalInSection <= 0) return 1;
  const half = Math.ceil(totalInSection / 2);
  return position < half ? 1 : 2;
}

export default ModuleIndicator;
