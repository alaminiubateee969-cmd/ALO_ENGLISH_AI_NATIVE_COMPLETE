/**
 * tests/question-provenance.test.ts
 *
 * The provenance gate is the release control that decides whether a question
 * bank may be published. A gate that can be satisfied by a placeholder is worse
 * than no gate at all, so these tests are written from the adversarial side:
 * every one of them tries to sneak past it.
 *
 * Fixed `now` is injected so freshness rules are deterministic and do not start
 * failing on their own in a year.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateProvenance } from '../scripts/validate-question-provenance.mjs';

const ROOT = join(import.meta.dir, '..');
const NOW = new Date('2026-10-14T00:00:00Z');

/** A complete, valid manifest. Individual tests break one field at a time. */
function validManifest() {
  return {
    manifestVersion: 1,
    updatedAt: '2026-10-14',
    examTypes: [
      {
        code: 'IELTS-ACADEMIC',
        name: 'IELTS Academic',
        contentOwner: 'ALO Education academic team',
        licence: {
          id: 'ORIGINAL-ALO',
          name: 'Original ALO-authored practice content',
          url: null,
          attributionRequired: false,
          attributionText: null,
        },
        permission: {
          evidenceReference: 'authoring run AR-2026-10-12',
          grantedBy: 'Head of Academic',
          grantedOn: '2026-10-12',
          expiresOn: null,
        },
        officialFormat: {
          verified: true,
          sourceUrl: 'https://ielts.org/take-a-test/test-types',
          checkedOn: '2026-10-01',
          notes: 'Format pages reviewed for the current sitting.',
        },
        answerKeySource: 'Two-reviewer key check, run KEY-2026-10-13',
        declaredCounts: { questionCount: 40, listeningWithVerifiedAudio: 10 },
        audioRights: {
          included: true,
          licenceId: 'TTS-COMMERCIAL-EDGE-VOICES',
          notes: 'Synthesised voice, commercial use cleared.',
        },
        reviewedBy: 'Head of Academic',
        reviewedOn: '2026-10-13',
      },
    ],
  };
}

function validate(manifest: unknown) {
  return validateProvenance(manifest, { now: NOW });
}

describe('provenance gate — accepted manifest', () => {
  test('a complete manifest passes with no errors', () => {
    const result = validate(validManifest());
    expect(result.errors).toEqual([]);
    expect(result.summary.declaredQuestions).toBe(40);
    expect(result.summary.licences).toEqual(['ORIGINAL-ALO']);
  });

  test('summarises totals across multiple exam types', () => {
    const manifest = validManifest();
    const second = JSON.parse(JSON.stringify(manifest.examTypes[0]));
    second.code = 'PTE-ACADEMIC';
    second.name = 'PTE Academic';
    second.declaredCounts = { questionCount: 25, listeningWithVerifiedAudio: 0 };
    manifest.examTypes.push(second);

    const result = validate(manifest);
    expect(result.errors).toEqual([]);
    expect(result.summary.declaredQuestions).toBe(65);
    expect(result.summary.examTypes).toBe(2);
  });
});

