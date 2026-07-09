import {
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  type LucideIcon,
} from "lucide-react";

export type ExamSection = {
  name: string;
  icon: LucideIcon;
  detail: string;
};

export type ExamType = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  accent: "blue" | "orange" | "royal";
  badge: string;
  duration: string;
  scale: string;
  popularity: string;
  sections: ExamSection[];
  highlights: string[];
  questionTypes: string[];
};

export const EXAM_TYPES: ExamType[] = [
  {
    id: "ielts-academic",
    slug: "ielts",
    name: "IELTS Academic",
    tagline: "The world's most popular English test for higher education",
    description:
      "IELTS-style academic practice covering all four skills with authentic question formats and band-score estimation.",
    longDescription:
      "Prepare for the IELTS Academic test with realistic mock exams, section-wise practice, and the ALO Smart Score Engine. Master Listening, Academic Reading, Writing Task 1 & 2, and the three-part Speaking interview.",
    accent: "blue",
    badge: "Most Popular",
    duration: "2h 44m",
    scale: "Band 0–9",
    popularity: "Taken by 4M+ students yearly",
    sections: [
      { name: "Listening", icon: Headphones, detail: "4 sections · 40 questions · 30 min" },
      { name: "Reading", icon: BookOpen, detail: "3 passages · 40 questions · 60 min" },
      { name: "Writing", icon: PenLine, detail: "Task 1 report + Task 2 essay · 60 min" },
      { name: "Speaking", icon: Mic, detail: "Part 1, 2 & 3 · 11–14 min" },
    ],
    highlights: [
      "Authentic IELTS-style question formats",
      "Band estimate per skill + overall",
      "Writing Task 1 & Task 2 evaluation",
      "Full 3-part speaking interview simulation",
    ],
    questionTypes: [
      "Multiple choice",
      "Matching headings",
      "True / False / Not Given",
      "Sentence completion",
      "Diagram label completion",
      "Writing Task 1 & 2",
      "Speaking cue card",
    ],
  },
  {
    id: "ielts-ukvi",
    slug: "ielts-ukvi",
    name: "IELTS UKVI",
    tagline: "UK visa & immigration approved secure English test",
    description:
      "UKVI-specific IELTS-style practice with secure test guidance and the same four-skill structure.",
    longDescription:
      "Practice for the IELTS for UKVI (UK Visas and Immigration) test. Same academic format with UKVI-specific labelling, secure test guidance, and clear practice-only disclaimers.",
    accent: "royal",
    badge: "UK Visa Ready",
    duration: "2h 44m",
    scale: "Band 0–9",
    popularity: "Required for UK visa applications",
    sections: [
      { name: "Listening", icon: Headphones, detail: "4 sections · 40 questions · 30 min" },
      { name: "Reading", icon: BookOpen, detail: "3 passages · 40 questions · 60 min" },
      { name: "Writing", icon: PenLine, detail: "Task 1 + Task 2 · 60 min" },
      { name: "Speaking", icon: Mic, detail: "3 parts · 11–14 min" },
    ],
    highlights: [
      "UKVI secure test guidance",
      "Practice-only disclaimer on every report",
      "Band estimate for visa readiness",
      "Full four-skill mock structure",
    ],
    questionTypes: [
      "Multiple choice",
      "Matching features",
      "Yes / No / Not Given",
      "Summary completion",
      "Short answer",
      "Writing Task 1 & 2",
      "Speaking discussion",
    ],
  },
  {
    id: "pte-academic",
    slug: "pte",
    name: "PTE Academic",
    tagline: "Computer-based English test accepted by universities worldwide",
    description:
      "PTE-style integrated practice with the Smart Score Engine delivering granular sub-skill breakdowns.",
    longDescription:
      "Prepare for PTE Academic with computer-based practice across Speaking & Writing, Reading, and Listening. The Smart Score Engine breaks down your performance across 20 question types.",
    accent: "orange",
    badge: "Fast Results",
    duration: "2h 00m",
    scale: "10–90",
    popularity: "Results in ~48 hours",
    sections: [
      { name: "Speaking & Writing", icon: Mic, detail: "Read aloud, repeat sentence, essay · 54–67 min" },
      { name: "Reading", icon: BookOpen, detail: "Fill blanks, reorder, MCQ · 29–30 min" },
      { name: "Listening", icon: Headphones, detail: "Summarise, dictation, MCQ · 30–43 min" },
    ],
    highlights: [
      "20 PTE-style question types",
      "Smart Score Engine sub-skill breakdown",
      "Read aloud & repeat sentence practice",
      "Summarise written text + essay",
    ],
    questionTypes: [
      "Read aloud",
      "Repeat sentence",
      "Describe image",
      "Re-tell lecture",
      "Summarise written text",
      "Essay",
      "Re-order paragraphs",
      "Write from dictation",
    ],
  },
  {
    id: "toefl-ibt",
    slug: "toefl",
    name: "TOEFL iBT",
    tagline: "Test of English as a Foreign Language for North America",
    description:
      "TOEFL iBT-style practice with integrated tasks across reading, listening, speaking and writing.",
    longDescription:
      "Prepare for the TOEFL iBT with integrated and independent task practice. Master academic reading passages, campus lectures, independent speaking, and integrated writing tasks.",
    accent: "blue",
    badge: "USA Focused",
    duration: "~2h 00m",
    scale: "0–120",
    popularity: "Accepted by 11,000+ institutions",
    sections: [
      { name: "Reading", icon: BookOpen, detail: "2 passages · 10 questions each · 35 min" },
      { name: "Listening", icon: Headphones, detail: "3 lectures + 2 conversations · 36 min" },
      { name: "Speaking", icon: Mic, detail: "1 independent + 3 integrated · 16 min" },
      { name: "Writing", icon: PenLine, detail: "Integrated + academic discussion · 29 min" },
    ],
    highlights: [
      "Integrated speaking & writing tasks",
      "Academic discussion practice",
      "Campus lecture listening drills",
      "Score estimate out of 120",
    ],
    questionTypes: [
      "Reading comprehension",
      "Listening lectures",
      "Independent speaking",
      "Integrated speaking",
      "Integrated writing",
      "Academic discussion writing",
    ],
  },
  {
    id: "duolingo",
    slug: "duolingo",
    name: "Duolingo English Test",
    tagline: "Adaptive, on-demand English proficiency test",
    description:
      "Duolingo-style adaptive practice across literacy, comprehension, conversation and production.",
    longDescription:
      "Prepare for the Duolingo English Test with adaptive question practice. Cover literacy, comprehension, conversation and production subscores with graded writing and speaking samples.",
    accent: "orange",
    badge: "Adaptive",
    duration: "~1h 00m",
    scale: "10–160",
    popularity: "Accepted by 4,000+ programs",
    sections: [
      { name: "Literacy", icon: BookOpen, detail: "Read & select, complete passages" },
      { name: "Comprehension", icon: Headphones, detail: "Listen & select, interactive listening" },
      { name: "Conversation", icon: Mic, detail: "Read aloud, speaking sample" },
      { name: "Production", icon: PenLine, detail: "Writing sample, describe image" },
    ],
    highlights: [
      "Adaptive question-style practice",
      "4 subscore breakdown",
      "Speaking & writing samples graded",
      "Interactive reading & listening",
    ],
    questionTypes: [
      "Read and select",
      "Listen and select",
      "Read aloud",
      "Writing sample",
      "Speaking sample",
      "Describe image",
      "Interactive reading",
    ],
  },
  {
    id: "oietc",
    slug: "oietc",
    name: "OIETC / Oxford ELLT",
    tagline: "Online English placement for university admission",
    description:
      "OIETC and Oxford ELLT-style practice with reading, listening, writing and a live interview simulation.",
    longDescription:
      "Prepare for OIETC and the Oxford English Language Level Test (ELLT) with four-skill practice plus an interview simulation. Build confidence for university admission English requirements.",
    accent: "royal",
    badge: "University Entry",
    duration: "~1h 30m",
    scale: "CEFR A2–C1",
    popularity: "Accepted by 60+ UK universities",
    sections: [
      { name: "Reading", icon: BookOpen, detail: "Passages + comprehension" },
      { name: "Listening", icon: Headphones, detail: "Audio-based questions" },
      { name: "Writing", icon: PenLine, detail: "Academic essay" },
      { name: "Speaking", icon: Mic, detail: "Interview simulation" },
    ],
    highlights: [
      "CEFR level estimate",
      "Interview simulation practice",
      "Academic essay evaluation",
      "Reading & listening drills",
    ],
    questionTypes: [
      "Reading comprehension",
      "Listening comprehension",
      "Academic essay writing",
      "Speaking interview",
      "Vocabulary in context",
    ],
  },
  {
    id: "oet",
    slug: "oet",
    name: "OET (Occupational English Test)",
    tagline: "English proficiency for healthcare professionals",
    description:
      "OET-style practice with healthcare scenarios across all four skills for nurses, doctors and allied health.",
    longDescription:
      "Prepare for the Occupational English Test with healthcare-specific scenarios. Practise reading medical texts, listening to consultations, writing referral letters, and speaking in a clinical role-play.",
    accent: "blue",
    badge: "Healthcare",
    duration: "~2h 50m",
    scale: "A–E grades",
    popularity: "Trusted by 12 healthcare regulators",
    sections: [
      { name: "Listening", icon: Headphones, detail: "Consultations + presentations" },
      { name: "Reading", icon: BookOpen, detail: "Healthcare texts + MCQ" },
      { name: "Writing", icon: PenLine, detail: "Referral / discharge letter" },
      { name: "Speaking", icon: Mic, detail: "Clinical role-play" },
    ],
    highlights: [
      "Healthcare scenario practice",
      "Referral letter writing tasks",
      "Clinical role-play speaking",
      "Grade A–E estimate",
    ],
    questionTypes: [
      "Listening consultations",
      "Reading healthcare texts",
      "Referral letter writing",
      "Clinical role-play speaking",
      "Vocabulary for healthcare",
    ],
  },
  {
    id: "alo-placement",
    slug: "alo-placement",
    name: "ALO Placement Test",
    tagline: "Internal English placement for ALO Education students",
    description:
      "ALO Education's internal placement covering grammar, vocabulary, reading, writing and speaking with a study readiness score.",
    longDescription:
      "The ALO Education internal placement test identifies your current English level and study readiness. Results feed directly into your personalised preparation plan and counselor recommendations.",
    accent: "orange",
    badge: "Internal",
    duration: "~1h 15m",
    scale: "Study readiness 0–100",
    popularity: "Built into ALO student onboarding",
    sections: [
      { name: "Grammar", icon: BookOpen, detail: "Structure & usage" },
      { name: "Vocabulary", icon: PenLine, detail: "Academic word knowledge" },
      { name: "Reading", icon: BookOpen, detail: "Comprehension" },
      { name: "Writing", icon: PenLine, detail: "Short response" },
      { name: "Speaking", icon: Mic, detail: "Diagnostic sample" },
    ],
    highlights: [
      "Study readiness score",
      "Personalised preparation plan",
      "Counselor-ready report",
      "Integrated with ALO CRM profile",
    ],
    questionTypes: [
      "Grammar multiple choice",
      "Vocabulary in context",
      "Reading comprehension",
      "Short writing response",
      "Speaking diagnostic",
    ],
  },
];

