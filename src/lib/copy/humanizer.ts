/**
 * src/lib/copy/humanizer.ts
 *
 * A style filter for prose that reads as machine-written.
 *
 * WHY THIS EXISTS, AND WHY IT IS SEPARATE FROM copy-guard
 * ──────────────────────────────────────────────────────
 * `src/lib/agents/skills/copy-guard.ts` answers "is this sentence legally
 * dangerous?" — guarantees, invented statistics, claims of official status.
 * This module answers a different question: "does this sound like a person?"
 *
 * Both matter for the same reason. Copy that reads as generated is not merely
 * unfashionable: on a consultancy site it costs trust exactly where trust is the
 * product, and it is the fastest way for a page to look like every competitor's
 * page. The patterns below are the ones that show up in model-written marketing
 * prose and almost nowhere else — the em-dash tricolon, "in today's fast-paced
 * world", three adjectives where one would do, a hedge in front of every verb.
 *
 * WHAT IT DOES NOT DO
 * ───────────────────
 * It never rewrites. A checker that edits prose is a checker whose suggestions
 * nobody reads, and the decisions here are the writer's. It reports, ranks by how
 * loud the tell is, and offers a shorter version of the same thought as a hint.
 *
 * Deliberately absent: a "human score" presented as objective. The number below
 * is an index of matches per hundred words, and it is labelled as such.
 */

export type StyleCategory = 'AI_TELL' | 'FILLER' | 'HEDGE' | 'PATTERN';

export type StyleRule = {
  id: string;
  category: StyleCategory;
  /** What the writer is actually doing wrong. */
  problem: string;
  pattern: RegExp;
  /** A shorter way to say the same thing, when there is one. */
  suggestion?: string;
};

/**
 * Ordered as a writer would meet them: stock phrases first, then padding, then
 * hedging, then structural tics.
 */
