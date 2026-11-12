"use client";

/**
 * src/components/exam/DonutChart.tsx
 *
 * SVG donut chart for a four-section score breakdown (Listening / Reading /
 * Writing / Speaking). Each section is rendered as a 90-degree arc segment
 * arranged around a single ring; the segment length is proportional to the
 * section score (0–9 for IELTS, 0–100 for percentage scales). The chart is
 * purely presentational — the host page owns the score data.
 *
 * Animation: each segment's `stroke-dashoffset` is transitioned from "fully
 * hidden" to "fully drawn" on mount, so the donut appears to fill in. The
 * animation uses requestAnimationFrame so it works without any animation
 * library, and degrades gracefully (instant fill) if the browser does not
 * support rAF.
 *
 * Centre label: the overall band / score, configurable via the `overall`
 * prop. Optional secondary caption beneath.
 *
 * The chart never claims to be an official score; the host page is responsible
 * for the "practice indicator only" disclosure text.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type DonutSegment = {
  /** Section key — Listening | Reading | Writing | Speaking (or any label). */
  key: string;
  /** Display label, shown in the legend. */
  label: string;
  /** Section score. Scale is configurable via the `scale` prop. */
  value: number;
  /** Tailwind-friendly hex colour for the segment + legend swatch. */
  color: string;
};

type DonutChartProps = {
  /** The four (or fewer) section segments. Order matters only for legend. */
  segments: DonutSegment[];
  /** Overall score shown in the centre. */
  overall?: number | null;
  /** Caption under the overall number (e.g. "Overall band"). */
  caption?: string;
  /** Maximum value a segment can take. Defaults to 9 (IELTS band scale). */
  scale?: number;
  /** Outer size in pixels. Defaults to 180. */
  size?: number;
  /** Stroke width of the ring. Defaults to 18. */
  strokeWidth?: number;
  /** Animation duration in ms. Set to 0 to disable. Defaults to 900. */
  duration?: number;
  /** Optional className for the root wrapper. */
  className?: string;
  /** Hide the legend below the chart. Defaults to false. */
  hideLegend?: boolean;
};

// Each segment occupies a fraction of the ring. The four IELTS sections get an
// equal quarter of the ring by default; if `segments` has fewer than 4 entries
// the slot allocation is still proportional to the segment count.
function slotFractions(count: number): number[] {
  return Array.from({ length: count }, () => 1 / count);
}

export function DonutChart(props: DonutChartProps) {
  // The inner component is keyed by `duration` so a change in the animation
  // duration fully remounts it — re-initialising the `progress` state via
  // the useState lazy initializer rather than a synchronous setState in an
  // effect (which the react-hooks/set-state-in-effect rule flags as a
  // cascading render). The only setState in the effect below is inside the
  // rAF callback, which is asynchronous and accepted by the rule.
  const key = `dur-${props.duration ?? 900}`;
  return <DonutChartInner key={key} {...props} />;
}

