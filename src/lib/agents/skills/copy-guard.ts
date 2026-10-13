/**
 * src/lib/agents/skills/copy-guard.ts
 *
 * Safe-claims checker for marketing and learner-facing copy.
 *
 * WHY THIS EXISTS
 * ───────────────
 * ALO is a study-abroad consultancy that also publishes English-test practice.
 * Two categories of sentence are legally and reputationally dangerous in this
 * market, and both are exactly what a language model produces by default:
 *
 *   1. Claims of official status or guaranteed outcomes ("official IELTS
 *      partner", "guaranteed band 7", "97% of our students scored 7+").
 *   2. Statistics nobody can substantiate from an approved source.
 *
 * The repository's existing marketing templates already avoid these claims; this
 * module makes that a rule that can be enforced automatically instead of a habit
 * that depends on whoever is writing. `tests/marketing-skills.test.ts` runs the
 * repository's own generated drafts through it, so a future template change that
 * introduces a banned claim fails CI.
 *
 * The checker is deliberately conservative: it reports violations and returns
 * them; it never rewrites text and never blocks a render path by throwing in
 * production code. Negated usage ("not an official score") is allowed, because
 * the accurate disclosure sentences the platform must publish contain exactly
 * that phrasing.
 */

export type ClaimViolation = {
  ruleId: string;
  /** What the rule protects against. */
  description: string;
  /** The exact matched text. */
  match: string;
  /** Character offset of the match in the checked document. */
  index: number;
  /** Why it was flagged, including whether a negation was detected. */
  reason: string;
};

type ClaimRule = {
  id: string;
  description: string;
  pattern: RegExp;
  /**
   * When true, a match preceded (within NEGATION_WINDOW characters) by a
   * negation word is treated as an accurate disclosure, not a claim.
   */
  negationTolerant: boolean;
};

/** How far back to look for a negation before a match. */
const NEGATION_WINDOW = 60;

const NEGATION = /\b(?:not|never|no|without|cannot|can't|isn't|aren't|doesn't|don't|won't)\b/i;

const CLAIM_RULES: readonly ClaimRule[] = [
  {
    id: 'guaranteed-outcome',
    description: 'A guaranteed score, band, admission, visa, or offer cannot be promised.',
    pattern:
      /\bguarantee(?:d|s|ing)?\b[^.!?]{0,60}\b(?:band|score|result|admission|visa|offer|place)\b|\b(?:band|score|admission|visa|offer)\b[^.!?]{0,30}\bguarantee(?:d|s)?\b/i,
    negationTolerant: true,
  },
  {
    id: 'perfect-outcome',
    description: 'Perfect or absolute outcome claims are not supportable.',
    pattern: /\b(?:100\s?%\s*(?:success|pass|guarantee)|perfect score|full band|always pass(?:es)?)\b/i,
    negationTolerant: true,
  },
  {
    id: 'official-status',
    description:
      'Claiming official status, partnership, endorsement or accreditation with a test provider or authority.',
    // Matches both orders: "official IELTS partner" and "certified by Pearson".
    // A provider name may sit between "official" and the role word, which is how
    // this claim is actually written in the wild.
    pattern:
      /\bofficial(?:ly)?(?:\s+[A-Za-z][A-Za-z.&'-]*){0,3}\s+(?:approved|certified|accredited|endorsed|partner(?:ed|ship)?|affiliated|representative|centre|center)\b|\b(?:approved|certified|accredited|endorsed|authorised|authorized|licensed)\s+by\s+(?:the\s+)?(?:british council|idp|cambridge|ets|pearson|ielts|toefl|pte|duolingo|ukvi|home office|university)\b/i,
    negationTolerant: true,
  },
  {
    id: 'official-score-claim',
    description:
      'Calling a practice result an official score or band misrepresents what the platform measures.',
    pattern: /\bofficial\s+(?:exam\s+|test\s+)?(?:score|band|result)s?\b/i,
    negationTolerant: true,
  },
  {
    id: 'unverifiable-statistic',
    description: 'Outcome statistics require an approved, citable source.',
    pattern:
      /\b(?:\d{1,3}(?:\.\d+)?\s?%\s+of\s+(?:our\s+|the\s+)?(?:students|learners|clients|applicants)|(?:over|more than)\s+\d[\d,]*\s+(?:students|learners|clients)\b[^.!?]{0,40}\b(?:achieved|scored|got|received|were accepted))/i,
    negationTolerant: true,
  },
  {
    id: 'superlative-ranking',
    description: 'Ranking claims ("best consultancy", "#1 agency") need substantiation.',
    pattern: /\b(?:the\s+)?(?:best|number\s?one|#1|top|leading)\s+(?:study\s+abroad\s+|immigration\s+)?(?:consultancy|agency|consultant|institute|academy|centre|center)\b/i,
    negationTolerant: true,
  },
  {
    id: 'visa-guarantee',
    description: 'Visa decisions belong to the authority, never the consultancy.',
    pattern: /\b(?:visa|permit)\b[^.!?]{0,40}\b(?:guaranteed|assured|100%|sure)\b/i,
    negationTolerant: true,
  },
  {
    id: 'fabricated-testimonial',
    description: 'Quoted praise must come from a real, consenting person.',
    pattern: /\b(?:says?|said|according to)\s+[A-Z][a-z]+\b[^.!?]{0,30}\b(?:scored|achieved|got)\b/i,
    negationTolerant: false,
  },
] as const;

function isNegated(doc: string, index: number): boolean {
  const start = Math.max(0, index - NEGATION_WINDOW);
  return NEGATION.test(doc.slice(start, index));
}

/**
 * Find every unsafe claim in a document. Returns an empty array for safe copy.
 * Pure and synchronous — safe to call during render.
 */
export function findUnsafeClaims(text: string): ClaimViolation[] {
  if (!text || text.trim().length === 0) return [];

  const violations: ClaimViolation[] = [];

  for (const rule of CLAIM_RULES) {
    // A fresh regex per pass: the shared literal carries lastIndex state only
    // with /g, which is intentionally not used here.
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    const match = text.match(pattern);
    if (!match || match.index === undefined) continue;

    const negated = rule.negationTolerant && isNegated(text, match.index);
    if (negated) continue;

    violations.push({
      ruleId: rule.id,
      description: rule.description,
      match: match[0],
      index: match.index,
      reason: rule.negationTolerant
        ? 'Matched a claim pattern with no negation nearby.'
        : 'Matched a claim pattern that does not allow negation.',
    });
  }

  return violations.sort((a, b) => a.index - b.index);
}

/** True when the copy contains no unsafe claims. */
export function isSafeCopy(text: string): boolean {
  return findUnsafeClaims(text).length === 0;
}

/**
 * Human-readable summary for a UI notice. Returns null when the copy is clean,
 * so callers can render conditionally without an extra length check.
 */
export function describeClaimCheck(text: string): string | null {
  const violations = findUnsafeClaims(text);
  if (violations.length === 0) return null;

  const rules = [...new Set(violations.map((v) => v.ruleId))];
  return `${violations.length} claim${violations.length === 1 ? '' : 's'} need review (${rules.join(', ')}). Remove or substantiate with an approved source before publishing.`;
}

/** The rules this module enforces. Exported for documentation and tests. */
export const CLAIM_RULE_IDS: readonly string[] = CLAIM_RULES.map((rule) => rule.id);
