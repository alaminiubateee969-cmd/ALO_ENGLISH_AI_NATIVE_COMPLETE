/**
 * src/components/diagrams/index.ts
 *
 * Public surface of the ALO editorial diagram set.
 *
 * Four diagram families are shipped. They are deliberately few and complete:
 * each one is accessible, print-safe, dependency-free, and renders as static
 * HTML, so it cannot break a page if JavaScript never loads.
 *
 * The catalogue below is data, not documentation-by-comment — the page that
 * lists available diagrams and the regression test both read it, so a new
 * diagram cannot be added without appearing in both.
 */

export { DiagramFigure, DiagramNode, DiagramConnector, DiagramLabel, DIAGRAM_PALETTE, toneStyles, wrapLabel } from './primitives';
export type { DiagramTone } from './primitives';
export { ProcessFlow } from './process-flow';
export type { ProcessStep } from './process-flow';
export { TimelineRoadmap } from './timeline-roadmap';
export type { RoadmapPhase } from './timeline-roadmap';
export { LayeredStack } from './layered-stack';
export type { StackLayer } from './layered-stack';
export { ComparisonMatrix } from './comparison-matrix';
export type { MatrixRow, MatrixValue } from './comparison-matrix';

// Catalogue lives in a React-free module so tests and server-side reporting can
// read it without importing a component tree. See ./catalogue.ts.
export { DIAGRAM_CATALOGUE, findDiagram } from './catalogue';
export type { DiagramCatalogueEntry } from './catalogue';
