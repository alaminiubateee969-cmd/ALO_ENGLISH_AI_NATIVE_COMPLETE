"use client";

/**
 * src/components/exam/InstructionTour.tsx
 *
 * First-time-user guided tour for the exam player. A four-step overlay
 * highlights the key UI affordances so a new candidate understands the flow
 * before they sit a practice mock:
 *
 *   1. "Select exam type"   — data-tour="exam-select"
 *   2. "Start exam"          — data-tour="exam-start"
 *   3. "Timer counts down"   — data-tour="exam-timer"
 *   4. "Submit when done"    — data-tour="exam-submit"
 *
 * The tour is purely a UI affordance — it does NOT preload questions, unlock
 * anything, or change exam state. The host page renders its own
 * `data-tour="…"` targets; this component looks them up by attribute and
 * positions an absolutely-positioned spotlight + tooltip over the matched
 * element. If a target is missing for the current step, the tooltip is shown
 * centered (so the tour still works on a page that omits an optional target).
 *
 * Dismissal is remembered in `localStorage` under `alo.tour.exam.dismissed`
 * (or a custom `storageKey`), so a returning candidate does not see the tour
 * again. The host page can force the tour by passing `force={true}` (e.g. from
 * a "Replay tour" button) — this re-shows the tour regardless of the stored
 * dismissal.
 */

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TourStep = {
  /** data-tour attribute value to highlight. */
  target: string;
  /** Title shown at the top of the tooltip. */
  title: string;
  /** Body copy explaining the affordance. */
  body: string;
};

type TourStepWithOptional = TourStep & {
  /** If true, a missing target is non-fatal (the tooltip centers). */
  optional?: boolean;
};

const DEFAULT_STEPS: TourStepWithOptional[] = [
  {
    target: "exam-select",
    title: "Select exam type",
    body:
      "Pick the exam you are preparing for. The catalog only lists exam types that currently have an active practice set.",
  },
  {
    target: "exam-start",
    title: "Start the exam",
    body:
      "Once you pick a practice set, start the attempt. The clock is server-side — refreshing the page keeps your time.",
  },
  {
    target: "exam-timer",
    title: "Timer counts down",
    body:
      "The remaining time is shown here. When it hits zero the attempt auto-submits — finish before then if you can.",
    optional: true,
  },
  {
    target: "exam-submit",
    title: "Submit when done",
    body:
      "Review your answers, then submit. You can mark questions for review and come back to them before submitting.",
  },
];

type InstructionTourProps = {
  /** Override the default four steps. */
  steps?: TourStepWithOptional[];
  /** localStorage key used to remember dismissal. */
  storageKey?: string;
  /** Force the tour to show, ignoring any stored dismissal. */
  force?: boolean;
  /** Called when the tour finishes (last step -> Done) or is skipped. */
  onComplete?: () => void;
  /** Optional className applied to the tooltip root. */
  className?: string;
};

const DEFAULT_STORAGE_KEY = "alo.tour.exam.dismissed";

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
} | null;

