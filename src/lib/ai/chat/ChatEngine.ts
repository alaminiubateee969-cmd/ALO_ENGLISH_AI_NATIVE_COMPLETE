/**
 * src/lib/ai/chat/ChatEngine.ts
 *
 * Rule-based conversational engine for the ALO web chat.
 *
 * This is "own AI": pattern matching + a small state machine. There are NO
 * external LLM API calls here. The engine:
 *   - guides visitors from greeting → exam selection → registration → portal
 *   - answers common FAQ questions (exam types, pricing, format, how to
 *     register, what counts as a score) using the same static shortcut and
 *     exam-catalog data the rest of the platform uses
 *   - collects registration fields one at a time and hands the collected
 *     payload to the API route, which calls the existing /api/auth/register
 *     flow on the student's behalf
 *
 * The state machine is intentionally linear and forgiving: a visitor can
 * always say "register", "show me exams", or "go to portal" out of order,
 * and the engine jumps to the right state.
 */

import { EXAM_TYPES } from "@/lib/alo-data";
import { SHORTCUTS, EXAM_LABELS, type ExamCode } from "@/lib/study-tools/shortcuts";

// ─── Public types ────────────────────────────────────────────────────────

export type ChatState =
  | "greeting"
  | "exam_selection"
  | "exam_info"
  | "account_check"
  | "registration_collect_name"
  | "registration_collect_email"
  | "registration_collect_edu_id"
  | "registration_collect_password"
  | "registration_submitting"
  | "portal_redirect"
  | "faq";

export type QuickReply = {
  label: string;
  value: string;
};

export type ChatReply = {
  text: string;
  nextState: ChatState;
  quickReplies?: QuickReply[];
  /** Set when the engine has enough info to register the student. */
  readyToRegister?: boolean;
  /** The link the visitor should follow to reach the portal / exam. */
  portalLink?: string;
  /** Exam code the student is preparing for, once known. */
  examInterest?: ExamCode | null;
};

export type RegistrationDraft = {
  name?: string;
  email?: string;
  educationalId?: string;
  password?: string;
  examInterest?: ExamCode | null;
};

export type ChatContext = {
  state: ChatState;
  draft: RegistrationDraft;
  /** Number of conversation turns processed by the engine (for anti-loop). */
  turnCount: number;
};

// ─── Constants ──────────────────────────────────────────────────────────

const PORTAL_LINK = "/practice-test";
const LOGIN_LINK = "/login";
const STUDY_PLAN_LINK = "/study-plan";
const SHORTCUTS_LINK = "/shortcuts";

const GREETING_TEXT =
  "Welcome to ALO English! I'm your AI assistant. I can help you pick an exam, register for a student account, and start a mock test. Would you like to practice for an English exam?";

const YES_REPLIES = ["yes", "y", "yeah", "yep", "sure", "ok", "okay", "please", "sounds good", "let's do it", "i'd like to", "i want to"];
const NO_REPLIES = ["no", "n", "nope", "not now", "later", "not really", "skip"];

const REGISTER_TRIGGERS = [
  "register", "sign up", "signup", "create account", "make an account",
  "i need an account", "enrol", "enroll", "join", "get a student id",
  "i don't have an account", "i do not have an account", "no account",
];

const EXAM_KEYWORDS: Array<{ code: ExamCode; words: string[] }> = [
  { code: "IELTS", words: ["ielts"] },
  { code: "TOEFL", words: ["toefl"] },
  { code: "PTE", words: ["pte"] },
  { code: "GRE", words: ["gre"] },
  { code: "GMAT", words: ["gmat"] },
  { code: "SAT", words: ["sat"] },
  { code: "ACT", words: ["act"] },
  { code: "DET", words: ["duolingo", "det"] },
  { code: "OET", words: ["oet"] },
  { code: "CAMBRIDGE", words: ["cambridge", "b2 first", "fce"] },
];

// ─── Helpers ────────────────────────────────────────────────────────────

function normalize(input: string): string {
  return input.toLowerCase().replace(/[\u2018\u2019\u201c\u201d]/g, "'").trim();
}

function containsAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

function detectExam(text: string): ExamCode | null {
  const lower = ` ${normalize(text)} `;
  for (const { code, words } of EXAM_KEYWORDS) {
    for (const w of words) {
      if (new RegExp(`\\b${w}\\b`).test(lower)) return code;
    }
  }
  return null;
}

