/**
 * src/lib/ai/evaluation/rubrics.ts
 *
 * The evaluation rubric for every exam the platform offers.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The platform's agent registry listed a "Writing Evaluator" and a "Speaking
 * Evaluator" for every exam, but the only implementation was a generic local
 * heuristic that looked at word count and discourse markers. It had no idea
 * which exam the student was preparing for, and an IELTS Task 1 chart
 * description was judged by the same rules as a GRE analytical essay.
 *
 * This module is the missing piece: one rubric per exam type, describing the
 * tasks that exam actually contains and the criteria that matter for it. The
 * AI evaluator (src/lib/ai/evaluation/ai-evaluation.ts) uses it to build the
 * prompt and to validate the model's answer.
 *
 * HONESTY RULES BAKED IN
 * ──────────────────────
 * - The criteria are written as questions, not as bands. The platform does
 *   not publish a band, a grade or a score for writing or speaking, because
 *   no rubric here has been calibrated against human raters.
 * - The speaking criteria deliberately exclude anything acoustic. A transcript
 *   cannot evidence pronunciation, accent, intelligibility, pace or pausing.
 * - A rubric for an exam whose product identity is not verified (OIETC) says
 *   so, and uses the generic English-writing criteria rather than inventing
 *   a blueprint.
 */

export type EvaluationSection = "WRITING" | "SPEAKING";

export type RubricCriterion = {
  key: string;
  label: string;
  /** The question the evaluator must answer about the student's work. */
  guidance: string;
};

export type ExamRubric = {
  code: string;
  name: string;
  /** The writing tasks this exam contains. Empty when it has none. */
  writingTasks: string[];
  /** The speaking tasks this exam contains. Empty when it has none. */
  speakingTasks: string[];
  writingCriteria: RubricCriterion[];
  speakingCriteria: RubricCriterion[];
  /** Extra focus for the evaluator, e.g. "compare two data sets". */
  focus: string;
  /** True when no exam-specific rubric exists and a generic one is used. */
  generic: boolean;
  /** Set when the exam's own product identity is not verified. */
  identityUnverified?: boolean;
};

// ─── Criteria families ────────────────────────────────────────────────────

const LANGUAGE_WRITING_CRITERIA: RubricCriterion[] = [
  { key: "task_coverage", label: "Task coverage", guidance: "Does the response address every part of the prompt, and develop each part rather than restating it?" },
  { key: "organisation", label: "Organisation", guidance: "Is there a clear opening, a logical progression of ideas, and a closing that follows from the argument?" },
  { key: "vocabulary", label: "Vocabulary range", guidance: "Is the vocabulary varied and used precisely, with repetition avoided where it weakens the message?" },
  { key: "grammar", label: "Grammar and accuracy", guidance: "Are the structures varied and accurate enough that meaning is never obscured?" },
  { key: "register", label: "Register and tone", guidance: "Is the tone appropriate to the task and the reader?" },
];

const ACADEMIC_WRITING_CRITERIA: RubricCriterion[] = [
  { key: "reasoning", label: "Argument and reasoning", guidance: "Does the argument actually answer the question posed, with a defensible line of reasoning rather than assertions?" },
  { key: "evidence", label: "Use of evidence", guidance: "Is each claim supported by the given material or by a stated, relevant example, rather than by assertion?" },
  { key: "focus", label: "Focus and organisation", guidance: "Does the response stay on the task, with each paragraph doing one job and serving the overall point?" },
  { key: "concision", label: "Concision and style", guidance: "Is every sentence doing work, with no padding, repetition or digression?" },
  { key: "mechanics", label: "Grammar and mechanics", guidance: "Are spelling, punctuation and sentence boundaries sound enough not to distract from the argument?" },
];

const SPEAKING_CRITERIA: RubricCriterion[] = [
  { key: "content", label: "Content and relevance", guidance: "Does the answer address the question that was asked, and stay on the topic?" },
  { key: "structure", label: "Structure and coherence", guidance: "Is the answer organised so that a listener can follow the line of reasoning?" },
  { key: "vocabulary", label: "Lexical range", guidance: "Is the vocabulary varied and appropriate, with word choice that carries meaning?" },
  { key: "grammar", label: "Grammar", guidance: "Are the structures accurate and varied enough to be followed without effort?" },
  { key: "detail", label: "Detail and elaboration", guidance: "Is the answer developed with relevant detail rather than left as a bare statement?" },
];

