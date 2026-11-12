/**
 * src/lib/agents/skills/marketing-skills.ts
 *
 * Marketing skill packs for the ALO agent layer.
 *
 * WHAT A "SKILL" IS HERE
 * ──────────────────────
 * A skill is a reviewed, deterministic brief — inputs, ordered steps, required
 * output sections, and guardrails — that a human or an agent works through. It
 * is not a model call and produces no content by itself: `buildSkillPrompt`
 * renders the same text every time, which is what makes the output reviewable
 * and diffable.
 *
 * WHY NOT FREE-FORM PROMPTS
 * ─────────────────────────
 * Free-form marketing prompts in this sector reliably produce the two things
 * this platform must never publish: invented statistics and implied official
 * status with a test provider. Every pack therefore carries explicit guardrails
 * and is registered with `canAutoExecute: false` — marketing copy is approved by
 * a person before it ships.
 *
 * Adapted (not copied) from the MIT-licensed `marketingskills` reference; no
 * third-party content is bundled. See docs/REFERENCE_LINK_AUDIT_2026-10-14.md.
 */

import { DEFAULT_MARKETING_FACTS } from '@/lib/marketing-content';

export type SkillStatus = 'registered' | 'verified' | 'disabled';

export type MarketingSkill = {
  /** Stable identifier, used in prompts and audit records. */
  id: string;
  name: string;
  /** Which team owns the skill. */
  owner: 'Marketing' | 'Admissions' | 'Product';
  /** One sentence on what the skill is for. */
  purpose: string;
  /** Situations where this skill is the right tool. */
  whenToUse: string[];
  /** Inputs that must exist before the skill is run. */
  requiredInputs: string[];
  /** Ordered working steps. */
  steps: string[];
  /** Hard limits. A step that would break one of these must stop. */
  guardrails: string[];
  /** Sections the output must contain, in order. */
  outputSections: string[];
  /** Never true: published marketing copy requires human approval. */
  canAutoExecute: false;
  /** Registration status. Nothing is 'verified' until a controlled run exists. */
  status: SkillStatus;
};

