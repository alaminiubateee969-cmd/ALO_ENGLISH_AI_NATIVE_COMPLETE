/**
 * prisma/seed-internal-exams.ts — guarded synthetic sample seeder for the
 * two ALO-internal exams: COUNSELOR-ASSESSMENT and DOCUMENT-READINESS.
 *
 * Same rules as every other sample seeder: content is original, short-form
 * development fixture material — not official, licensed or full-length —
 * and the guard refuses to run anywhere except an opted-in disposable
 * database. It exists so the catalog's two internal exams are playable
 * in dev/CI exactly like the other twenty exam types, instead of being
 * dead "coming soon" entries. Runs as step 6 of prisma/seed-sample-bank.mjs.
 *
 * Run:  ALLOW_SYNTHETIC_SAMPLE_QUESTIONS=1 node prisma/seed-internal-exams.ts
 */

import { assertSafeSampleSeedTarget } from "./seed-sample-guard.mjs";
assertSafeSampleSeedTarget();
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type Q = {
  section: string;
  type: string;
  prompt: string;
  passage?: string;
  options?: string[];
  correctAnswer?: string;
  correctIndex?: number;
  wordLimit?: number;
  order: number;
};

async function seedExam(examCode: string, setTitle: string, durationMin: number, questions: Q[]) {
  const sampleTitle = `${setTitle} — Synthetic Sample (not full-length)`;
  const examType = await db.examType.findUnique({ where: { code: examCode } });
  if (!examType) {
    console.log(`⚠️  Exam type ${examCode} not found — skipping (run the core seed first)`);
    return;
  }
  const existing = await db.practiceSet.findFirst({ where: { examTypeId: examType.id, title: sampleTitle } });
  if (existing) {
    const count = await db.question.count({ where: { practiceSetId: existing.id } });
    if (count > 0) {
      console.log(`⏭️  ${examCode} already has ${count} questions — skipping`);
      return;
    }
  }
  const practiceSet =
    existing ??
    (await db.practiceSet.create({
      data: {
        title: sampleTitle,
        description:
          "Development fixture only; original short-form practice for the internal ALO assessment. Not official or full-length exam content.",
        durationMin,
        examTypeId: examType.id,
      },
    }));

  for (const q of questions) {
    await db.question.create({
      data: {
        practiceSetId: practiceSet.id,
        section: q.section,
        type: q.type,
        prompt: q.prompt,
        passage: q.passage ?? null,
        audioUrl: null,
        options: q.options ? JSON.stringify(q.options) : null,
        correctAnswer: q.correctAnswer ?? null,
        correctIndex: q.correctIndex ?? null,
        correctIndices: null,
        wordLimit: q.wordLimit ?? null,
        points: 1,
        order: q.order,
      },
    });
  }
  console.log(`✅ ${examCode}: ${questions.length} questions seeded`);
}

// ─── Counselor Assessment ───────────────────────────────────────────────────