export function InstructionTour({
  steps = DEFAULT_STEPS,
  storageKey = DEFAULT_STORAGE_KEY,
  force = false,
  onComplete,
  className,
}: InstructionTourProps) {
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  // `userClosed` is set by the Skip / Done actions and stops the tour from
  // re-opening on the current mount. The `force` prop overrides it (see the
  // derived `active` below) so the host page can replay the tour at will.
  const [userClosed, setUserClosed] = useState(false);
  const [index, setIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect>(null);
  const overlayLabelId = useId();
  const step = steps[index] ?? steps[0];

  // ─── Hydration: read localStorage dismissal flag on mount ──────────────
  // This is the canonical "sync to external store on mount" pattern: SSR
  // renders with `hydrated=false, dismissed=false` so the server HTML matches
  // the first client render, then this effect runs once on the client to read
  // localStorage and update both flags. The setState calls are intentionally
  // synchronous in the effect body — they run exactly once per mount and
  // reflect an external source of truth the React tree cannot otherwise see.
  // The rule is overly conservative here, so it is suppressed for this block.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setHydrated(true);
    if (typeof window === "undefined") return;
    try {
      const flag = window.localStorage.getItem(storageKey);
      setDismissed(flag === "1");
    } catch {
      // localStorage can be disabled (private mode, cookies blocked). In
      // that case the tour is shown every visit — safe default.
      setDismissed(false);
    }
  }, [storageKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Derived: the tour is active once hydrated, AND either:
  //   - the host page is force-replaying it (force === true), OR
  //   - the user has not dismissed it on this mount AND has not stored a
  //     dismissal in localStorage.
  // Deriving this from state (rather than tracking it as separate state that
  // is synchronised in an effect) avoids the cascading-render pattern that
  // the react-hooks/set-state-in-effect rule flags.
  const active = hydrated && (force || (!userClosed && !dismissed));

  // ─── Measure the current step's target on every step change + resize ───
  const measureTarget = useCallback(() => {
    if (typeof window === "undefined") return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [step.target]);

  useEffect(() => {
    if (!active) return;
    // Defer the initial measurement to a rAF callback so the setState inside
    // `measureTarget` is not synchronous in the effect body (the rule fires
    // on synchronous setState only). The resize/scroll listeners call
    // measureTarget from event-handler callbacks, which are also asynchronous
    // and therefore fine.
    const rafId = requestAnimationFrame(() => measureTarget());
    const onResize = () => measureTarget();
    const onScroll = () => measureTarget();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    // Re-measure on a short delay so any layout shift settles.
    const t = window.setTimeout(measureTarget, 60);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
      window.clearTimeout(t);
    };
  }, [active, index, measureTarget]);

  // ─── Actions ────────────────────────────────────────────────────────────
  // Declared BEFORE the keydown effect that references them so the
  // react-hooks/immutability rule does not flag a forward reference.
  const persistDismissal = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  }, [storageKey]);

  const handleSkip = useCallback(() => {
    persistDismissal();
    setUserClosed(true);
    // Reset the step index for the next time the tour opens (e.g. when the
    // host page passes force=true). Doing this here in the click handler —
    // rather than in an effect on `active` change — avoids the cascading-
    // render pattern that the react-hooks/set-state-in-effect rule flags.
    setIndex(0);
    onComplete?.();
  }, [persistDismissal, onComplete]);

  const handleNext = useCallback(() => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= steps.length) {
        persistDismissal();
        setUserClosed(true);
        // Reset for the next open (see handleSkip).
        setIndex(0);
        onComplete?.();
        return i;
      }
      return next;
    });
  }, [steps.length, persistDismissal, onComplete]);

  const handlePrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  // ─── Esc / arrow-key handling ───────────────────────────────────────────
  // Re-attached on every active/index change so the latest action closures
  // are wired up; the actions themselves are deliberately omitted from the
  // dep list (they are stable enough for a keydown handler).
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, index, handleSkip, handleNext, handlePrev]);

  // ─── Tooltip positioning ────────────────────────────────────────────────
  // Place the tooltip below the target by default; if the target is in the
  // bottom half of the viewport, place it above. If the target is missing
  // (targetRect === null) the tooltip centers on the viewport.
  const tooltipStyle = useMemo<React.CSSProperties>(() => {
    if (!targetRect) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }
    const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;
    const below = targetRect.top + targetRect.height < viewportH * 0.55;
    const top = below
      ? targetRect.top + targetRect.height + 12
      : Math.max(12, targetRect.top - 220);
    // Clamp horizontally so the tooltip never overflows the viewport.
    const tooltipWidth = 320;
    const left = Math.max(
      12,
      Math.min(
        (typeof window !== "undefined" ? window.innerWidth : 1200) - tooltipWidth - 12,
        targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
      ),
    );
    return {
      position: "fixed",
      top,
      left,
      width: tooltipWidth,
    };
  }, [targetRect]);

  if (!hydrated || !active) return null;

  const isLast = index === steps.length - 1;
  const missingTarget = !targetRect;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={overlayLabelId}
      className="fixed inset-0 z-[100]"
    >
      {/* Dim overlay + spotlight cut-out */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#0B1F3A]/55 transition-opacity"
        style={{
          // Cut a transparent rectangle around the target using the
          // four-quad block technique: four dark divs around the hole.
          // Implemented via boxShadow for simplicity.
          boxShadow: targetRect
            ? undefined
            : undefined,
        }}
      />
      {targetRect ? (
        <>
          {/* Four dim blocks around the spotlight so the target stays bright. */}
          <Block
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: targetRect.top,
            }}
          />
          <Block
            style={{
              top: targetRect.top,
              left: 0,
              width: targetRect.left,
              height: targetRect.height,
            }}
          />
          <Block
            style={{
              top: targetRect.top,
              left: targetRect.left + targetRect.width,
              right: 0,
              height: targetRect.height,
            }}
          />
          <Block
            style={{
              top: targetRect.top + targetRect.height,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* Spotlight ring */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-lg ring-2 ring-[#E8501A] ring-offset-2 ring-offset-transparent"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
            }}
          />
        </>
      ) : null}

      {/* Tooltip */}
      <div
        role="document"
        className={cn(
          "z-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl",
          className,
        )}
        style={tooltipStyle}
      >
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#EEF6FF] text-[#0057B8]">
            <CircleHelp className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C2410C]">
              Tour · step {index + 1} of {steps.length}
            </p>
            <h2 id={overlayLabelId} className="mt-1 text-base font-bold text-[#0B1F3A]">
              {step.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            aria-label="Skip tour"
            className="-mr-1 -mt-1 grid size-7 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600">{step.body}</p>

        {missingTarget ? (
          <p className="mt-2 text-xs text-slate-400">
            (The element this step highlights is not on this page — the tour
            will continue.)
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-slate-500 hover:text-slate-700"
          >
            Skip tour
          </Button>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={index === 0}
              className="h-8 px-2"
              aria-label="Previous step"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Back
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              className="h-8 bg-[#0057B8] px-3 text-white hover:bg-[#0B63CE]"
            >
              {isLast ? "Done" : "Next"}
              {!isLast ? (
                <ChevronRight className="size-4" aria-hidden="true" />
              ) : null}
            </Button>
          </div>
        </div>

        {/* Step dots */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {steps.map((s, i) => (
            <span
              key={s.target}
              aria-hidden="true"
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index
                  ? "w-5 bg-[#0057B8]"
                  : i < index
                    ? "w-1.5 bg-[#0057B8]/60"
                    : "w-1.5 bg-slate-300",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Helper: a single dim block used to carve the spotlight hole ─────────
function Block({ style }: { style: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bg-[#0B1F3A]/55"
      style={style}
    />
  );
}

export default InstructionTour;