export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free Trial",
    price: "৳0",
    period: "one-time",
    description: "Start free — no card required.",
    features: [
      "1 free mock test (public students)",
      "3 free mock tests for ALO Education students",
      "Smart Score estimate",
      "Basic writing feedback",
      "Result report download",
    ],
    cta: "Start Free Practice",
  },
  {
    id: "single",
    name: "Single Mock Test",
    price: "৳499",
    period: "per test",
    description: "Buy one full mock test on demand.",
    features: [
      "1 full-length mock test",
      "Any exam type",
      "Full Smart Score report",
      "Writing + speaking feedback",
      "Downloadable PDF report",
      "Email report delivery",
    ],
    cta: "Buy Single Mock",
  },
  {
    id: "bundle",
    name: "5 Mock Test Bundle",
    price: "৳1,999",
    period: "5 tests",
    description: "Best value for serious preparation.",
    features: [
      "5 full-length mock tests",
      "Mix any exam types",
      "Full Smart Score report each",
      "Priority writing + speaking feedback",
      "Personalised study plan",
      "CRM counselor sync",
      "1:1 review session included",
    ],
    cta: "Buy Bundle & Save 20%",
    highlighted: true,
    badge: "Best Value",
  },
  {
    id: "prep",
    name: "English Prep Course",
    price: "Custom",
    period: "cohort",
    description: "Full guided preparation with expert teachers.",
    features: [
      "Unlimited mock tests during course",
      "Live classes with certified teachers",
      "1:1 speaking practice sessions",
      "Writing correction by examiners",
      "Personal counselor + study plan",
      "Visa & admission guidance",
    ],
    cta: "Talk to ALO Advisor",
  },
];