function isYes(text: string): boolean {
  const t = normalize(text);
  return YES_REPLIES.some((r) => t === r || t.startsWith(`${r} `) || t.startsWith(`${r},`));
}

function isNo(text: string): boolean {
  const t = normalize(text);
  return NO_REPLIES.some((r) => t === r || t.startsWith(`${r} `) || t.startsWith(`${r},`));
}

function wantsToRegister(text: string): boolean {
  const t = normalize(text);
  return containsAny(t, REGISTER_TRIGGERS);
}

function wantsPortal(text: string): boolean {
  const t = normalize(text);
  return containsAny(t, ["portal", "dashboard", "start exam", "start test", "begin exam", "go to exam", "take test", "practice test", "mock test", "start mock", "begin mock"]);
}

// ─── Quick reply presets ────────────────────────────────────────────────

const QR_GREETING: QuickReply[] = [
  { label: "Yes, practice for an exam", value: "yes" },
  { label: "Which exams are available?", value: "which exams" },
  { label: "How do I register?", value: "how do I register" },
  { label: "Is it free?", value: "is it free" },
];

const QR_EXAMS: QuickReply[] = [
  { label: "IELTS", value: "IELTS" },
  { label: "TOEFL", value: "TOEFL" },
  { label: "PTE", value: "PTE" },
  { label: "Duolingo", value: "DET" },
  { label: "Digital SAT", value: "SAT" },
  { label: "Show me all", value: "all exams" },
];

const QR_AFTER_EXAM: QuickReply[] = [
  { label: "I need to register", value: "register" },
  { label: "I already have an account", value: "I have an account" },
  { label: "Show me study shortcuts", value: "shortcuts" },
];

const QR_ACCOUNT_CHECK: QuickReply[] = [
  { label: "Yes, register me", value: "register" },
  { label: "I already have an account", value: "I have an account" },
];

const QR_REGISTRATION_NAME: QuickReply[] = [
  { label: "Use my email as name", value: "use email" },
];

const QR_PORTAL: QuickReply[] = [
  { label: "Open practice test", value: "go to portal" },
  { label: "Build a study plan", value: "study plan" },
  { label: "Browse exam shortcuts", value: "shortcuts" },
];

// ─── FAQ: pattern-matched answers (no LLM) ──────────────────────────────

type FaqEntry = {
  keywords: string[];
  answer: string;
};

