/**
 * tests/exam-completeness.test.ts
 *
 * Enforces that every exam system is complete and in parity:
 *  - DB seed codes (prisma/seed.mjs + seed.ts) agree with each other.
 *  - Every DB seed code has an available catalog module, an agent runtime
 *    blueprint, an evaluation rubric, and a runnable in-memory question bank.
 *  - Every available catalog module maps to a real DB seed code.
 *  - The in-memory question bank has unique ids, sane answer keys, and no
 *    placeholder text.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { EXAM_MODULES } from "../src/lib/exam-catalog";
import { EXAM_RUBRICS } from "../src/lib/ai/evaluation/rubrics";
import { allBlueprints } from "../src/lib/agents/runtime/blueprints";
import { QUESTION_COUNT_BY_EXAM, QUESTIONS } from "../src/lib/question-bank";

const ROOT = join(import.meta.dir, "..");

function seedCodesFrom(relPath: string): Set<string> {
  const src = readFileSync(join(ROOT, relPath), "utf8");
  // Slice out only the ExamType data array so settings/codes elsewhere don't leak in.
  const marker = "EXAM_TYPES = [";
  const start = src.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  // The array closes with "]" at line start; semicolon style differs per file.
  const end = src.indexOf("\n]", start);
  expect(end).toBeGreaterThan(start);
  const block = src.slice(start, end);
  const codes = new Set<string>();
  for (const m of block.matchAll(/code:\s*["']([^"']+)["']/g)) codes.add(m[1]);
  return codes;
}

/** DB ExamType.code -> in-memory question-bank ExamType label. */
const BANK_LABEL_BY_CODE: Record<string, string> = {
  "IELTS-A": "IELTS",
  "IELTS-G": "IELTS",
  "IELTS-UKVI": "IELTS",
  "PTE-A": "PTE",
  "TOEFL-iBT": "TOEFL",
  DUOLINGO: "Duolingo",
  OIETC: "OIETC",
  OET: "OET",
  LANGUAGECERT: "LanguageCert",
  LINGUASKILL: "Linguaskill",
  TOEIC: "TOEIC",
  CAMBRIDGE: "Cambridge",
  "ALO-PLACEMENT": "Placement",
  SAT: "SAT",
  ACT: "ACT",
  GRE: "GRE",
  GMAT: "GMAT",
  LSAT: "LSAT",
  MCAT: "MCAT",
  "VISA-INTERVIEW": "VisaInterview",
  "COUNSELOR-ASSESSMENT": "CounselorAssessment",
  "DOCUMENT-READINESS": "DocumentReadiness",
};

describe("DB seed parity", () => {
  test("seed.mjs and seed.ts define identical ExamType code sets", () => {
    const a = seedCodesFrom("prisma/seed.mjs");
    const b = seedCodesFrom("prisma/seed.ts");
    expect(a.size).toBeGreaterThan(0);
    expect([...a].sort()).toEqual([...b].sort());
  });
});

describe("every seeded exam is complete across all systems", () => {
  const seedCodes = seedCodesFrom("prisma/seed.mjs");
  const blueprintCodes = new Set(allBlueprints().map((b) => b.examTypeCode));
  const availableCatalogCodes = new Set(
    EXAM_MODULES.filter((m) => m.available !== false && m.examTypeCode !== null).map((m) => m.examTypeCode as string),
  );

  test("all mapping entries reference real seed codes", () => {
    for (const code of Object.keys(BANK_LABEL_BY_CODE)) {
      expect(seedCodes.has(code)).toBe(true);
    }
    for (const code of seedCodes) {
      expect(BANK_LABEL_BY_CODE[code]).toBeDefined();
    }
  });

  test.each([...seedCodes].sort())("%s has catalog, blueprint, rubric and bank coverage", (code) => {
    expect(availableCatalogCodes.has(code)).toBe(true);
    expect(blueprintCodes.has(code)).toBe(true);
    expect(EXAM_RUBRICS[code]).toBeDefined();
    const label = BANK_LABEL_BY_CODE[code];
    expect(label).toBeDefined();
    expect(QUESTION_COUNT_BY_EXAM[label as keyof typeof QUESTION_COUNT_BY_EXAM] ?? 0).toBeGreaterThanOrEqual(6);
  });
});

describe("no catalog entry points at a missing exam", () => {
  const seedCodes = seedCodesFrom("prisma/seed.mjs");

  test("available modules always carry a real DB code", () => {
    for (const m of EXAM_MODULES) {
      if (m.available === false) continue;
      expect(m.examTypeCode).not.toBeNull();
      expect(seedCodes.has(m.examTypeCode as string)).toBe(true);
    }
  });

  test("unavailable modules are the only ones allowed a null/unknown code", () => {
    for (const m of EXAM_MODULES) {
      if (m.examTypeCode === null || !seedCodes.has(m.examTypeCode)) {
        expect(m.available).toBe(false);
      }
    }
  });
});

const OPTION_TYPES = new Set([
  "multiple-choice",
  "true-false-not-given",
  "matching-headings",
  "reading-mcq",
  "matching-features",
  "read-and-select",
  "listen-and-select",
  "vocabulary-in-context",
  "sentence-equivalence",
  "quantitative-comparison",
  "data-sufficiency",
  "critical-reasoning",
  "sentence-correction",
  "data-insights",
  "logic-game",
  "central-idea",
  "standard-english",
  "data-interpretation",
  "complete-the-sentence",
]);
const TEXT_TYPES = new Set([
  "fill-blanks",
  "short-answer",
  "sentence-completion",
  "grid-in",
  "write-from-dictation",
]);

describe("in-memory question bank integrity", () => {
  test("ids are unique and every question has prompt + explanation", () => {
    const seen = new Set<string>();
    for (const q of QUESTIONS) {
      expect(seen.has(q.id)).toBe(false);
      seen.add(q.id);
      expect(q.prompt.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
    }
  });

  test("every objective question has a sane answer key", () => {
    for (const q of QUESTIONS) {
      const hasDropdownKey = Boolean(q.dropdownOptions && q.correctDropdowns);
      if (!hasDropdownKey && OPTION_TYPES.has(q.type)) {
        if (q.options && q.options.length >= 2) {
          const keyed =
            q.correctIndex !== undefined ||
            (q.correctIndices && q.correctIndices.length > 0) ||
            Boolean(q.correctAnswer);
          expect(keyed).toBe(true);
          if (q.correctIndex !== undefined) {
            expect(q.correctIndex).toBeGreaterThanOrEqual(0);
            expect(q.correctIndex).toBeLessThan(q.options.length);
          }
          for (const ix of q.correctIndices ?? []) {
            expect(ix).toBeGreaterThanOrEqual(0);
            expect(ix).toBeLessThan(q.options.length);
          }
        } else {
          // Typed-answer complete-the-sentence style.
          expect(Boolean(q.correctAnswer)).toBe(true);
        }
      }
      if (TEXT_TYPES.has(q.type)) {
        expect(Boolean(q.correctAnswer) || q.numericAnswer !== undefined).toBe(true);
      }
    }
  });

  test("no placeholder content anywhere in the bank", () => {
    for (const q of QUESTIONS) {
      expect(/lorem ipsum|\bplaceholder\b|\bTODO\b/i.test(q.prompt)).toBe(false);
    }
  });
});