export type FaqItem = { q: string; a: string };

export const FAQS: FaqItem[] = [
  {
    q: "How many free mock tests can I take?",
    a: "ALO Education registered students receive 3 free mock tests total. New visitors receive 1 free mock test. Quota is enforced securely on our backend using your verified email, phone, device and session — refreshing the browser will not reset it. After your free quota, you can buy single tests, bundles, or join a prep course.",
  },
  {
    q: "Am I an ALO Education student?",
    a: "You are an ALO Education student if you exist in the ALO Web_CRM, hold a valid ALO Student ID (e.g. AE-2026000001), have a verified email or phone from CRM sync, or an admin has marked you as an ALO student. If you are unsure, verify your ALO Student ID from your dashboard.",
  },
  {
    q: "Are these scores official?",
    a: "No. ALO Education practice tests are preparation tools only. Scores are estimates produced by our Smart Score Engine and examiner review. Official exam results are issued only by authorised test providers such as IELTS, PTE, TOEFL and Duolingo. Some practice tests, scoring, feedback, and interview simulations may be supported by automated digital evaluation tools.",
  },
  {
    q: "How does the speaking practice work?",
    a: "The ALO Speaking Evaluator and Digital Practice Examiner guide you through realistic interview simulations. You complete a microphone test, see a question with preparation time, record your answer, and receive scores for fluency, pronunciation, grammar, lexical resource, coherence and confidence — plus improvement tips. Recordings are saved securely to your account.",
  },
  {
    q: "What payment methods are supported?",
    a: "We support SSLCommerz, bKash, Nagad and Stripe (integration ready). If a payment gateway is not yet connected, you will see a clear message to contact ALO Education. Admins can also create free coupons, discount coupons, scholarships, and counselor-approved access.",
  },
  {
    q: "Is my data shared with ALO Education CRM?",
    a: "When you register, a lead is created in the ALO Web_CRM with source = english.aloeducation.com. Your mock attempts, scores, speaking and writing feedback, counseling bookings and payment status can be synced so your counselor can guide you. If the CRM is unavailable, data is saved locally and retried. You can see your CRM sync status inside your dashboard.",
  },
  {
    q: "Can I download my results and recordings?",
    a: "Yes. Every completed mock test produces a downloadable PDF report with your scores, strengths, weaknesses and a recommended plan. Speaking recordings and writing submissions are auth-gated — only you can download your own files.",
  },
  {
    q: "Do you offer visa and university interview practice?",
    a: "Yes. Beyond exam speaking, we offer credibility interview practice, UK visa interview practice, university CAS interview practice and scholarship interview practice — all labelled clearly as simulated practice for preparation only.",
  },
];

