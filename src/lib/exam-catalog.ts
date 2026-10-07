// ALO English Test Platform — Universal CBT Exam Catalog
// All exam names are referenced in "-style practice" form per compliance rules.
// No official exam content reproduced. All practice questions are original.

import type { ExamType } from "./question-bank";

export type ExamCategory = "english" | "study-abroad" | "university" | "visa" | "alo-internal";

export type ExamModule = {
  id: string;
  name: string;
  slug: string;
  category: ExamCategory;
  examType: ExamType | null; // null = no question bank yet (e.g., interview-only / internal)
  styleLabel: string; // e.g., "IELTS-style practice test"
  badge: string;
  accent: "blue" | "orange" | "royal" | "green" | "purple";
  tagline: string;
  description: string;
  duration: string;
  scale: string;
  sections: { name: string; detail: string }[];
  highlights: string[];
  popular?: boolean;
  /**
   * false = internal/tooling entry that has no backend exam definition.
   * Hidden from every public catalog so no student can enter a dead flow.
   */
  available?: boolean;
};

export const EXAM_CATEGORIES: { id: ExamCategory; name: string; description: string; icon: string }[] = [
  { id: "english", name: "English Proficiency", description: "IELTS, PTE, TOEFL, Duolingo, OIETC, OET, LanguageCert, Linguaskill & more", icon: "language" },
  { id: "study-abroad", name: "Study Abroad Entrance", description: "Digital SAT, ACT, GRE, GMAT, LSAT, MCAT", icon: "plane" },
  { id: "university", name: "University Internal Tests", description: "Placement, foundation, pre-master & scholarship assessments", icon: "building" },
  { id: "visa", name: "Visa & Interview Practice", description: "UK credibility, CAS, visa, scholarship & admission interviews", icon: "shield" },
  { id: "alo-internal", name: "ALO Internal Exams", description: "Counselor, readiness, diagnostic & document checks", icon: "graduation" },
];