const GENERIC_WRITING_CRITERIA: RubricCriterion[] = [
  { key: "task_coverage", label: "Task coverage", guidance: "Does the response address the prompt that was given?" },
  { key: "organisation", label: "Organisation", guidance: "Is there a clear line of reasoning a reader can follow?" },
  { key: "vocabulary", label: "Vocabulary range", guidance: "Is the vocabulary varied and used precisely?" },
  { key: "grammar", label: "Grammar and accuracy", guidance: "Is the writing accurate enough that the meaning is always clear?" },
];

const GENERIC_SPEAKING_CRITERIA: RubricCriterion[] = [
  { key: "content", label: "Content and relevance", guidance: "Does the answer address the question that was asked?" },
  { key: "structure", label: "Structure and coherence", guidance: "Is the answer organised so that a listener can follow it?" },
  { key: "vocabulary", label: "Lexical range", guidance: "Is the vocabulary varied and appropriate?" },
  { key: "grammar", label: "Grammar", guidance: "Is the language accurate and varied enough to be followed?" },
];

// ─── The registry ─────────────────────────────────────────────────────────

type RubricInput = Omit<ExamRubric, "writingCriteria" | "speakingCriteria" | "generic"> & {
  writingCriteria?: RubricCriterion[];
  speakingCriteria?: RubricCriterion[];
};

function build(input: RubricInput): ExamRubric {
  return {
    ...input,
    writingCriteria: input.writingCriteria ?? [],
    speakingCriteria: input.speakingCriteria ?? [],
    generic: false,
  };
}

const IELTS_SPEAKING = [
  "Part 1 — Interview questions",
  "Part 2 — Long turn (monologue from a prompt card)",
  "Part 3 — Two-way discussion",
];

const IELTS_ACADEMIC_WRITING = [
  "Task 1 — Academic writing (describe a graph, chart, table or process)",
  "Task 2 — Opinion, argument or problem/cause essay",
];

