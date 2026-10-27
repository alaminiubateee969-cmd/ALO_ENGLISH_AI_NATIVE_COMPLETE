#!/usr/bin/env node
/**
 * prisma/seed.mjs — Node-compatible seed entry point.
 *
 * Creates the admin user, exam types, and core settings. Idempotent.
 * ADMIN_SEED_PASSWORD must be supplied through a secret manager and is never logged.
 * Run with: DATABASE_URL=file:./db/production.db ADMIN_SEED_PASSWORD=... node prisma/seed.mjs
 */
import { PrismaClient } from '@prisma/client';
// bcryptjs is CommonJS and does not expose its functions as detectable ESM
// named exports, so `import { hashSync }` throws under plain Node. Take the
// default export and destructure it.
import bcrypt from 'bcryptjs';

const { hashSync } = bcrypt;

const prisma = new PrismaClient();

const EXAM_TYPES = [
  { code: 'IELTS-A', name: 'IELTS Academic', category: 'English Proficiency' },
  { code: 'IELTS-G', name: 'IELTS General Training', category: 'English Proficiency' },
  { code: 'IELTS-UKVI', name: 'IELTS UKVI', category: 'English Proficiency' },
  { code: 'PTE-A', name: 'PTE Academic', category: 'English Proficiency' },
  { code: 'TOEFL-iBT', name: 'TOEFL iBT', category: 'English Proficiency' },
  { code: 'DUOLINGO', name: 'Duolingo English Test', category: 'English Proficiency' },
  { code: 'OET', name: 'OET (Healthcare)', category: 'Professional' },
  { code: 'LANGUAGECERT', name: 'LanguageCert', category: 'English Proficiency' },
  { code: 'LINGUASKILL', name: 'Cambridge Linguaskill', category: 'English Proficiency' },
  { code: 'OIETC', name: 'OIETC — product identity pending verification', category: 'English Proficiency' },
  { code: 'TOEIC', name: 'TOEIC', category: 'English Proficiency' },
  { code: 'CAMBRIDGE', name: 'Cambridge English', category: 'English Proficiency' },
  { code: 'SAT', name: 'Digital SAT', category: 'Academic' },
  { code: 'ACT', name: 'ACT', category: 'Academic' },
  { code: 'GRE', name: 'GRE General Test', category: 'Academic' },
  { code: 'GMAT', name: 'GMAT Exam', category: 'Academic' },
  { code: 'LSAT', name: 'LSAT', category: 'Academic' },
  { code: 'MCAT', name: 'MCAT', category: 'Academic' },
  { code: 'VISA-INTERVIEW', name: 'Visa Interview Practice', category: 'Visa & Interview' },
  { code: 'ALO-PLACEMENT', name: 'ALO English Placement Test', category: 'ALO Internal' },
];

