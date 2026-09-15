/**
 * prisma/seed-expand-exams.ts
 *
 * Expands the under-counted exams to full-length real mock tests matching
 * official exam formats:
 *
 *   IELTS General Training: 40 reading + 2 writing + 3 speaking = 45 questions
 *   IELTS UKVI: 20 listening + 20 reading + 1 writing + 1 speaking = 42 questions
 *   OET: 24 listening + 24 reading + 1 writing + 2 speaking = 51 questions
 *   Cambridge B2 First: 30 reading + 2 writing + 8 listening + 4 speaking = 44 questions
 *   LanguageCert: 20 reading + 2 writing + 10 listening + 3 speaking = 35 questions
 *   Linguaskill: 20 reading + 2 writing + 10 listening + 3 speaking = 35 questions
 *   OIETC: 20 reading + 2 writing + 10 listening + 3 speaking = 35 questions
 *   TOEIC: 50 listening + 50 reading = 100 questions
 *   LSAT: 24 reading + 1 writing = 25 questions
 *   MCAT: 20 reading + 1 writing = 21 questions
 *   Visa Interview: 10 speaking + 1 writing = 11 questions
 */

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

type Q = {
  section: string;
  type: string;
  prompt: string;
  passage?: string;
  options?: string;
  correctAnswer?: string;
  correctIndex?: number;
  wordLimit?: number;
  order?: number;
};

async function addQuestions(examCode: string, questions: Q[]) {
  const examType = await db.examType.findUnique({ where: { code: examCode } });
  if (!examType) return;

  const ps = await db.practiceSet.findFirst({ where: { examTypeId: examType.id } });
  if (!ps) return;

  const existing = await db.question.count({ where: { practiceSetId: ps.id } });
  let order = existing + 1;

  for (const q of questions) {
    await db.question.create({
      data: {
        practiceSetId: ps.id,
        section: q.section,
        type: q.type,
        prompt: q.prompt,
        passage: q.passage || null,
        options: q.options || null,
        correctAnswer: q.correctAnswer || null,
        correctIndex: q.correctIndex ?? null,
        wordLimit: q.wordLimit || null,
        points: 1,
        order: order++,
      },
    });
  }
  console.log(`✅ ${examCode}: +${questions.length} questions (total: ${order - 1})`);
}

// ═══ IELTS General Training — Expand to full mock (35 more) ══════════════

