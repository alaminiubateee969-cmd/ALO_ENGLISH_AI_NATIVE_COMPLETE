/**
 * src/lib/agents/runtime/generator.ts
 *
 * The deterministic item generator.
 *
 * WHY THERE IS A GENERATOR AND NOT ONLY A MODEL
 * ──────────────────────────────────────────────
 * The mission says "no mandatory paid AI API" and "prioritise self-hosted,
 * open-weight models". But a self-hosted model is not always reachable, and a
 * platform whose daily content pipeline stops when a model server restarts is
 * not a platform. So the generator is deterministic and always available, and
 * a model — when one is configured — is used to *improve* a generated item
 * (clearer wording, better distractors), never to decide whether an answer is
 * correct.
 *
 * WHY THE ANSWER IS RIGHT BY CONSTRUCTION
 * ───────────────────────────────────────
 * Every item is built from a fact that the generator first writes into the
 * passage. The question then asks about that fact, and the key is read out of
 * the same record. A generator cannot produce a wrong key for a factual
 * question, because the key and the passage come from one object.
 *
 * EVERYTHING IS INVENTED
 * ─────────────────────
 * The entities, places and organisations below are composed from syllable
 * lists at run time. They are not real organisations, not real people, and
 * not taken from any exam provider's material. That is what makes the output
 * original and free of copyright, and it is also why these items are practice
 * material and not a reproduction of anyone's paper.
 */

import type { ExamBlueprint } from "./blueprints";

export type GeneratedItem = {
  section: "LISTENING" | "READING" | "WRITING" | "SPEAKING";
  /** A canonical question type the grader can score. */
  type: string;
  prompt: string;
  passage?: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  correctIndices?: number[];
  wordLimit?: number;
  /** 0 = easy, 1 = hard. */
  difficulty: number;
  topic: string;
  /** Why the key is right. Stored with the draft so a reviewer can check it. */
  rationale: string;
  provenance: {
    provider: string;
    model: string;
    promptVersion: string;
  };
};

const GENERATOR_VERSION = "alo-item-generator/1.0.0";

// ─── Invented vocabulary ───────────────────────────────────────────────────

const PLACE_STEMS = [
  "Marren", "Kelvara", "Norlun", "Dastrel", "Vindicore", "Orventhal", "Sembriya",
  "Talvindor", "Querren", "Ashkolt", "Brindlemoor", "Cavendish Wells", "Elmsworth",
  "Farrowgate", "Greymarch", "Hollowmere", "Ilverston", "Kestrel Bay",
];
const PLACE_SUFFIXES = ["ford", "bridge", "haven", "ridge", "stead", "market", "reach", "fell"];
const ORG_STEMS = [
  "Northwind", "Clearwater", "Silverbrook", "Ironvale", "Pinecrest", "Lakeshore",
  "Meadowlark", "Foxglove", "Stonebridge", "Westmarch", "Hollowbrook", "Fairhaven",
];
const ORG_SUFFIXES = [
  "Institute", "Trust", "Consortium", "Collective", "Foundation", "Association",
  "Authority", "Cooperative",
];
const UNITS = ["visitors", "passengers", "students", "residents", "shipments", "passes", "sessions"];

/**
 * Each subject carries the past participle (for the passage) and the base
 * form (for the question). "did the site generate" is a question;
 * "did the site generated" is not, and an exam item with bad grammar is a
 * bad item however correct its key is.
 */
const SUBJECTS = [
  { topic: "public transport", noun: "station", verb: "served", verbBase: "serve" },
  { topic: "renewable energy", noun: "wind farm", verb: "generated", verbBase: "generate" },
  { topic: "urban planning", noun: "cycle lane", verb: "carried", verbBase: "carry" },
  { topic: "water management", noun: "reservoir", verb: "stored", verbBase: "store" },
  { topic: "heritage conservation", noun: "bridge", verb: "restored", verbBase: "restore" },
  { topic: "vocational training", noun: "workshop", verb: "trained", verbBase: "train" },
  { topic: "public health", noun: "clinic", verb: "treated", verbBase: "treat" },
  { topic: "agricultural research", noun: "trial plot", verb: "yielded", verbBase: "yield" },
  { topic: "digital literacy", noun: "learning hub", verb: "taught", verbBase: "teach" },
  { topic: "coastal management", noun: "sea wall", verb: "protected", verbBase: "protect" },
];