const COUNSELOR_QUESTIONS: Q[] = [
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 1,
    passage: "A CAS (Confirmation of Acceptance for Studies) is an electronic document issued by a licensed UK sponsor after it has made an unconditional offer and checked the student's documents. A student cannot submit a UK Student visa application until the CAS has been assigned, because the application must quote the CAS reference number.",
    prompt: "According to the passage, why must a student wait for a CAS before applying for a UK Student visa?",
    options: [
      "The visa application must quote the CAS reference number",
      "The CAS is proof that tuition fees have been paid in full",
      "The Home Office issues the CAS after the visa is granted",
      "Universities only issue a CAS after enrolment",
    ],
    correctIndex: 0,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 2,
    prompt: "A student has an offer from a university but their passport expires in three months, before the course end date. What is the correct counselor advice?",
    options: [
      "Apply now and renew the passport after arrival",
      "Renew the passport first, then proceed with the application",
      "Use a family member's passport for the application",
      "Passport validity does not matter for student visas",
    ],
    correctIndex: 1,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 3,
    prompt: "Which document is used in the United States to show that a student has been admitted and can apply for an F-1 visa?",
    options: ["CAS", "CoE", "I-20", "LOA"],
    correctIndex: 2,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 4,
    prompt: "A counselor is preparing a student's financial evidence. Which practice is compliant?",
    options: [
      "Borrowing funds briefly so the balance looks sufficient on one day",
      "Showing funds held for the full period required by the visa rules, in an acceptable account",
      "Editing a bank statement to match the required amount",
      "Using a relative's business account without any supporting letter",
    ],
    correctIndex: 1,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 5,
    prompt: "What is the FIRST step of a sound counseling workflow with a new student?",
    options: [
      "Submitting applications to as many universities as possible",
      "Profiling: academics, budget, English level, destination goals and timeline",
      "Collecting a visa fee payment",
      "Booking flights and accommodation",
    ],
    correctIndex: 1,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 6,
    passage: "A conditional offer lists requirements the applicant must still meet — for example a final transcript or an English test score. Only when every condition is met does the offer become unconditional, which is normally required before a CAS or equivalent can be issued.",
    prompt: "A student holds a conditional offer that requires IELTS 6.5 and currently has 6.0. What should the counselor do?",
    options: [
      "Tell the university the score is 6.5 and upload the 6.0 certificate",
      "Request a CAS immediately because the offer already exists",
      "Plan a retake or a pre-sessional route so the condition can genuinely be met",
      "Ignore the condition; conditions are rarely checked",
    ],
    correctIndex: 2,
  },
  {
    section: "READING", type: "TRUE_FALSE_NOT_GIVEN", order: 7,
    passage: "Australia's Confirmation of Enrolment (CoE) is issued by the education provider once the student has accepted the offer and paid the required deposit. The CoE code is then used in the student visa application.",
    prompt: "The Australian CoE is issued by the Department of Home Affairs.",
    options: ["True", "False", "Not Given"],
    correctIndex: 1,
  },
  {
    section: "READING", type: "TRUE_FALSE_NOT_GIVEN", order: 8,
    passage: "Australia's Confirmation of Enrolment (CoE) is issued by the education provider once the student has accepted the offer and paid the required deposit. The CoE code is then used in the student visa application.",
    prompt: "Students must accept their offer and pay the required deposit before the CoE is issued.",
    options: ["True", "False", "Not Given"],
    correctIndex: 0,
  },
  {
    section: "READING", type: "FILL_BLANK", order: 9,
    prompt: "In the UK system, the document a licensed sponsor assigns to a student before the visa application is called a ____ (three-letter abbreviation).",
    correctAnswer: "CAS",
  },
  {
    section: "READING", type: "FILL_BLANK", order: 10,
    prompt: "A statement in which an applicant explains their study goals and reasons for choosing a course is commonly called a Statement of ____.",
    correctAnswer: "Purpose|SOP",
  },
  {
    section: "WRITING", type: "ESSAY", order: 11, wordLimit: 150,
    prompt: "Scenario response (at least 150 words): A student with IELTS 5.5 wants to apply for a UK master's course requiring 6.5, starting in eight weeks. Their budget is tight and they ask you to 'manage it somehow'. Write the honest advice you would give, including realistic options and the next concrete step.",
  },
  {
    section: "SPEAKING", type: "SPEAKING", order: 12,
    prompt: "Mock counseling conversation: A parent asks, 'Can you guarantee my son's visa will be approved?' Respond as the counselor. Speak for 1–2 minutes (type your response as a transcript).",
  },
];

// ─── Document Readiness ─────────────────────────────────────────────────────

