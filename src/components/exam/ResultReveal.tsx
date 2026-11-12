"use client";

/**
 * src/components/exam/ResultReveal.tsx
 *
 * Two-phase results screen:
 *   Phase 1 (loading): a centered spinner with "Calculating score…" text and
 *     the Bengali translation "স্কোর হিসাব হচ্ছে". Lasts ~1 second by default
 *     (configurable via `loadingMs`).
 *   Phase 2 (reveal): the wrapped children fade in from opacity 0 / translateY
 *     8px to opacity 1 / translateY 0.
 *
 * The loading delay mirrors the perceived effort of an official scoring
 * pipeline (writing/speaking evaluation) without forcing a real wait on the
 * candidate. It is intentionally short so it never blocks a slow connection
 * from being the dominant latency.
 *
 * The component is controlled: pass `trigger` to re-run the loading phase
 * (e.g. when the host page re-grades a different attempt). Pass `skip` to
 * skip straight to the reveal (e.g. for users who have already seen the
 * animation once this session).
 *
 * Implementation note: the inner component is remounted via React `key` when
 * `trigger` changes, so the loading phase re-initialises through the useState
 * lazy initializer rather than a synchronous setState in an effect (which
 * the react-hooks/set-state-in-effect rule rightly flags as a cascading
 * render). The only setState in the effect is inside a setTimeout callback,
 * which the rule accepts because it is asynchronous.
 */

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ResultRevealProps = {
  /** Children revealed after the loading phase. */
  children: React.ReactNode;
  /** Loading phase duration in ms. Set to 0 to skip the spinner entirely. */
  loadingMs?: number;
  /** Re-run the loading phase when this value changes. */
  trigger?: string | number;
  /** Skip the loading phase entirely (e.g. user has seen it once). */
  skip?: boolean;
  /** Optional heading shown above the revealed content. */
  title?: string;
  /** Optional className for the revealed wrapper. */
  className?: string;
};

export function ResultReveal(props: ResultRevealProps) {
  // The inner component is keyed by `trigger` so a change in `trigger`
  // fully remounts it — re-initialising the loading phase via the useState
  // lazy initializer rather than a synchronous setState in an effect.
  const key = props.trigger === undefined ? "static" : String(props.trigger);
  return <ResultRevealInner key={key} {...props} />;
}

function ResultRevealInner({
  children,
  loadingMs = 1000,
  skip = false,
  title,
  className,
}: ResultRevealProps) {
  const [phase, setPhase] = useState<"loading" | "revealed">(
    skip || loadingMs <= 0 ? "revealed" : "loading",
  );

  // Schedule the loading -> reveal transition. The only setState in this
  // effect body is inside the setTimeout callback, which is asynchronous and
  // therefore does not trigger the cascading-render warning.
  useEffect(() => {
    if (skip || loadingMs <= 0) return;
    const timer = window.setTimeout(() => setPhase("revealed"), loadingMs);
    return () => window.clearTimeout(timer);
  }, [loadingMs, skip]);

  if (phase === "loading") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center"
      >
        <Loader2
          aria-hidden="true"
          className="size-10 animate-spin text-[#0057B8]"
        />
        <div className="space-y-1">
          <p className="text-base font-semibold text-[#0B1F3A]">
            Calculating score<span className="animate-pulse">…</span>
          </p>
          <p
            lang="bn"
            className="text-sm font-medium text-slate-500"
            style={{
              fontFamily:
                "'SolaimanLipi','Noto Sans Bengali','Hind Siliguri',sans-serif",
            }}
          >
            স্কোর হিসাব হচ্ছে
          </p>
        </div>
        <span className="sr-only">Score is being calculated, please wait.</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "animate-[alo-result-fade_0.55s_ease-out_both]",
        className,
      )}
      aria-live="polite"
    >
      {title ? (
        <h2 className="mb-4 text-lg font-bold text-[#0B1F3A]">{title}</h2>
      ) : null}
      {children}
      <style jsx>{`
        @keyframes alo-result-fade {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default ResultReveal;
