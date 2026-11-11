/**
 * src/lib/exam/questions.ts
 *
 * Shared, answer-safe question loading.
 *
 * The `select` below is the single source of truth for what a student is
 * allowed to see: it deliberately omits correctAnswer, correctIndex and
 * correctIndices. Every exam read path must go through here so that grading
 * material can never leak into a response.
 */

type Db = typeof import("@/lib/db").db;

export const SAFE_QUESTION_SELECT = {
  id: true,
  section: true,
  type: true,
  prompt: true,
  passage: true,
  audioUrl: true,
  imageUrl: true,
  options: true,
  wordLimit: true,
  points: true,
  order: true,
} as const;

const TFNG_DEFAULTS = JSON.stringify(["True", "False", "Not Given"]);
const TF_DEFAULTS = JSON.stringify(["True", "False"]);

/**
 * Some legacy TRUE_FALSE(_NOT_GIVEN) questions were seeded without an
 * explicit options array. Synthesise the canonical choices so the client
 * always has radio buttons to render. Never mutates the caller's object —
 * returns a (shallow) copy.
 */
export function withDefaultOptions<Q extends { type: string; options: string | null }>(q: Q): Q & { options: string } {
  const t = q.type.toUpperCase();
  if (q.options && q.options.length > 2) return { ...q, options: q.options };
  if (t === "TRUE_FALSE_NOT_GIVEN") return { ...q, options: TFNG_DEFAULTS };
  if (t === "TRUE_FALSE") return { ...q, options: TF_DEFAULTS };
  return { ...q, options: q.options ?? "[]" };
}

/**
 * Listening `passage` fields contain the source transcript used by TTS.
 *
 * When the question has real audio attached (`audioUrl` set — only the
 * generate+verify pipeline sets it), the transcript is scoring material:
 * returning it during an active attempt would let the student read the
 * script instead of listening, so it is withheld.
 *
 * When the question has NO audio on this deployment, withholding the
 * transcript as well would leave the student with neither audio nor
 * script — an unanswerable question. The transcript is then the
 * disclosed practice fallback (the client labels it "Listening Script
 * (no audio for this question)"), matching the selection layer's
 * transcript-fallback mode. See `listeningAudioRequired` in
 * ./selection.ts for the strict-mode switch.
 *
 * Reading passages are always available: they are the task itself.
 */
export function redactListeningTranscript<
  Q extends { section: string; passage?: string | null; audioUrl?: string | null },
>(q: Q): Q {
  if (q.section.toUpperCase() !== "LISTENING" || q.passage == null) return q;
  if (!q.audioUrl || q.audioUrl.trim() === "") return q; // transcript fallback: no audio to protect
  return { ...q, passage: null };
}

/** Apply defaults and exam-time transcript redaction to a student question. */
export function toStudentQuestion<Q extends { section: string; type: string; options: string | null; passage?: string | null }>(q: Q) {
  return redactListeningTranscript(withDefaultOptions(q));
}

/**
 * Load the frozen question set for an attempt, in the exact order it was
 * served, without any correct-answer fields.
 */
export async function loadAttemptQuestions(db: Db, attemptId: string) {
  const rows = await db.attemptQuestion.findMany({
    where: { attemptId },
    orderBy: { order: "asc" },
    select: {
      order: true,
      section: true,
      question: { select: SAFE_QUESTION_SELECT },
    },
  });

  return rows.map((r) => toStudentQuestion(r.question));
}

/** Load every persisted answer for an attempt as a plain map. */
export async function loadAttemptAnswers(db: Db, attemptId: string): Promise<Record<string, string>> {
  const rows = await db.attemptAnswer.findMany({
    where: { attemptId },
    select: { questionId: true, answer: true },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.questionId] = r.answer;
  return map;
}
