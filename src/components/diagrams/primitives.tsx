/**
 * src/components/diagrams/primitives.tsx
 *
 * Shared primitives for the ALO editorial diagram set.
 *
 * Design rules (adapted from the MIT-licensed `diagram-design` reference,
 * re-implemented here for this codebase — no third-party code was copied):
 *   - Flat editorial style: hairline strokes, no drop shadows, no gradients.
 *   - Self-contained inline SVG: no Mermaid, no chart runtime, no client JS.
 *   - Every diagram is a semantic <figure> with a caption and an accessible
 *     title/description, so it degrades to readable text in a screen reader.
 *   - Colours come from the ALO palette used across `globals.css`.
 *
 * These components are server components. They render to static HTML and are
 * safe inside any App Router page, including statically generated ones.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Brand palette shared with src/app/globals.css. */
export const DIAGRAM_PALETTE = {
  navy: '#0B1F3A',
  blue: '#0057B8',
  blueSoft: '#EEF6FF',
  blueLine: '#BCD0E4',
  orange: '#C2410C',
  orangeSoft: '#FFF7ED',
  green: '#16A34A',
  greenSoft: '#ECFDF5',
  red: '#DC2626',
  redSoft: '#FEF2F2',
  slate: '#4B5563',
  slateSoft: '#F5F8FC',
  rule: '#E5E7EB',
  white: '#FFFFFF',
} as const;

export type DiagramTone = 'blue' | 'orange' | 'green' | 'red' | 'navy' | 'slate';

const TONE_STYLES: Record<DiagramTone, { stroke: string; fill: string; text: string }> = {
  blue: { stroke: DIAGRAM_PALETTE.blue, fill: DIAGRAM_PALETTE.blueSoft, text: DIAGRAM_PALETTE.blue },
  orange: { stroke: DIAGRAM_PALETTE.orange, fill: DIAGRAM_PALETTE.orangeSoft, text: DIAGRAM_PALETTE.orange },
  green: { stroke: DIAGRAM_PALETTE.green, fill: DIAGRAM_PALETTE.greenSoft, text: DIAGRAM_PALETTE.green },
  red: { stroke: DIAGRAM_PALETTE.red, fill: DIAGRAM_PALETTE.redSoft, text: DIAGRAM_PALETTE.red },
  navy: { stroke: DIAGRAM_PALETTE.navy, fill: DIAGRAM_PALETTE.white, text: DIAGRAM_PALETTE.navy },
  slate: { stroke: DIAGRAM_PALETTE.slate, fill: DIAGRAM_PALETTE.slateSoft, text: DIAGRAM_PALETTE.slate },
};

export function toneStyles(tone: DiagramTone) {
  return TONE_STYLES[tone];
}

/**
 * Figure wrapper. Always render diagrams inside this so the caption, title and
 * description cannot be forgotten — they are the accessible name for the SVG.
 */
export function DiagramFigure({
  id,
  title,
  description,
  caption,
  children,
  className,
}: {
  /** Unique, kebab-case id. Used to wire aria-labelledby/aria-describedby. */
  id: string;
  title: string;
  description: string;
  /** Optional supporting line rendered under the diagram. */
  caption?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  return (
    <figure className={cn('not-prose m-0', className)}>
      <div
        role="group"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <p
          id={titleId}
          className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0B1F3A]"
        >
          {title}
        </p>
        <p id={descId} className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          {description}
        </p>
        <div className="mt-5">{children}</div>
      </div>
      {caption ? (
        <figcaption className="mt-3 text-xs leading-5 text-slate-500">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

/**
 * Rectangular node with a label and optional supporting line.
 * Renders inside an SVG; caller positions it with translate().
 */
export function DiagramNode({
  x,
  y,
  width,
  height,
  label,
  detail,
  tone = 'navy',
  code,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  detail?: string;
  tone?: DiagramTone;
  /** Short monospace marker shown at the top-left of the node (e.g. "01"). */
  code?: string;
}) {
  const styles = toneStyles(tone);
  const labelLines = wrapLabel(label, width - 32, 7.2);

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width={width}
        height={height}
        rx={8}
        fill={styles.fill}
        stroke={styles.stroke}
        strokeWidth={1}
      />
      {code ? (
        <text
          x={16}
          y={24}
          fontSize={11}
          fontWeight={700}
          letterSpacing="0.14em"
          fill={styles.text}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          {code}
        </text>
      ) : null}
      {labelLines.map((line, index) => (
        <text
          key={line + index}
          x={16}
          y={(code ? 46 : 30) + index * 18}
          fontSize={14}
          fontWeight={600}
          fill={DIAGRAM_PALETTE.navy}
        >
          {line}
        </text>
      ))}
      {detail ? (
        <text
          x={16}
          y={height - 16}
          fontSize={11}
          fill={DIAGRAM_PALETTE.slate}
        >
          {detail.split('\n').slice(0, 1)[0]}
        </text>
      ) : null}
    </g>
  );
}

/**
 * Greedy word wrap measured in approximate character counts.
 * SVG has no text wrapping, so labels are wrapped deterministically here.
 */
export function wrapLabel(label: string, maxWidth: number, charWidth: number, maxLines = 3): string[] {
  const perLine = Math.max(8, Math.floor(maxWidth / charWidth));
  const words = label.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > perLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (last.length > perLine - 1) lines[maxLines - 1] = `${last.slice(0, Math.max(1, perLine - 1))}…`;
  }
  return lines;
}

/**
 * Horizontal or vertical connector with an optional arrow head.
 * Kept deliberately hairline-thin: the editorial look depends on it.
 */
export function DiagramConnector({
  from,
  to,
  orientation = 'horizontal',
  dashed = false,
  tone = 'slate',
  arrow = true,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  orientation?: 'horizontal' | 'vertical';
  dashed?: boolean;
  tone?: DiagramTone;
  arrow?: boolean;
}) {
  const stroke = toneStyles(tone).stroke;
  const markerId = `arrow-${tone}-${orientation}`;
  const path =
    orientation === 'horizontal'
      ? `M ${from.x} ${from.y} H ${to.x}`
      : `M ${from.x} ${from.y} V ${to.y}`;

  return (
    <g>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 8 5 L 0 9 z" fill={stroke} />
        </marker>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray={dashed ? '5 5' : undefined}
        markerEnd={arrow ? `url(#${markerId})` : undefined}
      />
    </g>
  );
}

/** Small uppercase label used for axis captions and phase headers. */
export function DiagramLabel({
  x,
  y,
  children,
  tone = 'slate',
  anchor = 'start',
}: {
  x: number;
  y: number;
  children: string;
  tone?: DiagramTone;
  anchor?: 'start' | 'middle' | 'end';
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={10}
      fontWeight={700}
      letterSpacing="0.16em"
      textAnchor={anchor}
      fill={toneStyles(tone).text}
      style={{ textTransform: 'uppercase' }}
    >
      {children.toUpperCase()}
    </text>
  );
}
