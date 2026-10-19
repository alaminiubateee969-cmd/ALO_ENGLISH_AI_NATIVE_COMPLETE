/**
 * src/lib/agents/runtime/blueprints.ts
 *
 * Versioned exam blueprints.
 *
 * WHY THIS FILE EXISTS
 * ─────────────────────
 * The platform used to describe exams as a title, a duration and a bag of
 * question types. That is not enough to generate a question, to allocate a
 * sitting, or to tell a learner what a mock test will contain. A blueprint is
 * the contract between the content agents and the exam engine: it says which
 * sections exist, how long each one is, how many items it has, which item
 * types it uses, and where the structure came from.
 *
 * EVERY BLUEPRINT IS SOURCED
 * ──────────────────────────
 * Each blueprint names the public provider page its structure was taken from
 * and the date it was last checked. A blueprint whose source is unknown says
 * so — see `OIETC`, whose product identity has not been verified, which is
 * why it gets a generic structure and a disclosure instead of a borrowed one.
 *
 * A BLUEPRINT IS NOT A SCORE
 * ──────────────────────────
 * The `scoring` field records the provider's own scale so the platform can
 * *talk about* it. It does not mean the platform produces that score. The
 * platform's practice score is a deterministic, disclosed accuracy ratio on a
 * 0–9 practice indicator. Every result the platform shows carries that
 * disclosure, and no blueprint turns a practice result into an official one.
 *
 * QUESTION TYPES
 * ──────────────
 * The item types named here come from the platform's canonical vocabulary
 * (`src/lib/exam/question-types.json`). A blueprint never invents a type the
 * grader cannot score.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

export type BlueprintSection = {
  /** The platform's section id: LISTENING, READING, WRITING, SPEAKING. */
  id: "LISTENING" | "READING" | "WRITING" | "SPEAKING";
  name: string;
  durationMin: number;
  /** Items in the full official sitting. Absent when the provider does not
   *  publish a fixed count for that section. */
  questionCount?: number;
  /** Canonical question types used by this section. */
  questionTypes: string[];
  notes?: string;
};

export type ExamBlueprint = {
  examTypeCode: string;
  name: string;
  /** The blueprint version. Bump it when the structure changes. */
  version: string;
  totalDurationMin: number;
  sections: BlueprintSection[];
  scoring: {
    /** The provider's own scale, for reference only. */
    scale: string;
    /** How the provider reports it. */
    note: string;
  };
  source: {
    label: string;
    url: string;
    /** ISO date the structure was last checked against the source. */
    checkedAt: string;
  };
  /** The disclosure that must accompany anything this blueprint produces. */
  disclosure: string;
  /** True when the platform has verified the product's identity. */
  identityVerified: boolean;
};

/** The date the blueprints in this file were checked. */
export const BLUEPRINT_CHECKED_AT = "2026-10-19";

const PRACTICE_DISCLOSURE =
  "ALO practice only. This is not an official score, not a band, and not recognised by any exam provider. " +
  "The platform's own practice indicator is a disclosed accuracy ratio, not a converted provider score.";

function bp(
  examTypeCode: string,
  name: string,
  version: string,
  totalDurationMin: number,
  sections: BlueprintSection[],
  scoring: ExamBlueprint["scoring"],
  source: ExamBlueprint["source"],
  identityVerified = true,
): ExamBlueprint {
  return {
    examTypeCode,
    name,
    version,
    totalDurationMin,
    sections,
    scoring,
    source,
    disclosure: PRACTICE_DISCLOSURE,
    identityVerified,
  };
}

// ─── The blueprints ────────────────────────────────────────────────────────

