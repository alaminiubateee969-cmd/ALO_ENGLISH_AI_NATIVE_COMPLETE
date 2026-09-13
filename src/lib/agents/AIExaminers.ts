/**
 * src/lib/agents/AIExaminers.ts
 *
 * 5 Bengali AI Examiner Personas — they look Bengali, speak English,
 * and account for Bengali-English accent patterns in evaluation.
 *
 * Each examiner has:
 * - A Bengali name and identity
 * - An avatar description (Bengali appearance)
 * - Accent-aware evaluation parameters
 * - Specialized evaluation focus
 */

export type AIExaminer = {
  id: string;
  name: string;
  title: string;
  avatarDescription: string;
  avatarUrl: string;
  personality: string;
  accentAwareness: string;
  evaluationFocus: string[];
  greetingMessage: string;
  accentAdjustments: {
    // Common Bengali→English pronunciation patterns to NOT penalize heavily:
    vToW: boolean;       // v/w confusion (very → wery)
    thToTOrD: boolean;   // th → t or d (think → tink, this → dis)
    sToSh: boolean;      // s/sh confusion (she → see)
    zToJ: boolean;       // z/j confusion
    retroflexD: boolean; // retroflex d/t sounds
    aspiration: boolean; // aspirated consonants
    intonationPattern: boolean; // Bengali intonation patterns
    articleDropping: boolean; // dropping articles (a/an/the)
    prepositionShift: boolean; // different preposition usage
    tensePattern: boolean; // present continuous for habitual actions
  };
};

export const AI_EXAMINERS: AIExaminer[] = [
  {
    id: "examiner-01",
    name: "Dr. Anika Rahman",
    title: "Senior English Language Examiner",
    avatarDescription: "Bengali woman, early 40s, wearing a professional teal saree, shoulder-length black hair, warm brown skin, glasses, confident expression",
    avatarUrl: "/examiners/examiner-01.png",
    personality: "Professional, encouraging, thorough. Understands Bengali English speakers' challenges deeply.",
    accentAwareness: "Accounts for v/w and th/t substitutions common in Bangladeshi English. Does not penalize Bengali intonation patterns in fluency scoring.",
    evaluationFocus: ["fluency", "lexical_resource", "coherence"],
    greetingMessage: "Hello, I'm Dr. Anika Rahman. I'll be your examiner today. Please don't worry about your accent — I understand how Bengali speakers pronounce English, and I'll evaluate you fairly. Let's begin.",
    accentAdjustments: {
      vToW: true,
      thToTOrD: true,
      sToSh: true,
      zToJ: true,
      retroflexD: true,
      aspiration: true,
      intonationPattern: true,
      articleDropping: true,
      prepositionShift: true,
      tensePattern: true,
    },
  },
  {
    id: "examiner-02",
    name: "Professor Rifat Hassan",
    title: "IELTS Speaking Specialist",
    avatarDescription: "Bengali man, late 30s, short black hair, trimmed beard, wearing a navy blazer over white shirt, brown skin, friendly smile",
    avatarUrl: "/examiners/examiner-02.png",
    personality: "Patient, detailed, gives constructive feedback. Specializes in pronunciation coaching for South Asian speakers.",
    accentAwareness: "Recognizes Bengali English patterns: retroflex T/D sounds, v→w, th→t/d, and article omission. Adjusts pronunciation scoring accordingly.",
    evaluationFocus: ["pronunciation", "grammar", "vocabulary"],
    greetingMessage: "Welcome! I'm Professor Rifat Hassan. I've worked with thousands of Bangladeshi students. I know exactly which sounds are hard for us in English. Just speak naturally and I'll evaluate you fairly.",
    accentAdjustments: {
      vToW: true,
      thToTOrD: true,
      sToSh: false,
      zToJ: true,
      retroflexD: true,
      aspiration: true,
      intonationPattern: true,
      articleDropping: true,
      prepositionShift: true,
      tensePattern: true,
    },
  },
  {
    id: "examiner-03",
    name: "Dr. Nusrat Jahan",
    title: "English Proficiency Assessment Expert",
    avatarDescription: "Bengali woman, mid 30s, wearing a maroon kameez with dupatta, long black hair in a braid, brown skin, warm and intelligent expression",
    avatarUrl: "/examiners/examiner-03.png",
    personality: "Analytical, fair, focused on content quality over accent perfection. Values clarity of thought.",
    accentAwareness: "Prioritizes communication effectiveness over accent accuracy. Accounts for Bengali English preposition patterns and article usage.",
    evaluationFocus: ["coherence", "task_achievement", "lexical_resource"],
    greetingMessage: "Good day! I'm Dr. Nusrat Jahan. My focus is on what you say, not how you sound. Bengali English is perfectly fine as long as you communicate clearly. Let's get started.",
    accentAdjustments: {
      vToW: true,
      thToTOrD: true,
      sToSh: true,
      zToJ: false,
      retroflexD: true,
      aspiration: false,
      intonationPattern: true,
      articleDropping: true,
      prepositionShift: true,
      tensePattern: true,
    },
  },
  {
    id: "examiner-04",
    name: "Mr. Tanvir Ahmed",
    title: "PTE & TOEFL Speaking Coach",
    avatarDescription: "Bengali man, early 30s, clean-shaven, modern haircut, wearing a grey formal shirt, brown skin, approachable look",
    avatarUrl: "/examiners/examiner-04.png",
    personality: "Modern, tech-savvy, understands online exam delivery. Encourages confidence over perfection.",
    accentAwareness: "Adjusts for Bengali English fluency patterns: sentence stress, rhythm, and common Bengali-English grammar patterns (present continuous overuse, article omission).",
    evaluationFocus: ["fluency", "pronunciation", "confidence"],
    greetingMessage: "Hi there! I'm Tanvir Ahmed. I know what it's like to speak English with a Bengali accent — I have one too! I'll evaluate you fairly, focusing on communication, not accent. Ready?",
    accentAdjustments: {
      vToW: true,
      thToTOrD: true,
      sToSh: true,
      zToJ: true,
      retroflexD: true,
      aspiration: true,
      intonationPattern: true,
      articleDropping: true,
      prepositionShift: false,
      tensePattern: true,
    },
  },
  {
    id: "examiner-05",
    name: "Dr. Farzana Karim",
    title: "Academic English & Writing Examiner",
    avatarDescription: "Bengali woman, late 40s, wearing an elegant green silk saree, silver hair clips, brown skin, reading glasses, scholarly expression",
    avatarUrl: "/examiners/examiner-05.png",
    personality: "Rigorous, academic, values logical argumentation and vocabulary range. Evaluates writing with South Asian English conventions in mind.",
    accentAwareness: "Accounts for Bengali English writing patterns: article usage, preposition choices, and Bengali-influenced sentence structures. Values content over minor grammar variations.",
    evaluationFocus: ["task_achievement", "grammar", "vocabulary"],
    greetingMessage: "Welcome, I'm Dr. Farzana Karim. I specialize in academic English for South Asian students. I understand that Bengali English has its own valid patterns. Focus on your ideas and I'll evaluate you fairly.",
    accentAdjustments: {
      vToW: false,
      thToTOrD: false,
      sToSh: false,
      zToJ: false,
      retroflexD: false,
      aspiration: false,
      intonationPattern: true,
      articleDropping: true,
      prepositionShift: true,
      tensePattern: true,
    },
  },
];

