/**
 * tests/lead-score.test.ts
 *
 * Three properties matter more than any particular number here:
 *
 *   1. **It is explainable.** The contributions must sum to the score exactly, so
 *      a counsellor reading the breakdown can reproduce the number.
 *   2. **It is not a prediction.** Nothing in the output may read as a chance of
 *      admission, funding or a visa, and the disclaimer travels with the score.
 *   3. **It does not carry personal data.** The reasons name fields, never values,
 *      so the explanation can be shown and logged without moving a student's
 *      name, email address or phone number around.
 */

import { describe, expect, test } from 'bun:test';
import {
  LEAD_SCORE_DISCLAIMER,
  STALE_AFTER_DAYS,
  bandFor,
  describeLeadScore,
  rankLeads,
  scoreLead,
  type ScorableLead,
} from '../src/lib/crm/lead-score';

const NOW = new Date('2026-10-14T09:00:00Z');

const completeLead: ScorableLead = {
  status: 'QUALIFIED',
  source: 'WEBSITE',
  country: 'United Kingdom',
  courseInterest: 'MSc Data Science',
  intake: 'September 2027',
  budgetRange: '20–30 lakh BDT',
  englishStatus: 'IELTS 6.5',
  email: 'student@example.com',
  phone: '+8801712345678',
  notes: 'Wants London',
  createdAt: new Date('2026-10-10T09:00:00Z'),
};

describe('the score is the sum of its reasons', () => {
  test('contributions add up exactly, so the number can be rebuilt by hand', () => {
    const result = scoreLead(completeLead, { messageCount: 6, hasServiceConsent: true }, NOW);
    const summed = result.contributions.reduce((total, contribution) => total + contribution.points, 0);
    expect(result.score).toBe(Math.max(0, Math.min(100, summed)));
  });

  test('a bare lead scores below a complete one', () => {
    const bare = scoreLead({ status: 'NEW', createdAt: NOW }, {}, NOW);
    const complete = scoreLead(completeLead, { messageCount: 6, hasServiceConsent: true }, NOW);
    expect(bare.score).toBeLessThan(complete.score);
  });

  test('adding a signal never lowers the score', () => {
    const withoutConsent = scoreLead(completeLead, { messageCount: 6 }, NOW);
    const withConsent = scoreLead(completeLead, { messageCount: 6, hasServiceConsent: true }, NOW);
    expect(withConsent.score).toBeGreaterThanOrEqual(withoutConsent.score);

    const withoutMessages = scoreLead(completeLead, {}, NOW);
    const withMessages = scoreLead(completeLead, { messageCount: 6 }, NOW);
    expect(withMessages.score).toBeGreaterThanOrEqual(withoutMessages.score);
  });

  test('the same inputs always give the same score and the same order', () => {
    const first = scoreLead(completeLead, { messageCount: 3 }, NOW);
    const second = scoreLead(completeLead, { messageCount: 3 }, NOW);
    expect(second.score).toBe(first.score);
    expect(second.contributions).toEqual(first.contributions);
  });

  test('the score is bounded to 0–100', () => {
    const bloated = scoreLead(
      { ...completeLead, status: 'CONVERTED' },
      { messageCount: 50, practiceAttempts: 20, hasServiceConsent: true, hasMarketingConsent: true, lastContactedAt: NOW },
      NOW,
    );
    expect(bloated.score).toBeLessThanOrEqual(100);

    const dead = scoreLead({ ...completeLead, status: 'LOST' }, {}, NOW);
    expect(dead.score).toBeGreaterThanOrEqual(0);
  });
});

describe('bands', () => {
  test('a lost lead is CLOSED whatever the number says', () => {
    const closed = scoreLead({ ...completeLead, status: 'LOST' }, { messageCount: 6 }, NOW);
    expect(closed.band).toBe('CLOSED');
    expect(bandFor(90, 'LOST')).toBe('CLOSED');
  });

  test('band boundaries are stable', () => {
    expect(bandFor(34)).toBe('COLD');
    expect(bandFor(35)).toBe('WARM');
    expect(bandFor(64)).toBe('WARM');
    expect(bandFor(65)).toBe('HOT');
  });
});

