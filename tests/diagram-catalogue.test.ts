/**
 * tests/diagram-catalogue.test.ts
 *
 * The diagram set is documented in two places that can drift: the catalogue in
 * src/components/diagrams/catalogue.ts and the components actually exported
 * from src/components/diagrams/index.ts. A catalogue entry for a component that
 * does not exist is a broken promise to whoever writes the next page, so the
 * barrel file is parsed from source and checked.
 *
 * Also covers `wrapLabel`, because SVG cannot wrap text: if that helper
 * misbehaves, diagram labels overflow their node silently.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIAGRAM_CATALOGUE, findDiagram } from '../src/components/diagrams/catalogue';
import { wrapLabel } from '../src/components/diagrams/primitives';

const ROOT = join(import.meta.dir, '..');

function exportedNames(): Set<string> {
  const source = readFileSync(join(ROOT, 'src', 'components', 'diagrams', 'index.ts'), 'utf8');
  const names = new Set<string>();
  for (const match of source.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const part of match[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (name) names.add(name);
    }
  }
  return names;
}

describe('diagram catalogue', () => {
  test('every catalogue component is exported from the diagrams barrel', () => {
    const exported = exportedNames();
    expect(exported.size).toBeGreaterThan(0);

    const missing = DIAGRAM_CATALOGUE.map((entry) => entry.component).filter(
      (component) => !exported.has(component),
    );

    expect(missing).toEqual([]);
  });

  test('families and components are unique', () => {
    const families = DIAGRAM_CATALOGUE.map((entry) => entry.family);
    const components = DIAGRAM_CATALOGUE.map((entry) => entry.component);
    expect(new Set(families).size).toBe(families.length);
    expect(new Set(components).size).toBe(components.length);
  });

  test('family ids are kebab-case and usable as aria id prefixes', () => {
    for (const entry of DIAGRAM_CATALOGUE) {
      expect(entry.family).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
    }
  });

  test('each entry states both a purpose and a limitation', () => {
    for (const entry of DIAGRAM_CATALOGUE) {
      expect(entry.purpose.trim().length).toBeGreaterThan(10);
      expect(entry.avoid.trim().length).toBeGreaterThan(10);
      expect(entry.name.trim().length).toBeGreaterThan(2);
    }
  });

  test('findDiagram resolves by family and returns undefined otherwise', () => {
    expect(findDiagram('process-flow')?.component).toBe('ProcessFlow');
    expect(findDiagram('does-not-exist')).toBeUndefined();
  });
});

describe('wrapLabel', () => {
  test('keeps short labels on one line', () => {
    expect(wrapLabel('Baseline', 150, 7.2)).toEqual(['Baseline']);
  });

  test('wraps long labels without losing words', () => {
    const lines = wrapLabel('Server freezes the question set for the sitting', 120, 7.2);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.length).toBeLessThanOrEqual(3);
    expect(lines.join(' ')).toContain('Server');
    expect(lines.join(' ')).toContain('sitting');
  });

  test('never exceeds the requested line budget', () => {
    const lines = wrapLabel('one two three four five six seven eight nine ten eleven twelve', 60, 7.2);
    expect(lines.length).toBeLessThanOrEqual(3);
  });

  test('terminates on a single unbreakable word', () => {
    const lines = wrapLabel('supercalifragilisticexpialidocious', 40, 7.2);
    expect(lines.length).toBe(1);
    expect(lines[0].length).toBeGreaterThan(0);
  });
});