/** A small deterministic PRNG so a given seed always produces the same item. */
function makeRandom(seed: number): () => number {
  let state = (seed || 1) >>> 0;
  return () => {
    // xorshift32
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };
}

function pick<T>(random: () => number, items: T[]): T {
  return items[Math.floor(random() * items.length) % items.length];
}

function intBetween(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

/** Build one invented fact. The passage and the key both come from this. */
type Fact = {
  place: string;
  organisation: string;
  year: number;
  amount: number;
  unit: string;
  topic: string;
  noun: string;
  verb: string;
  /** The base form, for a question: "did the site generate". */
  verbBase: string;
  secondYear: number;
  secondAmount: number;
};

function makeFact(random: () => number): Fact {
  const place = `${pick(random, PLACE_STEMS)}${pick(random, PLACE_SUFFIXES)}`;
  const organisation = `${pick(random, ORG_STEMS)} ${pick(random, ORG_SUFFIXES)}`;
  const subject = pick(random, SUBJECTS);
  const year = intBetween(random, 1965, 2019);
  return {
    place,
    organisation,
    year,
    amount: intBetween(random, 120, 9800),
    unit: pick(random, UNITS),
    topic: subject.topic,
    noun: subject.noun,
    verb: subject.verb,
    verbBase: subject.verbBase,
    secondYear: year + intBetween(random, 2, 18),
    secondAmount: intBetween(random, 100, 9900),
  };
}

/** The paragraph that states the fact. */
function factPassage(fact: Fact): string {
  return (
    `The ${fact.organisation} was founded to study how small towns adapt to change. ` +
    `Its first major project took place in ${fact.place}, where a disused ${fact.noun} ` +
    `was rebuilt over four years. The programme opened in ${fact.year} and, in the first ` +
    `full year of operation, the site ${fact.verb} about ${fact.amount.toLocaleString("en-GB")} ${fact.unit} ` +
    `each year. A follow-up review, published in ${fact.secondYear}, recorded ${fact.secondAmount.toLocaleString("en-GB")} ${fact.unit} ` +
    `and argued that the town's approach could be copied elsewhere.`
  );
}

/** A spoken-style script for a listening item. */
function factScript(fact: Fact): string {
  return (
    `Good morning and welcome to ${fact.place}. Before I begin, a few practical details. ` +
    `This site first opened in ${fact.year}, following a four-year rebuild of the old ${fact.noun}. ` +
    `In its first full year it ${fact.verb} roughly ${fact.amount.toLocaleString("en-GB")} ${fact.unit}. ` +
    `A review published in ${fact.secondYear} put the later figure at ${fact.secondAmount.toLocaleString("en-GB")} ${fact.unit}. ` +
    `Thank you for your attention.`
  );
}

function distractorYears(fact: Fact, random: () => number): number[] {
  const set = new Set<number>();
  while (set.size < 3) {
    const candidate = fact.year + intBetween(random, -30, 30);
    if (candidate !== fact.year) set.add(candidate);
  }
  return [...set];
}

// ─── Item builders ─────────────────────────────────────────────────────────

type BuildContext = {
  fact: Fact;
  random: () => number;
  passage: string;
  script: string;
};

function buildMultipleChoice(ctx: BuildContext, section: "LISTENING" | "READING"): GeneratedItem {
  const { fact, random, passage, script } = ctx;
  const askingYear = random() < 0.5;
  const correct = askingYear ? fact.year : fact.amount;
  const wrong = askingYear ? distractorYears(fact, random) : [fact.amount + 111, fact.amount - 87, fact.amount + 402].map((n) => Math.max(1, n));

  const options = [correct, ...wrong];
  // Fisher–Yates so the key is not always in the same slot.
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  const correctIndex = options.indexOf(correct);

  return {
    section,
    type: section === "LISTENING" ? "LISTEN_AND_SELECT" : "READING_MCQ",
    prompt: askingYear
      ? `In what year did the programme in ${fact.place} open?`
      : `About how many ${fact.unit} did the site ${fact.verbBase} in its first full year?`,
    passage: section === "LISTENING" ? script : passage,
    options: options.map((o) => (askingYear ? String(o) : o.toLocaleString("en-GB"))),
    correctIndex,
    difficulty: 0.35,
    topic: fact.topic,
    rationale: askingYear
      ? `The passage states that the programme opened in ${fact.year}.`
      : `The passage states that the site ${fact.verb} about ${fact.amount.toLocaleString("en-GB")} ${fact.unit} in its first full year.`,
    provenance: {
      provider: "deterministic_generator",
      model: GENERATOR_VERSION,
      promptVersion: GENERATOR_VERSION,
    },
  };
}

function buildTrueFalse(ctx: BuildContext, section: "LISTENING" | "READING"): GeneratedItem {
  const { fact, random, passage, script } = ctx;
  const stateTrue = random() < 0.5;
  const year = stateTrue ? fact.year : fact.year + intBetween(random, 3, 25);
  const body = section === "LISTENING" ? script : passage;
  return {
    section,
    type: "TRUE_FALSE_NOT_GIVEN",
    prompt: `The programme in ${fact.place} opened in ${year}.`,
    passage: body,
    options: ["TRUE", "FALSE", "NOT GIVEN"],
    correctIndex: stateTrue ? 0 : 1,
    difficulty: 0.3,
    topic: fact.topic,
    rationale: stateTrue
      ? `The passage states the year ${fact.year}, which matches the statement.`
      : `The passage states the year ${fact.year}, so the statement's year of ${year} does not match.`,
    provenance: {
      provider: "deterministic_generator",
      model: GENERATOR_VERSION,
      promptVersion: GENERATOR_VERSION,
    },
  };
}

function buildNotGiven(ctx: BuildContext, section: "LISTENING" | "READING"): GeneratedItem {
  const { fact, random, passage, script } = ctx;
  const body = section === "LISTENING" ? script : passage;
  return {
    section,
    type: "TRUE_FALSE_NOT_GIVEN",
    prompt: `The programme in ${fact.place} cost more than ${fact.amount.toLocaleString("en-GB")} ${fact.unit} to build.`,
    passage: body,
    options: ["TRUE", "FALSE", "NOT GIVEN"],
    correctIndex: 2,
    difficulty: 0.5,
    topic: fact.topic,
    rationale:
      "The passage gives no information about the cost of the project, so the statement cannot be marked true or false.",
    provenance: {
      provider: "deterministic_generator",
      model: GENERATOR_VERSION,
      promptVersion: GENERATOR_VERSION,
    },
  };
}

function buildFillBlank(ctx: BuildContext, section: "LISTENING" | "READING"): GeneratedItem {
  const { fact, random, passage, script } = ctx;
  const body = section === "LISTENING" ? script : passage;
  const useYear = random() < 0.5;
  const answer = useYear ? String(fact.year) : fact.amount.toLocaleString("en-GB");
  const prompt = useYear
    ? `The programme in ${fact.place} opened in ____.`
    : `In its first full year the site handled about ____ ${fact.unit}.`;
  return {
    section,
    type: "FILL_BLANK",
    prompt,
    passage: body,
    correctAnswer: answer,
    difficulty: 0.25,
    topic: fact.topic,
    rationale: useYear
      ? `The passage states the year ${fact.year}.`
      : `The passage states about ${answer} ${fact.unit}.`,
    provenance: {
      provider: "deterministic_generator",
      model: GENERATOR_VERSION,
      promptVersion: GENERATOR_VERSION,
    },
  };
}

function buildSentenceCompletion(ctx: BuildContext): GeneratedItem {
  const { fact, passage } = ctx;
  return {
    section: "READING",
    type: "SENTENCE_COMPLETION",
    prompt: `Complete the sentence using the information in the passage.\n\nThe programme in ${fact.place} opened in ____, and in its first full year the site handled about ${fact.amount.toLocaleString("en-GB")} ${fact.unit}.`,
    passage,
    correctAnswer: String(fact.year),
    difficulty: 0.4,
    topic: fact.topic,
    rationale: `The passage states that the programme opened in ${fact.year}.`,
    provenance: {
      provider: "deterministic_generator",
      model: GENERATOR_VERSION,
      promptVersion: GENERATOR_VERSION,
    },
  };
}

function buildSummaryCompletion(ctx: BuildContext): GeneratedItem {
  const { fact, passage } = ctx;
  return {
    section: "READING",
    type: "SUMMARY_COMPLETION",
    prompt: `Complete the summary below.\n\nThe ${fact.organisation} rebuilt a disused ${fact.noun} in ${fact.place}. The programme opened in ____ and the site later handled about ${fact.secondAmount.toLocaleString("en-GB")} ${fact.unit}, according to a review published in ${fact.secondYear}.`,
    passage,
    correctAnswer: String(fact.year),
    difficulty: 0.45,
    topic: fact.topic,
    rationale: `The passage states the year the programme opened: ${fact.year}.`,
    provenance: {
      provider: "deterministic_generator",
      model: GENERATOR_VERSION,
      promptVersion: GENERATOR_VERSION,
    },
  };
}

function buildMatching(ctx: BuildContext): GeneratedItem {
  const { fact, passage } = ctx;
  const left = [`${fact.place}`, `${fact.organisation}`, `${fact.noun}`];
  const right = [
    `the town where the project took place`,
    `the body that founded the programme`,
    `the kind of building that was rebuilt`,
  ];
  return {
    section: "READING",
    type: "MATCHING",
    prompt: "Match each item on the left with the description on the right.",
    passage,
    options: right,
    correctIndices: [0, 1, 2],
    difficulty: 0.5,
    topic: fact.topic,
    rationale:
      "The passage names the town, the founding body and the building that was rebuilt, in that order of description.",
    provenance: {
      provider: "deterministic_generator",
      model: GENERATOR_VERSION,
      promptVersion: GENERATOR_VERSION,
    },
  };
}

function buildWritingTask(ctx: BuildContext): GeneratedItem {
  const { fact } = ctx;
  return {
    section: "WRITING",
    type: "WRITING_TASK2",
    prompt: `Some people think that small towns should preserve their old buildings rather than replace them with new ones.\n\nTo what extent do you agree or disagree?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.`,
    wordLimit: 250,
    difficulty: 0.6,
    topic: "heritage and development",
    rationale:
      "A discursive task. The platform assesses the response qualitatively against the rubric for the exam; it does not score it against a fixed key.",
    provenance: {
      provider: "deterministic_generator",
      model: GENERATOR_VERSION,
      promptVersion: GENERATOR_VERSION,
    },
  };
}

function buildChartDescription(ctx: BuildContext): GeneratedItem {
  const { fact } = ctx;
  return {
    section: "WRITING",
    type: "CHART_DESCRIPTION",
    prompt: `The table below shows the number of ${fact.unit} recorded at ${fact.place} between ${fact.year} and ${fact.secondYear}.\n\n| Year | ${fact.unit[0].toUpperCase()}${fact.unit.slice(1)} |\n|---|---|\n| ${fact.year} | ${fact.amount.toLocaleString("en-GB")} |\n| ${fact.secondYear} | ${fact.secondAmount.toLocaleString("en-GB")} |`,
    wordLimit: 150,
    difficulty: 0.5,
    topic: fact.topic,
    rationale:
      "A visual-description task. The platform assesses the response qualitatively against the rubric for the exam.",
    provenance: {
      provider: "deterministic_generator",
      model: GENERATOR_VERSION,
      promptVersion: GENERATOR_VERSION,
    },
  };
}

function buildSpeaking(ctx: BuildContext): GeneratedItem {
  const { fact } = ctx;
  return {
    section: "SPEAKING",
    type: "SPEAKING",
    prompt: `Describe a small project in your own town or city that has changed the way people travel, work or spend their free time.\n\nYou should say:\n- what the project is\n- when and why it was started\n- how it has affected people\n\nand explain whether you think the change has been positive.`,
    wordLimit: 120,
    difficulty: 0.5,
    topic: "long turn",
    rationale:
      "A speaking task. The platform assesses the transcript qualitatively; no acoustic property is inferred.",
    provenance: {
      provider: "deterministic_generator",
      model: GENERATOR_VERSION,
      promptVersion: GENERATOR_VERSION,
    },
  };
}

// ─── The public generator ──────────────────────────────────────────────────

const BUILDERS_BY_TYPE: Record<string, (ctx: BuildContext) => GeneratedItem> = {
  MULTIPLE_CHOICE: (ctx) => buildMultipleChoice(ctx, ctx.fact.topic === "" ? "READING" : "READING"),
  READING_MCQ: (ctx) => buildMultipleChoice(ctx, "READING"),
  LISTEN_AND_SELECT: (ctx) => buildMultipleChoice(ctx, "LISTENING"),
  TRUE_FALSE: (ctx) => buildTrueFalse(ctx, "READING"),
  TRUE_FALSE_NOT_GIVEN: (ctx) => buildTrueFalse(ctx, "READING"),
  FILL_BLANK: (ctx) => buildFillBlank(ctx, "READING"),
  SHORT_ANSWER: (ctx) => buildFillBlank(ctx, "READING"),
  SENTENCE_COMPLETION: (ctx) => buildSentenceCompletion(ctx),
  SUMMARY_COMPLETION: (ctx) => buildSummaryCompletion(ctx),
  MATCHING: (ctx) => buildMatching(ctx),
  LABELING: (ctx) => buildMatching(ctx),
  ESSAY: (ctx) => buildWritingTask(ctx),
  WRITING_TASK1: (ctx) => buildChartDescription(ctx),
  WRITING_TASK2: (ctx) => buildWritingTask(ctx),
  CHART_DESCRIPTION: (ctx) => buildChartDescription(ctx),
  SPEAKING: (ctx) => buildSpeaking(ctx),
};

/** The section a type belongs to, for the types the generator produces. */
const SECTION_FOR_TYPE: Record<string, "LISTENING" | "READING" | "WRITING" | "SPEAKING"> = {
  MULTIPLE_CHOICE: "READING",
  READING_MCQ: "READING",
  LISTEN_AND_SELECT: "LISTENING",
  TRUE_FALSE: "READING",
  TRUE_FALSE_NOT_GIVEN: "READING",
  FILL_BLANK: "READING",
  SHORT_ANSWER: "READING",
  SENTENCE_COMPLETION: "READING",
  SUMMARY_COMPLETION: "READING",
  MATCHING: "READING",
  LABELING: "READING",
  ESSAY: "WRITING",
  WRITING_TASK1: "WRITING",
  WRITING_TASK2: "WRITING",
  CHART_DESCRIPTION: "WRITING",
  SPEAKING: "SPEAKING",
};

/**
 * Generate `count` items for one section of one exam.
 *
 * The seed makes the output reproducible: the same (exam, section, seed) always
 * produces the same items, which is what lets the duplicate checker be
 * meaningful and lets a test assert on exact content.
 */
export function generateItems(
  blueprint: ExamBlueprint,
  section: "LISTENING" | "READING" | "WRITING" | "SPEAKING",
  count: number,
  seed: number,
): GeneratedItem[] {
  const random = makeRandom(seed + section.length * 7919);
  const types = blueprint.sections.find((s) => s.id === section)?.questionTypes ?? [];
  const usable = types.filter((t) => BUILDERS_BY_TYPE[t]);
  if (usable.length === 0) return [];

  const items: GeneratedItem[] = [];
  for (let i = 0; i < count; i += 1) {
    const type = usable[i % usable.length];
    const builder = BUILDERS_BY_TYPE[type];
    if (!builder) continue;
    const fact = makeFact(random);
    const ctx: BuildContext = {
      fact,
      random,
      passage: factPassage(fact),
      script: factScript(fact),
    };
    const item = builder(ctx);
    // The section always follows the blueprint, not the type default, so a
    // listening blueprint produces listening items.
    items.push({ ...item, section, type });
  }
  return items;
}

/** The section a generated type belongs to. */
export function sectionForType(type: string): "LISTENING" | "READING" | "WRITING" | "SPEAKING" {
  return SECTION_FOR_TYPE[type] ?? "READING";
}

/** The generator's version, stored with every item it produces. */
export const ITEM_GENERATOR_VERSION = GENERATOR_VERSION;