export const EXAM_RUBRICS: Record<string, ExamRubric> = {
  "IELTS-A": build({
    code: "IELTS-A",
    name: "IELTS Academic",
    writingTasks: IELTS_ACADEMIC_WRITING,
    speakingTasks: IELTS_SPEAKING,
    writingCriteria: LANGUAGE_WRITING_CRITERIA,
    speakingCriteria: SPEAKING_CRITERIA,
    focus:
      "Task 1 is a description of visual data: check that the description is accurate, that the key features and comparisons are identified, and that trends are described rather than merely listed. Task 2 is an argument: check that a position is taken and defended. Speaking is transcript-based only.",
  }),
  "IELTS-G": build({
    code: "IELTS-G",
    name: "IELTS General Training",
    writingTasks: [
      "Task 1 — Letter or email (request, complaint, apology, application)",
      "Task 2 — Opinion, argument or problem/cause essay",
    ],
    speakingTasks: IELTS_SPEAKING,
    writingCriteria: LANGUAGE_WRITING_CRITERIA,
    speakingCriteria: SPEAKING_CRITERIA,
    focus:
      "Task 1 is a letter: check that every required purpose of the letter is covered, that the tone suits the relationship between writer and reader, and that the ending is appropriate. Task 2 is the same argumentative task as Academic. Speaking is transcript-based only.",
  }),
  "IELTS-UKVI": build({
    code: "IELTS-UKVI",
    name: "IELTS for UKVI",
    writingTasks: IELTS_ACADEMIC_WRITING,
    speakingTasks: IELTS_SPEAKING,
    writingCriteria: LANGUAGE_WRITING_CRITERIA,
    speakingCriteria: SPEAKING_CRITERIA,
    focus:
      "Same task structure as IELTS Academic. The evaluation is practice feedback against the published task format; it is not a UKVI visa decision and carries no immigration consequence.",
  }),
  "TOEFL-iBT": build({
    code: "TOEFL-iBT",
    name: "TOEFL iBT",
    writingTasks: [
      "Independent writing — opinion or argument essay (read a short passage, then argue)",
      "Integrated writing — summarise what a lecturer said while reading a passage",
    ],
    speakingTasks: [
      "Independent speaking — answer a general question from personal experience",
      "Integrated speaking — use a short reading or audio excerpt in the answer",
    ],
    writingCriteria: LANGUAGE_WRITING_CRITERIA,
    speakingCriteria: SPEAKING_CRITERIA,
    focus:
      "The integrated tasks test whether the response uses the source material: check that the summary draws on the lecture and the passage together rather than repeating one of them. Speaking is transcript-based only.",
  }),
  "PTE-A": build({
    code: "PTE-A",
    name: "PTE Academic",
    writingTasks: [
      "Summarising a written text",
      "Write from dictation",
    ],
    speakingTasks: [
      "Read aloud",
      "Re-speak a heard phrase",
      "Image description",
    ],
    writingCriteria: LANGUAGE_WRITING_CRITERIA,
    speakingCriteria: SPEAKING_CRITERIA,
    focus:
      "This exam scores several micro-skills; the platform evaluates the written and spoken response that was submitted. Read-aloud and re-speak tasks are acoustic by nature, so a transcript-based evaluation can only comment on the wording, not on the delivery.",
  }),
  CAMBRIDGE: build({
    code: "CAMBRIDGE",
    name: "Cambridge English (B2 First)",
    writingTasks: [
      "Part 2 — Essay",
      "Part 3 — Letter, email or article",
    ],
    speakingTasks: [
      "Part 1 — Personal questions",
      "Part 2 — Long turn",
      "Part 3 — Collaborative discussion",
    ],
    writingCriteria: LANGUAGE_WRITING_CRITERIA,
    speakingCriteria: SPEAKING_CRITERIA,
    focus:
      "Part 3 of the writing paper is a communication task: check the register, the coverage of the three bullet points and the closing. Speaking is transcript-based only.",
  }),
  LINGUASKILL: build({
    code: "LINGUASKILL",
    name: "Cambridge Linguaskill",
    writingTasks: ["Short writing task"],
    speakingTasks: ["Speaking task"],
    writingCriteria: LANGUAGE_WRITING_CRITERIA,
    speakingCriteria: SPEAKING_CRITERIA,
    focus: "Short tasks: check that the response is complete and clear for the length requested. Speaking is transcript-based only.",
  }),
  LANGUAGECERT: build({
    code: "LANGUAGECERT",
    name: "LanguageCert",
    writingTasks: ["Writing task"],
    speakingTasks: ["Speaking task"],
    writingCriteria: LANGUAGE_WRITING_CRITERIA,
    speakingCriteria: SPEAKING_CRITERIA,
    focus: "Check that the response answers the written or spoken task as asked. Speaking is transcript-based only.",
  }),
  TOEIC: build({
    code: "TOEIC",
    name: "TOEIC",
    writingTasks: ["Writing section response"],
    speakingTasks: ["Speaking section response"],
    writingCriteria: LANGUAGE_WRITING_CRITERIA,
    speakingCriteria: SPEAKING_CRITERIA,
    focus: "Check that the response addresses the business or everyday situation described. Speaking is transcript-based only.",
  }),
  DUOLINGO: build({
    code: "DUOLINGO",
    name: "Duolingo English Test",
    writingTasks: ["Written response"],
    speakingTasks: ["Speaking response"],
    writingCriteria: LANGUAGE_WRITING_CRITERIA,
    speakingCriteria: SPEAKING_CRITERIA,
    focus: "Short prompts: check the response is complete, accurate and appropriately pitched. Speaking is transcript-based only.",
  }),
  OET: build({
    code: "OET",
    name: "OET (Healthcare)",
    writingTasks: ["Case-related writing — a letter, email or referral note to a colleague"],
    speakingTasks: ["OET speaking role-play with a patient or colleague"],
    writingCriteria: LANGUAGE_WRITING_CRITERIA,
    speakingCriteria: SPEAKING_CRITERIA,
    focus:
      "This is a healthcare communication exam: check that clinical information is accurate, that the professional register is appropriate for the recipient, and that anything that could affect patient care is stated unambiguously. This is language feedback only, not a clinical competence assessment.",
  }),
  OIETC: build({
    code: "OIETC",
    name: "OIETC (product identity pending verification)",
    writingTasks: ["Writing task"],
    speakingTasks: ["Speaking task"],
    writingCriteria: GENERIC_WRITING_CRITERIA,
    speakingCriteria: GENERIC_SPEAKING_CRITERIA,
    focus:
      "The product identity for this exam code has not been verified, so no exam-specific blueprint is applied. The evaluator uses the generic English criteria and says so. Do not present the result as being against any named test.",
    identityUnverified: true,
  }),
  GRE: build({
    code: "GRE",
    name: "GRE General Test",
    writingTasks: [
      "Analytical Writing — Issue task (state and defend a position on an issue)",
      "Analytical Writing — Argument task (critique the reasoning in a short argument)",
    ],
    speakingTasks: [],
    writingCriteria: ACADEMIC_WRITING_CRITERIA,
    speakingCriteria: [],
    focus:
      "This is analytical writing, not language practice: the question is whether the reasoning is sound and supported, not whether the prose is ornate. For the Argument task, the target is the argument's reasoning, and a well-made point about the argument's structure is worth more than a restatement of the conclusion.",
  }),
  GMAT: build({
    code: "GMAT",
    name: "GMAT Exam",
    writingTasks: ["Analytical Writing — Argument essay"],
    speakingTasks: ["Integrated speaking response"],
    writingCriteria: ACADEMIC_WRITING_CRITERIA,
    speakingCriteria: SPEAKING_CRITERIA,
    focus:
      "The essay is judged on how specific and well-supported the reasoning is. Speaking responses are scored on the argument, not on delivery, so the transcript-based evaluation focuses on content and structure. Speaking is transcript-based only.",
  }),
  SAT: build({
    code: "SAT",
    name: "Digital SAT",
    writingTasks: ["Essay — evidence-based"],
    speakingTasks: [],
    writingCriteria: ACADEMIC_WRITING_CRITERIA,
    speakingCriteria: [],
    focus: "The essay must use evidence from the passage and a reasoning passage: check that the reasoning is traced, not merely quoted.",
  }),
  ACT: build({
    code: "ACT",
    name: "ACT",
    writingTasks: ["English Composition essay"],
    speakingTasks: [],
    writingCriteria: ACADEMIC_WRITING_CRITERIA,
    speakingCriteria: [],
    focus: "Check that the essay states a clear position, develops it with a stated line of reasoning, and uses the evidence given.",
  }),
  LSAT: build({
    code: "LSAT",
    name: "LSAT",
    writingTasks: ["Analytical reasoning essay"],
    speakingTasks: [],
    writingCriteria: ACADEMIC_WRITING_CRITERIA,
    speakingCriteria: [],
    focus: "Focus on the reasoning: identify the assumption, flaw or counterexample the argument depends on and make that explicit.",
  }),
  MCAT: build({
    code: "MCAT",
    name: "MCAT",
    writingTasks: [],
    speakingTasks: [],
    writingCriteria: [],
    speakingCriteria: [],
    focus:
      "The MCAT has no written or spoken production section, so there is nothing for the writing or speaking evaluator to assess. The exam is delivered here as reading practice only.",
  }),
  "VISA-INTERVIEW": build({
    code: "VISA-INTERVIEW",
    name: "Visa interview practice",
    writingTasks: ["Written preparation note"],
    speakingTasks: [
      "Interview answer — background and motivation",
      "Interview answer — current situation, study plans and ties",
    ],
    writingCriteria: GENERIC_WRITING_CRITERIA,
    speakingCriteria: GENERIC_SPEAKING_CRITERIA,
    focus:
      "This is interview preparation, not an eligibility assessment. The evaluator checks whether the answer is specific, honest in tone and addresses what was asked. It does not estimate visa outcomes, risk or eligibility, and it must never be presented as an assessment of an application.",
  }),
  "ALO-PLACEMENT": build({
    code: "ALO-PLACEMENT",
    name: "ALO English Placement Test",
    writingTasks: ["Placement writing task"],
    speakingTasks: ["Placement speaking task"],
    writingCriteria: LANGUAGE_WRITING_CRITERIA,
    speakingCriteria: SPEAKING_CRITERIA,
    focus:
      "This is the platform's own placement test: the purpose is to place the learner at the right level, so the evaluator reports which strengths and gaps would move the placement decision. It is not a proficiency certificate. Speaking is transcript-based only.",
  }),
};