export function getExaminerForSection(section: string): AIExaminer {
  // Select examiner based on section
  if (section === "SPEAKING") return AI_EXAMINERS[1]; // Professor Rifat — pronunciation specialist
  if (section === "WRITING") return AI_EXAMINERS[4];  // Dr. Farzana — writing specialist
  if (section === "LISTENING") return AI_EXAMINERS[0]; // Dr. Anika — general
  return AI_EXAMINERS[2]; // Dr. Nusrat — reading/coherence
}

export function getRandomExaminer(): AIExaminer {
  return AI_EXAMINERS[Math.floor(Math.random() * AI_EXAMINERS.length)];
}

/**
 * Accent-aware pronunciation scoring adjustment.
 * When a Bengali speaker says "wery" instead of "very" or "tink" instead of "think",
 * we don't penalize them as heavily as a non-Bengali-aware examiner would.
 */
export function adjustPronunciationScoreForBengaliAccent(
  baseScore: number,
  transcript: string,
  examiner: AIExaminer
): number {
  let adjustment = 0;
  const lower = transcript.toLowerCase();

  // Check for common Bengali-English patterns that should NOT be heavily penalized
  if (examiner.accentAdjustments.vToW) {
    // v→w is common in Bengali English; don't penalize
    if (lower.includes("wery") || lower.includes("we") || lower.includes("willage")) {
      adjustment += 0.5; // Slight boost since examiner understands this is Bengali English
    }
  }

  if (examiner.accentAdjustments.thToTOrD) {
    // th→t/d is common (think→tink, this→dis); don't penalize
    if (lower.includes("tink") || lower.includes("dis") || lower.includes("dat")) {
      adjustment += 0.5;
    }
  }

  if (examiner.accentAdjustments.articleDropping) {
    // Bengali speakers often drop articles; check for this pattern
    // If they speak well but drop articles, don't penalize grammar as heavily
    const words = lower.split(/\s+/);
    const hasArticles = words.some((w) => ["a", "an", "the"].includes(w));
    if (!hasArticles && words.length > 20) {
      adjustment += 0.3; // Slight grammar boost — Bengali language has no articles
    }
  }

  if (examiner.accentAdjustments.tensePattern) {
    // Bengali English often uses present continuous for habitual actions
    // "I am going to school every day" instead of "I go to school every day"
    if (lower.includes("i am going") || lower.includes("i am doing") || lower.includes("i am eating")) {
      adjustment += 0.2; // Minor adjustment — this is a Bengali English pattern
    }
  }

  return Math.min(9.0, baseScore + adjustment);
}

/**
 * Accent-aware fluency scoring.
 * Bengali speakers may pause at different points in sentences due to language structure.
 */
export function adjustFluencyScoreForBengaliAccent(
  baseScore: number,
  wordCount: number,
  durationSec: number,
  examiner: AIExaminer
): number {
  if (!examiner.accentAdjustments.intonationPattern) return baseScore;

  // Bengali intonation is different from English; add a small boost
  // since the examiner understands Bengali English rhythm patterns
  return Math.min(9.0, baseScore + 0.3);
}
