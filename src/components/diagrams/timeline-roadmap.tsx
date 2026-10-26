/**
 * src/components/diagrams/timeline-roadmap.tsx
 *
 * Vertical study/visa roadmap: phases on a spine with milestone pins.
 *
 * Typographic layout with an SVG spine rather than a pure SVG canvas — study
 * roadmaps carry real sentences, and HTML text wraps and translates properly
 * where SVG text does not. Every item is a list entry, so the roadmap is
 * meaningful to a screen reader without any image description.
 */

import { cn } from '@/lib/utils';
import { DIAGRAM_PALETTE, DiagramFigure, type DiagramTone } from './primitives';

export type RoadmapPhase = {
  label: string;
  period: string;
  title: string;
  description: string;
  milestones?: string[];
  tone?: DiagramTone;
};

const TONE_DOT: Record<DiagramTone, string> = {
  blue: DIAGRAM_PALETTE.blue,
  orange: DIAGRAM_PALETTE.orange,
  green: DIAGRAM_PALETTE.green,
  red: DIAGRAM_PALETTE.red,
  navy: DIAGRAM_PALETTE.navy,
  slate: DIAGRAM_PALETTE.slate,
};

export function TimelineRoadmap({
  id,
  title,
  description,
  caption,
  phases,
  tone = 'blue',
}: {
  id: string;
  title: string;
  description: string;
  caption?: string;
  phases: RoadmapPhase[];
  tone?: DiagramTone;
}) {
  return (
    <DiagramFigure id={id} title={title} description={description} caption={caption}>
      <ol aria-label={title} className="relative m-0 list-none space-y-6 p-0 pl-10">
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 2 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute left-[7px] top-2 hidden h-[calc(100%-1rem)] w-[2px] sm:block"
        >
          <line
            x1="1"
            y1="0"
            x2="1"
            y2="100"
            stroke={DIAGRAM_PALETTE.blueLine}
            strokeWidth="2"
          />
        </svg>

        {phases.map((phase) => {
          const dot = TONE_DOT[phase.tone ?? tone];
          return (
            <li key={phase.title} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-10 top-1.5 hidden size-4 rounded-full border-2 bg-white sm:block"
                style={{ borderColor: dot }}
              />
              <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.16em]"
                    style={{ color: dot }}
                  >
                    {phase.label}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-slate-500">
                    {phase.period}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-bold text-[#0B1F3A]">{phase.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{phase.description}</p>
                {phase.milestones?.length ? (
                  <ul className="mt-3 space-y-1.5 border-t border-dashed border-slate-200 pt-3">
                    {phase.milestones.map((milestone) => (
                      <li
                        key={milestone}
                        className={cn(
                          'flex gap-2 text-xs leading-5 text-slate-600',
                          'before:mt-[7px] before:size-1 before:shrink-0 before:rounded-full before:bg-slate-400',
                        )}
                      >
                        <span>{milestone}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </DiagramFigure>
  );
}
