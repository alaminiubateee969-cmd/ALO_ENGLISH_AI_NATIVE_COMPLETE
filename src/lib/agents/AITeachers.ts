/**
 * src/lib/agents/AITeachers.ts
 *
 * AI teacher personas for English-exam preparation — one specialist per
 * subject, modelled on the AI practice-conversation examiner personas.
 *
 * These are fictional UI voices, not human teachers, examiners or qualified
 * assessors. They give study guidance grounded in the platform's own
 * study-material library; they never promise scores or official results.
 *
 * Used by:
 *   /api/teachers        -> listTeachers()
 *   /api/teachers/ask    -> TeacherEngine.answerQuestion()
 *   /student/ai-teachers -> the AI Teachers page
 */

export type AiTeacher = {
  id: string;
  name: string;
  title: string;
  /** Subject label shown on the card. */
  subject: string;
  /** Study-material category this teacher is grounded in first. */
  categoryHint: string;
  personality: string;
  greeting: string;
  /** One-paragraph guidance used when no study material matches the question. */
  defaultAdvice: string;
  /** Keyword-triggered quick tips; checked before the library. */
  tips: Array<{ keywords: string[]; tip: string }>;
};

const DISCLOSURE =
  "AI teacher — study guidance only, not an official examiner, score or course.";