export const MARKETING_SKILLS: readonly MarketingSkill[] = [
  {
    id: 'SKILL-CRO-01',
    name: 'Landing page conversion review',
    owner: 'Marketing',
    purpose: 'Find what stops a visitor on a public page from taking the single action that page exists for.',
    whenToUse: [
      'A public page has traffic but few completed enquiries or consultation bookings',
      'A page is about to be promoted in a paid or partner campaign',
    ],
    requiredInputs: [
      'The page URL and the one action it is supposed to produce',
      'Current enquiry or booking volume for that page',
      'The audience it is written for',
    ],
    steps: [
      'State the single primary action and confirm it appears above the fold exactly once as a primary button.',
      'Read the first two sentences as the target audience and write down what is being promised.',
      'List every competing action on the page (secondary links, navigation, chat launcher) and whether it belongs there.',
      'Check the form: number of required fields, labels, validation messages, mobile keyboard types.',
      'Check the trust signals that are true and verifiable — office address, named counsellors, published policies.',
      'Record one change to test, the metric it should move, and how long the test needs to run.',
    ],
    guardrails: [
      'Do not add urgency that is not true ("deadline today" when it is not).',
      'Do not add a countdown, stock counter, or fake scarcity.',
      'Do not add testimonials that have not been approved by the person quoted.',
      'Do not remove the practice-only and non-affiliation disclaimers to shorten the page.',
      'Every claim on the page must be verifiable by the team; remove any that cannot be evidenced.',
    ],
    outputSections: ['Primary action', 'Friction found', 'Trust signals present', 'One change to test', 'How success is measured'],
    canAutoExecute: false,
    status: 'registered',
  },
  {
    id: 'SKILL-COPY-01',
    name: 'Copywriting brief',
    owner: 'Marketing',
    purpose: 'Turn a service or offer into a brief that a writer or an agent can draft from without inventing facts.',
    whenToUse: [
      'A new landing page, campaign, or email needs first-draft copy',
      'Existing copy needs to be rewritten for a different audience or destination country',
    ],
    requiredInputs: [
      'The offer in one sentence',
      'The audience and where they are in their decision',
      'Confirmed facts that may appear (services, countries, intakes, fees that are published)',
      'The call to action and its destination URL',
    ],
    steps: [
      'Write the offer as a factual sentence with no adjective that cannot be evidenced.',
      'Separate confirmed facts from assumptions; assumptions are not allowed to appear in the copy.',
      'Choose the register: practical and specific for students, formal and precise for institutional audiences.',
      'Draft to the output sections below, keeping one idea per paragraph.',
      'Read it as the audience and mark every sentence that would require a source.',
      'Run the safe-claims check on the draft before it goes to review.',
    ],
    guardrails: [
      'No outcome, band, visa, admission, or scholarship guarantee.',
      'No statistic without an approved source and date.',
      'No implication of official status with IELTS, ETS, Pearson, Duolingo, UKVI, or any university.',
      'Any practice score must be described as a study estimate, not an official result.',
    ],
    outputSections: ['Headline options', 'Body copy', 'Call to action', 'Facts used (with source)', 'Open questions for approval'],
    canAutoExecute: false,
    status: 'registered',
  },
  {
    id: 'SKILL-SEO-01',
    name: 'SEO page brief',
    owner: 'Marketing',
    purpose: 'Decide what a new or existing page should target, and prove it can actually rank for it.',
    whenToUse: [
      'A new route is being added to the public site',
      'An existing page is being rewritten or consolidated',
    ],
    requiredInputs: [
      'The page path and its current canonical URL',
      'The search intent it should serve',
      'The pages that would compete with it on this site',
    ],
    steps: [
      'Write the intent in the visitor’s words, not the internal product name.',
      'Check the page is in the indexable route list and that its path is not blocked by the robots policy.',
      'Confirm the title, description, canonical, and OpenGraph fields are set for the route.',
      'Confirm the page has one h1 that matches the intent.',
      'Check internal links pointing to the page, and from it to the next logical step.',
      'Run the safe-claims check on the proposed title, description, and headings.',
      'Record the target query set and the review date.',
    ],
    guardrails: [
      'Never add a route to the sitemap that requires authentication or returns a non-200 status.',
      'Do not create near-duplicate pages for each destination country; consolidate and differentiate by real content.',
      'Do not keyword-stuff or hide text.',
      'Titles, descriptions and headings are published copy: no guaranteed outcome, and no implied official status with a test provider or authority.',
    ],
    outputSections: ['Search intent', 'Target queries', 'Metadata to set', 'Internal links', 'Review date'],
    canAutoExecute: false,
    status: 'registered',
  },
  {
    id: 'SKILL-ANALYTICS-01',
    name: 'Analytics reading',
    owner: 'Product',
    purpose: 'Turn traffic and funnel figures into decisions without collecting personal data.',
    whenToUse: [
      'A weekly or monthly performance review',
      'A question about why a channel is or is not producing enquiries',
    ],
    requiredInputs: [
      'The measurement period and the comparison period',
      'The funnel steps being examined',
      'Whether any tracking change landed inside the period',
    ],
    steps: [
      'State the question before looking at any chart.',
      'Compare like with like: same channel definition, same page taxonomy, same period length.',
      'Separate volume changes from rate changes; most surprises are volume.',
      'Check for tracking changes and bot or referral-spam spikes before drawing a conclusion.',
      'Attribute only what the data supports; write down what it cannot show.',
      'Record the decision and the metric that will show whether it worked.',
    ],
    guardrails: [
      'Do not store or export personally identifying information from analytics.',
      'Do not present a correlation as a cause in a report to management.',
      'Do not use analytics to infer anything about an individual applicant.',
      'Do not state a claim the data does not evidence, and label estimates as estimates.',
    ],
    outputSections: ['Question', 'What the data shows', 'What it cannot show', 'Decision', 'Follow-up metric'],
    canAutoExecute: false,
    status: 'registered',
  },
  {
    id: 'SKILL-GROWTH-01',
    name: 'Growth experiment design',
    owner: 'Marketing',
    purpose: 'Design a small, measurable experiment instead of a large unmeasured campaign.',
    whenToUse: [
      'An idea needs testing before it is rolled out across every channel',
      'A previous campaign produced a result nobody can explain',
    ],
    requiredInputs: [
      'The hypothesis in the form: if we change X, then Y changes, because Z',
      'The audience and channel',
      'The metric and its current baseline',
    ],
    steps: [
      'Write the hypothesis in the required form and reject it if it cannot be stated that way.',
      'Define the smallest audience that can produce a signal.',
      'Define the single primary metric, and at least one counter-metric that would show harm.',
      'Set the duration before starting, and the decision rule (ship, iterate, stop).',
      'List what could invalidate the result: seasonality, overlapping campaigns, intake deadlines.',
      'Record the outcome and whether the decision rule was followed.',
    ],
    guardrails: [
      'No experiment that misleads a student about cost, eligibility, deadlines, or outcomes.',
      'No dark patterns: no hidden opt-outs, no pre-ticked consent, no fake countdowns.',
      'Stop immediately if the experiment harms applicant trust or produces misleading enquiries.',
    ],
    outputSections: ['Hypothesis', 'Audience and channel', 'Primary metric', 'Counter-metric', 'Duration and decision rule', 'Outcome'],
    canAutoExecute: false,
    status: 'registered',
  },
] as const;