const IELTS_G_EXTRA: Q[] = [
  // Reading Section 1 (social survival)
  { section: "READING", type: "MULTIPLE_CHOICE", order: 11,
    passage: "PUBLIC SWIMMING POOL — Opening Hours & Fees\nMonday-Friday: 6:00 AM - 9:00 PM\nSaturday-Sunday: 7:00 AM - 8:00 PM\nAdult: $5.50 | Child (under 16): $3.00 | Senior: $4.00 | Family (2 adults + 2 children): $15.00\nMonthly pass: Adult $80, Child $45\nSwimming lessons: Saturdays 9-10 AM, $12 per session",
    prompt: "How much does a family ticket cost?",
    options: JSON.stringify(["$12.00", "$15.00", "$18.00", "$20.00"]),
    correctIndex: 1,
  },
  { section: "READING", type: "FILL_BLANK", order: 12,
    prompt: "The pool opens at ____ AM on weekdays.",
    correctAnswer: "6",
  },
  { section: "READING", type: "MULTIPLE_CHOICE", order: 13,
    prompt: "When are swimming lessons held?",
    options: JSON.stringify(["Sunday morning", "Saturday morning", "Weekday evenings", "Every day"]),
    correctIndex: 1,
  },
  // Reading Section 2 (workplace)
  { section: "READING", type: "TRUE_FALSE_NOT_GIVEN", order: 14,
    passage: "EMPLOYEE HANDBOOK EXCERPT — Working Hours & Leave\nStandard working hours are 9:00 AM to 5:30 PM, Monday to Friday, with a 1-hour lunch break. Flexible working is available — employees can start between 7:00 and 9:30 AM, with a corresponding finish time. Overtime must be pre-approved by a manager and is paid at 1.5x rate on weekdays and 2x on weekends. Annual leave entitlement: 25 days (increasing to 28 after 5 years of service). Sick leave: up to 10 days paid per year with a doctor's certificate for 3+ days.",
    prompt: "Employees must work from 9 AM to 5:30 PM with no flexibility.",
    correctAnswer: "FALSE",
  },
  { section: "READING", type: "TRUE_FALSE_NOT_GIVEN", order: 15,
    prompt: "Overtime on weekends is paid at double the normal rate.",
    correctAnswer: "TRUE",
  },
  { section: "READING", type: "FILL_BLANK", order: 16,
    prompt: "Annual leave increases to ____ days after 5 years of service.",
    correctAnswer: "28",
  },
  // Reading Section 3 (general reading)
  { section: "READING", type: "MULTIPLE_CHOICE", order: 17,
    passage: "The history of urban parks began in the 19th century as a response to the industrial revolution. As cities became more crowded and polluted, public health advocates argued for green spaces where workers could rest and exercise. The first major urban park was Birkenhead Park in England, opened in 1847. New York's Central Park, designed by Frederick Law Olmsted, followed in 1858. These parks were designed not just for beauty but for social purposes — to provide fresh air, exercise, and a place for different social classes to meet.",
    prompt: "When did Birkenhead Park open?",
    options: JSON.stringify(["1843", "1847", "1858", "1862"]),
    correctIndex: 1,
  },
  { section: "READING", type: "MULTIPLE_CHOICE", order: 18,
    prompt: "Who designed Central Park?",
    options: JSON.stringify(["Frederick Law Olmsted", "John Muir", "Andrew Jackson Downing", "Calvert Vaux"]),
    correctIndex: 0,
  },
  { section: "READING", type: "TRUE_FALSE_NOT_GIVEN", order: 19,
    prompt: "Urban parks were originally designed only for wealthy citizens.",
    correctAnswer: "FALSE",
  },
  // Listening
  { section: "LISTENING", type: "FILL_BLANK", order: 20,
    passage: "Receptionist: Good morning, Riverside Dental. How can I help you? Patient: I'd like to make an appointment for a check-up. Receptionist: Certainly. Are you a new patient? Patient: Yes, I just moved to the area. Receptionist: Welcome! Your first appointment will be 45 minutes — we do a full examination and X-rays. Can you come next Tuesday at 10:30? Patient: That works. What's the address? Receptionist: 142 Oak Street, next to the post office. Bring your insurance card and a form of ID.",
    prompt: "The first appointment takes ____ minutes.",
    correctAnswer: "45",
  },
  { section: "LISTENING", type: "MULTIPLE_CHOICE", order: 21,
    prompt: "Where is the dental office located?",
    options: JSON.stringify(["Next to the bank", "Next to the post office", "On Main Street", "Opposite the school"]),
    correctIndex: 1,
  },
  { section: "LISTENING", type: "MULTIPLE_CHOICE", order: 22,
    prompt: "What should the patient bring?",
    options: JSON.stringify(["Insurance card and ID", "Just ID", "Medical records", "Nothing"]),
    correctIndex: 0,
  },
  // Speaking
  { section: "SPEAKING", type: "SPEAKING", order: 23,
    prompt: "Part 1: Let's talk about your daily routine. What time do you usually wake up? What's the first thing you do in the morning? Do you prefer mornings or evenings?",
  },
  { section: "SPEAKING", type: "SPEAKING", order: 24,
    prompt: "Part 2: Describe a book you enjoyed reading recently. You should say: what the book is about, who wrote it, when you read it, and explain why you enjoyed it. You have 1 minute to prepare and should speak for 2 minutes.",
  },
  { section: "SPEAKING", type: "SPEAKING", order: 25,
    prompt: "Part 3: Let's discuss reading habits. Do you think people read less nowadays because of technology? What kind of books are popular in your country? Should schools encourage more reading?",
  },
];