async function main() {
  console.log('Seeding database...');

  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@aloeducation.com';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error('Set ADMIN_SEED_PASSWORD (at least 12 characters) through the secret manager before seeding.');
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Platform Administrator',
      passwordHash: hashSync(adminPassword, 12),
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });


  for (const et of EXAM_TYPES) {
    await prisma.examType.upsert({
      where: { code: et.code },
      update: { name: et.name, category: et.category },
      create: { ...et, isActive: true },
    });
  }
  console.log(`  ${EXAM_TYPES.length} exam types seeded`);

  const settings = [
    { key: 'platform_name', value: 'ALO English Test Platform' },
    { key: 'practice_only', value: 'true' },
    { key: 'no_human_exam_mode', value: 'enabled' },
    { key: 'evaluation_provider', value: 'local_rule_engine' },
    { key: 'free_quota_alo', value: 'unlimited' },
    { key: 'free_quota_public', value: 'unlimited' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }
  console.log(`  ${settings.length} settings seeded`);


  // ── Study-material library ────────────────────────────────────────────────
  // Original ALO-authored guides for every exam plus core skills. Idempotent:
  // an existing row with the same title+category is left untouched so admin
  // edits and uploads are never clobbered by a re-seed.
  const STUDY_MATERIALS = [
    {
      title: 'IELTS Listening: the 10-step method',
      category: 'IELTS',
      description: 'How to approach every IELTS Listening question type without losing marks to transfer errors.',
      content: `IELTS Listening rewards a routine, not talent. Use the same ten steps on every practice test and the real exam.

Before the recording starts: read the questions ahead of the section, underline the word-limit for note-completion tasks, and predict the part of speech each gap needs — a number, a name, a noun. While listening: write only what you hear, never what "should" be there; if you miss an answer, leave it and move immediately to the next question, because one lost item is recoverable and two lost items are a spiral. Watch for the trap pattern: the speaker often corrects themselves ("the ticket is ten pounds — actually, twelve with the guide"), and the last statement is usually the answer.

Question types have fixed tactics. For multiple choice, eliminate options that use words straight from the recording but answer a different question — paraphrase is the rule, repetition is the trap. For maps and plans, orient yourself to the starting arrow and track position words: opposite, adjacent, at the far end, just past. For form completion, mind spelling rules — everything you hear spelled letter by letter must be copied exactly.

In the final ten minutes (paper-based) or as you go (computer-based), check that every answer obeys the word limit and that numbers are written as the task expects. Transfer answers you are sure of first. Never leave a blank: there is no penalty for a wrong guess.

Practise with the free full-length mocks on this platform, one section a day under timed conditions, and re-listen to your mistakes with the transcript the same evening. That review loop — not more hours of listening — is what moves a 6.0 to a 7.5.`,
    },
    {
      title: 'IELTS Reading: skimming, scanning and time control',
      category: 'IELTS',
      description: 'A 60-minute plan for all three passages, including True/False/Not Given and heading-match strategy.',
      content: `You have 60 minutes and 40 questions. The single biggest cause of a low band is time, not vocabulary.

Split the hour: 20 minutes for passage one, 20 for passage two, 20 for passage three, and defend the last two minutes for transferring checks. Within each passage, work the questions in a smart order: do the detail questions (gap-fill, true/false/not-given, multiple choice) first — they force you to read most of the text anyway — then do the paragraph-heading or matching questions, which are easier once you know the passage.

Skim first for two minutes: read the title, the first sentence of every paragraph, and nothing else. You now have a map. Then scan for keywords from each question: names, numbers, and technical words locate answers fast; common words like "important" do not, because the test paraphrases them.

True/False/Not Given is the classic band-limiter. The statement is TRUE only if the passage explicitly says so; FALSE only if it explicitly contradicts it; NOT GIVEN when the passage is silent or speculative. Do not use your knowledge of the world — the passage is the only evidence that exists.

Matching headings: the heading must summarise the whole paragraph, not one sentence. Eliminate headings that contain a word lifted from a single sentence. Gap-fill: copy the exact words from the passage and respect the word limit; a two-word answer written as three scores zero.

Every day, do one timed passage from the free mocks on this platform and spend twenty minutes reviewing: for each mistake, write down whether it was a locate failure, a paraphrase failure, or a time failure. That one-line diagnosis tells you what to drill next.`,
    },
    {
      title: 'IELTS Writing Task 2: the four-paragraph blueprint',
      category: 'IELTS',
      description: 'A repeatable structure that satisfies Task Response, Coherence, Lexical Resource and Grammar criteria.',
      content: `Task 2 is worth twice Task 1, so write it first and give it 40 minutes: 5 planning, 30 writing, 5 checking.

The blueprint that fits almost every question type: Introduction (2 sentences), Body 1 (5–6 sentences), Body 2 (5–6 sentences), Conclusion (1–2 sentences). Total 250–290 words.

Introduction: sentence one paraphrases the question (never copy it word for word); sentence two states your position in one clear line. An examiner decides your Task Response band largely from this position and whether every paragraph defends it.

Body paragraphs follow the PEE pattern — Point, Explain, Example. State the point in one sentence. Explain the mechanism in two or three sentences (this is where most candidates write too little and lose marks). Then give an example; it does not need to be real research, a concrete "for instance" is enough.

For opinion questions, both body paragraphs defend your view. For discuss-both-views, Body 1 gives the first view with its logic, Body 2 the second, and the conclusion picks a side. For problems-and-solutions, Body 1 is the problem with causes, Body 2 the solutions.

Language the criteria reward: linkers used precisely (however, consequently, in contrast) rather than mechanically; topic-specific vocabulary instead of memorised "big words"; a mix of simple and complex sentences — one relative clause or conditional per paragraph, not every sentence. The criteria punish long memorised templates: learn sentence functions, not sentences.

Checking protocol in the last five minutes: article errors (a/an/the), subject–verb agreement, plural-s, and tense consistency. These four categories are most of the avoidable errors.

Write two essays a week from this platform's free question bank and compare your work against the band descriptors; the free writing-feedback tool on every mock gives you exactly that loop.`,
    },
    {
      title: 'IELTS Speaking: sound fluent at any band',
      category: 'IELTS',
      description: 'What examiners actually reward in Parts 1, 2 and 3 — and a practice routine that builds real fluency.',
      content: `Speaking is marked on four equal criteria: fluency and coherence, lexical resource, grammatical range and accuracy, and pronunciation. Notice what is missing: accent, speed, and perfect grammar.

Part 1 (4–5 minutes): answer in 2–4 sentences. Never one word, never a speech. Formula: direct answer, one reason or example. "Do you like coffee?" — "Yes, I drink two cups a day, mostly while studying — it is the only habit I refuse to give up."

Part 2 (the long turn): use the one minute of preparation to write only notes — nouns, not sentences. Tell a story with a beginning, middle and end; stories generate past tenses and linkers automatically. If you finish before two minutes, keep going: extend with how you felt or what you learned. Cover the bullet points in any order.

Part 3 (discussion): this is where band 7+ is decided. Extend every answer with a reason, a contrast, or an example. Useful sentence frames: "The main reason is...", "It depends heavily on...", "Compared with the past, ...". If you do not know the topic, say so and reason aloud — examiners mark language, not knowledge.

Fluency practice routine: 15 minutes daily with the free AI speaking practice on this platform, which runs a realistic examiner conversation 24/7. Record yourself once a week answering one Part 2 card; listen for your three most repeated errors; fix those three only. Fluency is the absence of long pauses, so practise filling thinking-time with spoken fillers ("That is an interesting question...") instead of silence.

One week before the test, do a full mock speaking session every day. Familiarity, not new vocabulary, is what holds bands together under pressure.`,
    },
    {
      title: 'TOEFL iBT: note-taking that actually works',
      category: 'TOEFL',
      description: 'The listening-notes system for lectures and conversations, plus templates for the speaking and writing tasks.',
      content: `TOEFL is a note-taking exam. Every section lets you take notes, and every high scorer uses the same trick: notes are for structure, not detail.

Listening lectures follow a predictable skeleton: the professor states a topic, defines two to four key terms, gives an example for each, and often ends with a caveat or an opposing view. Divide your page into a column per key term. When you hear "for instance", write the example under the term it belongs to. Questions almost always ask about the purpose of an example, the meaning of a term, or the professor's attitude — all three are structural answers your notes will contain.

Reading: the question set includes vocabulary-in-context, sentence-insertion, and prose-summary. For the summary question, remember the rule: the correct three choices are the ones that represent whole paragraphs; wrong choices are true details that are too narrow or too broad.

Speaking: four tasks, fixed templates. Task 1 (independent): state a preference, two reasons, one example per reason, in 45 seconds. Tasks 2–4 (integrated): your job is to report — reading says X, the speaker agrees or disagrees because Y. Reading and listening relationships matter more than your opinion.

Writing: the integrated essay (20 minutes) reports how the lecture challenges the reading, point by point — one paragraph per point, no personal opinion. The academic discussion essay (10 minutes) adds your view to an online discussion: position, one reason, engagement with a previous poster.

Simulate the real interface with the free TOEFL mocks on this platform — typing your notes, wearing headphones, and speaking on a timer. Half of TOEFL preparation is removing surprise, and the platform lets you drill that 24/7 at no cost.`,
    },
    {
      title: 'PTE Academic: the scoring algorithm and you',
      category: 'PTE',
      description: 'Which tasks carry the most points across skills, and how to train for a machine scorer.',
      content: `PTE is scored by machine, and every task contributes to multiple skills. That cross-scoring is the key to an efficient plan.

The heaviest tasks: Read Aloud (speaking + reading), Repeat Sentence (speaking + listening — and the single best predictor of your listening score), Write From Dictation (writing + listening — the highest-value item in the whole exam), and Re-tell Lecture. If time is short, drill these four.

For machine-scored speaking, three things matter: continuous speech (no long pauses — the algorithm interprets silence as the end of an answer), steady pace (about 120–150 words per minute), and clear consonant endings ("started", not "start-ed" swallowed into "start"). Fluency outranks accent: a monotone but continuous answer outscores a dramatic one with hesitations.

Repeat Sentence method: do not write the sentence (you cannot anyway). Listen for meaning chunks — "the library / closes at nine / during exams" — and repeat the chunks. If you lose the middle, keep the beginning and end; partial credit is real and large.

Write From Dictation: type exactly what you hear; every correct word is a point toward both writing and listening. Train with the dictation drills in the free PTE mocks here. Aim for a daily 20-item sprint.

Essay (20 minutes): the template the algorithm rewards is boring and effective — clear position, two developed reasons with examples, one counter-argument handled, short conclusion. Long memorised filler is detected; moderate length with dense content scores.

Reorder Paragraphs: find the standalone sentence first (the one that uses a full name or defines the topic), then chain pronouns and linkers ("this", "however", "as a result") backwards. Do a PTE mock every second day on the platform and read the per-task feedback — it tells you exactly which of the heavy four is costing you points.`,
    },
    {
      title: 'Duolingo English Test: the 15 odd question types',
      category: 'DUOLINGO',
      description: 'Tactics for C-test, listen-and-type, read-aloud, the interview video and the writing sample.',
      content: `The DET feels like a game and is graded like an exam. Each odd question type has a short tactic.

Fill in the missing letters (C-test): the missing word is almost always a common function word or a word already used in the passage. Read the whole paragraph first for topic, then fill grammar words (the, of, which) before content words. Every blank you leave empty is guaranteed zero.

Listen and type: you get to replay the sentence twice (in most forms) — use the first play for meaning, the second for checking endings and small words (a, the, of). Type while you listen; do not trust memory.

Read aloud: recorded once. Speak at a calm pace, over-articulate word endings, and never restart — a continuous read with small stumbles outscores a restart.

Write about the photo (1 minute): one structure always works — describe the scene (who, what, where), then speculate ("It looks like...", "They might be..."). 40–60 words is plenty; accuracy beats length.

Speak about the photo / read then speak: same structure — describe, then speculate, then give a personal angle if time remains.

The interview video and writing sample are unscored for English but sent to institutions: treat them as your personal statement. Prepare two stories you can tell in 90 seconds — one academic, one personal — and reuse them.

Because the test is adaptive, do not panic when questions feel suddenly easy or hard; the algorithm is measuring, not judging. Run the free DET-style drills and mocks on this platform daily for two weeks — the question types become automatic, which is the entire strategy.`,
    },
    {
      title: 'GRE Verbal: sentence equivalence and the vocabulary core',
      category: 'GRE',
      description: 'A 300-word core list strategy, text-completion tactics, and how to read dense passages efficiently.',
      content: `GRE Verbal is a vocabulary and logic test in equal parts.

Vocabulary: you do not need 5,000 words; you need the roughly 800 that recur. Build from the frequency lists inside this platform's vocabulary section: ten new words a day, each written in one sentence of your own, revised with the previous day's ten. Recognition must be instant — half a second per word in the exam.

Text completion with one blank: read the full sentence, predict a word in your own language first, then match. If two choices are synonyms but the sentence needs an opposite tone, both are wrong — tone (positive/negative/neutral) eliminates faster than meaning.

Sentence equivalence: exactly one pair of answers are true synonyms that both fit. The tactic: find the pair first; the other three choices are almost always either non-synonyms or synonyms that do not fit the blank. If you cannot find a pair, you have misread the sentence.

Multi-blank text completions: do them one blank at a time, starting with whichever blank has the clearest structural clue (contrast words like "although", "far from", "not... but"). Check your completed sentence reads logically aloud in your head.

Reading comprehension: read the passage for structure — the author's position, the evidence, the turn ("However...") — before touching questions. Most questions ask what the author would agree with, so the position is the answer key. For "select-in-passage", the highlighted sentence is usually the topic sentence of a paragraph or the sentence right after a transition.

Do one GRE verbal set a day from the free mocks here, and keep an error log with two columns: "did not know the word" versus "misread the logic". After two weeks the log tells you which half to attack.`,
    },
    {
      title: 'OET for healthcare professionals: the letter that scores B',
      category: 'OET',
      description: 'Case-note selection, the referral-letter structure, and the clinical-speaking role-plays.',
      content: `OET grades your workplace English, so every task is a professional task.

Writing (24 minutes: 5 reading, 18 writing, 1 checking): you transform case notes into a referral or discharge letter. The B-grade letter selects — it does not copy everything. Read the notes once for the patient's story: condition, treatment so far, what happens next, and what the recipient must do. Then structure: one line of introduction (who the patient is and why you are writing), relevant history, current status and treatment, requests to the recipient, and a professional close. Ignore irrelevant notes (social details that do not affect care) — including them costs marks under the relevance criterion.

Grammar that matters: past tenses for history, present perfect or present for ongoing conditions ("She has attended the clinic since March", "He is currently on..."), and future or request forms for the plan ("I would be grateful if you could...").

Speaking (two role-plays, five minutes each): the card gives you a clinical setting and a patient or carer with concerns. The marks are communication, not medicine. Open with a frame ("I understand you wanted to talk about your medication today"), ask before telling, chunk information into short units and check understanding ("Does that make sense so far?"), acknowledge emotion by name ("I can see this has been worrying you"), and close with a concrete plan repeated back. The strongest candidates sound calm even when the role-play patient is hostile — that is the skill being graded.

Listening and reading use the same tactics as IELTS with clinical vocabulary. Run the free OET-style mocks on this platform twice a week, write one letter per day, and read each back aloud: a letter you cannot say smoothly in 90 seconds is a letter the examiner will not enjoy either.`,
    },
    {
      title: 'English tenses: the complete working map',
      category: 'GRAMMAR',
      description: 'All twelve tenses on one page, with the time words that choose them and the errors exams punish.',
      content: `Every tense answers two questions: when (past, present, future) and how the speaker frames the action (simple, continuous, perfect, perfect-continuous).

Present simple — habits and facts ("She works nights"). Signals: usually, always, every week. Present continuous — happening now or a temporary habit ("She is working nights this month"). Signals: now, currently, this week. Present perfect — a past action with present relevance ("She has worked here for five years" — and still does). Signals: since, for, already, yet, never. Present perfect continuous — the same, with focus on duration and activity ("She has been working since dawn").

Past simple — finished past with a finished time ("She worked yesterday"). Signals: yesterday, in 2019, last week, ago. Past continuous — background action in the past ("She was working when I called"). Past perfect — the past-before-the-past ("She had finished the shift before the alarm sounded"). Past perfect continuous — duration up to a past point ("She had been waiting for two hours when the doctor arrived").

Future with will — decisions, predictions, offers ("I will send it tonight"). Going to — plans and visible evidence ("She is going to specialise in cardiology"). Future continuous — in progress at a future time ("At nine tomorrow I will be operating"). Future perfect — completed by a future point ("By June she will have finished her training").

The three errors exams punish hardest: (1) present perfect with a finished-time word — wrong: "I have seen him yesterday"; right: "I saw him yesterday". (2) Since/for confusion — since marks a starting point, for marks a duration. (3) Continuous where simple belongs — states (know, believe, own, understand) resist the continuous: "I am knowing" is never right.

Drill: take any paragraph from the reading mocks on this platform, identify every tense, and explain why the writer chose it. Twenty minutes of that "why" practice beats two hours of table memorisation.`,
    },
    {
      title: 'Articles and countability: a/an, the, and zero',
      category: 'GRAMMAR',
      description: 'The rule system behind the most common error in every English exam — with a decision procedure.',
      content: `Article errors are the most frequent grammar mistake in IELTS and TOEFL writing, and the fastest to fix.

First decide countable or uncountable. Countable nouns have a plural (a report, two reports). Uncountables do not (information, advice, research, equipment, progress, feedback — note these five: exams love them, and "informations/advices" are always wrong).

The decision procedure, in order: (1) Is the noun countable-singular? Then it needs an article or another determiner — "report" alone is wrong; it is "a report" (first mention, any one), "the report" (known/already mentioned), "this/my/that report" (specified). (2) Is it countable-plural or uncountable? Then choose between zero article (general) and "the" (specific). "Reports are useful" — general. "The reports you sent are useful" — specific. (3) Proper nouns take zero article by default (Bangladesh, Dhaka Medical College) except for the families of exceptions: rivers, seas, mountain ranges, island groups and plural country names (the Padma, the Netherlands), and unique institutions in a context (the university, the government).

First mention versus later mention is the engine of narrative writing: "A patient presented with a rash. The rash had appeared two days earlier." First mention is "a", every later mention is "the". Doing only this in your writing removes about half of all article errors.

The listen-for drill: read one article of any text on this platform aloud and mark every noun with a/, the/, or ∅ before you read, then compare. Ten minutes a day for a fortnight builds the intuition; the free grammar-tagged practice sets on the platform let you drill exactly this error class.`,
    },
    {
      title: 'Academic Word List: the 60 words that appear everywhere',
      category: 'VOCABULARY',
      description: 'The highest-frequency academic words with exam-ready collocations — learn them as phrases, not items.',
      content: `Academic English runs on a surprisingly small core. These sixty words (from the Academic Word List families) appear in most exam texts and high-band essays. Learn each as a collocation — a word plus its natural partners — because exams test partners, not definitions.

Analysis and evidence: analyse data, cite evidence, demonstrate a link, indicate a trend, significant difference, substantial increase, considerable impact, marginal change.
Change and comparison: accelerate growth, decline sharply, fluctuate, stabilise, a gradual rise, a dramatic fall, by contrast, conversely, similarly.
Argument language: assert, claim, contend, maintain (that); refute, challenge, undermine an assumption; a convincing argument, a tentative conclusion.
Structure words: a component of, a factor in, a framework for, a criterion for (plural: criteria), a hypothesis (plural: hypotheses), a principle of, a function of, to constitute, to derive from.
People and institutions: individuals, communities, authorities, stakeholders, the workforce, the infrastructure, legislation, policy, a survey, a census.
Research verbs: conduct research, undertake a study, compile statistics, generate findings, publish outcomes, evaluate a programme.

Three rules that make this list worth ten times a random word list. First, learn the word family together: analyse (v), analysis (n plural analyses), analytic (adj), analytically (adv) — exams deliberately test the plural and the adjective forms. Second, register matters: "commence/terminate" are formal, "start/stop" neutral — a band-7 essay mixes registers deliberately, not accidentally. Third, use each new word in one sentence about your own life within 24 hours; unused vocabulary decays in days.

Work through the vocabulary sets on this platform (category: VOCABULARY), ten a day with the built-in review, and pull unknown words from every reading mock into the same loop. In six weeks the exam texts stop feeling foreign.`,
    },
    {
      title: 'Phrasal verbs for speaking and informal writing',
      category: 'VOCABULARY',
      description: 'The 40 phrasal verbs that carry everyday fluency, grouped by topic, with natural examples.',
      content: `Phrasal verbs are the difference between "communicating" and "sounding like a person". Exams reward them in speaking (IELTS Part 1, DET interview) and informal letters.

Daily routine: wake up, get up, set off (leave), get in (arrive), drop off (deliver someone), pick up (collect someone or learn casually), get back (return), stay up, turn in (go to bed).
Work and study: take on (accept work), carry out (perform), hand in (submit), put off (postpone), catch up on, keep up with, fall behind, brush up on (revise), go over (review), drop out of.
Money and shopping: pay back, pay off (a debt fully), save up, run out of, cut back on (reduce), splash out on (spend generously), take out (insurance, a loan).
Relationships: get on with / get along with, fall out with (argue), make up (reconcile), look up to (admire), grow apart, put up with (tolerate).
Communication: bring up (mention), point out, bring about (cause), talk over (discuss), hang up, call off (cancel), set up (arrange).
Problems: come up with (invent a solution), deal with, sort out, work out (solve or exercise), break down, turn down (reject), turn out (result).

How to make them stick: never learn "look up" alone — learn "look up the word in a dictionary" and "look after a younger brother", because the particle changes everything. Three per day with a personal sentence each, recycled weekly, is worth more than forty memorised in one sitting.

Then use the free speaking practice on this platform and force three phrasal verbs into each conversation — the AI examiner will not judge you, and the retrieval practice is exactly what makes them available in the real exam.`,
    },
    {
      title: 'Speaking fluency drills: fill silence with structure',
      category: 'SPEAKING',
      description: 'Daily 15-minute drills that build the one skill speaking tests measure: extended, connected speech.',
      content: `Fluency is not speed. It is the ability to keep producing connected speech without long pauses — and it trains like a sport.

Drill 1 — the 60-second monologue (daily, 5 minutes): pick any object in the room and speak about it for 60 seconds without stopping: describe it, speculate about its owner and history, give an opinion, invent a use. The rule: no silence longer than two seconds. Filler phrases ("Let me think about...", "What I mean is...") count as speech; that is what they are for.

Drill 2 — question ladders (5 minutes): take one question ("Do you prefer city or village life?") and answer it at three lengths: 10 seconds, 30 seconds, 60 seconds. The 10-second version forces a clear position; the 60-second version forces reasons, examples and a contrast. Exams constantly change the required length; most candidates can only produce one.

Drill 3 — shadowing (3 minutes): play any 60-second clip from the listening materials on this platform and speak along with it, half a second behind. This builds rhythm, stress and pronunciation without a single vocabulary list.

Drill 4 — the error triage (2 minutes): record yourself once a week. Listen only for your three most repeated mistakes — the same article error, the same tense slip, the same filler overuse. Fix those three this week, ignore everything else. Correcting everything at once corrects nothing.

Daily practice: run the free AI speaking sessions on this platform — a realistic examiner conversation, unlimited, 24/7. Two sessions a day, one on a familiar topic and one on a random one, converts these drills into exam-ready reflexes in about three weeks.`,
    },
    {
      title: 'Essay writing beyond IELTS: structure for any exam',
      category: 'WRITING',
      description: 'The universal essay skeleton — introduction moves, body logic, and conclusions that score.',
      content: `Every timed exam essay — IELTS Task 2, TOEFL academic discussion, GRE issue, university tests — rewards the same skeleton.

The introduction has two moves: (1) frame the topic in your own words, narrower than the question ("The rise of remote work has changed where, not just how, people do their jobs"), and (2) state your thesis — a specific, arguable position in one sentence. A thesis like "this topic has advantages and disadvantages" scores nothing; "the benefits outweigh the costs for knowledge workers, but not for new staff who need mentoring" scores, because it can be defended in paragraphs.

Body paragraphs: one point each, in the order your thesis promised. Inside a paragraph, the logic chain is claim → reason → evidence → link back. The reason is the step most candidates skip: do not jump from claim to example. Say why the claim holds ("...because mentoring depends on informal observation, which screens do not transmit"), then evidence, then one sentence tying the paragraph to the thesis.

Concessions earn marks: acknowledge the strongest counter-argument in one paragraph and answer it ("Admittedly, remote work broadens the talent pool; even so, onboarding costs..."). Examiners read this as critical thinking.

Conclusions do not introduce new ideas: restate the thesis in fresh words, then widen one notch ("...which is why return-to-office policy will remain a negotiation, not a rule").

Sentence variety without decoration: alternate sentence openings (subject, adverbial, subordinate clause), and prefer precise verbs (halve, outsource, delay) over adjective piles. One idea per sentence keeps grammar accurate under time pressure.

Write one essay every two days from this platform's free question bank and run it through the writing feedback tool; rewrite only the weakest paragraph the next day. Weak-paragraph rewriting is the highest-yield writing practice that exists.`,
    },
    {
      title: 'How to build a study plan you will actually follow',
      category: 'GENERAL',
      description: 'A weekly planning method for exam preparation — spacing, interleaving, and honest review.',
      content: `Most study plans fail in week two because they are aspirational. A plan you will follow beats a plan that looks good.

Step 1 — diagnose before you schedule. Take one full free mock on this platform under real conditions. Your section scores, not your feelings, decide the plan: the section you dread is rarely the section costing you the most points.

Step 2 — pick two daily anchors, not six. One input block (skills work: the study materials in this library, 30 minutes) and one output block (a timed practice: one reading passage, one listening section, one essay, or one speaking session — 30–45 minutes). Same time every day; the calendar does the remembering so your willpower does not have to.

Step 3 — interleave, do not block. Two hours of only reading practice produces less than one hour of reading plus one hour of writing: switching forces retrieval, and retrieval is what builds durable skill. Rotate exam sections across the week.

Step 4 — space your reviews. Redo every mistake from Monday on Wednesday, then on Sunday. Keep an error log with one line per mistake: what was wrong, why, the rule that fixes it. Before your real exam, the error log — not the textbook — is your revision material.

Step 5 — schedule the reward and the rest. One full rest day a week, and a smaller goal each Friday ("by tonight I can do Write From Dictation at 80% accuracy"). Plans survive on visible progress.

Realistic arc: 8–12 weeks from a diagnostic to target band on 1.5 hours a day; faster with more hours, but never by skipping Step 4. Everything the plan needs — mocks, section drills, speaking practice, this library — is free and unlimited on this platform, 24/7, so the plan's only scarce resource is your consistency.`,
    },
  ];

  // Sentence-aware chunking that mirrors RagEngine.chunkText(…, 500) so the
  // RAG study chat can search seeded materials exactly like uploaded ones.
  function chunkText(text, chunkSize) {
    if (text.length <= chunkSize) return [text];
    const chunks = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let current = '';
    for (const sentence of sentences) {
      if ((current + sentence).length <= chunkSize) {
        current += sentence;
      } else {
        if (current) chunks.push(current.trim());
        current = sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  let materialsSeeded = 0;
  for (const m of STUDY_MATERIALS) {
    const existing = await prisma.studyMaterial.findFirst({
      where: { title: m.title, category: m.category },
      select: { id: true },
    });
    if (existing) continue;
    await prisma.studyMaterial.create({
      data: {
        title: m.title,
        description: m.description,
        category: m.category,
        sourceType: 'TEXT',
        content: m.content,
        chunkCount: chunkText(m.content, 500).length,
        isPublic: true,
        isActive: true,
      },
    });
    materialsSeeded += 1;
  }
  console.log(`  study materials: ${materialsSeeded} added, ${STUDY_MATERIALS.length - materialsSeeded} already present`);

  console.log('Seed complete.');
}

main().catch((e) => { console.error('Seed failed:', e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
