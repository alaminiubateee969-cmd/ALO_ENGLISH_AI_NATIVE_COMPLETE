/**
 * tests/pipeline.test.ts
 *
 * The property that matters: no lead can become invisible on the board.
 *
 * A pipeline view is comfortable and therefore dangerous — a lead whose status is
 * not in the column list simply does not appear, and nobody notices because the
 * board still renders. The tests below put a lead in every stage, in an unknown
 * stage, and in no data at all, and check that each one is either shown or
 * explicitly reported.
 */

import { describe, expect, test } from 'bun:test';
import {
  PIPELINE_STAGES,
  UNKNOWN_STAGE_STATUS,
  buildPipeline,
  unrecognisedStatuses,
} from '../src/lib/crm/pipeline';

const NOW = new Date('2026-10-14T09:00:00Z');

function lead(overrides: Partial<{ id: string; name: string; status: string; createdAt: Date }> = {}) {
  return {
    id: overrides.id ?? 'lead_1',
    name: overrides.name ?? 'A Student',
    status: overrides.status ?? 'NEW',
    createdAt: overrides.createdAt ?? new Date('2026-10-10T09:00:00Z'),
    source: 'WEBSITE',
    country: 'United Kingdom',
    intake: 'September 2027',
  };
}

describe('grouping', () => {
  test('every known stage gets a column, in pipeline order', () => {
    const pipeline = buildPipeline([], NOW);
    expect(pipeline.columns.map((column) => column.status)).toEqual(PIPELINE_STAGES.map((stage) => stage.status));
    expect(pipeline.total).toBe(0);
    expect(pipeline.hasUnrecognised).toBe(false);
  });

  test('a lead lands in its own stage and nowhere else', () => {
    const pipeline = buildPipeline(
      [lead({ id: 'a', status: 'NEW' }), lead({ id: 'b', status: 'QUALIFIED' }), lead({ id: 'c', status: 'QUALIFIED' })],
      NOW,
    );
    const byStatus = new Map(pipeline.columns.map((column) => [column.status, column]));
    expect(byStatus.get('NEW')?.count).toBe(1);
    expect(byStatus.get('QUALIFIED')?.count).toBe(2);
    expect(byStatus.get('LOST')?.count).toBe(0);
    expect(pipeline.total).toBe(3);
  });

  test('every lead in the input appears in exactly one column', () => {
    const leads = PIPELINE_STAGES.map((stage, index) =>
      lead({ id: `lead_${index}`, status: stage.status }),
    ).concat(lead({ id: 'lead_unknown', status: 'WAITING_FOR_OFFER' }));

    const pipeline = buildPipeline(leads, NOW);
    const shown = pipeline.columns.flatMap((column) => column.leads.map((row) => row.id));
    expect(shown).toHaveLength(leads.length);
    expect(new Set(shown).size).toBe(leads.length);
  });

  test('a status the stage list does not know gets a column of its own, flagged', () => {
    const pipeline = buildPipeline([lead({ id: 'odd', status: 'WAITING_FOR_OFFER' })], NOW);
    const unexpected = pipeline.columns.find((column) => column.status === UNKNOWN_STAGE_STATUS);

    expect(pipeline.hasUnrecognised).toBe(true);
    expect(unexpected?.unexpected).toBe(true);
    expect(unexpected?.count).toBe(1);
    expect(unexpected?.leads.map((row) => row.id)).toEqual(['odd']);
    expect(unexpected?.meaning).toContain('need a stage');
  });

  test('a pipeline with nothing unrecognised does not invent the extra column', () => {
    const pipeline = buildPipeline([lead()], NOW);
    expect(pipeline.columns.some((column) => column.status === UNKNOWN_STAGE_STATUS)).toBe(false);
    expect(pipeline.hasUnrecognised).toBe(false);
  });

  test('statuses present in the data but missing from the stage list are listable', () => {
    expect(unrecognisedStatuses([lead({ status: 'NEW' }), lead({ status: 'ARCHIVED' }), lead({ status: 'ARCHIVED' })])).toEqual([
      'ARCHIVED',
    ]);
    expect(unrecognisedStatuses([lead({ status: 'NEW' })])).toEqual([]);
  });
});

describe('ordering and waiting times', () => {
  const leads = [
    lead({ id: 'newer', status: 'NEW', createdAt: new Date('2026-10-13T09:00:00Z') }),
    lead({ id: 'oldest', status: 'NEW', createdAt: new Date('2026-10-01T09:00:00Z') }),
    lead({ id: 'middle', status: 'NEW', createdAt: new Date('2026-10-07T09:00:00Z') }),
  ];

  test('leads are oldest first inside a column, so the longest wait is at the top', () => {
    const column = buildPipeline(leads, NOW).columns.find((entry) => entry.status === 'NEW');
    expect(column?.leads.map((row) => row.id)).toEqual(['oldest', 'middle', 'newer']);
  });

  test('the reported wait is the oldest lead in the column', () => {
    const column = buildPipeline(leads, NOW).columns.find((entry) => entry.status === 'NEW');
    expect(column?.oldestAgeDays).toBe(13);
  });

  test('an empty column reports no waiting time rather than zero', () => {
    const column = buildPipeline([], NOW).columns.find((entry) => entry.status === 'LOST');
    expect(column?.oldestAgeDays).toBeNull();
    expect(column?.count).toBe(0);
  });

  test('a lead created in the future does not produce a negative wait', () => {
    const future = lead({ createdAt: new Date('2026-12-01T09:00:00Z') });
    const column = buildPipeline([future], NOW).columns.find((entry) => entry.status === 'NEW');
    expect(column?.oldestAgeDays).toBe(0);
  });

  test('a date arriving as an ISO string is handled the same as a Date', () => {
    const asString = buildPipeline(
      [{ ...lead({ id: 'iso' }), createdAt: '2026-10-01T09:00:00.000Z' }],
      NOW,
    ).columns.find((entry) => entry.status === 'NEW');
    expect(asString?.oldestAgeDays).toBe(13);
  });
});

describe('what the board refuses to claim', () => {
  test('the note says there is no conversion rate, and why', () => {
    const pipeline = buildPipeline([lead()], NOW);
    expect(pipeline.note).toContain('No conversion rate');
    expect(pipeline.note).toContain('cohort');
  });

  test('the stage list has no stage for a student record, because that is not a stage', () => {
    // "Converted" is the end of the pipeline; ongoing student work belongs in the
    // student surfaces, and duplicating it here would double-count the same people.
    const statuses = PIPELINE_STAGES.map((stage) => stage.status);
    expect(statuses).toContain('CONVERTED');
    expect(statuses).not.toContain('STUDENT');
  });

  test('every stage explains what it means', () => {
    for (const stage of PIPELINE_STAGES) {
      expect(stage.meaning.length).toBeGreaterThan(10);
      expect(stage.label.trim().length).toBeGreaterThan(0);
    }
  });
});