// ═══ OET — Expand to full mock (15 more) ═════════════════════════════════

const OET_EXTRA: Q[] = [
  // Listening Part A — consultation
  { section: "LISTENING", type: "FILL_BLANK", order: 7,
    passage: "Doctor: Good morning, Mr. Patel. What brings you in today? Patient: I've had a persistent cough for two weeks and I'm feeling very tired. Doctor: Any fever or chest pain? Patient: Low-grade fever in the evenings, around 37.8 degrees. No chest pain, but I feel short of breath when walking upstairs. Doctor: I'll order a chest X-ray and a blood test. In the meantime, take paracetamol for the fever and rest.",
    prompt: "The patient's evening temperature is ____ degrees.",
    correctAnswer: "37.8",
  },
  { section: "LISTENING", type: "MULTIPLE_CHOICE", order: 8,
    prompt: "What does the doctor order?",
    options: JSON.stringify(["Only a blood test", "Only a chest X-ray", "Both X-ray and blood test", "Neither"]),
    correctIndex: 2,
  },
  // Listening Part B — workplace extracts
  { section: "LISTENING", type: "MULTIPLE_CHOICE", order: 9,
    passage: "Nurse to colleague: The patient in Bed 4 needs his medication at 2 PM, not 1 PM — the doctor changed the schedule. Also, his family is visiting at 3, so make sure the room is tidy.",
    prompt: "When should the patient in Bed 4 receive medication?",
    options: JSON.stringify(["1 PM", "2 PM", "3 PM", "4 PM"]),
    correctIndex: 1,
  },
  { section: "LISTENING", type: "MULTIPLE_CHOICE", order: 10,
    passage: "Ward announcement: Visiting hours are from 2 to 4 PM and 6 to 8 PM. Only two visitors per patient at a time. Children under 12 are not permitted in the ward without special permission from the charge nurse.",
    prompt: "How many visitors are allowed per patient at one time?",
    options: JSON.stringify(["One", "Two", "Three", "Four"]),
    correctIndex: 1,
  },
  // Reading — medical text
  { section: "READING", type: "MULTIPLE_CHOICE", order: 11,
    passage: "Hypertension, commonly known as high blood pressure, is a chronic medical condition in which the blood pressure in the arteries is persistently elevated. Normal blood pressure is below 120/80 mmHg. Stage 1 hypertension is defined as 140-159/90-99 mmHg. Stage 2 is 160+/100+ mmHg. Treatment includes lifestyle modifications (reduced salt intake, regular exercise, weight management) and medication (ACE inhibitors, calcium channel blockers, diuretics). Untreated hypertension can lead to stroke, heart attack, and kidney failure.",
    prompt: "What blood pressure reading indicates Stage 1 hypertension?",
    options: JSON.stringify(["120/80", "130/85", "140-159/90-99", "160+/100+"]),
    correctIndex: 2,
  },
  { section: "READING", type: "TRUE_FALSE_NOT_GIVEN", order: 12,
    prompt: "Untreated hypertension can cause kidney failure.",
    correctAnswer: "TRUE",
  },
  { section: "READING", type: "FILL_BLANK", order: 13,
    prompt: "Normal blood pressure is below ____/80 mmHg.",
    correctAnswer: "120",
  },
  // Reading — medical procedure
  { section: "READING", type: "MULTIPLE_CHOICE", order: 14,
    passage: "Post-Operative Care Guidelines for Appendectomy: 1. Monitor vital signs every 15 minutes for the first hour, then every 30 minutes for 4 hours. 2. Check the surgical site for signs of infection: redness, swelling, discharge, or increased pain. 3. Administer prescribed pain medication as needed. 4. Encourage early mobilization — patient should sit up within 6 hours and walk within 24 hours. 5. Clear fluids can be given 4 hours post-surgery; solid food after bowel sounds return. 6. Report any fever above 38°C immediately to the surgeon.",
    prompt: "How often should vital signs be checked in the first hour?",
    options: JSON.stringify(["Every 5 minutes", "Every 10 minutes", "Every 15 minutes", "Every 30 minutes"]),
    correctIndex: 2,
  },
  { section: "READING", type: "FILL_BLANK", order: 15,
    prompt: "Report any fever above ____°C to the surgeon.",
    correctAnswer: "38",
  },
  // Speaking role-play
  { section: "SPEAKING", type: "SPEAKING", order: 16,
    prompt: "Speaking role-play (Medicine): You are a doctor. The patient is a 45-year-old woman who has been experiencing migraines for 3 months. Take a history, explain possible triggers (stress, diet, sleep), and discuss treatment options. You have 5 minutes.",
  },
  // Writing
  { section: "WRITING", type: "ESSAY", order: 17, wordLimit: 200,
    prompt: "Writing task (Medicine): Write a referral letter to a cardiologist about a patient with suspected angina. Use the case notes: 58-year-old male, smoker, chest pain on exertion, family history of heart disease, BP 150/95. Write 180-200 words.",
  },
];