describe('what it refuses to be', () => {
  test('the disclaimer is attached to every score', () => {
    const result = scoreLead(completeLead, {}, NOW);
    expect(result.disclaimer).toBe(LEAD_SCORE_DISCLAIMER);
    expect(result.disclaimer).toContain('not a prediction');
  });

  test('no reason echoes the lead’s name, email address or phone number', () => {
    const result = scoreLead(completeLead, { messageCount: 2 }, NOW);
    const rendered = [
      ...result.contributions.map((contribution) => contribution.label),
      ...result.nextActions,
      describeLeadScore(result),
    ].join(' | ');

    for (const secret of ['student@example.com', '+8801712345678', 'MSc Data Science', 'London', '20–30 lakh BDT']) {
      expect(rendered).not.toContain(secret);
    }
  });

  test('nothing in the output claims an outcome', () => {
    const result = scoreLead(completeLead, { messageCount: 2, lastContactedAt: NOW }, NOW);
    const rendered = result.contributions.map((contribution) => contribution.label).join(' ').toLowerCase();
    for (const word of ['admission chance', 'visa chance', 'approval', 'likely to be accepted', 'guarantee']) {
      expect(rendered).not.toContain(word);
    }
  });
});

describe('next actions', () => {
  test('a brand-new thin lead is told to make first contact and fill the gaps', () => {
    const result = scoreLead({ status: 'NEW', createdAt: NOW, phone: null, email: null }, {}, NOW);
    expect(result.nextActions.length).toBeGreaterThan(0);
    expect(result.nextActions.length).toBeLessThanOrEqual(3);
    expect(result.nextActions.join(' ')).toContain('first contact');
  });

  test('a stale file is told to follow up', () => {
    const lastContactedAt = new Date(NOW.getTime() - (STALE_AFTER_DAYS + 5) * 86_400_000);
    const result = scoreLead(completeLead, { lastContactedAt }, NOW);
    expect(result.contributions.map((contribution) => contribution.code)).toContain('CONTACT_STALE');
    expect(result.nextActions.join(' ')).toContain('gone quiet');
  });

  test('a closed file gets no call list', () => {
    expect(scoreLead({ ...completeLead, status: 'LOST' }, {}, NOW).nextActions).toEqual([
      'No action: the file is closed.',
    ]);
    expect(scoreLead({ ...completeLead, status: 'CONVERTED' }, {}, NOW).nextActions[0]).toContain('already a student');
  });

  test('a lead that only needs a preferred name is not told to collect a phone it has', () => {
    const result = scoreLead({ ...completeLead, budgetRange: null }, {}, NOW);
    expect(result.nextActions.join(' ')).not.toContain('phone number');
    expect(result.nextActions.join(' ')).toContain('budget');
  });
});

describe('ranking a call list', () => {
  test('highest score first, then the longest-waiting lead', () => {
    const ranked = rankLeads([
      { id: 'c', score: 40, createdAt: new Date('2026-09-01') },
      { id: 'a', score: 80, createdAt: new Date('2026-10-01') },
      { id: 'b', score: 40, createdAt: new Date('2026-08-01') },
      { id: 'd', score: 80, createdAt: new Date('2026-09-15') },
    ]);
    expect(ranked.map((row) => row.id)).toEqual(['d', 'a', 'b', 'c']);
  });

  test('ranking does not mutate the input', () => {
    const rows = [
      { id: 'a', score: 10, createdAt: new Date('2026-10-01') },
      { id: 'b', score: 50, createdAt: new Date('2026-10-02') },
    ];
    rankLeads(rows);
    expect(rows.map((row) => row.id)).toEqual(['a', 'b']);
  });
});

describe('describeLeadScore', () => {
  test('reads as a sentence, not as a bare number', () => {
    const description = describeLeadScore(scoreLead(completeLead, { messageCount: 5 }, NOW));
    expect(description).toMatch(/^(HOT|WARM|COLD|CLOSED) \(\d+\/100\): \d+ positive signal/);
  });

  test('warnings are mentioned when they exist', () => {
    const lastContactedAt = new Date(NOW.getTime() - 30 * 86_400_000);
    const description = describeLeadScore(scoreLead(completeLead, { lastContactedAt }, NOW));
    expect(description).toContain('warning');
  });
});
