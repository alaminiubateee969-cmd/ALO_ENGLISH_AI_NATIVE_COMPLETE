/**
 * src/components/diagrams/layered-stack.tsx
 *
 * Layered system diagram: one row per architectural layer, with the data path
 * drawn as a hairline rail on the right. Used to document how a practice
 * sitting actually flows through the platform, so an internal reader can see
 * where the server (not the browser) owns state.
 */

import {
  DIAGRAM_PALETTE,
  DiagramFigure,
  DiagramLabel,
  toneStyles,
  type DiagramTone,
} from './primitives';

export type StackLayer = {
  label: string;
  role: string;
  items: string[];
  tone?: DiagramTone;
};

const PAD = 24;
const LAYER_HEIGHT = 92;
const LAYER_GAP = 18;
const TOTAL_WIDTH = 920;

export function LayeredStack({
  id,
  title,
  description,
  caption,
  layers,
  railLabel,
  tone = 'blue',
}: {
  id: string;
  title: string;
  description: string;
  caption?: string;
  layers: StackLayer[];
  /** Label for the vertical rail that runs alongside the layers. */
  railLabel?: string;
  tone?: DiagramTone;
}) {
  const height = 34 + layers.length * LAYER_HEIGHT + (layers.length - 1) * LAYER_GAP + 20;
  const railX = TOTAL_WIDTH - 46;

  return (
    <DiagramFigure id={id} title={title} description={description} caption={caption}>
      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label={`${title}. ${description}`}
          viewBox={`0 0 ${TOTAL_WIDTH} ${height}`}
          width={TOTAL_WIDTH}
          height={height}
          className="h-auto w-full min-w-[720px]"
        >
          {railLabel ? <DiagramLabel x={railX - 2} y={16} tone={tone} anchor="middle">{railLabel}</DiagramLabel> : null}

          {layers.map((layer, index) => {
            const y = 34 + index * (LAYER_HEIGHT + LAYER_GAP);
            const styles = toneStyles(layer.tone ?? tone);
            return (
              <g key={layer.label}>
                <rect
                  x={PAD}
                  y={y}
                  width={railX - PAD - 34}
                  height={LAYER_HEIGHT}
                  rx={8}
                  fill={styles.fill}
                  stroke={styles.stroke}
                  strokeWidth={1}
                />
                <text x={PAD + 16} y={y + 26} fontSize={14} fontWeight={700} fill={DIAGRAM_PALETTE.navy}>
                  {layer.label}
                </text>
                <text x={PAD + 16} y={y + 44} fontSize={11} fill={DIAGRAM_PALETTE.slate}>
                  {layer.role}
                </text>
                {layer.items.slice(0, 3).map((item, itemIndex) => (
                  <text
                    key={item}
                    x={PAD + 16}
                    y={y + 66 + itemIndex * 0}
                    fontSize={11}
                    fontWeight={600}
                    fill={styles.text}
                  >
                    {itemIndex === 0 ? item : ''}
                  </text>
                ))}
                {layer.items.length > 0 ? (
                  <text x={PAD + 16} y={y + 82} fontSize={11} fill={DIAGRAM_PALETTE.slate}>
                    {layer.items.join(' · ')}
                  </text>
                ) : null}

                <line
                  x1={railX}
                  y1={y + LAYER_HEIGHT / 2}
                  x2={railX}
                  y2={y + LAYER_HEIGHT / 2 + (index === layers.length - 1 ? 0 : LAYER_HEIGHT + LAYER_GAP - 8)}
                  stroke={DIAGRAM_PALETTE.blueLine}
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                />
                <circle
                  cx={railX}
                  cy={y + LAYER_HEIGHT / 2}
                  r={3.5}
                  fill={DIAGRAM_PALETTE.white}
                  stroke={styles.stroke}
                  strokeWidth={1.5}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </DiagramFigure>
  );
}