const BLUEPRINTS: ExamBlueprint[] = [
  // ── IELTS ───────────────────────────────────────────────────────────────
  bp(
    "IELTS-A",
    "IELTS Academic",
    "2026.1",
    165,
    [
      {
        id: "LISTENING",
        name: "Listening",
        durationMin: 30,
        questionCount: 40,
        questionTypes: ["LISTEN_AND_SELECT", "TRUE_FALSE_NOT_GIVEN", "FILL_BLANK", "MATCHING", "LABELING"],
        notes: "Four parts: two monologues and two conversations. Answered once only.",
      },
      {
        id: "READING",
        name: "Reading",
        durationMin: 60,
        questionCount: 40,
        questionTypes: ["READING_MCQ", "TRUE_FALSE_NOT_GIVEN", "FILL_BLANK", "MATCHING", "LABELING", "SENTENCE_COMPLETION", "SUMMARY_COMPLETION"],
        notes: "Academic: three passages, 2150–2750 words total. No transfer time.",
      },
      {
        id: "WRITING",
        name: "Writing",
        durationMin: 60,
        questionCount: 2,
        questionTypes: ["WRITING_TASK1", "WRITING_TASK2"],
        notes: "Task 1: describe visual information, 150+ words, about 20 minutes. Task 2: essay, 250+ words, about 40 minutes. Task 2 counts twice as much as Task 1.",
      },
      {
        id: "SPEAKING",
        name: "Speaking",
        durationMin: 14,
        questionCount: 3,
        questionTypes: ["SPEAKING"],
        notes: "Three parts: introduction and interview, individual long turn, two-way discussion. 11–14 minutes.",
      },
    ],
    { scale: "0–9 band", note: "Whole and half bands, 0–9. Task 2 counts twice in Writing." },
    {
      label: "IELTS — IELTS Academic test (format and timing)",
      url: "https://ielts.org/take-a-test/test-types/ielts-academic-test",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),
  bp(
    "IELTS-G",
    "IELTS General Training",
    "2026.1",
    165,
    [
      {
        id: "LISTENING",
        name: "Listening",
        durationMin: 30,
        questionCount: 40,
        questionTypes: ["LISTEN_AND_SELECT", "TRUE_FALSE_NOT_GIVEN", "FILL_BLANK", "MATCHING", "LABELING"],
        notes: "Identical to IELTS Academic listening.",
      },
      {
        id: "READING",
        name: "Reading",
        durationMin: 60,
        questionCount: 40,
        questionTypes: ["READING_MCQ", "TRUE_FALSE_NOT_GIVEN", "FILL_BLANK", "MATCHING", "LABELING", "SENTENCE_COMPLETION", "SUMMARY_COMPLETION"],
        notes: "General Training: three sections of everyday, non-academic texts.",
      },
      {
        id: "WRITING",
        name: "Writing",
        durationMin: 60,
        questionCount: 2,
        questionTypes: ["WRITING_TASK1", "WRITING_TASK2"],
        notes: "Task 1: write a letter, 150+ words. Task 2: essay, 250+ words.",
      },
      {
        id: "SPEAKING",
        name: "Speaking",
        durationMin: 14,
        questionCount: 3,
        questionTypes: ["SPEAKING"],
        notes: "Identical to IELTS Academic speaking.",
      },
    ],
    { scale: "0–9 band", note: "Whole and half bands, 0–9." },
    {
      label: "IELTS — General Training test (format and timing)",
      url: "https://ielts.org/take-a-test/test-types/ielts-general-training-test",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),
  bp(
    "IELTS-UKVI",
    "IELTS for UKVI",
    "2026.1",
    165,
    [
      {
        id: "LISTENING",
        name: "Listening",
        durationMin: 30,
        questionCount: 40,
        questionTypes: ["LISTEN_AND_SELECT", "TRUE_FALSE_NOT_GIVEN", "FILL_BLANK", "MATCHING"],
      },
      {
        id: "READING",
        name: "Reading",
        durationMin: 60,
        questionCount: 40,
        questionTypes: ["READING_MCQ", "TRUE_FALSE_NOT_GIVEN", "FILL_BLANK", "MATCHING"],
        notes: "Same item types as the Academic and General Training readings.",
      },
      {
        id: "WRITING",
        name: "Writing",
        durationMin: 60,
        questionCount: 2,
        questionTypes: ["WRITING_TASK1", "WRITING_TASK2"],
      },
      {
        id: "SPEAKING",
        name: "Speaking",
        durationMin: 14,
        questionCount: 3,
        questionTypes: ["SPEAKING"],
      },
    ],
    { scale: "0–9 band", note: "Same band scale as IELTS; the test is for UK visa purposes." },
    {
      label: "IELTS — test types (IELTS for UKVI)",
      url: "https://ielts.org/en-us/for-test-takers/test-format",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── TOEFL ───────────────────────────────────────────────────────────────
  bp(
    "TOEFL-iBT",
    "TOEFL iBT",
    "2026.1",
    90,
    [
      {
        id: "READING",
        name: "Reading",
        durationMin: 30,
        questionCount: 50,
        questionTypes: ["READING_MCQ", "FILL_BLANK", "SENTENCE_COMPLETION", "COMPLETE_THE_SENTENCE", "SUMMARY_COMPLETION"],
        notes: "Three task types from 21 January 2026: Complete the Words, Read in Daily Life, Read an Academic Passage. Multistage adaptive.",
      },
      {
        id: "LISTENING",
        name: "Listening",
        durationMin: 29,
        questionCount: 47,
        questionTypes: ["LISTEN_AND_SELECT", "MATCHING", "SENTENCE_COMPLETION", "FILL_BLANK", "LABELING"],
        notes: "Four task types: Listen and Choose a Response, Conversation, Announcement, Academic Talk. Multistage adaptive.",
      },
      {
        id: "SPEAKING",
        name: "Speaking",
        durationMin: 8,
        questionCount: 11,
        questionTypes: ["SPEAKING"],
        notes: "Two task types: Listen and Repeat, Take an Interview. Up to 30 seconds' preparation and 1 minute to respond.",
      },
      {
        id: "WRITING",
        name: "Writing",
        durationMin: 23,
        questionCount: 12,
        questionTypes: ["WRITING_TASK1", "WRITING_TASK2", "FILL_BLANK"],
        notes: "Three task types: Build a Sentence, Write an Email, Write for an Academic Discussion.",
      },
    ],
    { scale: "0–30 per section, 0–120 total; also reported as 1–6 bands", note: "Adaptive Reading and Listening. No break." },
    {
      label: "ETS — TOEFL iBT 2026 test blueprint and specifications",
      url: "https://www.ets.org/toefl/test-takers/ibt/about/content.html",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── PTE ─────────────────────────────────────────────────────────────────
  bp(
    "PTE-A",
    "PTE Academic",
    "2025.2",
    135,
    [
      {
        id: "SPEAKING",
        name: "Speaking & Writing (Part 1)",
        durationMin: 84,
        questionCount: 10,
        questionTypes: ["SPEAKING", "WRITING_TASK2", "FILL_BLANK"],
        notes: "Nine task types including a personal introduction, read aloud, repeat sentence, respond to a situation, summarise a group discussion, and two writing tasks. From 7 August 2025 the format has 22 task types in total.",
      },
      {
        id: "READING",
        name: "Reading (Part 2)",
        durationMin: 30,
        questionCount: 20,
        questionTypes: ["READING_MCQ", "READ_AND_SELECT", "FILL_BLANK", "LABELING", "SUMMARY_COMPLETION"],
        notes: "Five task types. Single pass; time spent on the first task does not transfer.",
      },
      {
        id: "LISTENING",
        name: "Listening (Part 3)",
        durationMin: 39,
        questionCount: 22,
        questionTypes: ["LISTEN_AND_SELECT", "MATCHING", "FILL_BLANK", "LABELING", "SUMMARY_COMPLETION"],
        notes: "Eight task types. Listen once, then select, type or summarise.",
      },
    ],
    { scale: "10–90 overall and per skill", note: "Computer-delivered. About two hours; 2h15 is the maximum allowed." },
    {
      label: "Pearson — PTE Academic test format",
      url: "https://www.pearsonpte.com/pte-academic/test-format",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── Duolingo ────────────────────────────────────────────────────────────
  bp(
    "DUOLINGO",
    "Duolingo English Test",
    "2026.1",
    60,
    [
      {
        id: "READING",
        name: "Adaptive Test — reading items",
        durationMin: 45,
        questionCount: 18,
        questionTypes: ["READING_MCQ", "READ_AND_SELECT", "FILL_BLANK", "SUMMARY_COMPLETION"],
        notes: "Thirteen task types overall. Read and Select 15–18, Fill in the Blanks 6–9, Read and Complete 3–6, Interactive Reading two sets of six.",
      },
      {
        id: "LISTENING",
        name: "Adaptive Test — listening items",
        durationMin: 45,
        questionCount: 9,
        questionTypes: ["LISTEN_AND_SELECT", "FILL_BLANK", "MATCHING"],
        notes: "Listen and Type 6–9, Interactive Listening two sets of 8–10.",
      },
      {
        id: "WRITING",
        name: "Writing and speaking sample",
        durationMin: 10,
        questionCount: 5,
        questionTypes: ["WRITING_TASK2", "SPEAKING"],
        notes: "Ungraded. Write About the Photo (3), Interactive Writing, Write About the Photo speaking, Read Then Speak, Interactive Speaking, plus a written and spoken sample sent to institutions.",
      },
    ],
    { scale: "10–160 overall, in steps of 5", note: "The overall score is the average of four skill subscores, rounded up to the nearest 5." },
    {
      label: "Duolingo — DET Scoring Guide for Teachers (2026)",
      url: "https://englishtest-static.duolingo.com/media/resources/DET_Scoring%20Guide%20for%20Teachers%20(2026).pdf",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── GRE ─────────────────────────────────────────────────────────────────
  bp(
    "GRE",
    "GRE General Test",
    "2026.1",
    118,
    [
      {
        id: "WRITING",
        name: "Analytical Writing",
        durationMin: 30,
        questionCount: 1,
        questionTypes: ["ESSAY"],
        notes: "One 'Analyze an Issue' task. The 'Analyze an Argument' task and the unscored section were removed in September 2023.",
      },
      {
        id: "READING",
        name: "Verbal Reasoning",
        durationMin: 41,
        questionCount: 27,
        questionTypes: ["READING_MCQ", "FILL_BLANK", "SUMMARY_COMPLETION"],
        notes: "Two sections: 12 questions in 18 minutes, then 15 questions in 23 minutes. Section-level adaptive.",
      },
      {
        id: "LISTENING",
        name: "Quantitative Reasoning",
        durationMin: 47,
        questionCount: 27,
        questionTypes: ["READING_MCQ", "FILL_BLANK"],
        notes: "Two sections: 12 questions in 21 minutes, then 15 questions in 26 minutes. Section-level adaptive. The platform's section labels are LISTENING/READING/WRITING; quantitative items are carried under READING because the schema has no quantitative section.",
      },
    ],
    { scale: "130–170 Verbal and Quantitative, 0–6 Analytical Writing", note: "Overall 340–340 plus the writing score. Section-level adaptive." },
    {
      label: "ETS — GRE General Test structure",
      url: "https://www.ets.org/gre/test-takers/general-test/prepare/test-structure.html",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── GMAT ────────────────────────────────────────────────────────────────
  bp(
    "GMAT",
    "GMAT Focus Edition",
    "2026.1",
    135,
    [
      {
        id: "READING",
        name: "Quantitative Reasoning",
        durationMin: 45,
        questionCount: 21,
        questionTypes: ["READING_MCQ", "FILL_BLANK"],
        notes: "Problem Solving only. Data Sufficiency and geometry are not tested in the Focus Edition.",
      },
      {
        id: "LISTENING",
        name: "Verbal Reasoning",
        durationMin: 45,
        questionCount: 23,
        questionTypes: ["READING_MCQ", "SUMMARY_COMPLETION"],
        notes: "Reading Comprehension and Critical Reasoning. Sentence Correction was removed.",
      },
      {
        id: "WRITING",
        name: "Data Insights",
        durationMin: 45,
        questionCount: 20,
        questionTypes: ["READING_MCQ", "MATCHING", "LABELING"],
        notes: "Data Sufficiency, Multi-Source Reasoning, Table Analysis, Graphics Interpretation, Two-Part Analysis. Replaces Integrated Reasoning.",
      },
    ],
    { scale: "205–805 total, 60–90 per section", note: "64 questions, 2 hours 15 minutes, no penalty for guessing. The Analytical Writing task was removed." },
    {
      label: "GMAC — GMAT exam format",
      url: "https://www.mba.com/exams-and-exam-prep/gmat-exam",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── SAT ─────────────────────────────────────────────────────────────────
  bp(
    "SAT",
    "Digital SAT",
    "2026.1",
    134,
    [
      {
        id: "READING",
        name: "Reading and Writing",
        durationMin: 64,
        questionCount: 54,
        questionTypes: ["READING_MCQ", "FILL_BLANK", "SENTENCE_COMPLETION", "SUMMARY_COMPLETION"],
        notes: "Two modules of 27 questions, 32 minutes each. Module 2 is adaptive.",
      },
      {
        id: "LISTENING",
        name: "Math",
        durationMin: 70,
        questionCount: 44,
        questionTypes: ["READING_MCQ", "FILL_BLANK"],
        notes: "Two modules of 22 questions, 35 minutes each. Module 2 is adaptive. A calculator is allowed throughout.",
      },
    ],
    { scale: "400–1600 overall, 200–800 per section", note: "98 questions, 2 hours 14 minutes including a 10-minute break. No penalty for guessing." },
    {
      label: "College Board — Digital SAT test structure (Bluebook)",
      url: "https://www.collegeboard.org/educators/college-board-maps/sat-test-format",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── ACT ─────────────────────────────────────────────────────────────────
  bp(
    "ACT",
    "ACT",
    "2026.1",
    175,
    [
      {
        id: "READING",
        name: "English",
        durationMin: 45,
        questionCount: 50,
        questionTypes: ["READING_MCQ", "SUMMARY_COMPLETION"],
        notes: "Grammar, punctuation, sentence structure, rhetorical strategy and organization.",
      },
      {
        id: "LISTENING",
        name: "Mathematics",
        durationMin: 60,
        questionCount: 45,
        questionTypes: ["READING_MCQ", "FILL_BLANK"],
        notes: "Preparing for higher mathematics. A calculator is allowed for part of the section.",
      },
      {
        id: "SPEAKING",
        name: "Reading",
        durationMin: 35,
        questionCount: 36,
        questionTypes: ["READING_MCQ", "MATCHING", "LABELING"],
        notes: "Reading comprehension over prose and literary passages. The platform's section labels are LISTENING/READING/WRITING/SPEAKING; the ACT reading section is carried under SPEAKING because it is the reading-comprehension section and the schema has no separate slot.",
      },
    ],
    { scale: "1–36 composite", note: "Science (40 questions, 35 minutes) is optional and is not part of the composite. The optional writing test adds 40 minutes." },
    {
      label: "ACT — test format and structure",
      url: "https://www.act.org/the-act/test/format",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── OET ─────────────────────────────────────────────────────────────────
  bp(
    "OET",
    "OET (Healthcare)",
    "2026.1",
    165,
    [
      {
        id: "LISTENING",
        name: "Listening",
        durationMin: 40,
        questionCount: 42,
        questionTypes: ["LISTEN_AND_SELECT", "MATCHING", "FILL_BLANK"],
        notes: "Healthcare scenarios, as in a real workplace.",
      },
      {
        id: "READING",
        name: "Reading",
        durationMin: 60,
        questionCount: 42,
        questionTypes: ["READING_MCQ", "MATCHING", "FILL_BLANK", "LABELING"],
        notes: "Short workplace texts and a 900-word healthcare article.",
      },
      {
        id: "WRITING",
        name: "Writing",
        durationMin: 45,
        questionCount: 1,
        questionTypes: ["WRITING_TASK1", "WRITING_TASK2"],
        notes: "One writing task: a letter or an answer to a note, following a workplace scenario.",
      },
      {
        id: "SPEAKING",
        name: "Speaking",
        durationMin: 20,
        questionCount: 2,
        questionTypes: ["SPEAKING"],
        notes: "Two role plays using set OET speaking role-play cards.",
      },
    ],
    { scale: "0–500 in 10-point steps, reported as grades A–E", note: "Each sub-test is reported separately." },
    {
      label: "Cambridge English — OET test overview",
      url: "https://www.cambridgeenglish.org/exams-and-tests/oet/test-overview/",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── TOEIC ───────────────────────────────────────────────────────────────
  bp(
    "TOEIC",
    "TOEIC Listening and Reading",
    "2026.1",
    150,
    [
      {
        id: "LISTENING",
        name: "Listening",
        durationMin: 45,
        questionCount: 100,
        questionTypes: ["LISTEN_AND_SELECT", "MATCHING", "FILL_BLANK", "LABELING", "SUMMARY_COMPLETION"],
        notes: "Part 1 photographs, Part 2 conversations, Part 3 announcements, Part 4 business passages. Section I.",
      },
      {
        id: "READING",
        name: "Reading",
        durationMin: 75,
        questionCount: 100,
        questionTypes: ["READING_MCQ", "FILL_BLANK", "SUMMARY_COMPLETION", "LABELING"],
        notes: "Section II. The TOEIC test also has a separate Writing and Speaking test, which this platform does not offer.",
      },
    ],
    { scale: "0–990 listening, 0–495 reading", note: "Multiple choice throughout. About 2.5 hours including the biographical questions." },
    {
      label: "ETS — TOEIC Listening and Reading test content and format",
      url: "https://www.ets.org/toeic/about/listening-reading.html",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── Linguaskill ─────────────────────────────────────────────────────────
  bp(
    "LINGUASKILL",
    "Cambridge Linguaskill",
    "2026.1",
    135,
    [
      {
        id: "READING",
        name: "Reading and Listening",
        durationMin: 75,
        questionCount: 50,
        questionTypes: ["READING_MCQ", "LISTEN_AND_SELECT", "MATCHING", "FILL_BLANK", "LABELING"],
        notes: "Linguaskill Core: 16 reading and 25 listening items across six parts.",
      },
      {
        id: "SPEAKING",
        name: "Speaking",
        durationMin: 15,
        questionCount: 4,
        questionTypes: ["SPEAKING"],
        notes: "Optional. Four tasks: interview, read aloud, collaboration, presentation.",
      },
      {
        id: "WRITING",
        name: "Writing",
        durationMin: 45,
        questionCount: 1,
        questionTypes: ["WRITING_TASK2"],
        notes: "Optional. One task: an email, report, review, article or letter.",
      },
    ],
    { scale: "CEFR A2–C1", note: "Reported as a CEFR level. The C1 Business Higher module is used in business settings." },
    {
      label: "Cambridge English — Linguaskill test format",
      url: "https://www.cambridgeenglish.org/exams-and-tests/linguaskill/",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── LanguageCert ────────────────────────────────────────────────────────
  bp(
    "LANGUAGECERT",
    "LanguageCert",
    "2026.1",
    120,
    [
      {
        id: "READING",
        name: "Reading and Listening",
        durationMin: 60,
        questionTypes: ["READING_MCQ", "LISTEN_AND_SELECT", "MATCHING", "FILL_BLANK"],
        notes: "Modular paper, as a General English or English for Specific Purposes test.",
      },
      {
        id: "WRITING",
        name: "Writing",
        durationMin: 40,
        questionTypes: ["WRITING_TASK2"],
        notes: "Optional module.",
      },
      {
        id: "SPEAKING",
        name: "Speaking",
        durationMin: 15,
        questionTypes: ["SPEAKING"],
        notes: "Optional module.",
      },
    ],
    { scale: "CEFR A2–C2", note: "Reported as a CEFR level." },
    {
      label: "LanguageCert — exam format",
      url: "https://www.languagecert.org/exams/english/languagecert-english/",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── MCAT ────────────────────────────────────────────────────────────────
  bp(
    "MCAT",
    "MCAT",
    "2026.1",
    375,
    [
      {
        id: "READING",
        name: "Chemical and Physical Foundations",
        durationMin: 95,
        questionCount: 59,
        questionTypes: ["READING_MCQ", "FILL_BLANK", "MATCHING"],
        notes: "10 passages plus 15 discrete questions. Scientific reasoning, chemical reactions, mechanics, physics and biochemistry.",
      },
      {
        id: "LISTENING",
        name: "Critical Analysis and Reasoning Skills",
        durationMin: 90,
        questionCount: 53,
        questionTypes: ["READING_MCQ", "SUMMARY_COMPLETION"],
        notes: "9 passages. Comprehension, reasoning and critique of arguments.",
      },
      {
        id: "WRITING",
        name: "Biological and Biochemical Foundations",
        durationMin: 95,
        questionCount: 59,
        questionTypes: ["READING_MCQ", "FILL_BLANK"],
        notes: "10 passages plus 15 discrete questions. Organic chemistry and biochemistry.",
      },
      {
        id: "SPEAKING",
        name: "Psychological, Social and Biological Foundations",
        durationMin: 95,
        questionCount: 59,
        questionTypes: ["READING_MCQ", "SUMMARY_COMPLETION"],
        notes: "10 passages plus 15 discrete questions. Psychology, sociology and biology.",
      },
    ],
    { scale: "472–528, with four section scores", note: "230 questions, 6 hours 15 minutes, with breaks." },
    {
      label: "AAMC — MCAT exam format",
      url: "https://www.aamc.org/students/mcat-exam/register/exam-day",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── LSAT ────────────────────────────────────────────────────────────────
  bp(
    "LSAT",
    "LSAT",
    "2026.1",
    160,
    [
      {
        id: "READING",
        name: "Reading Comprehension",
        durationMin: 35,
        questionCount: 27,
        questionTypes: ["READING_MCQ", "SUMMARY_COMPLETION", "MATCHING"],
        notes: "26–28 questions. The Analytical Reasoning (logic games) section was removed in August 2024.",
      },
      {
        id: "LISTENING",
        name: "Logical Reasoning I and II",
        durationMin: 70,
        questionCount: 50,
        questionTypes: ["READING_MCQ", "SUMMARY_COMPLETION"],
        notes: "Two scored sections of 24–26 questions each, 35 minutes apiece.",
      },
      {
        id: "WRITING",
        name: "Argumentative Writing",
        durationMin: 50,
        questionCount: 1,
        questionTypes: ["ESSAY"],
        notes: "Administered separately. Not scored, but sent to schools.",
      },
    ],
    { scale: "120–180", note: "One 35-minute experimental section is unscored. About 2 hours 40 minutes for the multiple-choice portion." },
    {
      label: "LSAC — LSAT sections and format",
      url: "https://www.lsat.org/about/what-is-the-lsat",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── ALO's own placement test ────────────────────────────────────────────
  bp(
    "ALO-PLACEMENT",
    "ALO English Placement Test",
    "2026.1",
    60,
    [
      {
        id: "LISTENING",
        name: "Listening",
        durationMin: 20,
        questionTypes: ["LISTEN_AND_SELECT", "MULTIPLE_CHOICE", "TRUE_FALSE"],
      },
      {
        id: "READING",
        name: "Reading",
        durationMin: 20,
        questionTypes: ["READING_MCQ", "MULTIPLE_CHOICE", "TRUE_FALSE_NOT_GIVEN"],
      },
      {
        id: "WRITING",
        name: "Writing",
        durationMin: 15,
        questionTypes: ["WRITING_TASK2", "ESSAY"],
        notes: "One short task. Assessed for level placement, not for a band.",
      },
      {
        id: "SPEAKING",
        name: "Speaking",
        durationMin: 10,
        questionTypes: ["SPEAKING"],
        notes: "One short spoken task. Transcript-based feedback only.",
      },
    ],
    { scale: "Not a proficiency certificate", note: "The platform's own placement test. The result places a learner at a level; it is not a certificate and is not recognised externally." },
    {
      label: "ALO Education product definition",
      url: "https://github.com/alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── VISA interview practice ────────────────────────────────────────────
  bp(
    "VISA-INTERVIEW",
    "Visa Interview Practice",
    "2026.1",
    30,
    [
      {
        id: "SPEAKING",
        name: "Interview practice",
        durationMin: 30,
        questionTypes: ["SPEAKING"],
        notes: "Practice conversation only. No eligibility, risk or outcome assessment is produced.",
      },
    ],
    { scale: "None", note: "Practice conversation. No score of any kind is produced." },
    {
      label: "ALO Education product definition",
      url: "https://github.com/alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── Cambridge (B2 First and above) ──────────────────────────────────────
  bp(
    "CAMBRIDGE",
    "Cambridge English",
    "2026.1",
    170,
    [
      {
        id: "LISTENING",
        name: "Listening",
        durationMin: 40,
        questionCount: 40,
        questionTypes: ["LISTEN_AND_SELECT", "TRUE_FALSE_NOT_GIVEN", "FILL_BLANK", "MATCHING", "LABELING"],
        notes: "Four parts.",
      },
      {
        id: "READING",
        name: "Reading",
        durationMin: 60,
        questionCount: 52,
        questionTypes: ["READING_MCQ", "TRUE_FALSE_NOT_GIVEN", "FILL_BLANK", "MATCHING", "LABELING", "SENTENCE_COMPLETION", "SUMMARY_COMPLETION"],
        notes: "B2 First: five parts of eight questions each, plus one of twelve.",
      },
      {
        id: "WRITING",
        name: "Writing",
        durationMin: 80,
        questionCount: 2,
        questionTypes: ["WRITING_TASK1", "WRITING_TASK2"],
        notes: "Part 1: a short text of at least 140 words. Part 2: a continuous piece of writing of at least 140 words. 80 minutes for both.",
      },
      {
        id: "SPEAKING",
        name: "Speaking",
        durationMin: 14,
        questionCount: 4,
        questionTypes: ["SPEAKING"],
        notes: "Four parts, 11–14 minutes.",
      },
    ],
    { scale: "Cambridge English Scale, 80–190, reported as a CEFR level", note: "The exact item counts vary by level; this blueprint reflects the B2 First structure the platform's content is aligned to." },
    {
      label: "Cambridge English — exam format",
      url: "https://www.cambridgeenglish.org/exams-and-tests/",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
  ),

  // ── OIETC — identity not verified ───────────────────────────────────────
  bp(
    "OIETC",
    "OIETC — product identity pending verification",
    "2026.1",
    60,
    [
      {
        id: "READING",
        name: "Reading",
        durationMin: 20,
        questionTypes: ["READING_MCQ", "MULTIPLE_CHOICE", "TRUE_FALSE_NOT_GIVEN"],
        notes: "Generic. The product's identity has not been verified, so no provider structure is claimed.",
      },
      {
        id: "LISTENING",
        name: "Listening",
        durationMin: 20,
        questionTypes: ["LISTEN_AND_SELECT", "MULTIPLE_CHOICE"],
      },
      {
        id: "WRITING",
        name: "Writing",
        durationMin: 15,
        questionTypes: ["ESSAY", "WRITING_TASK2"],
      },
      {
        id: "SPEAKING",
        name: "Speaking",
        durationMin: 10,
        questionTypes: ["SPEAKING"],
      },
    ],
    { scale: "Not published", note: "No provider structure has been verified for this product." },
    {
      label: "No official source — the product identity is unverified",
      url: "https://github.com/alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE",
      checkedAt: BLUEPRINT_CHECKED_AT,
    },
    false,
  ),
];

// ─── Access ────────────────────────────────────────────────────────────────

const BY_CODE = new Map(BLUEPRINTS.map((b) => [b.examTypeCode, b]));

/** The blueprint for an exam code, if there is one. */
export function getBlueprint(examTypeCode: string): ExamBlueprint | undefined {
  return BY_CODE.get(examTypeCode);
}

/** Every blueprint. */
export function allBlueprints(): ExamBlueprint[] {
  return [...BLUEPRINTS];
}

/** The nine principal examination families the platform must support. */
export const PRINCIPAL_EXAM_FAMILIES = [
  "IELTS-A",
  "IELTS-G",
  "TOEFL-iBT",
  "PTE-A",
  "DUOLINGO",
  "GRE",
  "GMAT",
  "SAT",
  "ACT",
  "ALO-PLACEMENT",
] as const;

/** The canonical question types the grader can score. */
export function canonicalQuestionTypes(): Set<string> {
  const raw = readFileSync(
    join(process.cwd(), "src", "lib", "exam", "question-types.json"),
    "utf8",
  ) as string;
  const parsed = JSON.parse(raw) as {
    indexTypes: string[];
    textTypes: string[];
    setTypes: string[];
    subjectiveTypes: string[];
  };
  return new Set([
    ...parsed.indexTypes,
    ...parsed.textTypes,
    ...parsed.setTypes,
    ...parsed.subjectiveTypes,
  ]);
}

/**
 * Every question type named by a blueprint that the grader cannot score.
 * A blueprint that names an unknown type is a defect, and this finds it.
 */
export function unscoreableBlueprintTypes(blueprint: ExamBlueprint): string[] {
  const known = canonicalQuestionTypes();
  const found = new Set<string>();
  for (const section of blueprint.sections) {
    for (const type of section.questionTypes) {
      if (!known.has(type)) found.add(type);
    }
  }
  return [...found];
}