export type Testimonial = {
  name: string;
  role: string;
  score: string;
  quote: string;
  initials: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Tasnia Rahman",
    role: "IELTS Academic · Dhaka",
    score: "Band 7.5",
    quote:
      "The mock tests felt exactly like the real exam. The Smart Score report pinpointed my weak areas in reading, and my band jumped from 6.0 to 7.5 in six weeks.",
    initials: "TR",
  },
  {
    name: "Mahin Chowdhury",
    role: "PTE Academic · Chittagong",
    score: "Score 79",
    quote:
      "Speaking practice with the ALO Speaking Evaluator was a game changer. I improved my fluency and the repeat-sentence drills were spot on.",
    initials: "MC",
  },
  {
    name: "Nusrat Jahan",
    role: "Duolingo English Test · Sylhet",
    score: "Score 135",
    quote:
      "Being an ALO student I got 3 free mocks. The adaptive practice and writing feedback were exactly what I needed for my Duolingo test.",
    initials: "NJ",
  },
  {
    name: "Rakib Hasan",
    role: "TOEFL iBT · Rajshahi",
    score: "Score 104",
    quote:
      "The integrated writing and speaking tasks were realistic. The downloadable report helped my counselor build a perfect study plan.",
    initials: "RH",
  },
];

export type MockTestQuestion = {
  id: number;
  type: string;
  passage?: string;
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
};

