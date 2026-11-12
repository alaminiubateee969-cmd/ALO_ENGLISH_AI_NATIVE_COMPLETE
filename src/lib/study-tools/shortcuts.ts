/**
 * src/lib/study-tools/shortcuts.ts
 *
 * Static library of exam-prep shortcuts and techniques. This is the single
 * source of truth used by both the public `/api/shortcuts` route and the
 * `/shortcuts` page. No database needed for the MVP — these are reference
 * strategies compiled from publicly-known exam-prep frameworks (IELTS Liz,
 * IELTS Simon, GregMat, College Board SAT guidance, ETS POWERPREP notes).
 *
 * Everything here is preparation guidance, not official exam content.
 */

export type ExamCode =
  | "IELTS"
  | "TOEFL"
  | "PTE"
  | "GRE"
  | "GMAT"
  | "SAT"
  | "ACT"
  | "DET"
  | "OET"
  | "CAMBRIDGE";

export type SkillCode =
  | "READING"
  | "WRITING"
  | "SPEAKING"
  | "LISTENING"
  | "QUANT"
  | "VERBAL";

export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type Shortcut = {
  id: string;
  title: string;
  exam: ExamCode;
  skill: SkillCode;
  description: string;
  example: string;
  difficulty: Difficulty;
  tags: string[];
};

export const EXAM_LABELS: Record<ExamCode, string> = {
  IELTS: "IELTS",
  TOEFL: "TOEFL iBT",
  PTE: "PTE Academic",
  GRE: "GRE",
  GMAT: "GMAT",
  SAT: "SAT",
  ACT: "ACT",
  DET: "Duolingo English Test",
  OET: "OET",
  CAMBRIDGE: "Cambridge B2 First",
};