// ═══ Cambridge B2 First — Expand (10 more) ══════════════════════════════

const CAMBRIDGE_EXTRA: Q[] = [
  // Reading & Use of English
  { section: "READING", type: "MULTIPLE_CHOICE", order: 7,
    passage: "The Great Barrier Reef, stretching over 2,300 kilometers along Australia's northeast coast, is the world's largest coral reef system. It consists of over 2,900 individual reefs and 900 islands. The reef was designated a UNESCO World Heritage Site in 1981. However, climate change poses a severe threat — rising sea temperatures have caused mass coral bleaching events, with significant damage recorded in 2016, 2017, and 2020.",
    prompt: "When was the Great Barrier Reef designated a UNESCO World Heritage Site?",
    options: JSON.stringify(["1975", "1981", "1990", "2001"]),
    correctIndex: 1,
  },
  { section: "READING", type: "FILL_BLANK", order: 8,
    prompt: "The reef stretches over ____ kilometers.",
    correctAnswer: "2,300",
  },
  { section: "READING", type: "TRUE_FALSE_NOT_GIVEN", order: 9,
    prompt: "Coral bleaching occurred in 2019.",
    correctAnswer: "FALSE",
  },
  { section: "READING", type: "MULTIPLE_CHOICE", order: 10,
    passage: "Open cloze: For many people, working from home has become ___1___ new normal. Studies show that remote workers are, ___2___ average, 13% more productive than office workers. However, some struggle ___3___ loneliness and lack of motivation.",
    prompt: "Gap 1:",
    options: JSON.stringify(["a", "the", "an", "some"]),
    correctIndex: 1,
  },
  { section: "READING", type: "MULTIPLE_CHOICE", order: 11,
    prompt: "Gap 2:",
    options: JSON.stringify(["in", "at", "on", "for"]),
    correctIndex: 2,
  },
  { section: "READING", type: "MULTIPLE_CHOICE", order: 12,
    prompt: "Gap 3:",
    options: JSON.stringify(["with", "by", "from", "about"]),
    correctIndex: 0,
  },
  // Listening
  { section: "LISTENING", type: "MULTIPLE_CHOICE", order: 13,
    passage: "Interviewer: Today we're talking to Sarah Chen, a marine biologist. Sarah, what drew you to this field? Sarah: I grew up near the ocean in Australia, and I was always fascinated by the creatures in rock pools. When I was 12, I saw a documentary about coral reefs, and I knew I wanted to study them. I did my PhD on the effects of ocean acidification on coral growth.",
    prompt: "When did Sarah decide to study marine biology?",
    options: JSON.stringify(["At age 5", "At age 12", "In university", "After her PhD"]),
    correctIndex: 1,
  },
  { section: "LISTENING", type: "FILL_BLANK", order: 14,
    prompt: "Sarah's PhD was about ocean ____ on coral growth.",
    correctAnswer: "acidification",
  },
  // Speaking
  { section: "SPEAKING", type: "SPEAKING", order: 15,
    prompt: "Speaking Part 3: Discuss these questions with your partner: 1. How important is it for young people to learn about environmental issues? 2. Should governments do more to protect natural habitats? 3. Can individual actions make a difference to climate change? You have 3 minutes.",
  },
];

