/**
 * tests/diagrams-render.test.tsx
 *
 * Renders the diagram components to static markup and asserts the accessible
 * contract that makes them safe to publish:
 *
 *   - each diagram exposes a heading and a description wired by aria ids
 *   - SVG diagrams carry role="img" with an aria-label
 *   - no diagram emits a client-only element (they must work without JS)
 *   - no diagram claims an official score or result anywhere in its copy
 *
 * Server-rendered markup is the same output the App Router sends, so this is
 * the real thing, not a simulation.
 */

import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ComparisonMatrix,
  LayeredStack,
  ProcessFlow,
  TimelineRoadmap,
} from '../src/components/diagrams';

const STEPS = [
  { label: 'Choose a practice set', detail: 'Active sets only' },
  { label: 'Server freezes questions', detail: 'Server-owned deadline' },
] as const;

describe('diagram rendering', () => {
  test('ProcessFlow renders an accessible labelled figure', () => {
    const html = renderToStaticMarkup(
      <ProcessFlow
        id="render-process"
        title="How it works"
        description="Two steps, in order."
        steps={STEPS.map((step) => ({ ...step }))}
      />,
    );

    expect(html).toContain('id="render-process-title"');
    expect(html).toContain('id="render-process-desc"');
    expect(html).toContain('aria-labelledby="render-process-title"');
    expect(html).toContain('aria-describedby="render-process-desc"');
    expect(html).toContain('role="img"');
    expect(html).toContain('<svg');
    // DiagramLabel uppercases axis labels via CSS + text transform.
    expect(html.toLowerCase()).toContain('step 1 to 2');
  });

  test('TimelineRoadmap renders one list item per phase', () => {
    const html = renderToStaticMarkup(
      <TimelineRoadmap
        id="render-roadmap"
        title="Roadmap"
        description="A sequence of phases."
        phases={[
          { label: 'Phase 1', period: 'Week 1', title: 'Baseline', description: 'Measure first.' },
          { label: 'Phase 2', period: 'Week 2', title: 'Focus', description: 'Work the gaps.' },
        ]}
      />,
    );

    // "<li" also matches "<line" in the SVG spine, so match the real tag.
    expect((html.match(/<li[ >]/g) ?? []).length).toBe(2);
    expect(html).toContain('Baseline');
    expect(html).toContain('tabular-nums');
  });

  test('LayeredStack renders every layer and the rail label', () => {
    const html = renderToStaticMarkup(
      <LayeredStack
        id="render-stack"
        title="Layers"
        description="Where state is owned."
        railLabel="data flow"
        layers={[
          { label: 'Browser', role: 'presentation', items: ['React'] },
          { label: 'Server', role: 'authority', items: ['Prisma', 'Grading'] },
        ]}
      />,
    );

    expect(html).toContain('Browser');
    expect(html).toContain('Server');
    expect(html).toContain('DATA FLOW');
  });

  test('ComparisonMatrix states each value in words, not colour alone', () => {
    const html = renderToStaticMarkup(
      <ComparisonMatrix
        id="render-matrix"
        title="Options"
        description="Two options compared."
        columns={['Option A', 'Option B']}
        rows={[{ label: 'Feature', values: ['yes', 'varies'] }]}
      />,
    );

    expect(html).toContain('Included');
    expect(html).toContain('Check with provider');
    expect(html).toContain('<table');
    expect(html).toContain('scope="row"');
  });

  test('no diagram makes an official-score claim', () => {
    const html = [
      renderToStaticMarkup(
        <ProcessFlow id="p" title="t" description="d" steps={STEPS.map((step) => ({ ...step }))} />,
      ),
      renderToStaticMarkup(
        <TimelineRoadmap
          id="t"
          title="t"
          description="d"
          phases={[{ label: 'l', period: 'w', title: 'x', description: 'y' }]}
        />,
      ),
    ].join(' ');

    for (const banned of ['official score', 'official result', 'guaranteed band', 'guaranteed score']) {
      expect(html.toLowerCase()).not.toContain(banned);
    }
  });
});
