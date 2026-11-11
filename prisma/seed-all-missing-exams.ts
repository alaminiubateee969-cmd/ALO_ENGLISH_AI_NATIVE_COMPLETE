/**
 * LEGACY SAMPLE-SEED SCRIPT — synthetic short-form practice fixtures for
 * several exam types. Content is not authorized, official, full-length, or
 * validated against current specifications. Guarded to disposable test/sample
 * databases only; never part of the production seed chain.
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
  options?: string; // JSON array
  correctAnswer?: string;
  correctIndex?: number;
  correctIndices?: string;
  wordLimit?: number;
  points?: number;
  order?: number;
};

async function seedExam(examCode: string, setTitle: string, setDescription: string, durationMin: number, questions: Q[]) {
  const sampleTitle = `${setTitle} — Synthetic Sample (not full-length)`;
  const sampleDescription = `${setDescription}. Development fixture only; not official, licensed, or full-length exam content.`;
  const examType = await db.examType.findUnique({ where: { code: examCode } });
  if (!examType) {
    console.log(`⚠️  Exam type ${examCode} not found — skipping`);
    return;
  }

  // Check if practice set already exists
  const existing = await db.practiceSet.findFirst({ where: { examTypeId: examType.id, title: sampleTitle } });
  if (existing) {
    const qCount = await db.question.count({ where: { practiceSetId: existing.id } });
    if (qCount > 0) {
      console.log(`⏭️  ${examCode} already has ${qCount} questions — skipping`);
      return;
    }
  }

  const practiceSet = existing || await db.practiceSet.create({
    data: {
      title: sampleTitle,
      description: sampleDescription,
      durationMin,
      examTypeId: examType.id,
    },
  });

  for (const q of questions) {
    // Normalize TRUE_FALSE(_NOT_GIVEN): ensure options + correctIndex exist so
    // every question is gradeable. Legacy entries only stored correctAnswer.
    const type = q.type.toUpperCase();
    let options = q.options || null;
    let correctIndex = q.correctIndex ?? null;
    let correctAnswer = q.correctAnswer || null;
    if ((type === "TRUE_FALSE_NOT_GIVEN" || type === "TRUE_FALSE") && !options) {
      const labels = type === "TRUE_FALSE" ? ["True", "False"] : ["True", "False", "Not Given"];
      options = JSON.stringify(labels);
      if (correctIndex === null && correctAnswer) {
        const norm = String(correctAnswer).toUpperCase().replace(/[^A-Z]/g, "");
        const map: Record<string, number> = { T: 0, TRUE: 0, YES: 0, Y: 0, F: 1, FALSE: 1, NO: 1, N: 1 };
        if (type === "TRUE_FALSE_NOT_GIVEN") { map.NG = 2; map.NOTGIVEN = 2; }
        correctIndex = map[norm] ?? null;
      }
    }
    // MATCHING with a single correctIndex but no correctIndices array: normalise.
    let correctIndices = q.correctIndices || null;
    if (type === "MATCHING" && !correctIndices && correctIndex !== null) {
      correctIndices = JSON.stringify([correctIndex]);
    }

    await db.question.create({
      data: {
        practiceSetId: practiceSet.id,
        section: q.section,
        type: q.type,
        prompt: q.prompt,
        passage: q.passage || null,
        audioUrl: null, // populated later by scripts/generate-listening-audio.mjs
        options,
        correctAnswer,
        correctIndex,
        correctIndices,
        wordLimit: q.wordLimit || null,
        points: q.points || 1,
        order: q.order || 0,
      },
    });
  }

  console.log(`✅ ${examCode}: ${questions.length} questions seeded`);
}

// ═══ IELTS General Training ═════════════════════════════════════════════

const IELTS_G_QUESTIONS: Q[] = [
  // Reading Section 1 — workplace notice
  {
    section: "READING", type: "TRUE_FALSE_NOT_GIVEN", order: 1,
    passage: "STAFF NOTICE — Annual Leave Applications\nAll staff must submit annual leave applications at least 4 weeks before the requested date. Applications are processed on a first-come, first-served basis. A maximum of 2 staff members per department may be on leave simultaneously. Emergency leave requires a doctor's certificate for absences exceeding 3 days. Unused leave cannot be carried forward beyond March 31st of the following year.",
    prompt: "Staff can apply for annual leave at any time without advance notice.",
    correctAnswer: "FALSE",
  },
  {
    section: "READING", type: "TRUE_FALSE_NOT_GIVEN", order: 2,
    prompt: "More than two staff from the same department can be on leave at the same time.",
    correctAnswer: "FALSE",
  },
  {
    section: "READING", type: "TRUE_FALSE_NOT_GIVEN", order: 3,
    prompt: "A doctor's certificate is needed for emergency leave of more than three days.",
    correctAnswer: "TRUE",
  },
  {
    section: "READING", type: "FILL_BLANK", order: 4,
    prompt: "Unused leave must be taken by ____ of the following year.",
    correctAnswer: "March 31st",
  },
  // Reading Section 2 — matching headings
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 5,
    passage: "The history of coffee houses in London dates back to the 17th century. The first coffee house opened in 1652 and quickly became a center for intellectual discussion and business dealings. By 1663, there were over 80 coffee houses in London. Each attracted a specific clientele — some were frequented by merchants, others by writers, and some by politicians. The famous Lloyd's insurance market began as a coffee house where shipowners and merchants met to discuss business.",
    prompt: "When did the first coffee house open in London?",
    options: JSON.stringify(["1650", "1652", "1663", "1680"]),
    correctIndex: 1,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 6,
    prompt: "Lloyd's insurance market started as:",
    options: JSON.stringify(["A bank", "A coffee house", "A shipping company", "A government office"]),
    correctIndex: 1,
  },
  // Writing — Task 1 (Letter)
  {
    section: "WRITING", type: "ESSAY", order: 7, wordLimit: 150,
    prompt: "You recently moved to a new city and want to join a local sports club. Write a letter to the club manager. In your letter:\n- Introduce yourself\n- Explain which sport you are interested in\n- Ask about membership fees and schedule\n\nWrite at least 150 words.",
  },
  // Writing — Task 2 (Essay)
  {
    section: "WRITING", type: "ESSAY", order: 8, wordLimit: 250,
    prompt: "Some people think that the government should provide free public transportation to reduce traffic congestion. Others believe that individuals should pay for their own transport. Discuss both views and give your opinion.\n\nWrite at least 250 words.",
  },
  // Speaking
  {
    section: "SPEAKING", type: "SPEAKING", order: 9,
    prompt: "Part 1: Let's talk about your hometown. Where is it? What do you like most about it? Has it changed much since you were a child?",
  },
  {
    section: "SPEAKING", type: "SPEAKING", order: 10,
    prompt: "Part 2: Describe a time when you received good news. You should say: what the news was, when you received it, who told you, and explain how you felt about it.",
  },
];

// ═══ IELTS UKVI ═════════════════════════════════════════════════════════

const IELTS_UKVI_QUESTIONS: Q[] = [
  {
    section: "LISTENING", type: "FILL_BLANK", order: 1,
    passage: "Welcome to the UK visa application center. Please have your passport, application reference number, and appointment confirmation ready. Biometric enrollment includes fingerprint scanning and a digital photograph. The process takes approximately 15 minutes. Your documents will be forwarded to UK Visas and Immigration for a decision within 15 working days for standard service, or 5 working days for priority service.",
    prompt: "Standard visa processing takes ____ working days.",
    correctAnswer: "15",
  },
  {
    section: "LISTENING", type: "MULTIPLE_CHOICE", order: 2,
    prompt: "What does biometric enrollment include?",
    options: JSON.stringify(["Only fingerprints", "Only a photo", "Fingerprints and digital photo", "A signature"]),
    correctIndex: 2,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 3,
    passage: "UKVI Life Skills Test: The A1 test is for spouses and partners. The A2 test is for extension of family visas after 2.5 years. The B1 test is for indefinite leave to remain and British citizenship. Each test is a 16-18 minute speaking and listening assessment with an examiner and one other candidate.",
    prompt: "Which UKVI Life Skills test is required for British citizenship?",
    options: JSON.stringify(["A1", "A2", "B1", "C1"]),
    correctIndex: 2,
  },
  {
    section: "SPEAKING", type: "SPEAKING", order: 4,
    prompt: "UKVI Life Skills B1: You will discuss a topic with the examiner. Topic: 'How important is it to learn about the customs of a country you visit?' Please speak for 2 minutes.",
  },
  {
    section: "WRITING", type: "ESSAY", order: 5, wordLimit: 150,
    prompt: "Write a short report (150 words) about a community event you attended, explaining why it was important for local integration.",
  },
];

// ═══ OET (Occupational English Test — Healthcare) ═══════════════════════

const OET_QUESTIONS: Q[] = [
  {
    section: "LISTENING", type: "FILL_BLANK", order: 1,
    passage: "Doctor: What brings you in today, Mrs. Chen? Patient: I've been experiencing chest pain for the past three days, especially when I climb stairs. Doctor: Can you describe the pain? Is it sharp or dull? Patient: It's a dull ache that sometimes spreads to my left arm. Doctor: Any shortness of breath or sweating? Patient: Yes, I feel breathless even with light activity.",
    prompt: "The patient's pain spreads to her ____ arm.",
    correctAnswer: "left",
  },
  {
    section: "LISTENING", type: "MULTIPLE_CHOICE", order: 2,
    prompt: "What type of pain is the patient experiencing?",
    options: JSON.stringify(["Sharp", "Dull ache", "Burning", "Stabbing"]),
    correctIndex: 1,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 3,
    passage: "Medication Administration Protocol: All medications must be checked against the patient's wristband before administration. The 'Five Rights' must be verified: right patient, right drug, right dose, right route, right time. Any discrepancy must be reported to the prescribing physician immediately. High-risk medications require a second nurse to co-sign the administration record.",
    prompt: "How many 'Rights' must be verified before medication administration?",
    options: JSON.stringify(["Three", "Four", "Five", "Six"]),
    correctIndex: 2,
  },
  {
    section: "READING", type: "TRUE_FALSE_NOT_GIVEN", order: 4,
    prompt: "High-risk medications require two nurses to sign the record.",
    correctAnswer: "TRUE",
  },
  {
    section: "WRITING", type: "ESSAY", order: 5, wordLimit: 180,
    prompt: "Writing task (Nursing): Using the case notes provided, write a discharge letter to a community nurse about a patient recovering from hip replacement surgery. Include: patient history, surgery details, current condition, and follow-up care needed. Write 180-200 words.",
  },
  {
    section: "SPEAKING", type: "SPEAKING", order: 6,
    prompt: "Speaking role-play (Nursing): You are a nurse. The patient is a 60-year-old man who has been diagnosed with Type 2 diabetes. Explain his condition, the importance of diet and exercise, and how to monitor blood sugar levels. You have 5 minutes.",
  },
];

// ═══ LanguageCert ═══════════════════════════════════════════════════════

const LANGUAGECERT_QUESTIONS: Q[] = [
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 1,
    passage: "The invention of the printing press by Johannes Gutenberg in 1440 revolutionized the spread of knowledge in Europe. Before the press, books were copied by hand, making them rare and expensive. The press enabled mass production of texts, leading to increased literacy and the rapid spread of new ideas during the Renaissance and Reformation.",
    prompt: "Who invented the printing press?",
    options: JSON.stringify(["Leonardo da Vinci", "Johannes Gutenberg", "Isaac Newton", "Galileo Galilei"]),
    correctIndex: 1,
  },
  {
    section: "READING", type: "FILL_BLANK", order: 2,
    prompt: "Before the printing press, books were copied by ____.",
    correctAnswer: "hand",
  },
  {
    section: "WRITING", type: "ESSAY", order: 3, wordLimit: 250,
    prompt: "Write an essay (250 words) on the following topic: 'Social media has changed the way people communicate.' Do you agree or disagree? Provide reasons and examples.",
  },
  {
    section: "SPEAKING", type: "SPEAKING", order: 4,
    prompt: "Speaking Task: Describe a person who has had a significant influence on your life. You should say: who they are, how you know them, what they do, and explain why they have influenced you. Speak for 3 minutes.",
  },
  {
    section: "LISTENING", type: "MULTIPLE_CHOICE", order: 5,
    passage: "Welcome to the city library tour. The library has three floors. The ground floor has the fiction section and children's books. The first floor has non-fiction and reference materials. The second floor has study rooms and computers. The library is open from 9 AM to 8 PM on weekdays.",
    prompt: "Where is the fiction section located?",
    options: JSON.stringify(["First floor", "Second floor", "Ground floor", "Basement"]),
    correctIndex: 2,
  },
];

// ═══ Cambridge Linguaskill ═══════════════════════════════════════════════

const LINGUASKILL_QUESTIONS: Q[] = [
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 1,
    passage: "Climate change is affecting agricultural productivity worldwide. Rising temperatures and changing rainfall patterns have reduced crop yields in many regions. Farmers are adapting by planting drought-resistant varieties and using more efficient irrigation systems. However, these solutions are not accessible to all, particularly small-scale farmers in developing countries.",
    prompt: "What is the main challenge mentioned in the passage?",
    options: JSON.stringify(["Lack of seeds", "Climate change affecting agriculture", "Too much rainfall", "High food prices"]),
    correctIndex: 1,
  },
  {
    section: "READING", type: "FILL_BLANK", order: 2,
    prompt: "Farmers are using ____ irrigation systems to adapt.",
    correctAnswer: "efficient",
  },
  {
    section: "WRITING", type: "ESSAY", order: 3, wordLimit: 200,
    prompt: "Writing Task: You recently attended a professional development workshop. Write an email to your manager (200 words) describing what you learned and how it will benefit your work.",
  },
  {
    section: "SPEAKING", type: "SPEAKING", order: 4,
    prompt: "Speaking Task: You will be shown a topic and asked to speak about it for 2 minutes. Topic: 'The importance of teamwork in the workplace.'",
  },
  {
    section: "LISTENING", type: "MULTIPLE_CHOICE", order: 5,
    passage: "The company meeting will be held on Thursday at 2 PM in Conference Room B. All department heads must attend. The agenda includes the quarterly budget review and the new project timeline. Please bring your department reports.",
    prompt: "When is the company meeting?",
    options: JSON.stringify(["Wednesday at 2 PM", "Thursday at 2 PM", "Thursday at 3 PM", "Friday at 2 PM"]),
    correctIndex: 1,
  },
];

// ═══ OIETC / Oxford ELLT ════════════════════════════════════════════════

const OIETC_QUESTIONS: Q[] = [
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 1,
    passage: "Online learning has become increasingly popular, especially after the COVID-19 pandemic. It offers flexibility and convenience, allowing students to learn at their own pace. However, online learning also has disadvantages, including lack of face-to-face interaction and the need for self-discipline. Successful online learners typically have strong time management skills and are comfortable with technology.",
    prompt: "What is a disadvantage of online learning mentioned in the text?",
    options: JSON.stringify(["High cost", "Lack of face-to-face interaction", "Limited subjects", "No internet needed"]),
    correctIndex: 1,
  },
  {
    section: "READING", type: "TRUE_FALSE_NOT_GIVEN", order: 2,
    prompt: "Online learning became more popular after the COVID-19 pandemic.",
    correctAnswer: "TRUE",
  },
  {
    section: "WRITING", type: "ESSAY", order: 3, wordLimit: 250,
    prompt: "Write an essay (250 words): 'University education should be free for all students.' Do you agree or disagree? Give reasons for your answer.",
  },
  {
    section: "SPEAKING", type: "SPEAKING", order: 4,
    prompt: "Speaking Task: Describe a skill you would like to learn. You should say: what the skill is, why you want to learn it, how you would learn it, and how it would benefit you. Speak for 3 minutes.",
  },
  {
    section: "LISTENING", type: "FILL_BLANK", order: 5,
    passage: "The university's international office is located in Building C, Room 204. Office hours are from 9 AM to 5 PM, Monday through Friday. Students can get help with visa applications, course enrollment, and accommodation. Walk-in consultations are available, but appointments are recommended for complex matters.",
    prompt: "The international office is in Room ____.",
    correctAnswer: "204",
  },
];

// ═══ TOEIC ═══════════════════════════════════════════════════════════════

const TOEIC_QUESTIONS: Q[] = [
  {
    section: "LISTENING", type: "MULTIPLE_CHOICE", order: 1,
    passage: "Man: Did you send the quarterly report to the regional manager? Woman: Yes, I emailed it this morning and he confirmed receipt. Man: Great, he needs it for the board meeting tomorrow.",
    prompt: "When is the board meeting?",
    options: JSON.stringify(["Today", "Tomorrow", "Next week", "Next month"]),
    correctIndex: 1,
  },
  {
    section: "LISTENING", type: "MULTIPLE_CHOICE", order: 2,
    passage: "Attention passengers. The 3:15 train to Manchester has been delayed by 20 minutes due to signal problems. We apologize for the inconvenience. Please check the departure boards for updates.",
    prompt: "Why is the train delayed?",
    options: JSON.stringify(["Weather", "Signal problems", "Staff shortage", "Track maintenance"]),
    correctIndex: 1,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 3,
    passage: "MEMO: To all staff. The annual company picnic will be held on Saturday, July 15th at Riverside Park from 11 AM to 4 PM. Families are welcome. Please RSVP to HR by July 1st. Bring a dish to share.",
    prompt: "What should employees do before July 1st?",
    options: JSON.stringify(["Bring a dish", "RSVP to HR", "Arrive at 11 AM", "Go to Riverside Park"]),
    correctIndex: 1,
  },
  {
    section: "READING", type: "FILL_BLANK", order: 4,
    prompt: "The company picnic is on Saturday, ____.",
    correctAnswer: "July 15th",
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 5,
    passage: "The job advertisement seeks a marketing coordinator with at least 3 years of experience. Requirements include: proficiency in digital marketing tools, excellent communication skills, and a bachelor's degree in marketing or related field. Salary range: $45,000-$55,000 depending on experience.",
    prompt: "What is the minimum experience required?",
    options: JSON.stringify(["1 year", "2 years", "3 years", "5 years"]),
    correctIndex: 2,
  },
];

// ═══ Cambridge English (B2 First / C1 Advanced) ═════════════════════════

const CAMBRIDGE_QUESTIONS: Q[] = [
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 1,
    passage: "The Amazon rainforest, often called the 'lungs of the Earth,' produces approximately 20% of the world's oxygen. It covers over 5.5 million square kilometers and is home to an estimated 390 billion individual trees divided into 16,000 species. Despite its importance, deforestation continues at an alarming rate, primarily for cattle ranching and soybean cultivation.",
    prompt: "How much of the world's oxygen does the Amazon produce?",
    options: JSON.stringify(["10%", "15%", "20%", "25%"]),
    correctIndex: 2,
  },
  {
    section: "READING", type: "FILL_BLANK", order: 2,
    prompt: "The Amazon is home to an estimated ____ billion individual trees.",
    correctAnswer: "390",
  },
  {
    section: "READING", type: "TRUE_FALSE_NOT_GIVEN", order: 3,
    prompt: "Deforestation in the Amazon is primarily for urban development.",
    correctAnswer: "FALSE",
  },
  {
    section: "WRITING", type: "ESSAY", order: 4, wordLimit: 250,
    prompt: "Write an essay (240-280 words) on: 'Technology has made our lives easier but not necessarily better.' Discuss this statement, providing examples to support your views.",
  },
  {
    section: "SPEAKING", type: "SPEAKING", order: 5,
    prompt: "Speaking Part 2: Compare and contrast two photographs. Photo A shows a busy city center. Photo B shows a quiet rural village. Discuss the advantages and disadvantages of living in each place. You have 1 minute to speak.",
  },
  {
    section: "LISTENING", type: "MULTIPLE_CHOICE", order: 6,
    passage: "Presenter: Today's lecture is about renewable energy. Solar power capacity has grown by 50% in the last year alone. Wind energy now accounts for 8% of global electricity production. However, the main challenge remains energy storage — batteries need to become cheaper and more efficient to make renewable energy viable as a primary source.",
    prompt: "What percentage of global electricity does wind energy produce?",
    options: JSON.stringify(["5%", "8%", "10%", "15%"]),
    correctIndex: 1,
  },
];

// ═══ LSAT (Law School Admission Test) ═══════════════════════════════════

const LSAT_QUESTIONS: Q[] = [
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 1,
    passage: "A controversial legal theory argues that judicial review—the power of courts to invalidate legislation—was not intended by the framers of the Constitution. Proponents of this view point to the absence of explicit language in the Constitution granting this power. However, the counterargument notes that the framers discussed judicial review extensively in the Federalist Papers, particularly in Federalist No. 78, where Alexander Hamilton argued that courts must have the power to strike down laws that conflict with the Constitution.",
    prompt: "According to the passage, where did Alexander Hamilton discuss judicial review?",
    options: JSON.stringify(["The Declaration of Independence", "The Bill of Rights", "Federalist No. 78", "The Constitution"]),
    correctIndex: 2,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 2,
    prompt: "The main argument of those who question judicial review is that:",
    options: JSON.stringify(["It is too expensive", "The Constitution does not explicitly grant it", "Courts lack expertise", "It takes too long"]),
    correctIndex: 1,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 3,
    passage: "Logical Reasoning: All mammals are warm-blooded. All warm-blooded creatures have a circulatory system. Therefore, all mammals have a circulatory system. This argument is:",
    prompt: "The argument above is an example of:",
    options: JSON.stringify(["Inductive reasoning", "Deductive reasoning (valid)", "A fallacy", "Circular reasoning"]),
    correctIndex: 1,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 4,
    passage: "Logical Reasoning: A new law requires all restaurants to display calorie counts on their menus. A restaurant owner argues that this will reduce business because customers will be discouraged by high calorie numbers. However, in cities where similar laws exist, restaurant revenue has actually increased by an average of 3%. The owner's argument is weakened by this evidence because:",
    prompt: "What weakens the restaurant owner's argument?",
    options: JSON.stringify(["Calorie counts are inaccurate", "Revenue increased in cities with similar laws", "Customers don't read menus", "The law is unconstitutional"]),
    correctIndex: 1,
  },
  {
    section: "WRITING", type: "ESSAY", order: 5, wordLimit: 500,
    prompt: "Writing Sample: A city is considering whether to build a new sports stadium or invest in public education. Write an argument supporting one position. Consider: economic impact, community benefits, and long-term consequences. You have 35 minutes.",
  },
];

// ═══ MCAT (Medical College Admission Test) ══════════════════════════════

const MCAT_QUESTIONS: Q[] = [
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 1,
    passage: "The human cardiovascular system consists of the heart, blood vessels, and blood. The heart has four chambers: the right atrium and right ventricle (which pump deoxygenated blood to the lungs), and the left atrium and left ventricle (which pump oxygenated blood to the body). The right ventricle pumps blood through the pulmonary artery to the lungs, where it picks up oxygen. The left ventricle pumps oxygenated blood through the aorta to the rest of the body.",
    prompt: "Which chamber pumps oxygenated blood to the body?",
    options: JSON.stringify(["Right atrium", "Right ventricle", "Left atrium", "Left ventricle"]),
    correctIndex: 3,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 2,
    prompt: "The pulmonary artery carries:",
    options: JSON.stringify(["Oxygenated blood to the body", "Deoxygenated blood to the lungs", "Oxygenated blood to the heart", "Deoxygenated blood to the body"]),
    correctIndex: 1,
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 3,
    passage: "Cellular respiration is the process by which cells convert glucose and oxygen into ATP (energy), carbon dioxide, and water. The three stages are: glycolysis (in the cytoplasm), the Krebs cycle (in the mitochondria), and the electron transport chain (in the mitochondria). Glycolysis produces a net of 2 ATP molecules, while the complete oxidation of one glucose molecule can produce up to 38 ATP.",
    prompt: "How many ATP molecules does glycolysis produce?",
    options: JSON.stringify(["2", "4", "18", "38"]),
    correctIndex: 0,
  },
  {
    section: "READING", type: "FILL_BLANK", order: 4,
    prompt: "The complete oxidation of one glucose molecule can produce up to ____ ATP.",
    correctAnswer: "38",
  },
  {
    section: "READING", type: "MULTIPLE_CHOICE", order: 5,
    passage: "A researcher conducts a study on the effect of a new drug on blood pressure. She divides 200 patients into two groups: one receives the drug, the other receives a placebo. After 8 weeks, the drug group shows an average decrease of 12 mmHg in systolic blood pressure, while the placebo group shows a decrease of 2 mmHg. The most likely explanation for the 2 mmHg decrease in the placebo group is:",
    prompt: "What explains the placebo group's blood pressure decrease?",
    options: JSON.stringify(["The drug leaked into their group", "The placebo effect", "Natural variation", "Measurement error"]),
    correctIndex: 1,
  },
];

// ═══ Visa Interview Practice ════════════════════════════════════════════

const VISA_QUESTIONS: Q[] = [
  {
    section: "SPEAKING", type: "SPEAKING", order: 1,
    prompt: "Visa Officer: Why do you want to study in the UK? Please answer as you would in a real visa interview. Speak for 1-2 minutes.",
  },
  {
    section: "SPEAKING", type: "SPEAKING", order: 2,
    prompt: "Visa Officer: Why did you choose this particular university and course? Explain your reasons clearly.",
  },
  {
    section: "SPEAKING", type: "SPEAKING", order: 3,
    prompt: "Visa Officer: How will you finance your studies and living expenses in the UK? Provide specific details about your funding sources.",
  },
  {
    section: "SPEAKING", type: "SPEAKING", order: 4,
    prompt: "Visa Officer: What are your plans after completing your studies? Do you intend to return to your home country?",
  },
  {
    section: "SPEAKING", type: "SPEAKING", order: 5,
    prompt: "Visa Officer: Can you explain the gap in your education/employment history? Please provide a clear and honest explanation.",
  },
  {
    section: "WRITING", type: "ESSAY", order: 6, wordLimit: 300,
    prompt: "Write a Statement of Purpose (300 words) for your UK student visa application. Include: your academic background, why you chose this course, your career goals, and your ties to your home country that demonstrate your intention to return.",
  },
];

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding all missing exam types...\n");

  await seedExam("IELTS-G", "IELTS General Training — Full Practice Test", "General reading, letter writing & essay", 170, IELTS_G_QUESTIONS);
  await seedExam("IELTS-UKVI", "IELTS UKVI — Life Skills Practice", "UKVI secure test guidance + practice", 60, IELTS_UKVI_QUESTIONS);
  await seedExam("OET", "OET — Healthcare English Practice", "Occupational English Test for healthcare professionals", 120, OET_QUESTIONS);
  await seedExam("LANGUAGECERT", "LanguageCert — ESOL Practice", "LanguageCert International ESOL practice test", 150, LANGUAGECERT_QUESTIONS);
  await seedExam("LINGUASKILL", "Cambridge Linguaskill — Practice Test", "Adaptive English assessment for work/study", 90, LINGUASKILL_QUESTIONS);
  await seedExam("OIETC", "OIETC — Practice sample (product identity pending)", "Legacy synthetic sample only; official product identity and format are unverified.", 120, OIETC_QUESTIONS);
  await seedExam("TOEIC", "TOEIC — Listening & Reading Practice", "Workplace English proficiency assessment", 120, TOEIC_QUESTIONS);
  await seedExam("CAMBRIDGE", "Cambridge B2 First — Practice Test", "Cambridge English: First (FCE) practice", 180, CAMBRIDGE_QUESTIONS);
  await seedExam("LSAT", "LSAT — Law School Admission Practice", "Logical reasoning, reading comprehension, writing", 150, LSAT_QUESTIONS);
  await seedExam("MCAT", "MCAT — Medical College Admission Practice", "Biological, physical, and psychological sciences", 180, MCAT_QUESTIONS);
  await seedExam("VISA-INTERVIEW", "Visa Interview — Practice & Preparation", "UK/US/Canada visa interview speaking practice", 60, VISA_QUESTIONS);

  const totalQ = await db.question.count();
  const totalSets = await db.practiceSet.count();
  console.log(`\n📊 Total: ${totalQ} questions across ${totalSets} practice sets`);
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error("Seed failed:", e);
    db.$disconnect();
    process.exit(1);
  });
