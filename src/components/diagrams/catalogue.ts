/**
 * src/components/diagrams/catalogue.ts
 *
 * Catalogue of available diagram families.
 *
 * This module is deliberately free of React and SVG imports so it can be
 * imported by tests and by server-side reporting without pulling a component
 * tree with it. It is data, not documentation-by-comment: the diagram index
 * re-exports it and tests/diagram-catalogue.test.ts validates it.
 */

export type DiagramCatalogueEntry = {
  /** Component name as exported from src/components/diagrams/index.ts. */
  component: 'ProcessFlow' | 'TimelineRoadmap' | 'LayeredStack' | 'ComparisonMatrix';
  /** Kebab-case identifier, also used as the aria id prefix. */
  family: string;
  name: string;
  /** What this diagram is for. */
  purpose: string;
  /** What it must not be used for. */
  avoid: string;
  /** True when the diagram renders entirely inside an SVG canvas. */
  svg: boolean;
};

export const DIAGRAM_CATALOGUE: readonly DiagramCatalogueEntry[] = [
  {
    component: 'ProcessFlow',
    family: 'process-flow',
    name: 'Process flow',
    purpose: 'Ordered steps with a defined start and end, optionally closing a loop.',
    avoid: 'Do not use for parallel workstreams; the connector implies strict sequence.',
    svg: true,
  },
  {
    component: 'TimelineRoadmap',
    family: 'timeline-roadmap',
    name: 'Timeline roadmap',
    purpose: 'Phases with a period label, milestones, and sentence-length explanations.',
    avoid: 'Do not use for branching decisions; use a process flow plus prose.',
    svg: false,
  },
  {
    component: 'LayeredStack',
    family: 'layered-stack',
    name: 'Layered stack',
    purpose: 'Architectural layers and which side owns state, data, or trust.',
    avoid: 'Do not use as a deployment diagram; it does not model hosts or networks.',
    svg: true,
  },
  {
    component: 'ComparisonMatrix',
    family: 'comparison-matrix',
    name: 'Comparison matrix',
    purpose: 'Feature-by-option comparison where each cell states its value in words.',
    avoid: 'Do not use for scoring tables; a matrix is not a report of results.',
    svg: false,
  },
] as const;

/** Look up a catalogue entry by its kebab-case family name. */
export function findDiagram(family: string): DiagramCatalogueEntry | undefined {
  return DIAGRAM_CATALOGUE.find((entry) => entry.family === family);
}