describe('provenance gate — rejects placeholders and omissions', () => {
  test('rejects a non-object manifest', () => {
    expect(validate(null).errors[0]).toContain('not a JSON object');
    expect(validate([]).errors[0]).toContain('not a JSON object');
  });

  test('rejects a wrong manifest version', () => {
    const manifest = { ...validManifest(), manifestVersion: 2 };
    expect(validate(manifest).errors.join(' ')).toContain('manifestVersion must be 1');
  });

  test('rejects an empty or missing exam list', () => {
    expect(validate({ ...validManifest(), examTypes: [] }).errors.join(' ')).toContain('non-empty array');
  });

  for (const placeholder of ['TBD', 'n/a', '', '   ', 'unknown', 'PLACEHOLDER', 'sample']) {
    test(`rejects the placeholder ${JSON.stringify(placeholder)} in licence.id`, () => {
      const manifest = validManifest();
      manifest.examTypes[0].licence.id = placeholder;
      expect(validate(manifest).errors.join(' ')).toContain('licence.id');
    });
  }

  test('rejects an unverified official format', () => {
    const manifest = validManifest();
    manifest.examTypes[0].officialFormat.verified = false;
    expect(validate(manifest).errors.join(' ')).toContain('officialFormat.verified must be true');
  });

  test('rejects a missing permission evidence reference', () => {
    const manifest = validManifest();
    manifest.examTypes[0].permission.evidenceReference = 'TBD';
    expect(validate(manifest).errors.join(' ')).toContain('evidenceReference');
  });

  test('requires attribution text when attribution is required', () => {
    const manifest = validManifest();
    manifest.examTypes[0].licence.attributionRequired = true;
    manifest.examTypes[0].licence.attributionText = null;
    expect(validate(manifest).errors.join(' ')).toContain('attributionText');
  });

  test('rejects a zero-question bank outright', () => {
    const manifest = validManifest();
    manifest.examTypes[0].declaredCounts.questionCount = 0;
    const errors = validate(manifest).errors.join(' ');
    expect(errors).toContain('positive integer');
    expect(errors).toContain('totals zero');
  });

  test('rejects audio-claiming listening items without cleared audio rights', () => {
    const manifest = validManifest();
    manifest.examTypes[0].audioRights = { included: false, licenceId: 'TBD', notes: '' };
    const errors = validate(manifest).errors.join(' ');
    expect(errors).toContain('audioRights.included must be true');
    expect(errors).toContain('audioRights.licenceId');
  });

  test('rejects a listening count larger than the question count', () => {
    const manifest = validManifest();
    manifest.examTypes[0].declaredCounts = { questionCount: 10, listeningWithVerifiedAudio: 11 };
    expect(validate(manifest).errors.join(' ')).toContain('cannot exceed questionCount');
  });

  test('rejects duplicate exam codes', () => {
    const manifest = validManifest();
    manifest.examTypes.push(JSON.parse(JSON.stringify(manifest.examTypes[0])));
    expect(validate(manifest).errors.join(' ')).toContain('declared more than once');
  });
});

describe('provenance gate — dates', () => {
  test('rejects a future grant date', () => {
    const manifest = validManifest();
    manifest.examTypes[0].permission.grantedOn = '2027-01-01';
    expect(validate(manifest).errors.join(' ')).toContain('in the future');
  });

  test('rejects malformed dates', () => {
    const manifest = validManifest();
    manifest.examTypes[0].reviewedOn = '13/10/2026';
    expect(validate(manifest).errors.join(' ')).toContain('reviewedOn must be an ISO date');
  });

  test('rejects an expired licence', () => {
    const manifest = validManifest();
    manifest.examTypes[0].permission.expiresOn = '2026-09-30';
    expect(validate(manifest).errors.join(' ')).toContain('expiresOn has passed');
  });

  test('warns when the official format was checked more than a year ago', () => {
    const manifest = validManifest();
    manifest.examTypes[0].officialFormat.checkedOn = '2024-01-01';
    const result = validate(manifest);
    expect(result.errors).toEqual([]);
    expect(result.warnings.join(' ')).toContain('older than 12 months');
  });
});

describe('provenance gate — source hosts', () => {
  test('accepts a known official provider host', () => {
    const manifest = validManifest();
    manifest.examTypes[0].officialFormat.sourceUrl = 'https://www.ets.org/toefl/test-takers/ibt/about/content.html';
    const result = validate(manifest);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  test('warns about an unofficial source host without failing the gate', () => {
    const manifest = validManifest();
    manifest.examTypes[0].officialFormat.sourceUrl = 'https://some-blog.example.com/ielts-format';
    const result = validate(manifest);
    expect(result.errors).toEqual([]);
    expect(result.warnings.join(' ')).toContain('not a known official provider host');
  });

  test('rejects an invalid source URL', () => {
    const manifest = validManifest();
    manifest.examTypes[0].officialFormat.sourceUrl = 'not-a-url';
    expect(validate(manifest).errors.join(' ')).toContain('not a valid URL');
  });
});

describe('the shipped example manifest', () => {
  /**
   * The example documents the shape. It must never be mistaken for real
   * provenance, so this test asserts it is rejected — if someone fills it in,
   * this test fails and forces them to move it to the real filename.
   */
  test('intentionally fails validation while demonstrating the shape', () => {
    const raw = readFileSync(join(ROOT, 'prisma', 'question-provenance.example.json'), 'utf8');
    const manifest = JSON.parse(raw);
    const result = validate(manifest);

    expect(result.errors.length).toBeGreaterThan(3);
    expect(manifest.manifestVersion).toBe(1);
    expect(manifest.examTypes[0].officialFormat).toBeDefined();
  });
});