const DOCUMENT_QUESTIONS: Q[] = [
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 1,
    passage: "For most student visa routes the passport must be valid for the whole planned stay, and many universities also require at least six months of validity at the time of application. A name mismatch between the passport and academic certificates is one of the most common causes of delay.",
    prompt: "According to the passage, which problem most commonly delays an application?",
    options: [
      "A name mismatch between passport and certificates",
      "A passport photo with a dark background",
      "Certificates printed on coloured paper",
      "Too many pages in the passport",
    ],
    correctIndex: 0,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 2,
    prompt: "Which set of documents forms the core academic file for a master's application?",
    options: [
      "Driving licence, utility bill, national ID",
      "Bachelor's certificate, full transcripts, and (if asked) grading scale",
      "Birth certificate, marriage certificate, tax return",
      "Only the final degree certificate is ever needed",
    ],
    correctIndex: 1,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 3,
    prompt: "Your certificate is in a language other than English. What should accompany it?",
    options: [
      "Nothing — universities translate documents themselves",
      "A certified English translation together with the original",
      "A handwritten summary in English",
      "Only a photocopy of the original",
    ],
    correctIndex: 1,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 4,
    prompt: "Which financial document pattern is acceptable evidence for a student visa?",
    options: [
      "A large deposit made yesterday with no history",
      "Funds held continuously for the required period in an accepted financial institution",
      "A screenshot of a mobile wallet balance",
      "A promise letter from a friend without bank evidence",
    ],
    correctIndex: 1,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 5,
    prompt: "Before submitting scans, what is the correct quality standard?",
    options: [
      "Any readable photo taken at an angle is fine",
      "Flat, colour, full-page scans with all corners visible and no glare",
      "Black-and-white low-resolution copies to keep files small",
      "Cropped images showing only the grades",
    ],
    correctIndex: 1,
  },
  {
    section: "READING", type: "TRUE_FALSE_NOT_GIVEN", order: 6,
    passage: "For most student visa routes the passport must be valid for the whole planned stay, and many universities also require at least six months of validity at the time of application. A name mismatch between the passport and academic certificates is one of the most common causes of delay.",
    prompt: "Some universities require at least six months of passport validity at application time.",
    options: ["True", "False", "Not Given"],
    correctIndex: 0,
  },
  {
    section: "READING", type: "TRUE_FALSE_NOT_GIVEN", order: 7,
    passage: "For most student visa routes the passport must be valid for the whole planned stay, and many universities also require at least six months of validity at the time of application. A name mismatch between the passport and academic certificates is one of the most common causes of delay.",
    prompt: "The passage states that a passport can be renewed at the visa application centre.",
    options: ["True", "False", "Not Given"],
    correctIndex: 2,
  },
  {
    section: "READING", type: "FILL_BLANK", order: 8,
    prompt: "A certified English ____ must accompany any certificate that is not originally in English.",
    correctAnswer: "translation",
  },
  {
    section: "READING", type: "FILL_BLANK", order: 9,
    prompt: "The academic record listing every subject and grade from a degree is called a ____.",
    correctAnswer: "transcript",
  },
  {
    section: "WRITING", type: "ESSAY", order: 10, wordLimit: 120,
    prompt: "Document summary note (at least 120 words): Summarise the documents in YOUR application file (or a student file you are preparing): list each document, what it proves, and anything that is still missing or inconsistent.",
  },
  {
    section: "SPEAKING", type: "SPEAKING", order: 11,
    prompt: "Document interview: An officer asks, 'Walk me through your application documents and prove how your studies will be funded.' Answer for 1–2 minutes (type your response as a transcript).",
  },
];

async function main() {
  console.log("Seeding ALO-internal exam fixtures (Counselor Assessment, Document Readiness)…\n");
  await seedExam("COUNSELOR-ASSESSMENT", "Counselor Assessment — Core Knowledge", 60, COUNSELOR_QUESTIONS);
  await seedExam("DOCUMENT-READINESS", "Document Readiness — Application File Check", 30, DOCUMENT_QUESTIONS);
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error("Internal-exams seed failed:", e);
    db.$disconnect();
    process.exit(1);
  });