function DonutChartInner({
  segments,
  overall = null,
  caption = "Overall",
  scale = 9,
  size = 180,
  strokeWidth = 18,
  duration = 900,
  className,
  hideLegend = false,
}: DonutChartProps) {
  const safeSegments = segments.filter((s) => Number.isFinite(s.value) && s.value >= 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Small gap (in ring units) between segments so the donut reads as four
  // distinct sections rather than a continuous ring.
  const gap = 4;
  const slots = slotFractions(Math.max(safeSegments.length, 1));

  // ─── Mount animation ──────────────────────────────────────────────────
  // Each segment's stroke-dashoffset starts at `arcLength` (fully hidden) and
  // animates to 0 (fully drawn). We use a single rAF loop driving all
  // segments in lockstep so they fill together. The initial `progress` is
  // derived from `duration` via the useState lazy initializer (1 if there is
  // no animation to run, 0 otherwise) so the effect body never has to call
  // setState synchronously.
  const [progress, setProgress] = useState<number>(duration <= 0 ? 1 : 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (duration <= 0) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic for a snappy finish
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [duration]);

  // ─── Layout ───────────────────────────────────────────────────────────
  // Centre the ring at (size/2, size/2); rotate -90deg so 0° points up.
  const centre = size / 2;
  const rotation = -90;

  // Per-segment arc geometry. Each segment starts where the previous ended.
  // We compute the running `start` offset with a prefix-sum reduce so the
  // build is purely functional (no mutation of a let inside .map, which the
  // react-hooks/immutability rule rejects as post-render reassignment).
  const arcs = useMemo(() => {
    // First pass: per-segment slot length, visible arc, fill fraction.
    const built = safeSegments.map((seg, i) => {
      const slot = slots[i] ?? 0;
      const slotLength = slot * circumference;
      // The visible arc length is the slot length minus two gaps (one on each
      // side). Clamp to >=0 so a tiny ring doesn't go negative.
      const visibleLength = Math.max(slotLength - gap * 2, 0);
      // The fill within the visible arc is proportional to the value/scale.
      const fillFraction = scale > 0 ? Math.min(Math.max(seg.value / scale, 0), 1) : 0;
      const filledLength = visibleLength * fillFraction;
      // Animate from "fully hidden" (offset = filledLength) to "fully drawn"
      // (offset = 0). Both endpoints are along the same segment so the segment
      // appears to grow from its own start.
      const dashOffset = filledLength * (1 - progress);
      return {
        ...seg,
        slotLength,
        visibleLength,
        dashArray: `${filledLength} ${circumference - filledLength}`,
        dashOffset,
      };
    });
    // Second pass: prefix-sum the slotLengths to get each segment's `start`
    // offset along the ring. Pure reduce — no closure mutation.
    return built.reduce(
      (acc, arc) => {
        const start = acc.cursor;
        acc.out.push({ ...arc, start });
        acc.cursor += arc.slotLength;
        return acc;
      },
      { out: [] as Array<(typeof built)[number] & { start: number }>, cursor: 0 },
    ).out;
  }, [safeSegments, slots, circumference, scale, progress]);

  const overallDisplay =
    overall === null || overall === undefined || !Number.isFinite(overall)
      ? "—"
      : Number.isInteger(overall)
        ? String(overall)
        : overall.toFixed(1);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`Score breakdown donut chart. Overall ${overallDisplay} out of ${scale}.`}
          className="block"
        >
          <g transform={`rotate(${rotation} ${centre} ${centre})`}>
            {/* Track ring — the full donut outline in a faint colour. */}
            <circle
              cx={centre}
              cy={centre}
              r={radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
            />
            {/* Per-segment track (the slot the segment lives in). */}
            {arcs.map((arc) => (
              <circle
                key={`track-${arc.key}`}
                cx={centre}
                cy={centre}
                r={radius}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth={strokeWidth}
                strokeDasharray={`${arc.visibleLength} ${circumference - arc.visibleLength}`}
                strokeDashoffset={-arc.start}
                strokeLinecap="butt"
              />
            ))}
            {/* Per-segment fill — animated. */}
            {arcs.map((arc) => (
              <circle
                key={`fill-${arc.key}`}
                cx={centre}
                cy={centre}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={strokeWidth}
                strokeDasharray={arc.dashArray}
                strokeDashoffset={arc.dashOffset - arc.start}
                strokeLinecap="round"
                style={{ transition: duration > 0 ? "stroke-dashoffset 60ms linear" : undefined }}
              />
            ))}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold leading-none text-[#0B1F3A]">
            {overallDisplay}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {caption}
          </span>
        </div>
      </div>

      {!hideLegend && (
        <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
          {safeSegments.map((seg) => (
            <li key={seg.key} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="font-medium text-slate-700">{seg.label}</span>
              <span className="ml-auto font-mono font-semibold text-[#0B1F3A]">
                {Number.isInteger(seg.value) ? seg.value : seg.value.toFixed(1)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DonutChart;