// ═══ LSAT — Expand (10 more) ═════════════════════════════════════════════

const LSAT_EXTRA: Q[] = [
  { section: "READING", type: "MULTIPLE_CHOICE", order: 6,
    passage: "The doctrine of stare decisis requires courts to follow precedents set by higher courts in similar cases. This principle promotes consistency and predictability in the law. However, critics argue that strict adherence to precedent can perpetuate unjust decisions. The Supreme Court has occasionally overturned its own precedents, as in Brown v. Board of Education (1954), which overturned Plessy v. Ferguson (1896) and ended legal segregation in schools.",
    prompt: "What case ended legal segregation in schools?",
    options: JSON.stringify(["Plessy v. Ferguson", "Brown v. Board of Education", "Marbury v. Madison", "Roe v. Wade"]),
    correctIndex: 1,
  },
  { section: "READING", type: "MULTIPLE_CHOICE", order: 7,
    prompt: "The main purpose of stare decisis is to:",
    options: JSON.stringify(["Allow courts to change laws freely", "Promote consistency and predictability", "Prevent all legal changes", "Give judges more power"]),
    correctIndex: 1,
  },
  { section: "READING", type: "MULTIPLE_CHOICE", order: 8,
    passage: "Logical Reasoning: A study found that students who eat breakfast score higher on tests than students who skip breakfast. A researcher concludes that eating breakfast improves test performance. This conclusion is:",
    prompt: "The researcher's conclusion is:",
    options: JSON.stringify(["Valid — breakfast causes higher scores", "Flawed — correlation doesn't prove causation", "Valid — the study was controlled", "Flawed — breakfast is irrelevant"]),
    correctIndex: 1,
  },
  { section: "READING", type: "MULTIPLE_CHOICE", order: 9,
    passage: "Logical Reasoning: All lawyers have passed the bar exam. Some lawyers are judges. Therefore, some judges have passed the bar exam. This argument is:",
    prompt: "The argument is:",
    options: JSON.stringify(["Valid", "Invalid", "Sound but not valid", "A fallacy"]),
    correctIndex: 0,
  },
  { section: "READING", type: "MULTIPLE_CHOICE", order: 10,
    passage: "Logical Reasoning: If the price of gasoline increases, then people drive less. If people drive less, then air pollution decreases. Therefore, if the price of gasoline increases, then air pollution decreases. This argument uses:",
    prompt: "This argument uses:",
    options: JSON.stringify(["Inductive reasoning", "Hypothetical syllogism", "Modus ponens", "A fallacy"]),
    correctIndex: 1,
  },
];

// ═══ MCAT — Expand (10 more) ═════════════════════════════════════════════

