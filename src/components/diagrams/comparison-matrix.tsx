/**
 * src/components/diagrams/comparison-matrix.tsx
 *
 * Side-by-side comparison with explicit, non-colour-only marks.
 *
 * Accessibility: every cell carries a text equivalent ("Included", "Not
 * offered", "Check with provider") in addition to the SVG mark, because a
 * colour-only tick is unreadable for colour-blind users and in print.
 */

import { Check, Minus, HelpCircle } from 'lucide-react';
import { DIAGRAM_PALETTE, DiagramFigure, type DiagramTone } from './primitives';
import { cn } from '@/lib/utils';

export type MatrixValue = 'yes' | 'no' | 'varies';

export type MatrixRow = {
  label: string;
  description?: string;
  values: MatrixValue[];
};

const MARK: Record<
  MatrixValue,
  { text: string; Icon: typeof Check; color: string; className: string }
> = {
  yes: { text: 'Included', Icon: Check, color: DIAGRAM_PALETTE.green, className: 'text-[#16A34A]' },
  no: { text: 'Not offered', Icon: Minus, color: DIAGRAM_PALETTE.slate, className: 'text-slate-400' },
  varies: {
    text: 'Check with provider',
    Icon: HelpCircle,
    color: DIAGRAM_PALETTE.orange,
    className: 'text-[#C2410C]',
  },
};

export function ComparisonMatrix({
  id,
  title,
  description,
  caption,
  columns,
  rows,
  tone = 'blue',
}: {
  id: string;
  title: string;
  description: string;
  caption?: string;
  columns: string[];
  rows: MatrixRow[];
  /** Accepted for API symmetry with the other diagrams; marks carry meaning. */
  tone?: DiagramTone;
}) {
  void tone;

  return (
    <DiagramFigure id={id} title={title} description={description} caption={caption}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <caption className="sr-only">{description}</caption>
          <thead>
            <tr className="border-b border-slate-200">
              <th scope="col" className="py-2 pr-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Feature
              </th>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0B1F3A]"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-slate-100 last:border-b-0">
                <th scope="row" className="py-3 pr-4 align-top font-semibold text-[#0B1F3A]">
                  {row.label}
                  {row.description ? (
                    <span className="mt-1 block font-normal leading-5 text-slate-500">
                      {row.description}
                    </span>
                  ) : null}
                </th>
                {row.values.map((value, index) => {
                  const mark = MARK[value];
                  const Icon = mark.Icon;
                  return (
                    <td key={`${row.label}-${columns[index] ?? index}`} className="px-3 py-3 align-top">
                      <span className="flex items-center gap-2">
                        <Icon aria-hidden="true" className={cn('size-4 shrink-0', mark.className)} />
                        <span className="text-xs text-slate-600">{mark.text}</span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DiagramFigure>
  );
}
