/**
 * src/lib/agents/skills/index.ts
 *
 * Public surface of the reviewed skill packs and the safe-claims checker.
 *
 * Import from here rather than from individual modules so the set can grow
 * without touching every call site.
 */

export {
  MARKETING_SKILLS,
  buildSkillPrompt,
  getSkill,
  getSkillStats,
} from './marketing-skills';
export type { MarketingSkill, SkillContext, SkillStatus } from './marketing-skills';

export {
  CLAIM_RULE_IDS,
  describeClaimCheck,
  findUnsafeClaims,
  isSafeCopy,
} from './copy-guard';
export type { ClaimViolation } from './copy-guard';