export const EXAM_MODULES: ExamModule[] = [
  // ===== ENGLISH PROFICIENCY =====
  {
    id: "ielts-academic", name: "IELTS Academic", slug: "ielts", category: "english", examType: "IELTS",
    styleLabel: "IELTS-style practice test", badge: "Most Popular", accent: "blue", popular: true,
    tagline: "Academic reading, Task 1 report & Task 2 essay",
    description: "Original IELTS-style academic practice covering all four skills with authentic question formats and band-score estimation.",
    duration: "2h 44m", scale: "Band 0–9",
    sections: [
      { name: "Listening", detail: "4 sections · 40 questions · 30 min" },
      { name: "Reading", detail: "3 passages · 40 questions · 60 min" },
      { name: "Writing Task 1", detail: "Report · 20 min" },
      { name: "Writing Task 2", detail: "Essay · 40 min" },
      { name: "Speaking Part 1", detail: "Introduction & interview" },
      { name: "Speaking Part 2", detail: "Cue card · 2 min" },
      { name: "Speaking Part 3", detail: "Discussion" },
    ],
    highlights: ["Authentic IELTS-style question formats", "Band estimate per skill + overall", "Writing Task 1 & 2 evaluation", "Full 3-part speaking interview simulation"],
  },
  {
    id: "ielts-general", name: "IELTS General Training", slug: "ielts-general", category: "english", examType: "IELTS",
    styleLabel: "IELTS-style practice test", badge: "General", accent: "blue",
    tagline: "General reading, letter writing & essay",
    description: "IELTS-style General Training practice with everyday reading passages, letter writing Task 1 and essay Task 2.",
    duration: "2h 44m", scale: "Band 0–9",
    sections: [
      { name: "Listening", detail: "4 sections · 40 questions" },
      { name: "Reading", detail: "3 sections · 40 questions · 60 min" },
      { name: "Writing Task 1", detail: "Letter · 20 min" },
      { name: "Writing Task 2", detail: "Essay · 40 min" },
      { name: "Speaking", detail: "3 parts · 11–14 min" },
    ],
    highlights: ["General reading passages", "Letter writing Task 1", "Essay Task 2", "Band estimate"],
  },
  {
    id: "ielts-ukvi", name: "IELTS UKVI", slug: "ielts-ukvi", category: "english", examType: "IELTS",
    styleLabel: "IELTS-style practice test", badge: "UK Visa", accent: "royal",
    tagline: "UKVI secure test guidance + practice disclaimer",
    description: "UKVI-specific IELTS-style practice with secure test guidance and clear practice-only disclaimers.",
    duration: "2h 44m", scale: "Band 0–9",
    sections: [
      { name: "Listening", detail: "4 sections · 40 questions" },
      { name: "Reading", detail: "3 passages · 40 questions" },
      { name: "Writing", detail: "Task 1 + Task 2" },
      { name: "Speaking", detail: "3 parts" },
      { name: "UKVI Guidance", detail: "Secure test rules" },
    ],
    highlights: ["UKVI secure test guidance", "Practice-only disclaimer", "Band estimate for visa readiness"],
  },
  {
    id: "pte", name: "PTE Academic", slug: "pte", category: "english", examType: "PTE",
    styleLabel: "PTE-style practice test", badge: "Fast Results", accent: "orange", popular: true,
    tagline: "20 integrated question types, Smart Score Engine",
    description: "PTE-style integrated computer-based practice across Speaking & Writing, Reading, and Listening.",
    duration: "2h 00m", scale: "10–90",
    sections: [
      { name: "Read Aloud", detail: "Speaking" },
      { name: "Repeat Sentence", detail: "Speaking" },
      { name: "Describe Image", detail: "Speaking" },
      { name: "Retell Lecture", detail: "Speaking" },
      { name: "Answer Short Question", detail: "Speaking" },
      { name: "Summarize Written Text", detail: "Writing" },
      { name: "Essay", detail: "Writing" },
      { name: "Reading Fill in Blanks", detail: "Reading" },
      { name: "Reorder Paragraphs", detail: "Reading" },
      { name: "Listening Fill in Blanks", detail: "Listening" },
      { name: "Highlight Correct Summary", detail: "Listening" },
      { name: "Select Missing Word", detail: "Listening" },
      { name: "Write from Dictation", detail: "Listening" },
    ],
    highlights: ["20 PTE-style question types", "Smart Score sub-skill breakdown", "Read aloud & repeat sentence", "Summarize + essay"],
  },
  {
    id: "toefl", name: "TOEFL iBT", slug: "toefl", category: "english", examType: "TOEFL",
    styleLabel: "TOEFL-style practice test", badge: "USA Focused", accent: "blue",
    tagline: "Integrated tasks & academic discussion",
    description: "TOEFL iBT-style practice with integrated tasks across reading, listening, speaking and writing.",
    duration: "2h 00m", scale: "0–120",
    sections: [
      { name: "Reading", detail: "2 passages · 10 Qs each" },
      { name: "Listening", detail: "3 lectures + 2 conversations" },
      { name: "Speaking", detail: "1 independent + 3 integrated" },
      { name: "Writing", detail: "Integrated + academic discussion" },
    ],
    highlights: ["Integrated speaking & writing", "Academic discussion practice", "Campus lecture drills", "Score out of 120"],
  },
  {
    id: "duolingo", name: "Duolingo English Test", slug: "duolingo", category: "english", examType: "Duolingo",
    styleLabel: "Duolingo-style practice test", badge: "Adaptive", accent: "orange", popular: true,
    tagline: "Adaptive practice, 4 subscores",
    description: "Duolingo-style adaptive question practice across literacy, comprehension, conversation and production.",
    duration: "1h 00m", scale: "10–160",
    sections: [
      { name: "Read and Select", detail: "Vocabulary" },
      { name: "Fill in the Blanks", detail: "Cloze" },
      { name: "Read Aloud", detail: "Pronunciation" },
      { name: "Listen and Type", detail: "Dictation" },
      { name: "Interactive Reading", detail: "Comprehension" },
      { name: "Writing Sample", detail: "Production" },
      { name: "Speaking Sample", detail: "Production" },
      { name: "Video Interview Practice", detail: "Speaking" },
    ],
    highlights: ["Adaptive question-style practice", "4 subscore breakdown", "Speaking & writing samples", "Interactive reading"],
  },
  {
    id: "oietc", name: "OIETC / Oxford ELLT", slug: "oietc", category: "english", examType: "OIETC",
    styleLabel: "OIETC-style practice test", badge: "University Entry", accent: "royal",
    tagline: "Interview simulation + CEFR estimate",
    description: "OIETC and Oxford ELLT-style practice with reading, listening, writing and a speaking interview simulation.",
    duration: "1h 30m", scale: "CEFR A2–C1",
    sections: [
      { name: "Listening", detail: "Audio-based questions" },
      { name: "Reading", detail: "Passages + comprehension" },
      { name: "Writing", detail: "Academic essay" },
      { name: "Speaking", detail: "Interview simulation" },
    ],
    highlights: ["CEFR level estimate", "Interview simulation", "Academic essay evaluation", "Reading & listening drills"],
  },
  {
    id: "oet", name: "OET (Healthcare)", slug: "oet", category: "english", examType: "OET",
    styleLabel: "OET-style practice test", badge: "Healthcare", accent: "blue",
    tagline: "Healthcare scenarios & clinical role-play",
    description: "OET-style practice with healthcare-specific scenarios across all four skills for nurses, doctors and allied health.",
    duration: "2h 50m", scale: "A–E grades",
    sections: [
      { name: "Listening", detail: "Consultations + presentations" },
      { name: "Reading", detail: "Healthcare texts + MCQ" },
      { name: "Profession-specific Writing", detail: "Referral / discharge letter" },
      { name: "Speaking Role Play", detail: "Clinical role-play" },
    ],
    highlights: ["Healthcare scenario practice", "Profession-specific writing", "Clinical role-play speaking", "Grade A–E estimate"],
  },
  {
    id: "languagecert", name: "LanguageCert", slug: "languagecert", category: "english", examType: "LanguageCert",
    styleLabel: "LanguageCert-style practice test", badge: "ESOL", accent: "green",
    tagline: "General & academic English ESOL practice",
    description: "LanguageCert-style ESOL practice covering all four skills with CEFR-aligned difficulty.",
    duration: "2h 30m", scale: "CEFR A1–C2",
    sections: [
      { name: "Listening", detail: "Audio comprehension" },
      { name: "Reading", detail: "Passages + MCQ" },
      { name: "Writing", detail: "Task 1 + Task 2" },
      { name: "Speaking", detail: "Interview" },
    ],
    highlights: ["CEFR-aligned difficulty", "All four skills", "Academic & general tracks", "Score estimate"],
  },
  {
    id: "linguaskill", name: "Cambridge Linguaskill", slug: "linguaskill", category: "english", examType: "Linguaskill",
    styleLabel: "Linguaskill-style practice test", badge: "Cambridge", accent: "purple",
    tagline: "Adaptive multi-level English assessment",
    description: "Linguaskill-style adaptive practice across Reading & Listening, Writing, and Speaking with CEFR placement.",
    duration: "1h 30m", scale: "CEFR A1–C2",
    sections: [
      { name: "Reading and Listening", detail: "Adaptive" },
      { name: "Writing", detail: "Email + essay" },
      { name: "Speaking", detail: "Recorded responses" },
    ],
    highlights: ["Adaptive multi-level", "CEFR placement", "Business & general variants", "Fast estimate"],
  },
  {
    id: "alo-placement", name: "ALO English Placement Test", slug: "alo-placement-test", category: "english", examType: "Placement",
    styleLabel: "ALO Placement practice test", badge: "Internal", accent: "orange",
    tagline: "Study readiness score + counselor report",
    description: "ALO Education's internal English placement covering grammar, vocabulary, reading, listening, writing and speaking with a study readiness score.",
    duration: "1h 15m", scale: "Level A1–C2 + readiness 0–100",
    sections: [
      { name: "Grammar", detail: "Structure & usage" },
      { name: "Vocabulary", detail: "Academic word knowledge" },
      { name: "Reading", detail: "Comprehension" },
      { name: "Listening", detail: "Audio comprehension" },
      { name: "Writing", detail: "Short response" },
      { name: "Speaking", detail: "Diagnostic sample" },
    ],
    highlights: ["Study readiness score", "CEFR level placement", "Personalised preparation plan", "Counselor-ready report"],
  },

  // ===== STUDY ABROAD ENTRANCE =====
  {
    id: "digital-sat", name: "Digital SAT", slug: "digital-sat", category: "study-abroad", examType: "SAT",
    styleLabel: "SAT-style practice test", badge: "Digital", accent: "blue", popular: true,
    tagline: "Adaptive Reading/Writing + Math modules",
    description: "Digital SAT-style adaptive practice with Reading & Writing and two adaptive Math modules.",
    duration: "2h 14m", scale: "400–1600",
    sections: [
      { name: "Reading and Writing", detail: "Adaptive · 64 min" },
      { name: "Math Module 1", detail: "35 min" },
      { name: "Math Module 2", detail: "Adaptive · 35 min" },
    ],
    highlights: ["Adaptive module structure", "Reading + Writing combined", "Math with calculator", "Score 400–1600 estimate"],
  },
  {
    id: "act", name: "ACT", slug: "act", category: "study-abroad", examType: "ACT",
    styleLabel: "ACT-style practice test", badge: "USA", accent: "royal",
    tagline: "English, Math, Reading, Science + optional Writing",
    description: "ACT-style practice across English, Math, Reading and Science with an optional Writing essay.",
    duration: "2h 55m", scale: "1–36",
    sections: [
      { name: "English", detail: "75 questions · 45 min" },
      { name: "Math", detail: "60 questions · 60 min" },
      { name: "Reading", detail: "40 questions · 35 min" },
      { name: "Science", detail: "40 questions · 35 min" },
      { name: "Optional Writing", detail: "Essay · 40 min" },
    ],
    highlights: ["Four core subjects", "Science reasoning", "Optional essay", "Composite score 1–36"],
  },
  {
    id: "gre", name: "GRE General Test", slug: "gre", category: "study-abroad", examType: "GRE",
    styleLabel: "GRE-style practice test", badge: "Graduate", accent: "orange", popular: true,
    tagline: "Verbal, Quantitative & Analytical Writing",
    description: "GRE-style practice with Verbal Reasoning, Quantitative Reasoning and Analytical Writing.",
    duration: "1h 58m", scale: "260–340",
    sections: [
      { name: "Verbal Reasoning", detail: "Text completion + sentence equivalence + RC" },
      { name: "Quantitative Reasoning", detail: "QC + problem solving + data interpretation" },
      { name: "Analytical Writing", detail: "Issue task · 30 min" },
    ],
    highlights: ["Text completion & sentence equivalence", "Quantitative comparison", "Data interpretation", "Verbal 130–170 + Quant 130–170"],
  },
  {
    id: "gmat", name: "GMAT Focus", slug: "gmat", category: "study-abroad", examType: "GMAT",
    styleLabel: "GMAT-style practice test", badge: "Business", accent: "blue",
    tagline: "Quant, Verbal & Data Insights",
    description: "GMAT Focus-style practice with Quantitative Reasoning, Verbal Reasoning and Data Insights.",
    duration: "2h 15m", scale: "205–805",
    sections: [
      { name: "Quantitative Reasoning", detail: "Problem solving" },
      { name: "Verbal Reasoning", detail: "CR + SC" },
      { name: "Data Insights", detail: "Data sufficiency + multi-source" },
      { name: "Analytical Writing", detail: "If required" },
    ],
    highlights: ["Data Insights section", "Critical reasoning", "Sentence correction", "Score 205–805 estimate"],
  },
  {
    id: "lsat", name: "LSAT", slug: "lsat", category: "study-abroad", examType: "LSAT",
    styleLabel: "LSAT-style practice test", badge: "Law", accent: "purple",
    tagline: "Logical, analytical & reading comprehension",
    description: "LSAT-style practice with Logical Reasoning, Analytical Reasoning (logic games) and Reading Comprehension.",
    duration: "2h 20m", scale: "120–180",
    sections: [
      { name: "Logical Reasoning", detail: "Arguments · assumption + weaken" },
      { name: "Analytical Reasoning", detail: "Logic games" },
      { name: "Reading Comprehension", detail: "Passages + inference" },
      { name: "Writing Sample", detail: "Unscored · argument" },
    ],
    highlights: ["Logic games practice", "Assumption & weaken", "Reading comprehension", "Score 120–180 estimate"],
  },
  {
    id: "mcat", name: "MCAT", slug: "mcat", category: "study-abroad", examType: "MCAT",
    styleLabel: "MCAT-style practice test", badge: "Medical", accent: "royal",
    tagline: "Sciences + CARS for medical school",
    description: "MCAT-style practice across Chemical/Physical, CARS, Biological/Biochemical and Psychological/Social foundations.",
    duration: "7h 30m", scale: "472–528",
    sections: [
      { name: "Chemical and Physical Foundations", detail: "Chem + physics" },
      { name: "CARS", detail: "Critical analysis & reasoning" },
      { name: "Biological and Biochemical Foundations", detail: "Bio + biochem" },
      { name: "Psychological, Social and Biological Foundations", detail: "Behavioral sciences" },
    ],
    highlights: ["CARS practice", "Biochemistry scenarios", "Chemistry calculations", "Score 472–528 estimate"],
  },

  // ===== UNIVERSITY INTERNAL =====
  {
    id: "uni-english-placement", name: "University English Placement Test", slug: "university-placement-test", category: "university", examType: "Placement",
    styleLabel: "University Placement practice test", badge: "University", accent: "green",
    tagline: "Place into the right English level",
    description: "University-style English placement test to determine the right course level for incoming students.",
    duration: "1h 30m", scale: "CEFR A1–C2",
    sections: [
      { name: "Grammar", detail: "Structure" },
      { name: "Vocabulary", detail: "Academic" },
      { name: "Reading", detail: "Comprehension" },
      { name: "Writing", detail: "Diagnostic" },
    ],
    highlights: ["CEFR placement", "Diagnostic writing", "Grammar & vocabulary", "Level recommendation"],
  },
  {
    id: "uni-math-placement", name: "University Math Placement Test", slug: "university-math-placement", category: "university", examType: "SAT",
    styleLabel: "University Math Placement practice test", badge: "University", accent: "blue",
    tagline: "Algebra, calculus & statistics readiness",
    description: "University-style math placement covering algebra, pre-calculus and introductory statistics.",
    duration: "1h 00m", scale: "0–100",
    sections: [
      { name: "Algebra", detail: "Equations + inequalities" },
      { name: "Functions", detail: "Graphs + domains" },
      { name: "Statistics", detail: "Descriptive + probability" },
    ],
    highlights: ["Algebra fundamentals", "Functions & graphs", "Basic probability", "Course placement"],
  },
  {
    id: "foundation-entry", name: "Foundation Entry Test", slug: "foundation-entry-test", category: "university", examType: "Placement",
    styleLabel: "Foundation Entry practice test", badge: "Foundation", accent: "orange",
    tagline: "Entry for foundation pathway programs",
    description: "Foundation program entry test covering academic English, numeracy and study skills.",
    duration: "1h 30m", scale: "Pass / Refer",
    sections: [
      { name: "Academic English", detail: "Reading + writing" },
      { name: "Numeracy", detail: "Foundation math" },
      { name: "Study Skills", detail: "Note-taking + analysis" },
    ],
    highlights: ["Foundation readiness", "Academic English", "Study skills check", "Pathway recommendation"],
  },
  {
    id: "pre-master-entry", name: "Pre-Master Entry Test", slug: "pre-master-entry-test", category: "university", examType: "Placement",
    styleLabel: "Pre-Master Entry practice test", badge: "Pre-Master", accent: "royal",
    tagline: "Entry for pre-master's pathway",
    description: "Pre-master's entry assessment covering academic writing, critical reading and quantitative reasoning.",
    duration: "2h 00m", scale: "Pass / Refer",
    sections: [
      { name: "Academic Writing", detail: "Essay" },
      { name: "Critical Reading", detail: "Analysis" },
      { name: "Quantitative Reasoning", detail: "Interpretation" },
    ],
    highlights: ["Academic writing", "Critical reading", "Quantitative reasoning", "Master's readiness"],
  },
  {
    id: "scholarship-assessment", name: "Scholarship Assessment Test", slug: "scholarship-assessment-test", category: "university", examType: "Placement",
    styleLabel: "Scholarship Assessment practice test", badge: "Scholarship", accent: "purple",
    tagline: "Merit assessment for scholarship awards",
    description: "Scholarship assessment combining academic reasoning, written analysis and an interview prompt.",
    duration: "2h 00m", scale: "0–100",
    sections: [
      { name: "Academic Reasoning", detail: "MCQ" },
      { name: "Written Analysis", detail: "Essay" },
      { name: "Interview Prompt", detail: "Speaking" },
    ],
    highlights: ["Merit evaluation", "Written analysis", "Interview practice", "Scholarship recommendation"],
  },

  // ===== VISA & INTERVIEW =====
  {
    id: "uk-credibility", name: "UK Credibility Interview", slug: "credibility-interview", category: "visa", examType: "VisaInterview",
    styleLabel: "Credibility Interview practice", badge: "UK Visa", accent: "royal", popular: true,
    tagline: "Practice the UK student credibility interview",
    description: "Practice the UK student visa credibility interview with realistic question prompts and recording practice.",
    duration: "15–20 min", scale: "Confidence score",
    sections: [
      { name: "Course & University", detail: "Why this course?" },
      { name: "Finances", detail: "Funding proof" },
      { name: "Post-study plans", detail: "Return intention" },
    ],
    highlights: ["Realistic credibility prompts", "Recording practice", "Confidence scoring", "Feedback tips"],
  },
  {
    id: "cas-interview", name: "CAS Interview Practice", slug: "cas-interview", category: "visa", examType: "VisaInterview",
    styleLabel: "CAS Interview practice", badge: "CAS", accent: "blue",
    tagline: "Confirmation of Acceptance for Studies interview",
    description: "Practice the university CAS interview used to confirm your acceptance for studies in the UK.",
    duration: "10–15 min", scale: "Confidence score",
    sections: [
      { name: "Course Knowledge", detail: "Module understanding" },
      { name: "English Ability", detail: "Live speaking check" },
      { name: "Logistics", detail: "Accommodation + fees" },
    ],
    highlights: ["CAS-style prompts", "Speaking assessment", "Confidence scoring", "Improvement tips"],
  },
  {
    id: "visa-interview", name: "Visa Interview Practice", slug: "visa-interview", category: "visa", examType: "VisaInterview",
    styleLabel: "Visa Interview practice", badge: "Visa", accent: "orange",
    tagline: "General visa interview simulation",
    description: "Practice general student visa interview questions for any destination country.",
    duration: "15 min", scale: "Confidence score",
    sections: [
      { name: "Background", detail: "Education + work" },
      { name: "Intent", detail: "Study purpose" },
      { name: "Ties", detail: "Home country ties" },
    ],
    highlights: ["Multi-country prompts", "Recording practice", "Confidence scoring", "Feedback"],
  },
  {
    id: "scholarship-interview", name: "Scholarship Interview Practice", slug: "scholarship-interview", category: "visa", examType: "VisaInterview",
    styleLabel: "Scholarship Interview practice", badge: "Scholarship", accent: "purple",
    tagline: "Panel interview for scholarship awards",
    description: "Practice scholarship panel interview questions on leadership, goals and contribution.",
    duration: "20 min", scale: "Confidence score",
    sections: [
      { name: "Leadership", detail: "Examples" },
      { name: "Goals", detail: "Career + study" },
      { name: "Contribution", detail: "Community" },
    ],
    highlights: ["Panel-style prompts", "Leadership questions", "Recording practice", "Confidence scoring"],
  },
  {
    id: "admission-interview", name: "University Admission Interview", slug: "admission-interview", category: "visa", examType: "VisaInterview",
    styleLabel: "Admission Interview practice", badge: "Admission", accent: "green",
    tagline: "University admission interview simulation",
    description: "Practice university admission interview questions covering motivation, fit and academic background.",
    duration: "20 min", scale: "Confidence score",
    sections: [
      { name: "Motivation", detail: "Why this university?" },
      { name: "Fit", detail: "Course alignment" },
      { name: "Background", detail: "Academic + extracurricular" },
    ],
    highlights: ["Admission-style prompts", "Motivation questions", "Recording practice", "Confidence scoring"],
  },

  // ===== ALO INTERNAL =====
  {
    id: "counselor-assessment", name: "Counselor Assessment Test", slug: "counselor-assessment-test", category: "alo-internal", examType: null, available: false,
    styleLabel: "ALO Internal practice test", badge: "Internal", accent: "blue",
    tagline: "Assess counselor knowledge & process",
    description: "Internal ALO test to assess counselor knowledge of countries, universities, visas and ALO process.",
    duration: "1h 00m", scale: "0–100",
    sections: [
      { name: "Countries & Visas", detail: "Knowledge" },
      { name: "Universities", detail: "Programs + entry" },
      { name: "ALO Process", detail: "Workflow" },
    ],
    highlights: ["Counselor onboarding", "Process knowledge", "Score + certification", "Internal only"],
  },
  {
    id: "student-readiness", name: "Student Readiness Test", slug: "student-readiness-test", category: "alo-internal", examType: "Placement",
    styleLabel: "ALO Internal practice test", badge: "Internal", accent: "orange",
    tagline: "Are you ready to apply abroad?",
    description: "Internal ALO test measuring a student's readiness to begin applications abroad.",
    duration: "45 min", scale: "Readiness 0–100",
    sections: [
      { name: "English", detail: "Quick diagnostic" },
      { name: "Documents", detail: "Readiness check" },
      { name: "Finance", detail: "Awareness" },
    ],
    highlights: ["Readiness score", "Gap analysis", "Counselor handoff", "Action plan"],
  },
  {
    id: "english-diagnostic", name: "English Level Diagnostic", slug: "english-level-diagnostic", category: "alo-internal", examType: "Placement",
    styleLabel: "ALO Internal practice test", badge: "Diagnostic", accent: "royal",
    tagline: "Quick CEFR level check",
    description: "A quick adaptive diagnostic to place students at the right CEFR level for prep planning.",
    duration: "30 min", scale: "CEFR A1–C2",
    sections: [
      { name: "Grammar", detail: "Adaptive" },
      { name: "Vocabulary", detail: "Adaptive" },
      { name: "Reading", detail: "Short passage" },
    ],
    highlights: ["Adaptive", "CEFR placement", "5-minute option", "Prep plan input"],
  },
  {
    id: "document-readiness", name: "Document Readiness Test", slug: "document-readiness-test", category: "alo-internal", examType: null, available: false,
    styleLabel: "ALO Internal practice test", badge: "Checklist", accent: "green",
    tagline: "Checklist for application documents",
    description: "An interactive checklist test verifying that a student's documents are application-ready.",
    duration: "20 min", scale: "Checklist %",
    sections: [
      { name: "Academic", detail: "Transcripts + certificates" },
      { name: "Identity", detail: "Passport + photo" },
      { name: "Financial", detail: "Bank statement + sponsorship" },
    ],
    highlights: ["Document checklist", "Missing-item alerts", "Counselor handoff", "Application-ready flag"],
  },
  {
    id: "visa-readiness", name: "Visa Readiness Test", slug: "visa-readiness-test", category: "alo-internal", examType: "VisaInterview",
    styleLabel: "ALO Internal practice test", badge: "Visa", accent: "purple",
    tagline: "Ready for your visa interview?",
    description: "An internal ALO test to verify a student is ready for their visa interview — documents, finances and interview prep.",
    duration: "30 min", scale: "Readiness 0–100",
    sections: [
      { name: "Document Check", detail: "Visa file" },
      { name: "Finance Check", detail: "Funds proof" },
      { name: "Interview Practice", detail: "Recording" },
    ],
    highlights: ["Visa file check", "Finance verification", "Interview recording", "Readiness certificate"],
  },
];