/**
 * The rubric for an exam code. Unknown codes get a generic rubric with
 * `generic: true` so the caller can disclose that no exam-specific criteria
 * were applied.
 */
export function getExamRubric(code: string): ExamRubric {
  const found = EXAM_RUBRICS[code?.toUpperCase?.() ?? ""];
  if (found) return found;
  return {
    code: code || "UNKNOWN",
    name: code || "Unknown exam",
    writingTasks: ["Writing task"],
    speakingTasks: ["Speaking task"],
    writingCriteria: GENERIC_WRITING_CRITERIA,
    speakingCriteria: GENERIC_SPEAKING_CRITERIA,
    focus: "No exam-specific rubric exists for this exam code; the generic English criteria are applied.",
    generic: true,
  };
}

/** Every exam code the rubric registry covers. */
export function listRubricCodes(): string[] {
  return Object.keys(EXAM_RUBRICS).sort();
}

/** Does this exam have a writing task the evaluator can assess? */
export function hasWritingRubric(code: string): boolean {
  const rubric = getExamRubric(code);
  return rubric.writingTasks.length > 0 && rubric.writingCriteria.length > 0;
}

/** Does this exam have a speaking task the evaluator can assess? */
export function hasSpeakingRubric(code: string): boolean {
  const rubric = getExamRubric(code);
  return rubric.speakingTasks.length > 0 && rubric.speakingCriteria.length > 0;
}