export type SkillContext = {
  /** The offer or page under discussion. */
  subject: string;
  /** Who the work is for. */
  audience: string;
  /** Anything already known and approved. */
  knownFacts?: string[];
  /** The next step the reader should take. */
  callToAction?: string;
  /** Optional URL for the call to action. */
  url?: string;
};

/**
 * Render a skill into a single, deterministic working prompt.
 *
 * Deterministic matters: two people running the same skill on the same context
 * get byte-identical text, so the output can be reviewed against the brief and
 * diffed when the skill changes.
 */
export function buildSkillPrompt(skill: MarketingSkill, context: SkillContext): string {
  const facts = (context.knownFacts ?? []).map((fact) => `- ${fact.trim()}`).join('\n');
  const cta = context.callToAction
    ? `- Call to action: ${context.callToAction}${context.url ? ` (${context.url})` : ''}`
    : '- Call to action: not set';

  return [
    `# ${skill.name} (${skill.id})`,
    '',
    `Purpose: ${skill.purpose}`,
    '',
    '## Context',
    `- Subject: ${context.subject.trim()}`,
    `- Audience: ${context.audience.trim()}`,
    cta,
    '',
    '## Confirmed facts',
    facts || `- ${DEFAULT_MARKETING_FACTS}`,
    '',
    '## Steps',
    ...skill.steps.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## Guardrails (do not cross)',
    ...skill.guardrails.map((rule) => `- ${rule}`),
    '',
    '## Required output sections',
    ...skill.outputSections.map((section) => `## ${section}`),
    '',
    `Approval: this output is a draft. canAutoExecute=${skill.canAutoExecute} — a person must review it before publication.`,
  ].join('\n');
}

export function getSkill(id: string): MarketingSkill | undefined {
  return MARKETING_SKILLS.find((skill) => skill.id === id);
}

export function getSkillStats() {
  const byOwner = MARKETING_SKILLS.reduce<Record<string, number>>((acc, skill) => {
    acc[skill.owner] = (acc[skill.owner] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total: MARKETING_SKILLS.length,
    byOwner,
    autoExecutable: MARKETING_SKILLS.filter((skill) => skill.canAutoExecute).length,
    verified: MARKETING_SKILLS.filter((skill) => skill.status === 'verified').length,
    humanApprovalRequired: MARKETING_SKILLS.filter((skill) => !skill.canAutoExecute).length,
  };
}