const FAQ_ENTRIES: FaqEntry[] = [
  {
    keywords: ["free", "cost", "price", "pay", "payment", "charge", "fee", "subscription"],
    answer:
      "Yes — ALO English is free for learners. Every student gets 3 free mock tests per exam type. No card and no payment are required to register or to take those free mock tests. Practice tools like the study-plan builder, exam-prep shortcuts and SOP studio are free with no account.",
  },
  {
    keywords: ["register", "sign up", "create account", "enrol", "enroll", "how do i join"],
    answer:
      "You can register right here in this chat. Tell me your name, email and the educational ID issued by your ALO branch, and I'll create your student account. You'll get a student ID and a direct link to start a mock test.",
  },
  {
    keywords: ["educational id", "edu id", "student id", "where do i find", "id format"],
    answer:
      "Your educational ID is the 3-32 character code issued by your ALO Education branch or counselor (letters, digits, or dashes). It is required because the platform is gated, not public. If you don't have one yet, contact your local ALO branch.",
  },
  {
    keywords: ["password", "secure", "security"],
    answer:
      "Pick a password with at least 12 characters. Mix letters, numbers and symbols. It's stored as a bcrypt hash — ALO staff cannot read it back. Don't reuse a password from another important account.",
  },
  {
    keywords: ["ielts"],
    answer:
      "IELTS Academic covers Listening (40 questions / 30 min), Reading (40 questions / 60 min), Writing (Task 1 report + Task 2 essay / 60 min) and Speaking (3 parts / 14 min). The score is reported as a band from 0 to 9. ALO practice is preparation only — it is not an official IELTS result.",
  },
  {
    keywords: ["toefl"],
    answer:
      "TOEFL iBT has four sections: Reading (20 q / 35 min), Listening (28 q / 36 min), Speaking (4 tasks / 16 min) and Writing (2 tasks / 29 min). The total score is 0-120. ALO's TOEFL-style practice is for preparation, not an official ETS score.",
  },
  {
    keywords: ["pte"],
    answer:
      "PTE Academic is fully computer-based with 20 integrated question types across Speaking & Writing (77 min), Reading (32 min) and Listening (43 min). The score ranges from 10 to 90. ALO PTE practice is preparation, not a Pearson score.",
  },
  {
    keywords: ["duolingo", "det"],
    answer:
      "The Duolingo English Test (DET) is adaptive and takes about 1 hour. It reports four subscores (Literacy, Comprehension, Conversation, Production) on a 10-160 scale. ALO DET-style practice is preparation, not an official Duolingo score.",
  },
  {
    keywords: ["sat"],
    answer:
      "The Digital SAT is adaptive across two modules of Reading & Writing and two modules of Math, total ~2h 14m, scored 400-1600. ALO's SAT-style practice is preparation only and is not affiliated with the College Board.",
  },
  {
    keywords: ["gre"],
    answer:
      "The GRE General Test covers Analytical Writing, Verbal Reasoning and Quantitative Reasoning. ALO's GRE-style practice questions cover reading, vocabulary and quant patterns — preparation only, not an official ETS score.",
  },
  {
    keywords: ["gmat"],
    answer:
      "The GMAT Focus Edition has Quantitative Reasoning, Verbal Reasoning and Data Insights, scored 205-805. ALO's GMAT-style practice is preparation only and is not affiliated with GMAC.",
  },
  {
    keywords: ["oet"],
    answer:
      "OET is the English test for healthcare professionals, with Listening, Reading, Writing and Speaking sections all in clinical contexts. ALO's OET-style practice is preparation only and is not an official OET result.",
  },
  {
    keywords: ["score", "band", "result", "how is my score calculated"],
    answer:
      "Listening and Reading practice are auto-graded as a simple accuracy-based indicator. Writing may receive generic text-only revision suggestions from our local rule engine — no calibrated band. Speaking conversation practice is not numerically scored (a transcript cannot evidence pronunciation, fluency, or accent). No ALO score is an official exam result.",
  },
  {
    keywords: ["mock", "practice test", "how many questions", "how long"],
    answer:
      "Each active practice set is drawn from the question bank. The platform serves 5 different daily variants per exam type per day, so you won't see the same set twice until you've cycled through all 5. Each attempt is also shuffled per-sitting. Set availability and question counts vary — open the practice-test page to see today's catalog.",
  },
  {
    keywords: ["official", "certified", "certificate", "real exam", "valid"],
    answer:
      "ALO English is a preparation platform. Practice scores, feedback and certificates generated here are study aids only — they are not issued, endorsed, or validated by any exam board. Always confirm your official test booking with the exam provider.",
  },
  {
    keywords: ["speaking", "interview", "voice", "microphone", "mic"],
    answer:
      "Speaking practice uses your browser's built-in speech recognition and speech synthesis — no paid API. The conversation flows through 3 parts (intro, longer turn, discussion). It is practice only; no speaking score is produced.",
  },
  {
    keywords: ["writing", "essay", "feedback"],
    answer:
      "Submit your essay and the local rule engine returns generic revision suggestions: word count, paragraph structure, discourse markers, vocabulary variety. It is not a calibrated exam rubric or a numeric writing score.",
  },
  {
    keywords: ["handbook", "ask", "rag", "study material", "document"],
    answer:
      "Visit /ask-handbook to search the public study handbook. You can ask about grammar, vocabulary and exam strategy without signing in. Answers cite the source material.",
  },
  {
    keywords: ["study plan", "schedule", "plan", "timetable"],
    answer:
      "Open /study-plan to build a day-by-day schedule. Pick your exam, target score, daily study time and test date — you'll get a calendar with milestones and progress checkboxes. Saved to your browser; no account needed.",
  },
  {
    keywords: ["shortcut", "technique", "tip", "strategy", "trick"],
    answer:
      "Browse /shortcuts for real exam-prep techniques across IELTS, TOEFL, PTE, GRE, GMAT, SAT, ACT, DET, OET and Cambridge. Filter by skill and difficulty. Each shortcut has a worked example.",
  },
  {
    keywords: ["sop", "statement of purpose", "research proposal", "personal statement"],
    answer:
      "Open /sop-studio for a guided Statement of Purpose writer. Six sections, prompts, tips, live word counts and worked examples. Auto-saves to your browser and exports to .txt.",
  },
  {
    keywords: ["study abroad", "destination", "university", "course", "visa"],
    answer:
      "ALO Education also helps students organise study-abroad research. Visit /destinations to compare countries, /course-finder to research programmes, or /book-consultation to request a free advisor session. Always confirm admissions, funding and visa details with the relevant official organisations.",
  },
  {
    keywords: ["reset", "forgot password", "forgot", "locked out"],
    answer:
      "If you've forgotten your password, open /login and click the reset link. The platform sends a time-limited reset token to your registered email. If you've also lost access to that email, contact your ALO branch.",
  },
  {
    keywords: ["privacy", "data", "gdpr", "delete my data"],
    answer:
      "Your practice data stays on this platform. Audio for speaking practice is processed by the browser's built-in speech APIs and is not stored by us. Contact ALO Education to request access to or deletion of your account data.",
  },
  {
    keywords: ["human", "real examiner", "live agent", "counselor", "counsellor"],
    answer:
      "I'm an AI assistant built by ALO Education — pattern-matched rules, not a human. For a free counseling session with a real advisor, visit /book-consultation and an ALO Education counselor will contact you.",
  },
];

