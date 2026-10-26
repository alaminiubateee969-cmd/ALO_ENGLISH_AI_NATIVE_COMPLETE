/**
 * tests/marketing-skills.test.ts
 *
 * Two jobs:
 *
 *   1. Skill packs stay reviewable — every pack declares inputs, steps,
 *      guardrails and output sections, and none may auto-execute.
 *   2. The safe-claims checker both catches unsafe copy AND passes the
 *      repository's own generated marketing drafts. The second half is the
 *      important one: it means a future template change that introduces a
 *      guarantee or an invented statistic fails CI instead of shipping.
 */

import { describe, expect, test } from 'bun:test';
import {
  CLAIM_RULE_IDS,
  MARKETING_SKILLS,
  buildSkillPrompt,
  describeClaimCheck,
  findUnsafeClaims,
  getSkill,
  getSkillStats,
  isSafeCopy,
} from '../src/lib/agents/skills';
import { generateMarketingDraft, MARKETING_CONTENT_TYPES } from '../src/lib/marketing-content';

describe('marketing skill packs', () => {
  test('identifiers are unique and namespaced', () => {
    const ids = MARKETING_SKILLS.map((skill) => skill.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^SKILL-[A-Z]+-\d{2}$/);
  });

  test('every pack is complete enough to hand to a writer', () => {
    for (const skill of MARKETING_SKILLS) {
      expect(skill.purpose.length).toBeGreaterThan(20);
      expect(skill.whenToUse.length).toBeGreaterThan(0);
      expect(skill.requiredInputs.length).toBeGreaterThan(0);
      expect(skill.steps.length).toBeGreaterThan(3);
      expect(skill.guardrails.length).toBeGreaterThan(0);
      expect(skill.outputSections.length).toBeGreaterThan(1);
    }
  });

  test('no marketing skill may auto-execute', () => {
    for (const skill of MARKETING_SKILLS) {
      expect(skill.canAutoExecute).toBe(false);
      expect(skill.status).not.toBe('verified');
    }
    expect(getSkillStats().autoExecutable).toBe(0);
    expect(getSkillStats().humanApprovalRequired).toBe(MARKETING_SKILLS.length);
  });

  test('every pack forbids guaranteeing an outcome or implying official status', () => {
    for (const skill of MARKETING_SKILLS) {
      const guardrails = skill.guardrails.join(' ').toLowerCase();
      const coversClaims =
        guardrails.includes('guarantee') ||
        guardrails.includes('official') ||
        guardrails.includes('mislead') ||
        guardrails.includes('source') ||
        guardrails.includes('evidenc') ||
        guardrails.includes('claim');
      expect(coversClaims).toBe(true);
    }
  });

  test('getSkill resolves by id', () => {
    expect(getSkill('SKILL-SEO-01')?.owner).toBe('Marketing');
    expect(getSkill('SKILL-NOPE-99')).toBeUndefined();
  });
});

describe('buildSkillPrompt', () => {
  const skill = getSkill('SKILL-COPY-01')!;
  const context = {
    subject: 'IELTS practice sets',
    audience: 'students preparing for a UK master’s application',
    knownFacts: ['Practice sets are listed in the active catalog'],
    callToAction: 'Book a consultation',
    url: 'https://english.aloeducation.com/book-consultation',
  };

  test('is deterministic for identical input', () => {
    expect(buildSkillPrompt(skill, context)).toBe(buildSkillPrompt(skill, context));
  });

  test('carries context, guardrails, output sections and the approval line', () => {
    const prompt = buildSkillPrompt(skill, context);

    expect(prompt).toContain('SKILL-COPY-01');
    expect(prompt).toContain('IELTS practice sets');
    expect(prompt).toContain('Book a consultation');
    expect(prompt).toContain('## Guardrails (do not cross)');
    expect(prompt).toContain('No outcome, band, visa, admission, or scholarship guarantee.');
    expect(prompt).toContain('canAutoExecute=false');
    for (const section of skill.outputSections) expect(prompt).toContain(`## ${section}`);
  });

  test('falls back to the approved practice-only statement when no facts are given', () => {
    const prompt = buildSkillPrompt(skill, { subject: 'PTE practice', audience: 'applicants' });
    expect(prompt).toContain('not official exam results');
    expect(prompt).toContain('Call to action: not set');
  });
});

describe('safe-claims checker', () => {
  test('flags guaranteed outcomes', () => {
    const violations = findUnsafeClaims('Guaranteed band 7 in four weeks, or your money back.');
    expect(violations.map((v) => v.ruleId)).toContain('guaranteed-outcome');
    expect(isSafeCopy('Guaranteed band 7 in four weeks.')).toBe(false);
  });

  test('flags implied official status with a provider', () => {
    const violations = findUnsafeClaims('We are an official IELTS partner centre.');
    expect(violations.map((v) => v.ruleId)).toContain('official-status');
  });

  test('flags invented outcome statistics', () => {
    const violations = findUnsafeClaims('97% of our students scored band 7 or above last year.');
    expect(violations.length).toBeGreaterThan(0);
  });

  test('flags visa guarantees', () => {
    expect(isSafeCopy('Your student visa is guaranteed with our premium package.')).toBe(false);
  });

  test('flags unsubstantiated ranking claims', () => {
    expect(isSafeCopy('The best consultancy in Dhaka for UK admissions.')).toBe(false);
  });

  test('allows accurate negated disclosures', () => {
    expect(isSafeCopy('Practice scores are estimates and are not official exam results.')).toBe(true);
    expect(isSafeCopy('ALO does not guarantee a visa or an admission decision.')).toBe(true);
    expect(isSafeCopy('Any band guidance is study help, never an official band.')).toBe(true);
  });

  test('empty or whitespace copy is not a violation', () => {
    expect(findUnsafeClaims('')).toEqual([]);
    expect(findUnsafeClaims('   \n  ')).toEqual([]);
  });

  test('violations report a rule id, the match and an index', () => {
    const [first] = findUnsafeClaims('Guaranteed admission to any university.');
    expect(first).toBeDefined();
    expect(CLAIM_RULE_IDS).toContain(first.ruleId);
    expect(first.match.toLowerCase()).toContain('guaranteed');
    expect(first.index).toBeGreaterThanOrEqual(0);
    expect(first.reason.length).toBeGreaterThan(10);
  });

  test('describeClaimCheck returns null for clean copy and a summary otherwise', () => {
    expect(describeClaimCheck('Book a free consultation to discuss your options.')).toBeNull();
    const summary = describeClaimCheck('Guaranteed visa. 100% success. best consultancy in Dhaka.');
    expect(summary).not.toBeNull();
    expect(summary).toContain('need review');
  });

  /**
   * The regression that matters: the repository's own templates must stay clean.
   * If someone edits a template to add a guarantee, this fails.
   */
  test('every generated marketing draft passes the safe-claims check', () => {
    for (const type of MARKETING_CONTENT_TYPES) {
      const draft = generateMarketingDraft({
        type: type.id,
        offer: 'ALO English practice',
        audience: 'students preparing for an English test',
        facts: 'Practice sets are listed in the active catalog',
        tone: 'clear and encouraging',
        callToAction: 'Explore practice tests',
        url: 'https://english.aloeducation.com/exam-prep',
      });

      const violations = findUnsafeClaims(draft);
      expect({ type: type.id, violations: violations.map((v) => v.ruleId) }).toEqual({
        type: type.id,
        violations: [],
      });
    }
  });
});