export const SKILL_LABELS: Record<SkillCode, string> = {
  READING: "Reading",
  WRITING: "Writing",
  SPEAKING: "Speaking",
  LISTENING: "Listening",
  QUANT: "Quant",
  VERBAL: "Verbal",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const SHORTCUTS: Shortcut[] = [
  // ---------------- IELTS READING ----------------
  {
    id: "ielts-read-skim-scan",
    title: "Skim then scan: two-pass reading",
    exam: "IELTS",
    skill: "READING",
    difficulty: "BEGINNER",
    tags: ["skimming", "scanning", "time-management"],
    description:
      "First pass (2 minutes): read the title, sub-headings, first sentence of each paragraph and the conclusion. Build a mental map of where information lives. Second pass: read each question, identify the keyword (proper noun, number, date, technical term), then scan only the paragraph you expect to contain it. Never read every word start to finish — IELTS reading is a locating exercise, not a comprehension exercise.",
    example:
      "Question: 'When was the Stockholm Declaration adopted?' Keyword = 'Stockholm Declaration'. From your skim you remember paragraph 3 was about international conferences. Scan paragraph 3 only for the words 'Stockholm' — you find '1972' within ten seconds instead of re-reading three paragraphs.",
  },
  {
    id: "ielts-read-tfng-elimination",
    title: "T/F/NG elimination strategy",
    exam: "IELTS",
    skill: "READING",
    difficulty: "INTERMEDIATE",
    tags: ["true-false-not-given", "elimination"],
    description:
      "TRUE: the statement matches the passage exactly — same fact, same relationship, same direction. FALSE: the passage directly contradicts the statement (opposite relationship, different number, reversed cause/effect). NOT GIVEN: the topic may appear, but the SPECIFIC claim in the statement is never confirmed or denied. The trap is treating 'extra information' as FALSE. If the passage adds detail not in the statement, that is NOT GIVEN, not FALSE. Always locate the comparison: if there is no comparison, you cannot mark TRUE or FALSE.",
    example:
      "Passage: 'Solar capacity grew 24% in 2023.' Statement: 'Solar grew faster than wind in 2023.' → NOT GIVEN. The passage mentions solar only; there is no wind comparison. A common wrong answer is FALSE because students assume wind grew slower.",
  },
  {
    id: "ielts-read-heading-match",
    title: "Heading match: read the WHOLE paragraph",
    exam: "IELTS",
    skill: "READING",
    difficulty: "INTERMEDIATE",
    tags: ["headings", "main-idea"],
    description:
      "For 'Choosing headings' questions the first sentence often misleads. Read the full paragraph and ask: what is the paragraph MOSTLY about? The correct heading covers the majority of sentences, not the first one. Eliminate headings that use a word from the paragraph but describe a minor detail. The distractor heading is almost always built from a real word that appears once.",
    example:
      "Paragraph mentions penguins once but is mostly about climate-driven migration patterns across many species. The 'Penguin behaviour' heading is the trap; 'Changing animal migration' is correct even though 'migration' appears less prominently.",
  },
  {
    id: "ielts-read-sentence-completion",
    title: "Sentence completion: copy grammar exactly",
    exam: "IELTS",
    skill: "READING",
    difficulty: "BEGINNER",
    tags: ["fill-blank", "grammar"],
    description:
      "The word(s) you copy from the passage must fit the grammar of the gap. Before you write, read the sentence stem aloud in your head with your candidate word — does it sound like English? Check the instruction: 'ONE word only' vs 'NO MORE THAN TWO words' is a frequent cause of lost marks. Numbers count as words. Hyphenated words usually count as one. Never change the form (singular/plural, tense) unless the instruction allows.",
    example:
      "Stem: 'The device was praised for its ____.' Passage has 'remarkable portability'. Answer = 'portability' (one word). If you wrote 'portable', grammar fits but you altered the form — only acceptable if the question allows it.",
  },
  {
    id: "ielts-read-matching-info",
    title: "Matching information: paragraph order is not answer order",
    exam: "IELTS",
    skill: "READING",
    difficulty: "ADVANCED",
    tags: ["matching", "organisation"],
    description:
      "In 'Which paragraph contains the following information?' questions the answers are deliberately out of order. The first item might be in paragraph D, the second in paragraph A. Mark each paragraph with a one-word topic label during your skim, then match by topic not by sequence. Watch for paraphrase — the question will almost never use the passage's exact words.",
    example:
      "Item: 'a criticism of the original method' → scan for negative-tone sentences. You marked paragraph F as 'critique' in your skim → answer is F, even though paragraph F appears last.",
  },

  // ---------------- IELTS WRITING ----------------
  {
    id: "ielts-write-task2-template",
    title: "Task 2 four-paragraph essay template",
    exam: "IELTS",
    skill: "WRITING",
    difficulty: "BEGINNER",
    tags: ["task-2", "structure", "template"],
    description:
      "A reliable 4-paragraph structure scores consistently above band 6.5 for Task Achievement and Coherence. Para 1 — Introduction (2-3 sentences): paraphrase the prompt, then state your position in one clear sentence (thesis). Para 2 — Body 1 (5-7 sentences): topic sentence stating your first reason, then explain → example → result. Para 3 — Body 2 (5-7 sentences): second reason with the same explain→example→result chain. Para 4 — Conclusion (1-2 sentences): restate position + brief implication. Never put new information in the conclusion.",
    example:
      "Prompt: 'Some say university education should be free.' Intro: 'Whether tertiary education should be funded entirely by the state is a long-debated question. I believe core degree programs should be tuition-free, with fees reserved only for second qualifications.' Body 1: reason = social mobility. Body 2: reason = economic return to the state. Conclusion: 'Free first degrees balance fairness with long-run fiscal benefit.'",
  },
  {
    id: "ielts-write-cohesive-devices",
    title: "Cohesive devices: use a small set well",
    exam: "IELTS",
    skill: "WRITING",
    difficulty: "INTERMEDIATE",
    tags: ["cohesion", "linkers", "vocabulary"],
    description:
      "Examiners reward PRECISE use of a small set of linkers, not a long decorative list. Adding 'furthermore', 'moreover', 'in addition', 'additionally' in the same essay reads as mechanical. Pick ONE per relationship type. Contrasting: 'however' or 'on the other hand' (not both). Cause/result: 'consequently' or 'as a result'. Sequencing: 'first', 'second', 'finally'. Referencing ('this', 'such', 'these') creates stronger cohesion than linkers — use them to refer back to the previous sentence's idea.",
    example:
      "Weak: 'Cars cause pollution. Moreover, they cause noise. Furthermore, they cause congestion.' Strong: 'Cars produce significant urban pollution. This is compounded by noise and, as a result, by congestion that further lowers air quality.' The second version references back with 'this' and 'as a result'.",
  },
  {
    id: "ielts-write-task1-data-select",
    title: "Task 1 Academic: select, do not list",
    exam: "IELTS",
    skill: "WRITING",
    difficulty: "INTERMEDIATE",
    tags: ["task-1", "charts", "selection"],
    description:
      "Task 1 is a 150-word summary, not a 300-word inventory. Group the data into 2-3 trends and report each in one sentence with a supporting figure. Select the highest, lowest, and the most striking change. Do NOT report every bar — that is the chart's job, not yours. Always include the unit ('percent', 'millions of tonnes') and the time frame. End with a one-sentence overview that names the main trend — examiners explicitly look for this and it is worth a full band in Task Achievement.",
    example:
      "Inadequate: 'In 2010 it was 12. In 2011 it was 14. In 2012 it was 18…' Adequate: 'Between 2010 and 2020, renewable output rose from 12% to 38% of total generation, with the steepest increase occurring after 2016 when solar capacity tripled. Fossil-fuel share fell correspondingly.'",
  },
  {
    id: "ielts-write-lexical-resource",
    title: "Lexical resource: collocations over rare words",
    exam: "IELTS",
    skill: "WRITING",
    difficulty: "ADVANCED",
    tags: ["vocabulary", "collocation"],
    description:
      "Band 7+ Lexical Resource rewards accurate collocation and topic-specific vocabulary, not rare words. A correctly-used phrase like 'mitigate the impact of' scores higher than a misused 'obfuscate'. Learn 8-10 collocations per common IELTS topic (education, environment, technology, health, urbanisation, employment). Use them where they fit naturally; forcing them in lowers your score. Avoid synonyms you have never seen in real native writing.",
    example:
      "Education topic collocations: 'narrow the achievement gap', 'foster critical thinking', 'cram for exams', 'pursue tertiary education', 'grant equal access'. Each of these is more useful than memorising isolated words like 'pedagogy' or 'erudition'.",
  },

  // ---------------- IELTS SPEAKING ----------------
  {
    id: "ielts-speak-part2-story",
    title: "Part 2: tell ONE story, not four",
    exam: "IELTS",
    skill: "SPEAKING",
    difficulty: "INTERMEDIATE",
    tags: ["part-2", "cue-card", "fluency"],
    description:
      "The cue card has 4 bullet points; candidates panic and answer each in 30 seconds, leaving 90 seconds of dead air. Instead, pick ONE specific instance and tell it as a narrative. The bullet points are prompts, not a checklist — you will not lose marks for covering them in a different order or implicitly. A flowing story with detail demonstrates Fluency & Coherence better than a stuttered list. If you finish early, add a reflection: 'what I learned from this was…'",
    example:
      "Cue card: 'Describe a skill you learned recently.' Instead of 'what/when/how/why' as four separate mini-answers, tell the story: 'Last March I decided I needed to learn to cook my grandmother's biryani. I called her on a Saturday…' — the bullets get covered naturally inside the narrative.",
  },
  {
    id: "ielts-speak-part3-structure",
    title: "Part 3: answer, reason, example, consequence",
    exam: "IELTS",
    skill: "SPEAKING",
    difficulty: "ADVANCED",
    tags: ["part-3", "structure", "argument"],
    description:
      "Part 3 questions are abstract ('Do you think technology has improved education?'). Apply A-R-E-C: Answer (your position in one sentence), Reason (why), Example (a concrete case), Consequence (the wider implication). 4 sentences is the sweet spot — under 3 sounds thin, over 6 sounds repetitive. If you change your mind mid-answer, signal it explicitly: 'On reflection, I would say…' — examiners reward self-correction as evidence of analytical thinking.",
    example:
      "Q: 'Should governments fund the arts?' A: 'Broadly, yes — though only where markets clearly fail to.' Reason: 'Because arts participation has public-good characteristics that ticket sales cannot capture.' Example: 'Free museum entry in London substantially increased school visits.' Consequence: 'Removing such funding would, over time, narrow the cultural base available to lower-income families.'",
  },
  {
    id: "ielts-speak-fillers",
    title: "Replace 'um' with discourse markers",
    exam: "IELTS",
    skill: "SPEAKING",
    difficulty: "BEGINNER",
    tags: ["fluency", "fillers"],
    description:
      "Silence and 'um/uh' lower the Fluency score. Replace them with discourse markers that buy thinking time AND earn credit for natural spoken English: 'Well, to be honest…', 'That is an interesting question, I suppose…', 'If I think about it…', 'Let me put it this way…'. Avoid filler from your first language. Do not start every answer with 'Yes' or 'No' — examiners notice repetition; vary with 'Generally speaking', 'In most cases', 'It depends'.",
    example:
      "Q: 'Do you like cooking?' Avoid: 'Um, yes, I cook, um, sometimes, like, weekends.' Better: 'Well, to be honest, I cook mostly on weekends — it is my way of unwinding after a busy week.'",
  },

  // ---------------- IELTS LISTENING ----------------
  {
    id: "ielts-listen-pre-read",
    title: "Pre-read during the 30-second gap",
    exam: "IELTS",
    skill: "LISTENING",
    difficulty: "BEGINNER",
    tags: ["pre-reading", "prediction"],
    description:
      "Before each section you get 30 seconds to read the questions. Use it to predict answers: underline the keyword in each question, guess the answer type (number, name, plural noun), and predict likely paraphrases. For section 4 (lecture), the questions follow the order of the talk, so the structure of the questions tells you the structure of the lecture. Mark the question BEFORE the one you are waiting for so you do not miss the transition.",
    example:
      "You see 'Course fee: £ ____'. You predict: a number, probably between 100 and 500, possibly with a decimal. When the speaker says 'the cost works out at three hundred and forty pounds', you already have your pen in the right place — no panic.",
  },
  {
    id: "ielts-listen-distractors",
    title: "Watch for the distractor-then-correction pattern",
    exam: "IELTS",
    skill: "LISTENING",
    difficulty: "INTERMEDIATE",
    tags: ["distractors", "correction"],
    description:
      "IELTS frequently uses self-correction: the speaker gives a number, then changes it ('we meet on Tuesdays — no wait, it moved to Thursdays'). The CORRECT answer is the second one, but the first is the trap. Other distractors: a different speaker mentions a wrong value ('I thought it was 12?' 'No, it is 14.'), or the speaker lists options before selecting one. Wait for confirmation before writing.",
    example:
      "Speaker: 'The library opens at nine… actually, half past nine during term.' The answer is 9:30, not 9:00. If you wrote 9:00 at the first mention, you fell for the distractor.",
  },

  // ---------------- TOEFL SPEAKING ----------------
  {
    id: "toefl-speak-integrated-template",
    title: "Integrated Speaking (Tasks 2-4): 3-sentence template",
    exam: "TOEFL",
    skill: "SPEAKING",
    difficulty: "INTERMEDIATE",
    tags: ["integrated", "template", "tasks-2-4"],
    description:
      "For integrated speaking the reading/listening summary must be tight. Use this skeleton: (1) One sentence summarising the reading's main claim or proposal. (2) One sentence stating the speaker's position. (3) Two reasons the speaker gives, each tied to a specific detail from the listening. Keep reading summary under 15 seconds; the listening content is where the marks are. Do NOT give your own opinion in tasks 2-4 — you are summarising, not arguing.",
    example:
      "Task 2 — proposal to extend library hours. (1) 'The university plans to keep the library open until midnight on weekdays.' (2) 'The man in the listening disagrees.' (3a) 'First, he argues that staff costs would be passed on as a student fee.' (3b) 'Second, he points out most students leave by 9 p.m. already, so the extra hours would go unused.'",
  },
  {
    id: "toefl-speak-independent-template",
    title: "Independent Speaking (Task 1): opinion + two reasons",
    exam: "TOEFL",
    skill: "SPEAKING",
    difficulty: "BEGINNER",
    tags: ["independent", "task-1", "template"],
    description:
      "Task 1 gives you 15 seconds to prepare and 45 seconds to speak. Use: 5 seconds — state your opinion clearly. 20 seconds — give reason 1 with one example. 15 seconds — give reason 2 with one example. 5 seconds — short restate. Do NOT hedge ('it depends', 'maybe'). Pick a side even if you do not feel strongly — clarity beats nuance in 45 seconds. If you finish early, do not add a third reason — better to develop the two you have.",
    example:
      "Q: 'Should students work part-time?' State: 'Yes, with limits.' Reason 1: 'Builds time-management — when I worked at a café I learned to plan my week.' Reason 2: 'Provides financial literacy early.' Restate: 'So, part-time work — within reason — is beneficial.'",
  },

  // ---------------- TOEFL WRITING ----------------
  {
    id: "toefl-write-integrated-template",
    title: "Integrated Writing: contrast, do not list",
    exam: "TOEFL",
    skill: "WRITING",
    difficulty: "INTERMEDIATE",
    tags: ["integrated", "contrast"],
    description:
      "The integrated essay contrasts the reading with the listening; it is NOT a summary of both. Each body paragraph should pair one reading point with the corresponding listening counter-point. Template sentence: 'While the reading asserts X, the lecturer counters that Y.' Aim for 3 such pairings. The lecture usually challenges every reading point — if you cannot find a counter to one, you missed it. Keep your own opinion out entirely; mentioning it costs points.",
    example:
      "Reading says sea-otter decline is due to predators. Lecture says predation evidence is weak and pollution better explains the pattern. Body paragraph: 'The reading attributes declining sea-otter populations to orca predation. The lecturer rejects this, noting that orcas would need to consume thousands of otters yearly to explain the data, which is implausible.'",
  },

  // ---------------- PTE ----------------
  {
    id: "pte-read-mcqa-process",
    title: "Multiple-choice choose single answer: time-box to 90 seconds",
    exam: "PTE",
    skill: "READING",
    difficulty: "INTERMEDIATE",
    tags: ["mcq", "time-management"],
    description:
      "PTE Reading is time-pressured (32-41 minutes for ~15 questions). Single-answer MCQs carry few points and should take at most 90 seconds each. Read the question stem first, then scan the passage for the keyword. Eliminate two obviously-wrong options immediately, then choose between the remaining two on the basis of the single most precise sentence in the passage. If you cannot decide in 90 seconds, pick your best guess and move on — never carry a question past its time-box.",
    example:
      "Question asks for the author's 'main concern'. Eliminate options that describe minor details or that reverse the author's stance. The correct answer usually paraphrases the topic sentence or the final sentence of the passage.",
  },
  {
    id: "pte-write-essay-template",
    title: "PTE Essay: PEGE template scores high on the rubric",
    exam: "PTE",
    skill: "WRITING",
    difficulty: "BEGINNER",
    tags: ["essay", "template"],
    description:
      "PTE essays are machine-scored for structure, grammar and vocabulary — a tight template scores very well. PEGE = Position, Explanation, General example, Echo. Para 1: state position + brief reason. Para 2: Explanation (develop the reason). Para 3: General example (real or hypothetical). Para 4: Echo the position with a different phrasing. 200-300 words total; never under 200 or over 300. Use the same template every time — the algorithm rewards consistency.",
    example:
      "Prompt on remote work. Para 1: 'Remote work, in my view, improves productivity for most knowledge workers.' Para 2: explain — fewer interruptions, autonomy over schedule. Para 3: example — a 2022 Stanford study of 16,000 workers found a 13% productivity gain. Para 4: 'For these reasons, remote arrangements tend to raise rather than reduce output.'",
  },
  {
    id: "pte-speak-describe-image",
    title: "Describe Image: 4 sentences, never describe everything",
    exam: "PTE",
    skill: "SPEAKING",
    difficulty: "INTERMEDIATE",
    tags: ["describe-image", "speaking"],
    description:
      "Describe Image gives 25 seconds to prepare and 40 seconds to speak. Use 4 sentences only: (1) What the image shows — type + main subject. (2) The most striking feature (highest, lowest, biggest change). (3) A second feature or comparison. (4) A brief conclusion or implication. Do NOT read every label — the algorithm rewards fluency and structure over completeness. Speak continuously; pauses hurt more than minor errors.",
    example:
      "Image: bar chart of electricity sources. (1) 'The bar chart compares the share of electricity generated by source in 2020.' (2) 'Coal remained the largest single source at approximately 38%.' (3) 'Renewables combined accounted for nearly 28%, having risen sharply since 2010.' (4) 'Overall, the transition away from coal is clear but incomplete.'",
  },

  // ---------------- GRE QUANT ----------------
  {
    id: "gre-quant-number-properties",
    title: "Number properties: test 0, 1, -1, fractions",
    exam: "GRE",
    skill: "QUANT",
    difficulty: "INTERMEDIATE",
    tags: ["number-properties", "QC"],
    description:
      "In Quantitative Comparison (QC) questions, before doing algebra, plug in the four 'special' values: 0, 1, -1, a fraction between 0 and 1, and a large negative number. If Quantity A is bigger for all of these, choose A. If the relationship changes, the answer is D (cannot be determined). This catches the hidden assumption (e.g. 'x is positive') that the question did not state. Always re-read the stem after testing — sometimes a constraint rules out a value you tested.",
    example:
      "QC: x is an integer; Quantity A = x squared; Quantity B = x. If x=1 → equal. x=2 → A bigger. x=0 → equal. x=-1 → A bigger. x=-3 → A bigger. The relationship varies → answer D. Algebra confirms: x squared = x when x=0 or x=1, otherwise differs.",
  },
  {
    id: "gre-quant-estimation",
    title: "Estimation: round before you calculate",
    exam: "GRE",
    skill: "QUANT",
    difficulty: "BEGINNER",
    tags: ["estimation", "arithmetic"],
    description:
      "When answer choices are far apart, estimate aggressively. Round 49 to 50, 3.14 to 3, 7.9 to 8. Most GRE quant questions reward a strong estimate over precise calculation — answer choices are typically spaced by at least 10-20%. Estimate first, then look at the choices: if only one is close, select it without finishing the algebra. If two are close, refine your estimate or compute precisely only between those two.",
    example:
      "Question: 38 times 52, approximately. Choices: (A) 196 (B) 1,976 (C) 19,760 (D) 197,600. Round: 40 x 50 = 2,000. Only (B) 1,976 is near 2,000 — answer is B. The precise product is 1,976 but you did not need to compute it.",
  },
  {
    id: "gre-quant-plug-in",
    title: "Plug-in your own numbers for variable-heavy questions",
    exam: "GRE",
    skill: "QUANT",
    difficulty: "INTERMEDIATE",
    tags: ["plug-in", "algebra"],
    description:
      "For 'which of the following is equal to' questions where the answer is in terms of variables, choose simple values (x=2, y=3) and compute the target quantity. Then substitute the same values into each answer choice — the one that matches is correct. Pick a second set of values to verify (avoid x=1 because it makes x squared and x equal — common distractor trap). This converts abstract algebra into arithmetic, which is faster and less error-prone.",
    example:
      "Target: 'the perimeter of a rectangle with length L and width L/3.' Pick L=6 → width=2 → perimeter = 16. Test answers with L=6: option (A) 4L → 24 wrong; (B) 8L/3 → 16 correct. Confirm with L=3 → width=1 → perimeter=8; (B) gives 8 correct.",
  },
  {
    id: "gre-quant-backsolve",
    title: "Backsolve: use the answer choices",
    exam: "GRE",
    skill: "QUANT",
    difficulty: "INTERMEDIATE",
    tags: ["backsolve", "strategy"],
    description:
      "When the question asks for a value AND the answer choices are numbers in increasing order, work backwards from the middle choice (C). If C is too small, the answer is D or E; if too big, A or B. This halves the work in one step. Backsolving is faster than setting up equations when the relationship is non-linear (e.g. 'find x where x squared plus 3x equals 28'). Remember to check whether the answer must be an integer — if not, backsolve may miss a fractional answer.",
    example:
      "Choices: 4, 6, 8, 10, 12. Question: a number plus its square equals 56. Try C=8: 8+64=72 — too big. Try B=6: 6+36=42 — too small. The precise answer is 7 (49+7=56). If 7 is among the choices, select it; otherwise the question likely has a typo or you misread.",
  },

  // ---------------- GRE VERBAL ----------------
  {
    id: "gre-verbal-text-completion-clues",
    title: "Text Completion: find the clue BEFORE the blank",
    exam: "GRE",
    skill: "VERBAL",
    difficulty: "INTERMEDIATE",
    tags: ["text-completion", "vocabulary"],
    description:
      "Every Text Completion question contains a clue — a word or phrase elsewhere in the sentence that dictates the answer. Read the full sentence, underline the clue, then predict the answer in your own words BEFORE looking at the choices. If your prediction matches an option, you are usually correct. The distractors are designed to fit the blank grammatically but not semantically — never let the choices drive your prediction.",
    example:
      "Sentence: 'Despite her ____ reputation for candour, the politician's memoir was strikingly evasive.' The clue is 'strikingly evasive' AND 'despite' (signals contrast). Predict: 'well-deserved' or 'established'. Match to choices → 'hard-won' fits. The trap is 'undeserved' which students pick because they read the contrast backwards.",
  },
  {
    id: "gre-verbal-sentence-equivalence-pair",
    title: "Sentence Equivalence: the answers come in pairs",
    exam: "GRE",
    skill: "VERBAL",
    difficulty: "INTERMEDIATE",
    tags: ["sentence-equivalence", "pairs"],
    description:
      "Sentence Equivalence requires TWO words that both complete the sentence AND produce the same meaning. The two correct answers are almost always synonyms. Strategy: predict the answer, then look for a pair of synonyms among the choices — usually only one pair fits. If you cannot find a synonym pair, your prediction is wrong. Beware words that seem synonymous but are not ('obstinate' vs 'stubborn' = pair; 'obstinate' vs 'intractable' = not exactly synonymous in context).",
    example:
      "Sentence: 'The committee's response was ____, avoiding any commitment.' Predict: 'evasive' or 'noncommittal'. Among the choices, look for the synonym pair — if 'equivocal' and 'noncommittal' are both present, that is the answer; 'ambiguous' is a near-miss trap because it carries an extra meaning of 'open to interpretation'.",
  },

  // ---------------- GMAT ----------------
  {
    id: "gmat-quant-data-sufficiency-template",
    title: "Data Sufficiency: AD vs BCE decision tree",
    exam: "GMAT",
    skill: "QUANT",
    difficulty: "ADVANCED",
    tags: ["data-sufficiency", "strategy"],
    description:
      "Data Sufficiency has a fixed decision tree that saves time. Evaluate Statement (1) alone first. If (1) is sufficient, the answer is A or D. Now evaluate (2) alone — if (2) is also sufficient alone, answer is D; if not, A. If (1) is NOT sufficient, the answer is B, C or E. Then evaluate (2) alone — sufficient → B; not sufficient → combine → C if combined works, else E. Memorise this tree: it removes the temptation to combine too early.",
    example:
      "Q: 'Is x positive?' (1) x squared = 9 → x = 3 or -3 → insufficient → answer in {B, C, E}. (2) x + 3 = 6 → x = 3 → sufficient → answer B. Without the tree, many candidates waste time combining (1) and (2).",
  },
  {
    id: "gmat-verbal-critical-reasoning",
    title: "Critical Reasoning: identify the conclusion first",
    exam: "GMAT",
    skill: "VERBAL",
    difficulty: "ADVANCED",
    tags: ["critical-reasoning", "argument"],
    description:
      "Before you read the question, identify the argument's conclusion — the main claim the author wants you to accept. Conclusions often follow indicator words: 'therefore', 'thus', 'so', 'hence', 'consequently', 'clearly'. Once you have the conclusion, find the single premise that supports it. Most CR question types (strengthen, weaken, assumption) target the link between premise and conclusion — your job is to evaluate whether that link holds. For 'assumption' questions, use the negation test: if negating an answer choice destroys the argument, that is the assumption.",
    example:
      "Argument: 'Our sales rose after the ad campaign; therefore the campaign worked.' Conclusion = 'the campaign worked'. Premise = 'sales rose after'. Hidden assumption = 'nothing else caused the sales rise'. To weaken: show a confound (e.g. 'a competitor raised prices the same week').",
  },

  // ---------------- SAT MATH ----------------
  {
    id: "sat-math-calculator-strategy",
    title: "SAT calculator strategy: only use it when it saves time",
    exam: "SAT",
    skill: "QUANT",
    difficulty: "BEGINNER",
    tags: ["calculator", "time-management"],
    description:
      "The digital SAT has an integrated Desmos graphing calculator available on EVERY math question, but using it blindly wastes time. Use the calculator for: (1) tedious arithmetic (large multiplications, square roots), (2) systems of equations (graph both lines, find intersection), (3) checking work after solving algebraically. Do NOT use it for: integer-arithmetic you can do in your head, simple linear equations, or questions designed to test reasoning. For 'which of the following is a solution' type, plug the choices in rather than solving the equation.",
    example:
      "Question: 'For what value of x does 2x + 5 = 17?' Head-only: x=6 (subtract 5, halve). Calculator would take 3 keystrokes and 5 seconds. Question: 'Find the intersection of y = 0.4x - 2.7 and y = -0.9x + 8.1' → calculator (graph both) is faster than solving by hand.",
  },
  {
    id: "sat-math-answer-elimination",
    title: "Eliminate clearly-wrong answers before solving",
    exam: "SAT",
    skill: "QUANT",
    difficulty: "INTERMEDIATE",
    tags: ["elimination", "strategy"],
    description:
      "On the SAT multiple-choice math section, scan the choices before solving. Eliminate any that violate basic constraints: if the question asks for a positive value, eliminate negatives; if it asks for a percentage between 0 and 100, eliminate outside that range; if it asks for an integer, eliminate fractions. This often removes 1-2 choices immediately. If you must guess, you improve your odds from 25% to 33% or 50%. For student-produced-response questions (grid-in), there are no choices to eliminate — solve carefully.",
    example:
      "Question: 'A rectangle has integer side lengths and perimeter 14. What is its area?' Choices: 6, 8, 10, 12, 49. Eliminate 49 (perimeter 14 → max side 6, so max area with sides 6,1 = 6, not 49). Then test pairs: (3,4) → perimeter 14, area 12 → answer D.",
  },
  {
    id: "sat-math-backsolve",
    title: "Backsolve on the SAT: start with choice C",
    exam: "SAT",
    skill: "QUANT",
    difficulty: "INTERMEDIATE",
    tags: ["backsolve", "strategy"],
    description:
      "SAT math choices are listed in ascending order. Plug choice C into the question's condition. If C is too small, the answer is D or E; if too big, A or B. This usually finds the answer in two attempts. Backsolving is especially powerful for word problems involving percent change or quadratic relationships where solving the equation is slow. For 'least possible value' or 'greatest possible value' questions, backsolving is NOT efficient — solve directly.",
    example:
      "Q: 'If 3x + 7 = 22, what is x?' Choices: 3, 4, 5, 6, 7. Test C=5: 3(5)+7=22 correct → answer C. One attempt. Algebra would have been equally fast here, but for 'x is N% of 240' type questions, backsolving often wins.",
  },

  // ---------------- ACT ----------------
  {
    id: "act-english-concision",
    title: "ACT English: when in doubt, choose the shortest",
    exam: "ACT",
    skill: "VERBAL",
    difficulty: "BEGINNER",
    tags: ["concision", "rhetoric"],
    description:
      "ACT English rewards concise writing. When a question asks about style and the choices include a short and a long version, the shortest grammatical option is correct about 70% of the time. Eliminate wordy options, redundant phrases ('past history', 'future plans'), and passive constructions. The exception: if the short option is grammatically wrong or loses meaning, choose the next shortest. NEVER add information that is not in the original sentence.",
    example:
      "Choices for 'Due to the fact that it was raining…': (A) Due to the fact that it was raining (B) Because it was raining (C) On account of the fact that it was raining (D) Being that it was raining. Answer B — shortest and grammatical.",
  },
  {
    id: "act-reading-line-reference",
    title: "ACT Reading: line-reference questions are scoped",
    exam: "ACT",
    skill: "READING",
    difficulty: "BEGINNER",
    tags: ["line-reference", "scope"],
    description:
      "When an ACT Reading question gives a line reference (e.g. 'lines 23-27'), the answer is in those lines or the sentence immediately before/after — not elsewhere in the passage. Read the cited lines twice, predict the answer, then check choices. Do NOT re-read the whole passage. For general/main-idea questions, the answer comes from the first and last paragraphs. ACT reading is fast (35 minutes, 40 questions) — pace at 8 minutes 45 seconds per passage including questions.",
    example:
      "Question: 'In lines 23-27, the author suggests the character feels…' Read lines 22-28 closely. The answer is a direct paraphrase of those lines; distractors come from similar vocabulary elsewhere in the passage.",
  },

  // ---------------- DET ----------------
  {
    id: "det-speaking-cloze",
    title: "DET 'Read then Write': structure over length",
    exam: "DET",
    skill: "WRITING",
    difficulty: "BEGINNER",
    tags: ["det", "writing"],
    description:
      "Duolingo's 'Read then Write' task gives 5 minutes to write 50+ words. The DET scoring AI weights grammar and vocabulary more heavily than length. Aim for 60-90 words in a clear 3-sentence structure: sentence 1 — direct answer to the prompt; sentence 2 — a reason or example; sentence 3 — a brief elaboration or qualification. Do not write 200 words — errors accumulate and grammar score drops. Always proofread your last sentence for tense agreement.",
    example:
      "Prompt: 'Describe a hobby you enjoy.' 'I enjoy cooking on weekends because it lets me experiment with flavours from my childhood. Last week I tried my grandmother's biryani recipe, which taught me the importance of layering spices. Although it took three hours, the result was worth the effort.' (49 words, 3 sentences, past + present + concessive — strong grammar range.)",
  },
  {
    id: "det-speaking-c-test",
    title: "DET 'Listen then Speak': take the full 30 seconds",
    exam: "DET",
    skill: "SPEAKING",
    difficulty: "INTERMEDIATE",
    tags: ["det", "speaking"],
    description:
      "For 'Listen then Speak' you hear a question twice and get 30-90 seconds to respond. Use the FULL allotted time — short answers lower the fluency score. Structure: 5s — restate the question (buys thinking time); 15s — your direct answer with a reason; 10s — a concrete example; 5-10s — a brief qualification or summary. If you finish early, do not stop — add 'Overall, I would say that…' and extend. The AI rewards continuous speech; silence or long pauses are penalised heavily.",
    example:
      "Q: 'Is it better to live in a city or the countryside?' Restate + answer (5s): 'Whether city or countryside living is preferable depends largely on one's life stage.' Reason (15s): 'Cities offer career density for young professionals.' Example (10s): 'When I moved to London at 23, the proximity to employers accelerated my career.' Qualify (5-10s): 'However, families often prefer the countryside for space and schools.'",
  },

  // ---------------- OET ----------------
  {
    id: "oet-writing-letter-structure",
    title: "OET letter: paragraph by clinical chronology",
    exam: "OET",
    skill: "WRITING",
    difficulty: "INTERMEDIATE",
    tags: ["letter", "structure"],
    description:
      "OET writing tasks require a referral, discharge or transfer letter. Use strict clinical-chronology paragraphing: Para 1 — patient identity + presenting complaint + reason for letter. Para 2 — relevant history + onset. Para 3 — examination + investigation findings. Para 4 — treatment given + current status. Para 5 — request to the recipient (specific action with timeframe). 180-200 words is the target; under 180 loses marks, over 220 loses marks. Never include irrelevant clinical detail — selection is part of the assessment.",
    example:
      "Para 5 example: 'I would be grateful if you could review Mr Khan's wound at your next clinic and consider debridement if infection persists. He is currently on oral amoxicillin 500 mg three times daily, which we will continue until your review.'",
  },
  {
    id: "oet-speaking-roleplay",
    title: "OET speaking role-play: acknowledge before advising",
    exam: "OET",
    skill: "SPEAKING",
    difficulty: "INTERMEDIATE",
    tags: ["role-play", "empathy"],
    description:
      "OET speaking role-plays assess communication, not clinical knowledge. The cardinal rule: ACKNOWLEDGE the patient's concern before giving information or advice. Pattern: 'I can see this is worrying you' → 'Let me explain what we know' → 'Here is what I would suggest'. Avoid medical jargon with patients — 'hypertension' becomes 'high blood pressure'. Use open questions ('How have you been feeling?') then focused questions. Check understanding at the end: 'Does that make sense so far?'.",
    example:
      "Card: patient anxious about a biopsy result. Wrong: 'Your result was negative, you are fine.' Right: 'I can hear you have been quite anxious about this result. The biopsy came back showing no signs of cancer, which is reassuring. I would suggest we keep monitoring the area every six months. Does that put your mind at ease?'",
  },

  // ---------------- CAMBRIDGE ----------------
  {
    id: "cambridge-open-cloze-collocation",
    title: "Cambridge Open Cloze: collocations are the answer",
    exam: "CAMBRIDGE",
    skill: "READING",
    difficulty: "ADVANCED",
    tags: ["open-cloze", "collocations"],
    description:
      "B2 First (and C1 Advanced) Open Cloze tests collocation, phrasal verbs, and grammar particles. The answer is almost always a function word: preposition, auxiliary, relative pronoun, linker, or fixed-expression particle. Predict the part of speech from the surrounding clause. Common answers: 'as', 'such', 'despite', 'in order', 'whether', 'whose', 'been', 'have'. If your predicted word is a content word (noun, verb), reconsider — the answer is rarely a content word.",
    example:
      "Sentence: 'She has always been interested ____ marine biology.' The answer is the preposition 'in' — a fixed collocation. If you predict 'about' or 'with', they are wrong because 'interested in' is the only correct collocation.",
  },
];

/** Filter shortcuts by exam and/or skill. All optional. */
export function filterShortcuts(opts: {
  exam?: ExamCode | "ALL";
  skill?: SkillCode | "ALL";
  difficulty?: Difficulty | "ALL";
  query?: string;
}): Shortcut[] {
  const q = (opts.query ?? "").trim().toLowerCase();
  return SHORTCUTS.filter((s) => {
    if (opts.exam && opts.exam !== "ALL" && s.exam !== opts.exam) return false;
    if (opts.skill && opts.skill !== "ALL" && s.skill !== opts.skill) return false;
    if (opts.difficulty && opts.difficulty !== "ALL" && s.difficulty !== opts.difficulty)
      return false;
    if (q) {
      const hay = `${s.title} ${s.description} ${s.example} ${s.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export const ALL_EXAMS: ExamCode[] = [
  "IELTS",
  "TOEFL",
  "PTE",
  "GRE",
  "GMAT",
  "SAT",
  "ACT",
  "DET",
  "OET",
  "CAMBRIDGE",
];

export const ALL_SKILLS: SkillCode[] = [
  "READING",
  "WRITING",
  "SPEAKING",
  "LISTENING",
  "QUANT",
  "VERBAL",
];

export const ALL_DIFFICULTIES: Difficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
