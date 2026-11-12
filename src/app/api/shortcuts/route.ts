/**
 * GET /api/shortcuts — return all exam-prep shortcuts.
 *
 * Static data (no database). Supports optional query filters:
 *   - exam        (e.g. IELTS, GRE, SAT) — case-insensitive
 *   - skill       (e.g. READING, QUANT)  — case-insensitive
 *   - difficulty  (e.g. BEGINNER)        — case-insensitive
 *   - q           (free-text search across title, description, example, tags)
 *
 * Reference style: IELTS Liz, IELTS Simon, GregMat, College Board SAT guidance.
 * All content is preparation guidance only — not official exam material.
 */

import { ok, withErrorHandler, badRequest } from "@/lib/responses";
import {
  SHORTCUTS,
  filterShortcuts,
  ALL_EXAMS,
  ALL_SKILLS,
  ALL_DIFFICULTIES,
  EXAM_LABELS,
  SKILL_LABELS,
  DIFFICULTY_LABELS,
  type ExamCode,
  type SkillCode,
  type Difficulty,
} from "@/lib/study-tools/shortcuts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseEnum<T extends string>(value: string | null, allowed: readonly T[]): T | "ALL" | null {
  if (!value) return "ALL";
  const upper = value.toUpperCase() as T;
  if (allowed.includes(upper)) return upper;
  // Allow "ALL" explicitly.
  if (upper === "ALL") return "ALL";
  return null; // invalid value
}

export async function GET(request: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const url = new URL(request.url);
    const params = url.searchParams;

    const examRaw = params.get("exam");
    const skillRaw = params.get("skill");
    const difficultyRaw = params.get("difficulty");
    const queryRaw = params.get("q") ?? params.get("query") ?? undefined;

    const exam = parseEnum(examRaw, ALL_EXAMS);
    if (examRaw && exam === null) {
      return badRequest(
        `Invalid 'exam'. Allowed values: ${ALL_EXAMS.join(", ")}, ALL`,
      );
    }
    const skill = parseEnum(skillRaw, ALL_SKILLS);
    if (skillRaw && skill === null) {
      return badRequest(
        `Invalid 'skill'. Allowed values: ${ALL_SKILLS.join(", ")}, ALL`,
      );
    }
    const difficulty = parseEnum(difficultyRaw, ALL_DIFFICULTIES);
    if (difficultyRaw && difficulty === null) {
      return badRequest(
        `Invalid 'difficulty'. Allowed values: ${ALL_DIFFICULTIES.join(", ")}, ALL`,
      );
    }

    const filtered = filterShortcuts({
      exam: exam === "ALL" ? undefined : (exam as ExamCode),
      skill: skill === "ALL" ? undefined : (skill as SkillCode),
      difficulty: difficulty === "ALL" ? undefined : (difficulty as Difficulty),
      query: queryRaw,
    });

    return ok(
      {
        total: filtered.length,
        filters: {
          exam: exam ?? "ALL",
          skill: skill ?? "ALL",
          difficulty: difficulty ?? "ALL",
          query: queryRaw ?? null,
        },
        facets: {
          exams: ALL_EXAMS.map((code) => ({
            code,
            label: EXAM_LABELS[code],
            count: SHORTCUTS.filter((s) => s.exam === code).length,
          })),
          skills: ALL_SKILLS.map((code) => ({
            code,
            label: SKILL_LABELS[code],
            count: SHORTCUTS.filter((s) => s.skill === code).length,
          })),
          difficulties: ALL_DIFFICULTIES.map((code) => ({
            code,
            label: DIFFICULTY_LABELS[code],
            count: SHORTCUTS.filter((s) => s.difficulty === code).length,
          })),
        },
        shortcuts: filtered,
      },
      filtered.length === SHORTCUTS.length
        ? "All shortcuts retrieved"
        : `${filtered.length} shortcuts matched the filter`,
    );
  });
}