function answerFaq(text: string): string | null {
  const t = normalize(text);
  // Long-form keyword scan: pick the entry with the most keyword hits.
  let best: { entry: FaqEntry; hits: number } | null = null;
  for (const entry of FAQ_ENTRIES) {
    let hits = 0;
    for (const kw of entry.keywords) {
      if (t.includes(kw)) hits += 1;
    }
    if (hits > 0 && (!best || hits > best.hits)) {
      best = { entry, hits };
    }
  }
  return best ? best.entry.answer : null;
}

// ─── Exam catalog helpers ───────────────────────────────────────────────

function examInfoFor(code: ExamCode): string {
  const match = EXAM_TYPES.find((e) => e.id.toLowerCase() === code.toLowerCase());
  if (!match) {
    const label = EXAM_LABELS[code] || code;
    return `${label} is one of the exams covered by ALO English. Open the exam catalog (/exam-prep) to see today's active practice sets.`;
  }
  const sectionList = match.sections
    .map((s) => `${s.name} (${s.questions} q / ${s.duration})`)
    .join(", ");
  return `${match.name} — ${match.tagline}. Sections: ${sectionList}. Duration ~${match.duration}. Scale: ${match.scale}. ALO practice is preparation only — not an official exam result.`;
}

function listExams(): string {
  const items = EXAM_TYPES.map((e) => `${e.name} (${e.scale}, ~${e.duration})`).join("; ");
  return `Exams covered by ALO English: ${items}. Tell me which one you're preparing for and I'll show you what's in the catalog, then help you register.`;
}

function shortcutsFor(code: ExamCode): string {
  const matches = SHORTCUTS.filter((s) => s.exam === code).slice(0, 3);
  if (matches.length === 0) {
    return `I don't have a curated shortcut list for ${EXAM_LABELS[code] || code} yet — open /shortcuts to browse every exam's techniques.`;
  }
  const list = matches.map((s) => `- ${s.title}: ${s.description.split(".")[0]}.`).join("\n");
  return `Top ${EXAM_LABELS[code] || code} shortcuts:\n${list}\n\nBrowse all techniques at ${SHORTCUTS_LINK}.`;
}

// ─── Email / edu-id / password validators ───────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EDU_ID_RE = /^[A-Z0-9][A-Z0-9-]{2,31}$/;

function isValidEmail(s: string): boolean {
  return EMAIL_RE.test(s.trim()) && s.trim().length <= 254;
}

function normalizeEduId(s: string): string {
  return s.trim().toUpperCase();
}

function isValidEduId(s: string): boolean {
  return EDU_ID_RE.test(normalizeEduId(s));
}

function isValidPassword(s: string): boolean {
  return s.length >= 12 && s.length <= 128;
}

// ─── Initial context ────────────────────────────────────────────────────

export function createInitialChatContext(examInterest?: ExamCode | null): ChatContext {
  return {
    state: "greeting",
    draft: { examInterest: examInterest ?? null },
    turnCount: 0,
  };
}

// ─── Core: respond to a user message ────────────────────────────────────

