/**
 * Disabled compatibility surface for the legacy daily question generator.
 *
 * The former implementation appended hard-coded template questions directly
 * to active practice sets without review. It could pair a passage with an
 * unrelated answer key. No generation or database write is permitted here.
 * Use original, sourced content through an explicit review and approval flow.
 */

export const QUESTION_GENERATION_STATUS = 'BLOCKED' as const;
export const QUESTION_GENERATION_BLOCKER =
  'Automatic question generation is disabled: content provenance, answer-key validation, specification coverage, and human approval are not verified.';

export async function generateDailyQuestions(
  _examTypeCode: string,
  _practiceSetId: string,
): Promise<number> {
  throw new Error(QUESTION_GENERATION_BLOCKER);
}

export async function generateAllDailyQuestions(): Promise<void> {
  throw new Error(QUESTION_GENERATION_BLOCKER);
}