export const SAMPLE_QUESTIONS: MockTestQuestion[] = [
  {
    id: 1,
    type: "Multiple Choice · Reading",
    passage:
      "The rise of remote work has fundamentally reshaped urban economies. With fewer employees commuting daily, city-centre retail has seen a marked decline, while suburban demand for co-working spaces has surged. Planners now face the challenge of rebalancing infrastructure investment.",
    prompt:
      "According to the passage, what is one consequence of the shift to remote work?",
    options: [
      "Increased revenue for city-centre retail businesses",
      "Higher demand for suburban co-working spaces",
      "A reduction in suburban infrastructure investment",
      "More daily commuting into city centres",
    ],
    correct: 1,
    explanation:
      "The passage states that 'suburban demand for co-working spaces has surged', making option B correct.",
  },
  {
    id: 2,
    type: "True / False / Not Given · Reading",
    passage:
      "Coral reefs support roughly 25% of all marine species despite covering less than 1% of the ocean floor. Rising sea temperatures have triggered repeated bleaching events, threatening this biodiversity.",
    prompt:
      "Statement: Coral reefs cover more than 1% of the ocean floor.",
    options: ["True", "False", "Not Given"],
    correct: 1,
    explanation:
      "The passage says reefs cover 'less than 1% of the ocean floor', so the statement is False.",
  },
  {
    id: 3,
    type: "Fill in the Blanks · Listening",
    prompt:
      "Complete the sentence: The lecturer emphasised that sustainable development requires balancing economic growth with ______ protection.",
    options: [
      "environmental",
      "political",
      "commercial",
      "industrial",
    ],
    correct: 0,
    explanation:
      "'Sustainable development' pairs with 'environmental protection' in academic listening contexts.",
  },
  {
    id: 4,
    type: "Multiple Choice · Grammar",
    prompt:
      "Choose the grammatically correct sentence:",
    options: [
      "The data shows that the number of students are increasing.",
      "The data show that the number of students is increasing.",
      "The data shows that the number of students were increasing.",
      "The data show that the number of students are increasing.",
    ],
    correct: 1,
    explanation:
      "'Data' (plural) takes 'show'; 'the number of' takes a singular verb 'is increasing'.",
  },
];

export const TRUST_STATS = [
  { label: "Mock tests delivered", value: "48,200+" },
  { label: "Students prepared", value: "12,500+" },
  { label: "Average score lift", value: "+1.2 band" },
  { label: "Exam types covered", value: "8" },
];

export const INTERVIEW_MODES = [
  { name: "IELTS Speaking", desc: "Part 1, 2 & 3 cue card interview" },
  { name: "PTE Speaking", desc: "Read aloud, repeat sentence, describe image" },
  { name: "Duolingo Speaking", desc: "Speaking sample + read aloud" },
  { name: "Credibility Interview", desc: "Student credibility question practice" },
  { name: "UK Visa Interview", desc: "Visa officer-style simulation" },
  { name: "University CAS Interview", desc: "CAS interview readiness" },
  { name: "Scholarship Interview", desc: "Scholarship panel practice" },
  { name: "OET Clinical Role-play", desc: "Healthcare communication" },
];

export const AI_FEEDBACK_DIMENSIONS = [
  { key: "fluency", label: "Fluency", desc: "Pace, pausing & continuity" },
  { key: "pronunciation", label: "Pronunciation", desc: "Clarity & sound accuracy" },
  { key: "grammar", label: "Grammar", desc: "Range & accuracy" },
  { key: "lexical", label: "Lexical Resource", desc: "Vocabulary range & precision" },
  { key: "coherence", label: "Coherence", desc: "Ideas & linking" },
  { key: "confidence", label: "Confidence", desc: "Delivery & tone" },
];