/**
 * Produce the next assistant reply given the user's latest message and the
 * current conversation context. This function mutates `ctx` (draft fields,
 * turnCount) so the caller can persist the same object back to the client.
 *
 * Returns a ChatReply with text, nextState, optional quickReplies, and flags
 * the draft as ready to register when all required fields are present.
 */
export function generateChatReply(
  userMessage: string,
  ctx: ChatContext,
): ChatReply {
  const text = (userMessage || "").trim();
  const lower = normalize(text);
  ctx.turnCount += 1;

  // ─── Out-of-order global intents (work from any state) ──────────────
  if (wantsToRegister(lower)) {
    return startRegistration(ctx);
  }
  if (wantsPortal(lower)) {
    return goToPortal(ctx);
  }
  const detected = detectExam(lower);
  if (detected) {
    ctx.draft.examInterest = detected;
    if (ctx.state === "greeting" || ctx.state === "exam_selection" || ctx.state === "faq") {
      return {
        text: `Great — you're preparing for ${EXAM_LABELS[detected]}. ${examInfoFor(detected)}\n\nDo you already have an ALO student account, or would you like me to help you create one?`,
        nextState: "account_check",
        examInterest: detected,
        quickReplies: QR_ACCOUNT_CHECK,
      };
    }
  }
  if (containsAny(lower, ["all exams", "which exams", "list exams", "what exams", "exams available", "available exam"])) {
    return {
      text: listExams(),
      nextState: "exam_selection",
      quickReplies: QR_EXAMS,
    };
  }
  if (containsAny(lower, ["shortcut", "technique", "tip"])) {
    const code = ctx.draft.examInterest;
    return {
      text: code ? shortcutsFor(code) : "Browse every exam-prep technique at " + SHORTCUTS_LINK + ". Tell me which exam you're preparing for and I'll narrow the list.",
      nextState: ctx.state === "greeting" ? "faq" : ctx.state,
      quickReplies: QR_EXAMS,
    };
  }

  // ─── State machine ──────────────────────────────────────────────────
  switch (ctx.state) {
    case "greeting": {
      if (!text) {
        return { text: GREETING_TEXT, nextState: "greeting", quickReplies: QR_GREETING };
      }
      if (isYes(lower) || containsAny(lower, ["exam", "practice", "prepare", "mock", "test"])) {
        return {
          text: "Excellent. Which exam are you preparing for? IELTS, TOEFL, PTE, Duolingo English Test, Digital SAT — or another?",
          nextState: "exam_selection",
          quickReplies: QR_EXAMS,
        };
      }
      if (isNo(lower)) {
        return {
          text: "No problem. I can still help with study plans, exam-prep shortcuts, or answer general questions about English tests. What would you like to explore?",
          nextState: "faq",
          quickReplies: [
            { label: "Browse study plans", value: "study plan" },
            { label: "See exam shortcuts", value: "shortcuts" },
            { label: "Ask about an exam", value: "tell me about IELTS" },
          ],
        };
      }
      // Try FAQ first; if nothing matches, prompt for exam selection.
      const faq = answerFaq(lower);
      if (faq) {
        return { text: faq, nextState: "faq", quickReplies: QR_GREETING };
      }
      return {
        text: "I can help you pick an exam, register, and start a mock test. Which exam are you preparing for?",
        nextState: "exam_selection",
        quickReplies: QR_EXAMS,
      };
    }

    case "exam_selection": {
      if (detected) {
        ctx.draft.examInterest = detected;
        return {
          text: `Good choice — ${EXAM_LABELS[detected]}. ${examInfoFor(detected)}\n\nDo you already have an ALO student account? If not, I can create one for you right now.`,
          nextState: "account_check",
          examInterest: detected,
          quickReplies: QR_ACCOUNT_CHECK,
        };
      }
      if (containsAny(lower, ["all exams", "which exams", "list"])) {
        return { text: listExams(), nextState: "exam_selection", quickReplies: QR_EXAMS };
      }
      const faq = answerFaq(lower);
      if (faq) return { text: faq, nextState: "faq", quickReplies: QR_EXAMS };
      return {
        text: "Pick one from the buttons below, or type the name (IELTS, TOEFL, PTE, Duolingo, SAT, GRE, GMAT, OET, Cambridge).",
        nextState: "exam_selection",
        quickReplies: QR_EXAMS,
      };
    }

    case "exam_info": {
      const faq = answerFaq(lower);
      if (faq) return { text: faq, nextState: "faq", quickReplies: QR_AFTER_EXAM };
      return {
        text: "Would you like to register for a student account so you can take a practice test?",
        nextState: "account_check",
        quickReplies: QR_ACCOUNT_CHECK,
      };
    }

    case "account_check": {
      if (isYes(lower) || wantsToRegister(lower)) {
        return startRegistration(ctx);
      }
      if (containsAny(lower, ["already", "have an account", "have account", "i have an account", "logged in", "i'm a student"])) {
        return {
          text: "Perfect. You can head straight to the practice-test portal to start a mock. After 3 free sittings per exam type you may need to upgrade — your dashboard will tell you.",
          nextState: "portal_redirect",
          portalLink: PORTAL_LINK,
          quickReplies: QR_PORTAL,
        };
      }
      if (isNo(lower)) {
        return startRegistration(ctx);
      }
      const faq = answerFaq(lower);
      if (faq) return { text: faq, nextState: "faq", quickReplies: QR_ACCOUNT_CHECK };
      return {
        text: "Would you like me to help you create a student account? It takes about a minute.",
        nextState: "account_check",
        quickReplies: QR_ACCOUNT_CHECK,
      };
    }

    case "registration_collect_name": {
      if (containsAny(lower, ["use email", "skip", "no name"])) {
        // Use email as name placeholder if we already have one.
        if (ctx.draft.email) {
          ctx.draft.name = ctx.draft.email.split("@")[0];
        } else {
          ctx.draft.name = "Student";
        }
      } else if (text.length >= 1 && text.length <= 100) {
        ctx.draft.name = text;
      } else {
        return {
          text: "Please share a name (1-100 characters) so the account has a display name. You can also type 'skip' to use your email username.",
          nextState: "registration_collect_name",
          quickReplies: QR_REGISTRATION_NAME,
        };
      }
      return {
        text: "Thanks! What's your email address? It will be your login.",
        nextState: "registration_collect_email",
      };
    }

    case "registration_collect_email": {
      if (!isValidEmail(text)) {
        return {
          text: "That doesn't look like a valid email. Please type it like you@example.com.",
          nextState: "registration_collect_email",
        };
      }
      ctx.draft.email = text.trim();
      return {
        text: "Got it. Now your ALO educational ID — the 3-32 character code issued by your ALO branch (letters, digits, or dashes).",
        nextState: "registration_collect_edu_id",
      };
    }

    case "registration_collect_edu_id": {
      if (!isValidEduId(text)) {
        return {
          text: "That educational ID doesn't match the expected format (3-32 chars: letters, digits, or dashes). Please re-type it. If you don't have one, contact your ALO branch.",
          nextState: "registration_collect_edu_id",
        };
      }
      ctx.draft.educationalId = normalizeEduId(text);
      return {
        text: "Finally, pick a password with at least 12 characters. Mix letters, numbers and symbols — don't reuse one from another important account.",
        nextState: "registration_collect_password",
      };
    }

    case "registration_collect_password": {
      if (!isValidPassword(text)) {
        return {
          text: "Password must be 12-128 characters. Please type a stronger one.",
          nextState: "registration_collect_password",
        };
      }
      ctx.draft.password = text;
      return {
        text: "Thanks! I'll create your student account now. One moment…",
        nextState: "registration_submitting",
        readyToRegister: true,
      };
    }

    case "registration_submitting": {
      // The API route performs the actual registration when readyToRegister
      // is set. If we get here, the previous turn already collected fields
      // — re-flag readiness.
      if (
        ctx.draft.name &&
        ctx.draft.email &&
        ctx.draft.educationalId &&
        ctx.draft.password
      ) {
        return {
          text: "Creating your account now…",
          nextState: "registration_submitting",
          readyToRegister: true,
        };
      }
      return startRegistration(ctx);
    }

    case "portal_redirect": {
      if (wantsPortal(lower)) return goToPortal(ctx);
      if (containsAny(lower, ["study plan"])) {
        return { text: "Open the study-plan builder to draft a day-by-day schedule.", nextState: "portal_redirect", portalLink: STUDY_PLAN_LINK, quickReplies: QR_PORTAL };
      }
      if (containsAny(lower, ["shortcut"])) {
        return { text: "Browse exam-prep techniques here.", nextState: "portal_redirect", portalLink: SHORTCUTS_LINK, quickReplies: QR_PORTAL };
      }
      const faq = answerFaq(lower);
      if (faq) return { text: faq, nextState: "faq", quickReplies: QR_PORTAL };
      return {
        text: "Whenever you're ready, head to the practice-test portal to begin. You can also explore the study-plan builder or shortcuts.",
        nextState: "portal_redirect",
        portalLink: PORTAL_LINK,
        quickReplies: QR_PORTAL,
      };
    }

    case "faq":
    default: {
      if (isYes(lower) || containsAny(lower, ["register", "sign up", "create account"])) {
        return startRegistration(ctx);
      }
      if (wantsPortal(lower)) return goToPortal(ctx);
      const faq = answerFaq(lower);
      if (faq) return { text: faq, nextState: "faq", quickReplies: QR_GREETING };
      if (detected) {
        ctx.draft.examInterest = detected;
        return {
          text: `${examInfoFor(detected)}\n\nWould you like to register for a student account?`,
          nextState: "account_check",
          examInterest: detected,
          quickReplies: QR_ACCOUNT_CHECK,
        };
      }
      return {
        text: "I can help you pick an exam, register for an account, and start a mock test. What would you like to do?",
        nextState: "greeting",
        quickReplies: QR_GREETING,
      };
    }
  }
}