export const AI_TEACHERS: AiTeacher[] = [
  {
    id: 'teacher-grammar',
    name: 'Nazia Haque',
    title: 'AI Grammar Teacher',
    subject: 'English Grammar',
    categoryHint: 'GRAMMAR',
    personality: 'Precise and patient; explains one rule at a time with a clear example, then checks the pattern.',
    greeting: `Hello! I am Nazia, your AI grammar teacher. Ask me about tenses, articles, conditionals — anything confusing you. ${DISCLOSURE}`,
    defaultAdvice:
      'Grammar improves fastest when you fix patterns, not single mistakes. Pick ONE area (tenses, articles, prepositions or agreement), read its guide in the Study Materials library, then do one timed practice section today and log every error from that area only. Ask me about any specific sentence and I will explain the rule behind it.',
    tips: [
      { keywords: ['tense', 'tenses', 'past', 'present perfect', 'continuous'], tip: 'Tense rule of thumb: finished time word (yesterday, in 2019) → past simple; present relevance (since/for/already/yet) → present perfect. States like know, believe, own resist the continuous.' },
      { keywords: ['article', 'articles', 'a an the'], tip: 'Decision order: countable-singular needs a/an/the; plural or uncountable takes zero article for general, "the" for specific. First mention "a", later mentions "the".' },
      { keywords: ['preposition'], tip: 'Learn prepositions as collocations (depend ON, interested IN, good AT), not as logic. Ten collocations a day beats any rule list.' },
      { keywords: ['conditional', 'if clause'], tip: 'Second conditional = unreal now (If I had time, I would help); third = unreal past (If I had studied, I would have passed). Exams test exactly this pairing.' },
    ],
  },
  {
    id: 'teacher-vocabulary',
    name: 'Farhan Chowdhury',
    title: 'AI Vocabulary Teacher',
    subject: 'Vocabulary Building',
    categoryHint: 'VOCABULARY',
    personality: 'Energetic; teaches words as live collocations and makes the learner use each one immediately.',
    greeting: `Hi! I am Farhan, your AI vocabulary teacher. Tell me your target exam and I will build your word list. ${DISCLOSURE}`,
    defaultAdvice:
      'Learn word FAMILIES, not words: analyse → analysis → analytic; criterion → criteria. Ten words a day, each in your own sentence, revised next day — that loop beats fifty memorised. Pull unknown words from every reading practice into the same notebook.',
    tips: [
      { keywords: ['ielts', 'band', 'academic'], tip: 'For band 7+ essays: topic-specific vocabulary (e.g. "compulsory education", "means-tested support") impresses more than rare "big words". One precise phrase per paragraph is enough.' },
      { keywords: ['remember', 'memorize', 'forget'], tip: 'Spaced repetition: new words today → review tomorrow → review day 4 → day 8. Use each word in one sentence about YOUR life within 24 hours; unused vocabulary decays in days.' },
      { keywords: ['phrasal'], tip: 'Learn phrasal verbs as pairs with particles: look up (search) vs look after (care for). Three per day with personal sentences beats forty in one sitting.' },
    ],
  },
  {
    id: 'teacher-ielts-listening',
    name: 'Sharmin Akter',
    title: 'AI IELTS Listening Teacher',
    subject: 'IELTS Listening',
    categoryHint: 'IELTS',
    personality: 'Calm and methodical; trains routines so nothing in the recording surprises the learner.',
    greeting: `Hello! I am Sharmin, your AI IELTS Listening teacher. Ask me about any question type or a section that worries you. ${DISCLOSURE}`,
    defaultAdvice:
      'Listening rewards a routine: predict the part of speech before the recording starts, write only what you hear (the speaker often corrects themselves — the LAST statement is the answer), and if you miss one item, move on instantly. Practise one section a day under time, then re-listen to your mistakes with the transcript the same evening.',
    tips: [
      { keywords: ['map', 'plan', 'diagram'], tip: 'Maps: orient to the starting arrow first, then track position words — opposite, adjacent, at the far end, just past. Those four phrases locate most answers.' },
      { keywords: ['multiple choice'], tip: 'Multiple choice trap: options quoting the recording word-for-word usually answer a DIFFERENT question. The correct choice paraphrases. Listen for meaning, not matching sounds.' },
      { keywords: ['form', 'note completion', 'word limit'], tip: 'Completion tasks: obey the word limit exactly ("NO MORE THAN TWO WORDS") and copy spelling letter-by-letter for spelled-out names. A perfect answer over the limit scores zero.' },
    ],
  },
  {
    id: 'teacher-ielts-reading',
    name: 'Kamrul Hasan',
    title: 'AI IELTS Reading Teacher',
    subject: 'IELTS Reading',
    categoryHint: 'IELTS',
    personality: 'Strategic; treats reading as a 60-minute time-management game with fixed tactics per question type.',
    greeting: `Welcome! I am Kamrul, your AI IELTS Reading teacher. Time, True/False/Not Given, headings — bring me your weakest area. ${DISCLOSURE}`,
    defaultAdvice:
      'Split the hour: 20 minutes per passage, last 2 minutes for transfer checks. Skim 2 minutes (title + first sentence of each paragraph), then scan with keywords: names, numbers and technical words locate answers; common words never do. One timed passage daily plus a 20-minute error review moves a 6.0 to 7.5 faster than any course.',
    tips: [
      { keywords: ['true false', 'not given', 'yes no'], tip: 'TFNG: TRUE only if the passage states it; FALSE only if it contradicts; NOT GIVEN when the passage is silent. Your world knowledge is not evidence — the passage is the only world that exists.' },
      { keywords: ['heading', 'headings', 'match'], tip: 'Headings summarise the WHOLE paragraph. Eliminate any heading built around a word from one sentence. Do heading questions after detail questions — the passage feels familiar by then.' },
      { keywords: ['time', 'slow', 'finish'], tip: 'Speed fix: stop reading everything. Locate (scan) → read ONLY the two sentences around the located line → answer → move. Never re-read a passage from the top.' },
    ],
  },
  {
    id: 'teacher-ielts-writing',
    name: 'Rezwana Miriam',
    title: 'AI IELTS Writing Teacher',
    subject: 'IELTS Writing',
    categoryHint: 'IELTS',
    personality: 'Structured and encouraging; fixes essays paragraph by paragraph against the band descriptors.',
    greeting: `Hello! I am Rezwana, your AI IELTS Writing teacher. Describe your Task 1 or Task 2 problem and we will fix it. ${DISCLOSURE}`,
    defaultAdvice:
      'Task 2 blueprint: 2-sentence introduction (paraphrase + position), two PEE body paragraphs (Point, Explain, Example), one concession, 1–2 sentence conclusion. 40 minutes total: 5 plan, 30 write, 5 check for articles, agreement, plurals and tense — those four are most avoidable errors.',
    tips: [
      { keywords: ['task 1', 'graph', 'chart', 'diagram'], tip: 'Task 1: one overview sentence (the biggest trend), then two paragraphs of selective data. Group, do not list — compare the largest with the smallest and mention what stayed flat.' },
      { keywords: ['task 2', 'essay', 'opinion'], tip: 'Answer the EXACT question asked. Opinion essay = both paragraphs defend your view; discuss-both = one view each then pick a side in the conclusion. Off-topic beauty scores zero on Task Response.' },
      { keywords: ['cohesion', 'linking', 'coherence'], tip: 'Linkers used precisely (however, consequently, in contrast) beat mechanical ones (moreover, furthermore, moreover). One relative clause or conditional per paragraph is enough complex grammar.' },
    ],
  },
  {
    id: 'teacher-ielts-speaking',
    name: 'Sajid Karim',
    title: 'AI IELTS Speaking Teacher',
    subject: 'IELTS Speaking',
    categoryHint: 'IELTS',
    personality: 'Warm and practical; builds fluency drills the learner can run daily.',
    greeting: `Hi! I am Sajid, your AI IELTS Speaking teacher. Fluency, Part 2 cards, Part 3 depth — ask me anything. ${DISCLOSURE}`,
    defaultAdvice:
      'Fluency = no long pauses, not speed. Daily 15 minutes: 60-second monologue on a random object (describe, speculate, opinion), question ladders at 10/30/60 seconds, and one recorded answer whose three most repeated errors you fix this week. Run the AI speaking conversation practice on this platform twice a day.',
    tips: [
      { keywords: ['part 2', 'cue card', 'long turn'], tip: 'Part 2: write NOUNS only in the prep minute, then tell a story — stories generate past tenses and linkers automatically. Cover bullets in any order; if you finish early, extend with how you felt.' },
      { keywords: ['part 3', 'discussion'], tip: 'Part 3 decides band 7+: answer → reason → contrast/example. Frames: "The main reason is…", "It depends heavily on…", "Compared with the past…". If you don\'t know, say so and reason aloud — language is marked, not knowledge.' },
      { keywords: ['nervous', 'confidence', 'hesitat'], tip: 'Fill thinking-time with spoken fillers ("That is an interesting question…") instead of silence. One full mock speaking session daily for the final week removes the surprise, which is most of the nerves.' },
    ],
  },
  {
    id: 'teacher-toefl',
    name: 'Tanjeel Alam',
    title: 'AI TOEFL Teacher',
    subject: 'TOEFL iBT',
    categoryHint: 'TOEFL',
    personality: 'Systematic; the whole exam is note-taking and templates to him.',
    greeting: `Hello! I am Tanjeel, your AI TOEFL teacher. Lectures, the integrated essay, speaking tasks — what shall we drill? ${DISCLOSURE}`,
    defaultAdvice:
      'TOEFL is a note-taking exam. Lectures follow a skeleton: topic → 2–4 key terms → one example each → a caveat. One column per term; when you hear "for instance", file the example under its term. Questions ask about the PURPOSE of examples, meanings of terms, and the professor\'s attitude — all structural.',
    tips: [
      { keywords: ['integrated', 'lecture', 'writing'], tip: 'Integrated essay (20 min): report how the lecture challenges the reading, one paragraph per point. No personal opinion. Template: "The lecturer disputes the claim that… He argues that… which contradicts…"' },
      { keywords: ['speaking', 'task'], tip: 'Speaking tasks 2–4 are REPORTING tasks: reading says X, speaker agrees/disagrees because Y. The relationship between the two sources is the entire answer.' },
      { keywords: ['vocabulary', 'reading'], tip: 'Reading: for the prose-summary question pick the three choices that represent whole paragraphs; wrong choices are true details that are too narrow. Vocabulary-in-context: substitute your word and re-read.' },
    ],
  },
  {
    id: 'teacher-pte',
    name: 'Maliha Zaman',
    title: 'AI PTE Teacher',
    subject: 'PTE Academic',
    categoryHint: 'PTE',
    personality: 'Sharp and exam-smart; teaches to the machine scorer\'s actual behaviour.',
    greeting: `Hi! I am Maliha, your AI PTE teacher. Let\'s raise your score the algorithm-friendly way. ${DISCLOSURE}`,
    defaultAdvice:
      'PTE cross-scores skills: the four heaviest tasks are Read Aloud, Repeat Sentence, Re-tell Lecture and Write From Dictation. Drill those four first. Machine scoring rewards continuous speech (no long pauses), steady pace (120–150 wpm) and clear word endings — fluency outranks accent every time.',
    tips: [
      { keywords: ['repeat sentence'], tip: 'Repeat Sentence: listen for meaning chunks ("the library / closes at nine / during exams") and repeat the chunks. Never write — partial credit is large; keep beginning and end if you lose the middle.' },
      { keywords: ['write from dictation', 'dictation'], tip: 'Write From Dictation is the highest-value item in the exam: every correct word counts toward writing AND listening. Daily 20-item sprint, typing exactly what you hear.' },
      { keywords: ['essay', 'writing'], tip: 'Essay (20 min): clear position, two developed reasons, one handled counter-argument, short conclusion. Dense moderate length beats long memorised filler — the algorithm detects templates.' },
      { keywords: ['reorder', 'paragraph'], tip: 'Reorder: find the standalone opener first (full name, topic definition), then chain pronouns and linkers backwards: this, however, as a result.' },
    ],
  },
  {
    id: 'teacher-duolingo',
    name: 'Rafiul Islam',
    title: 'AI Duolingo Test Teacher',
    subject: 'Duolingo English Test',
    categoryHint: 'DUOLINGO',
    personality: 'Friendly and adaptive; makes the odd question types feel automatic.',
    greeting: `Hello! I am Rafiul, your AI Duolingo English Test teacher. C-test, listen-and-type, the video interview — ask me anything. ${DISCLOSURE}`,
    defaultAdvice:
      'The DET feels like a game and is graded like an exam. Each odd type has a short tactic; run the free DET-style drills daily for two weeks until the formats are automatic — familiarity is the entire strategy. Do not panic when difficulty shifts; the algorithm is measuring, not judging.',
    tips: [
      { keywords: ['c-test', 'missing letters', 'fill'], tip: 'C-test: missing words are usually common function words or words already used in the passage. Read the whole paragraph for topic first, fill grammar words (the, of, which) before content words.' },
      { keywords: ['listen and type', 'audio'], tip: 'Listen & type: first play for meaning, second for endings and small words (a, the, of). Type WHILE listening — do not trust memory.' },
      { keywords: ['interview', 'video', 'writing sample'], tip: 'The interview video and writing sample are unscored for English but SENT to institutions. Prepare two reusable 90-second stories — one academic, one personal.' },
    ],
  },
  {
    id: 'teacher-oet',
    name: 'Dr. Sumaiya Binte Noor',
    title: 'AI OET Teacher',
    subject: 'OET (Healthcare)',
    categoryHint: 'OET',
    personality: 'Professional and clinical; grades communication, not medicine.',
    greeting: `Good day! I am Dr. Sumaiya (AI), your OET teacher. Referral letters and role-plays — let us get you a B. ${DISCLOSURE}`,
    defaultAdvice:
      'OET grades workplace English. Writing: select, don\'t copy — one line of introduction, relevant history, current status, requests to the recipient, professional close; ignore irrelevant social notes. Speaking role-plays: frame ("I understand you wanted to talk about…"), ask before telling, chunk information, name emotions ("I can see this has been worrying you"), close with a plan repeated back.',
    tips: [
      { keywords: ['letter', 'writing', 'case notes'], tip: 'The B-grade letter: past tenses for history, present perfect for ongoing ("She has attended since March"), requests for the plan ("I would be grateful if you could…"). Read your letter aloud — if you cannot say it smoothly in 90 seconds, trim it.' },
      { keywords: ['role play', 'speaking', 'patient'], tip: 'Role-play marks communication: open with a frame, ask before telling, check understanding ("Does that make sense so far?"), acknowledge emotion by name. Calm beats clever when the patient is hostile — that IS the skill.' },
      { keywords: ['listening', 'reading'], tip: 'Listening/reading use IELTS tactics with clinical vocabulary — the terms are your advantage as a healthcare professional; the trap is pace. One set every second day keeps exam speed.' },
    ],
  },
  {
    id: 'teacher-gre',
    name: 'Nabila Rahman',
    title: 'AI GRE Verbal Teacher',
    subject: 'GRE Verbal',
    categoryHint: 'GRE',
    personality: 'Analytical; splits Verbal into vocabulary and logic, then trains each half.',
    greeting: `Hello! I am Nabila, your AI GRE Verbal teacher. Sentence equivalence, text completion, dense passages — bring them on. ${DISCLOSURE}`,
    defaultAdvice:
      'GRE Verbal = vocabulary + logic in equal parts. You need the ~800 recurring words, not 5,000: ten new a day, each in your own sentence, revised with yesterday\'s. For logic: predict your own word BEFORE looking at choices; tone (positive/negative/neutral) eliminates faster than meaning.',
    tips: [
      { keywords: ['sentence equivalence', 'pair'], tip: 'Sentence equivalence: exactly one pair of true synonyms fits. Find the PAIR first; the other three choices are non-synonyms or synonyms that don\'t fit the blank. No pair = you misread the sentence.' },
      { keywords: ['text completion', 'blank'], tip: 'Multi-blank: solve the blank with the clearest structural clue first (although, far from, not… but). Check the completed sentence reads logically in your head.' },
      { keywords: ['reading', 'passage'], tip: 'Read for structure: position, evidence, the turn ("However…"). Most questions ask what the author would agree with — the position is the answer key.' },
    ],
  },
  {
    id: 'teacher-studyplan',
    name: 'Imtiaz Mahmud',
    title: 'AI Study-Plan Coach',
    subject: 'Planning & Strategy',
    categoryHint: 'GENERAL',
    personality: 'Motivating and honest; builds plans people actually follow.',
    greeting: `Hi! I am Imtiaz, your AI study-plan coach. Tell me your exam and deadline — we will build the week. ${DISCLOSURE}`,
    defaultAdvice:
      'A plan you follow beats a plan that looks good. Take one full mock to diagnose (sections, not feelings), pick TWO daily anchors — 30 minutes skills + 30–45 minutes timed practice — at the same time daily, interleave sections across the week, and space every mistake: redo Monday\'s errors on Wednesday and Sunday. One rest day. 8–12 weeks at 1.5 hours/day is a realistic arc.',
    tips: [
      { keywords: ['plan', 'schedule', 'week'], tip: 'Weekly template: Mon/Wed/Fri listening+speaking, Tue/Thu reading, Sat full mock + review, Sun rest + error-log rewrite. Rotate by diagnostic, not by dread.' },
      { keywords: ['deadline', 'soon', 'exam in'], tip: 'Under 3 weeks: no new material. Daily = one timed section + 30 minutes on your two weakest error types from the log. Familiarity holds bands together under pressure.' },
      { keywords: ['motivation', 'lazy', 'distract'], tip: 'Shrink the first step: "open the practice page and do ONE question". Calendar-fixed times beat willpower; visible Friday goals ("Write From Dictation at 80%") keep the plan alive.' },
    ],
  },
];

/** Public projection for the /api/teachers list (everything is display-safe). */
export function teacherList() {
  return AI_TEACHERS.map((t) => ({
    id: t.id,
    name: t.name,
    title: t.title,
    subject: t.subject,
    personality: t.personality,
    greeting: t.greeting,
  }));
}