export const STYLE_RULES: readonly StyleRule[] = [
  {
    id: 'stock-fast-paced',
    category: 'AI_TELL',
    problem: 'Opening with the state of the world says nothing about the reader.',
    pattern: /\b(?:in today'?s (?:fast[- ]paced|ever[- ]changing|digital|modern) (?:world|landscape|environment)|in an ever[- ]evolving|in the modern world)\b/gi,
    suggestion: 'Start with the reader\u2019s situation instead: "You are planning a Master\u2019s for September…"',
  },
  {
    id: 'stock-delve',
    category: 'AI_TELL',
    problem: '"Delve into" is written, never said.',
    pattern: /\b(?:delve|dive deep|deep dive) (?:into|in)\b/gi,
    suggestion: '"Look at" or just say what the thing is.',
  },
  {
    id: 'stock-unlock',
    category: 'AI_TELL',
    problem: '"Unlock" turns a service into a product slogan.',
    pattern: /\bunlock(?:ing)? (?:your|the|a) (?:potential|future|opportunit\w+|possibilit\w+)\b/gi,
    suggestion: 'Name the concrete result: "a plan for your intake", "a practice sitting that is marked".',
  },
  {
    id: 'stock-seamless',
    category: 'AI_TELL',
    problem: 'Seamless, robust, cutting-edge: adjectives that survive any rewrite because they mean nothing.',
    pattern: /\b(?:seamless(?:ly)?|robust|cutting[- ]edge|state[- ]of[- ]the[- ]art|world[- ]class|best[- ]in[- ]class|game[- ]changer|revolutionar\w+|transformative|elevate your|empower(?:ing)? you)\b/gi,
    suggestion: 'Delete the adjective and check the sentence still says something. If it does not, it said nothing.',
  },
  {
    id: 'stock-testament',
    category: 'AI_TELL',
    problem: '"A testament to", "navigate the complexities", "the realm of": ceremony instead of information.',
    pattern: /\b(?:a testament to|navigate the (?:complexit\w+|landscape)|the realm of|the world of|tal\w+ about (?:how|the)|speaks volumes)\b/gi,
    suggestion: 'State the fact the phrase is decorating.',
  },
  {
    id: 'stock-excited',
    category: 'AI_TELL',
    problem: 'Announcing excitement is a press release, not a sentence to a student.',
    pattern: /\b(?:we(?:'| a)?re (?:excited|thrilled|delighted) to (?:announce|share|introduce)|excited to announce)\b/gi,
    suggestion: 'Say what changed and what it means for the reader.',
  },
  {
    id: 'filler-it-is-worth-noting',
    category: 'FILLER',
    problem: 'If it were not worth noting, it would not be in the sentence.',
    pattern: /\b(?:it (?:is|'s) worth noting that|it should be noted that|it is important to note that|please note that|needless to say)\b/gi,
  },
  {
    id: 'filler-in-order-to',
    category: 'FILLER',
    problem: 'Padding around the verb.',
    pattern: /\b(?:in order to|due to the fact that|at this point in time|in the event that|for the purpose of|a wide range of|a variety of)\b/gi,
    suggestion: '"to", "because", "now", "if".',
  },
  {
    id: 'hedge-stacking',
    category: 'HEDGE',
    problem: 'Two hedges in one clause is a writer who has not decided.',
    pattern: /\b(?:may (?:possibly|potentially)|might (?:possibly|potentially)|could (?:possibly|potentially)|generally (?:speaking|tends to)|tends to (?:often|usually)|often (?:tends to|may)|it (?:could|might) be (?:argued|said) that)\b/gi,
    suggestion: 'Commit to the claim, or explain the uncertainty once with a source.',
  },
  {
    id: 'hedge-both-sides',
    category: 'HEDGE',
    problem: 'Saying both sides of everything reads as an answer that avoided the question.',
    pattern: /\b(?:on the one hand|on the other hand|whilst|while it is true that)\b/gi,
  },
  {
    id: 'pattern-tricolon',
    category: 'PATTERN',
    problem:
      'Three-item lists are the default rhythm of generated prose; two or four reads like a human chose. // only fires when the three items are modifiers, not a real list of things.',
    // A real list of things ("your passport, transcripts and a photograph") is not
    // a tricolon, so the pattern is narrowed: no plural items and no determiner
    // inside the list. That still leaves honest adjective lists flagged —
    // "grammar, spelling and wording" — which is why this is a PATTERN hint and
    // never a block. Tightening it further would start missing the tell it exists
    // for.
    pattern: /\b(?!\w*s\b)[\w-]+,\s+(?!\w*s\b)(?![a-z]+\s+(?:a|an|the)\b)[\w-]+\s+and\s+(?!\w*s\b)(?!(?:a|an|the)\s)[\w-]+\b/g,
  },
  {
    id: 'pattern-not-only',
    category: 'PATTERN',
    problem: '"Not only … but also" exists mostly in essays about essays.',
    pattern: /\bnot only\b[^.!?]{0,80}?\bbut also\b/gi,
    suggestion: 'Split into two sentences.',
  },
  {
    id: 'pattern-in-conclusion',
    category: 'PATTERN',
    problem: 'Labelling a conclusion announces that the writing is a task.',
    pattern: /\b(?:in conclusion|to summari[sz]e|in summary|all in all|at the end of the day)\b/gi,
  },
  {
    id: 'pattern-overall-connector',
    category: 'PATTERN',
    problem: 'Sentence-opening connectors stacked down a page read as a generated list.',
    pattern: /(?:^|\n)\s*(?:furthermore|moreover|additionally|consequently|nevertheless|nonetheless|that being said)\b/gi,
  },
];

export type StyleFinding = {
  ruleId: string;
  category: StyleCategory;
  problem: string;
  /** The exact matched text, trimmed for display. */
  match: string;
  index: number;
  suggestion: string | null;
};

export type StyleReport = {
  /** Findings in document order. */
  findings: StyleFinding[];
  /** Matches per 100 words. An index, not a grade; see the module note. */
  tellIndex: number;
  words: number;
  /** The longest sentence, in words, with its first few words for identification. */
  longestSentence: { words: number; opening: string } | null;
  /** Counts per category, for a compact display. */
  byCategory: Record<StyleCategory, number>;
};

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Every style rule match in the text, in document order. */
export function findStyleIssues(text: string): StyleFinding[] {
  if (!text.trim()) return [];

  const findings: StyleFinding[] = [];
  for (const rule of STYLE_RULES) {
    // Fresh regex per call path: a shared /g regex carries lastIndex between
    // inputs, which silently skips matches on the second document.
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    for (const match of text.matchAll(pattern)) {
      findings.push({
        ruleId: rule.id,
        category: rule.category,
        problem: rule.problem,
        match: match[0].trim(),
        index: match.index ?? 0,
        suggestion: rule.suggestion ?? null,
      });
    }
  }

  return findings.sort((left, right) => left.index - right.index);
}

/** Longest sentence, ignoring abbreviations' full stops imperfectly but usefully. */
function longestSentenceIn(text: string): { words: number; opening: string } | null {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
  if (sentences.length === 0) return null;

  let longest = sentences[0];
  for (const sentence of sentences) {
    if (countWords(sentence) > countWords(longest)) longest = sentence;
  }

  return { words: countWords(longest), opening: longest.split(/\s+/).slice(0, 6).join(' ') };
}

/** A full style report for one document. */
export function checkStyle(text: string): StyleReport {
  const findings = findStyleIssues(text);
  const words = countWords(text);

  const byCategory: Record<StyleCategory, number> = { AI_TELL: 0, FILLER: 0, HEDGE: 0, PATTERN: 0 };
  for (const finding of findings) byCategory[finding.category] += 1;

  return {
    findings,
    words,
    tellIndex: words > 0 ? Math.round((findings.length / words) * 100 * 10) / 10 : 0,
    longestSentence: longestSentenceIn(text),
    byCategory,
  };
}

/** One line for a report or a CI log. Null when there is nothing to say. */
export function describeStyleReport(report: StyleReport): string | null {
  if (report.words === 0) return null;
  if (report.findings.length === 0) {
    return `No machine-prose patterns found in ${report.words} words.`;
  }
  const categories = (Object.entries(report.byCategory) as Array<[StyleCategory, number]>)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => `${count} ${category.toLowerCase().replace('_', '-')}`);
  return `${report.findings.length} style flag${report.findings.length === 1 ? '' : 's'} in ${report.words} words (${categories.join(', ')}).`;
}

/** Does this copy pass the house style, at the given index ceiling? */
export function passesStyleCheck(text: string, maxIndex = 1.5): boolean {
  return checkStyle(text).tellIndex <= maxIndex;
}