function startRegistration(ctx: ChatContext): ChatReply {
  // Don't lose the exam interest when transitioning into registration.
  return {
    text: `Let's create your student account${ctx.draft.examInterest ? ` for ${EXAM_LABELS[ctx.draft.examInterest]}` : ""}. What's your full name? (You can type 'skip' to use your email username later.)`,
    nextState: "registration_collect_name",
    examInterest: ctx.draft.examInterest ?? null,
    quickReplies: QR_REGISTRATION_NAME,
  };
}

function goToPortal(ctx: ChatContext): ChatReply {
  return {
    text: ctx.draft.examInterest
      ? `Great — head to the practice-test portal to start your ${EXAM_LABELS[ctx.draft.examInterest]} mock. You have 3 free sittings per exam type.`
      : "The practice-test portal is your starting point for every mock test. You have 3 free sittings per exam type.",
    nextState: "portal_redirect",
    portalLink: PORTAL_LINK,
    quickReplies: QR_PORTAL,
  };
}

// ─── Post-registration success message ──────────────────────────────────

/**
 * Build the success reply the engine returns after the API route has created
 * the account. The caller passes the returned student ID so the engine can
 * surface it to the visitor.
 */
export function registrationSuccessReply(studentId: string, ctx: ChatContext): ChatReply {
  const exam = ctx.draft.examInterest;
  const examLine = exam ? ` Your ${EXAM_LABELS[exam]} practice set is ready when you are.` : "";
  return {
    text: `You're all set! Your ALO student account is live. Student ID: ${studentId}. You can now log in and start a mock test.${examLine}\n\nOpen the practice-test portal to begin, or build a study plan first.`,
    nextState: "portal_redirect",
    portalLink: PORTAL_LINK,
    quickReplies: [
      { label: "Open practice test", value: "go to portal" },
      { label: "Open login", value: LOGIN_LINK },
      { label: "Build a study plan", value: "study plan" },
    ],
  };
}

/**
 * Build the failure reply when registration failed (email or edu-id
 * collision, validation error, etc.). The visitor can retry without losing
 * the rest of the conversation.
 */
export function registrationFailureReply(reason: string): ChatReply {
  return {
    text: `I couldn't create the account: ${reason}\n\nIf you already have an account with that email or educational ID, please log in instead. Otherwise, fix the issue above and type 'register' to try again.`,
    nextState: "faq",
    quickReplies: [
      { label: "Try again", value: "register" },
      { label: "Open login", value: LOGIN_LINK },
      { label: "Talk to a counselor", value: "counselor" },
    ],
  };
}

// ─── Re-exports for callers ─────────────────────────────────────────────

export { LOGIN_LINK, PORTAL_LINK, STUDY_PLAN_LINK, SHORTCUTS_LINK };
export { isValidEmail, isValidEduId, isValidPassword, normalizeEduId };