export const PRACTICE_DISCLAIMER = "This is original exam-aligned practice for preparation only. Scores are practice estimates. Not official exam content. No guarantee of real-exam repetition.";

export const CBT_ENGINE_FEATURES = [
  { icon: "timer", title: "Section & full exam timer", desc: "Sticky countdown with auto-submit" },
  { icon: "palette", title: "Question palette", desc: "Answered / unanswered / flagged status" },
  { icon: "save", title: "Auto-save & refresh recovery", desc: "Never lose progress" },
  { icon: "submit", title: "Submit confirmation", desc: "Anti-refresh protection" },
  { icon: "pause", title: "Pause / resume", desc: "If the exam allows" },
  { icon: "report", title: "Smart Score Report", desc: "Band / score / percentile + skill breakdown" },
  { icon: "review", title: "Answer review + explanations", desc: "Learn from every question" },
  { icon: "download", title: "Downloadable report", desc: "PDF with strengths & plan" },
];

export const CBT_QUESTION_TYPES = [
  "Single choice MCQ", "Multiple choice MCQ", "True / False / Not Given", "Yes / No / Not Given",
  "Fill in the blank", "Dropdown blank", "Short answer", "Essay writing", "Graph / chart writing",
  "Listening audio question", "Speaking recording", "Read aloud", "Repeat sentence",
  "Describe image", "Retell lecture", "Summarize written text", "Summarize spoken text",
  "Drag & drop matching", "Matching headings", "Matching sentence endings", "Reorder paragraphs",
  "Numeric answer", "Code / text input", "Case study", "Scenario-based", "File upload", "Image-based",
];

/** Modules with a working backend exam definition — safe to advertise. */
export const PUBLISHED_EXAM_MODULES: ExamModule[] = EXAM_MODULES.filter(
  (e) => e.available !== false
);
