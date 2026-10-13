/**
 * src/components/diagrams/process-flow.tsx
 *
 * Horizontal process diagram with numbered nodes and a hairline connector,
 * plus an optional dashed feedback loop for cyclic processes (study → attempt
 * → feedback → study).
 *
 * Rendered as a single responsive SVG inside a scroll container so labels stay
 * legible on narrow screens instead of shrinking to unreadable text.
 */

import {
  DIAGRAM_PALETTE,
  DiagramConnector,
  DiagramFigure,
  DiagramLabel,
  DiagramNode,
  toneStyles,
  type DiagramTone,
} from './primitives';

export type ProcessStep = {
  label: string;
  detail?: string;
  code?: string;
  tone?: DiagramTone;
};

const PADDING = 24;
const NODE_WIDTH = 190;
const NODE_HEIGHT = 104;
const GAP = 46;

export function ProcessFlow({
  id,
  title,
  description,
  caption,
  steps,
  loopLabel,
  tone = 'blue',
}: {
  id: string;
  title: string;
  description: string;
  caption?: string;
  steps: ProcessStep[];
  /** When set, a dashed return path is drawn under the row with this label. */
  loopLabel?: string;
  tone?: DiagramTone;
}) {
  const width = PADDING * 2 + steps.length * NODE_WIDTH + Math.max(0, steps.length - 1) * GAP;
  const rowTop = 34;
  const height = rowTop + NODE_HEIGHT + (loopLabel ? 74 : 24);
  const loopBottom = rowTop + NODE_HEIGHT + 44;

  return (
    <DiagramFigure id={id} title={title} description={description} caption={caption}>
      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label={`${title}. ${description}`}
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="h-auto w-full min-w-[680px]"
        >
          <DiagramLabel x={PADDING} y={16} tone={tone}>
            {`Step 1 to ${steps.length}`}
          </DiagramLabel>

          {steps.map((step, index) => {
            const x = PADDING + index * (NODE_WIDTH + GAP);
            const isLast = index === steps.length - 1;
            return (
              <g key={`${step.label}-${index}`}>
                <DiagramNode
                  x={x}
                  y={rowTop}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  label={step.label}
                  detail={step.detail}
                  tone={step.tone ?? tone}
                  code={step.code ?? String(index + 1).padStart(2, '0')}
                />
                {!isLast ? (
                  <DiagramConnector
                    from={{ x: x + NODE_WIDTH + 6, y: rowTop + NODE_HEIGHT / 2 }}
                    to={{ x: x + NODE_WIDTH + GAP - 6, y: rowTop + NODE_HEIGHT / 2 }}
                    tone="slate"
                  />
                ) : null}
              </g>
            );
          })}

          {loopLabel ? (
            <g>
              <path
                d={`M ${PADDING + (steps.length - 1) * (NODE_WIDTH + GAP) + NODE_WIDTH / 2} ${
                  rowTop + NODE_HEIGHT
                } V ${loopBottom} H ${PADDING + NODE_WIDTH / 2} V ${rowTop + NODE_HEIGHT}`}
                fill="none"
                stroke={DIAGRAM_PALETTE.slate}
                strokeWidth={1.5}
                strokeDasharray="6 6"
                markerEnd={`url(#loop-arrow-${tone})`}
              />
              <defs>
                <marker
                  id={`loop-arrow-${tone}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill={DIAGRAM_PALETTE.slate} />
                </marker>
              </defs>
              <text
                x={width / 2}
                y={loopBottom - 10}
                fontSize={11}
                fontWeight={600}
                textAnchor="middle"
                fill={toneStyles('slate').text}
              >
                {loopLabel}
              </text>
            </g>
          ) : null}
        </svg>
      </div>
    </DiagramFigure>
  );
}