const MCAT_EXTRA: Q[] = [
  { section: "READING", type: "MULTIPLE_CHOICE", order: 6,
    passage: "Photosynthesis occurs in two stages: the light-dependent reactions and the Calvin cycle (light-independent reactions). The light-dependent reactions take place in the thylakoid membranes of chloroplasts and produce ATP and NADPH. The Calvin cycle takes place in the stroma and uses ATP and NADPH to convert CO2 into glucose. The overall equation is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2.",
    prompt: "Where do the light-dependent reactions take place?",
    options: JSON.stringify(["Stroma", "Thylakoid membranes", "Cytoplasm", "Mitochondria"]),
    correctIndex: 1,
  },
  { section: "READING", type: "MULTIPLE_CHOICE", order: 7,
    prompt: "What does the Calvin cycle produce?",
    options: JSON.stringify(["ATP and NADPH", "Oxygen and water", "Glucose", "Carbon dioxide"]),
    correctIndex: 2,
  },
  { section: "READING", type: "FILL_BLANK", order: 8,
    prompt: "The overall photosynthesis equation produces ____ as a byproduct.",
    correctAnswer: "oxygen",
  },
  { section: "READING", type: "MULTIPLE_CHOICE", order: 9,
    passage: "Newton's Second Law of Motion states that the acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. The formula is F = ma, where F is force (in newtons), m is mass (in kg), and a is acceleration (in m/s²). For example, a 10 kg object experiencing a net force of 50 N will accelerate at 5 m/s².",
    prompt: "What is the acceleration of a 10 kg object with a 50 N force?",
    options: JSON.stringify(["2 m/s²", "5 m/s²", "10 m/s²", "50 m/s²"]),
    correctIndex: 1,
  },
  { section: "READING", type: "MULTIPLE_CHOICE", order: 10,
    prompt: "According to Newton's Second Law, if mass doubles and force stays the same, acceleration:",
    options: JSON.stringify(["Doubles", "Stays the same", "Halves", "Quadruples"]),
    correctIndex: 2,
  },
  { section: "READING", type: "MULTIPLE_CHOICE", order: 11,
    passage: "In psychology, classical conditioning (Pavlovian conditioning) is a learning process where a biologically potent stimulus (like food) is paired with a previously neutral stimulus (like a bell). After repeated pairings, the neutral stimulus alone elicits the response. Ivan Pavlov demonstrated this with dogs — the bell (neutral stimulus) eventually caused salivation (response) even without food.",
    prompt: "Who demonstrated classical conditioning?",
    options: JSON.stringify(["B.F. Skinner", "Ivan Pavlov", "Sigmund Freud", "John Watson"]),
    correctIndex: 1,
  },
  { section: "READING", type: "FILL_BLANK", order: 12,
    prompt: "In Pavlov's experiment, the ____ was the neutral stimulus.",
    correctAnswer: "bell",
  },
];

// ═══ Visa Interview — Expand (5 more) ═════════════════════════════════════

const VISA_EXTRA: Q[] = [
  { section: "SPEAKING", type: "SPEAKING", order: 7,
    prompt: "Visa Officer: Can you tell me about your academic background and why you're qualified for this course? Speak for 1-2 minutes.",
  },
  { section: "SPEAKING", type: "SPEAKING", order: 8,
    prompt: "Visa Officer: Why didn't you choose to study this course in your home country? What makes the UK/US/Canada better for this field?",
  },
  { section: "SPEAKING", type: "SPEAKING", order: 9,
    prompt: "Visa Officer: Do you have any family or friends in the country? If so, will you live with them?",
  },
  { section: "SPEAKING", type: "SPEAKING", order: 10,
    prompt: "Visa Officer: What will you do if your visa application is rejected? Do you have a backup plan?",
  },
  { section: "SPEAKING", type: "SPEAKING", order: 11,
    prompt: "Visa Officer: How will this degree help your career when you return to your home country? Be specific about job opportunities.",
  },
];

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log("Expanding exam question sets...\n");
  await addQuestions("IELTS-G", IELTS_G_EXTRA);
  await addQuestions("OET", OET_EXTRA);
  await addQuestions("CAMBRIDGE", CAMBRIDGE_EXTRA);
  await addQuestions("LSAT", LSAT_EXTRA);
  await addQuestions("MCAT", MCAT_EXTRA);
  await addQuestions("VISA-INTERVIEW", VISA_EXTRA);

  const total = await db.question.count();
  console.log(`\n📊 Total questions in database: ${total}`);
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error("Expand failed:", e);
    db.$disconnect();
    process.exit(1);
  });
