/**
 * English.ALOEducation.com Web_CRM — Prisma seed script.
 *
 * Creates:
 *   - 1 super-admin user (admin@aloeducation.com / ChangeMe123!)
 *   - 8 exam types with 4 sections each
 *   - 10 sample courses
 *   - 5 sample questions
 *   - 2 mock tests
 *   - System settings (free quotas, brand config, etc.)
 *
 * Idempotent: safe to run repeatedly. Existing records are looked up
 * by their unique codes and updated in place rather than duplicated.
 *
 * Run with: `bun run db:seed`
 */
import { PrismaClient, Role, QuestionType, Difficulty } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding English.ALOEducation.com Web_CRM…");

  // -------------------- SUPER ADMIN --------------------
  const adminEmail = "admin@aloeducation.com";
  const adminPassword = "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: Role.SUPER_ADMIN, status: "active" },
    create: {
      email: adminEmail,
      name: "ALO Super Admin",
      passwordHash,
      role: Role.SUPER_ADMIN,
      status: "active",
    },
  });
  console.log(`  ✓ Super admin: ${admin.email}`);

  // -------------------- EXAM TYPES + SECTIONS --------------------
  const examDefs: Array<{
    code: string;
    name: string;
    slug: string;
    description: string;
    duration: number;
    scoreScale: string;
    styleLabel: string;
    sections: Array<{ name: string; description: string; duration: number }>;
  }> = [
    {
      code: "IELTS",
      name: "IELTS Academic",
      slug: "ielts-academic",
      description: "International English Language Testing System — Academic module.",
      duration: 175,
      scoreScale: "0–9 band",
      styleLabel: "IELTS-style practice test",
      sections: [
        { name: "Listening", description: "4 sections, 40 questions", duration: 30 },
        { name: "Reading", description: "3 passages, 40 questions", duration: 60 },
        { name: "Writing", description: "Task 1 (graph) + Task 2 (essay)", duration: 60 },
        { name: "Speaking", description: "3 parts: intro, cue card, discussion", duration: 15 },
      ],
    },
    {
      code: "IELTS_UKVI",
      name: "IELTS UKVI",
      slug: "ielts-ukvi",
      description: "IELTS for UK Visas and Immigration — Secure English Language Test.",
      duration: 175,
      scoreScale: "0–9 band",
      styleLabel: "IELTS UKVI practice test",
      sections: [
        { name: "Listening", description: "4 sections, 40 questions", duration: 30 },
        { name: "Reading", description: "3 passages, 40 questions", duration: 60 },
        { name: "Writing", description: "Task 1 + Task 2", duration: 60 },
        { name: "Speaking", description: "3 parts", duration: 15 },
      ],
    },
    {
      code: "PTE",
      name: "PTE Academic",
      slug: "pte-academic",
      description: "Pearson Test of English — Academic, fully computer-marked.",
      duration: 120,
      scoreScale: "10–90",
      styleLabel: "PTE Academic practice test",
      sections: [
        { name: "Speaking & Writing", description: "Read aloud, repeat sentence, describe image, essay", duration: 77 },
        { name: "Reading", description: "MCQ, reorder paragraphs, fill blanks", duration: 30 },
        { name: "Listening", description: "Summarize spoken text, MCQ, fill blanks", duration: 43 },
      ],
    },
    {
      code: "TOEFL",
      name: "TOEFL iBT",
      slug: "toefl-ibt",
      description: "Test of English as a Foreign Language — Internet Based Test.",
      duration: 117,
      scoreScale: "0–120",
      styleLabel: "TOEFL iBT practice test",
      sections: [
        { name: "Reading", description: "2 passages, 20 questions", duration: 35 },
        { name: "Listening", description: "3 lectures, 2 conversations", duration: 36 },
        { name: "Speaking", description: "4 tasks", duration: 16 },
        { name: "Writing", description: "Integrated + independent essay", duration: 30 },
      ],
    },
    {
      code: "DUOLINGO",
      name: "Duolingo English Test",
      slug: "duolingo-english-test",
      description: "Adaptive online English proficiency test accepted by 4000+ institutions.",
      duration: 60,
      scoreScale: "10–160",
      styleLabel: "Duolingo-style adaptive test",
      sections: [
        { name: "Literacy", description: "Read & select, complete sentences", duration: 20 },
        { name: "Comprehension", description: "Listen & select, identify ideas", duration: 20 },
        { name: "Conversation", description: "Speak & write responses", duration: 10 },
        { name: "Production", description: "Writing & speaking samples", duration: 10 },
      ],
    },
    {
      code: "OIETC",
      name: "OIETC",
      slug: "oietc",
      description: "Online English Test for International Students — accepted by UK universities.",
      duration: 90,
      scoreScale: "B1–C1",
      styleLabel: "OIETC practice test",
      sections: [
        { name: "Reading", description: "Academic reading passages", duration: 30 },
        { name: "Listening", description: "Lecture & conversation", duration: 30 },
        { name: "Writing", description: "Essay task", duration: 30 },
      ],
    },
    {
      code: "ELLT",
      name: "Oxford ELLT",
      slug: "oxford-ellt",
      description: "Oxford English Language Level Test — 6 CEFR levels.",
      duration: 75,
      scoreScale: "A2–C2",
      styleLabel: "Oxford ELLT practice test",
      sections: [
        { name: "Reading", description: "Comprehension & vocabulary", duration: 25 },
        { name: "Listening", description: "Recorded audio tasks", duration: 25 },
        { name: "Writing", description: "Short essay", duration: 25 },
      ],
    },
    {
      code: "SPOKEN",
      name: "Spoken English",
      slug: "spoken-english",
      description: "General spoken-English proficiency test — fluency, pronunciation, coherence.",
      duration: 30,
      scoreScale: "1–10",
      styleLabel: "Spoken English assessment",
      sections: [
        { name: "Self Introduction", description: "2-min intro", duration: 5 },
        { name: "Topic Talk", description: "3-min cue card", duration: 10 },
        { name: "Discussion", description: "Open-ended follow-ups", duration: 15 },
      ],
    },
  ];

  const examTypeIds: Record<string, string> = {};
  const sectionIds: Record<string, string> = {};

  for (const def of examDefs) {
    const examType = await prisma.examType.upsert({
      where: { code: def.code },
      update: {
        name: def.name,
        slug: def.slug,
        description: def.description,
        duration: def.duration,
        scoreScale: def.scoreScale,
        styleLabel: def.styleLabel,
        isActive: true,
      },
      create: {
        code: def.code,
        name: def.name,
        slug: def.slug,
        description: def.description,
        duration: def.duration,
        scoreScale: def.scoreScale,
        styleLabel: def.styleLabel,
        isActive: true,
      },
    });
    examTypeIds[def.code] = examType.id;

    // Wipe existing sections then recreate (keeps sortOrder clean).
    await prisma.examSection.deleteMany({ where: { examTypeId: examType.id } });
    for (let i = 0; i < def.sections.length; i++) {
      const s = def.sections[i];
      const section = await prisma.examSection.create({
        data: {
          examTypeId: examType.id,
          name: s.name,
          description: s.description,
          duration: s.duration,
          sortOrder: i,
        },
      });
      sectionIds[`${def.code}:${s.name}`] = section.id;
    }
    console.log(`  ✓ Exam type: ${def.name} (${def.sections.length} sections)`);
  }

  // -------------------- COURSES --------------------
  const courseDefs: Array<{
    code: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    level: string;
    duration: number;
    price: number;
  }> = [
    { code: "CRS-IELTS-FND", title: "IELTS Foundation", slug: "ielts-foundation", description: "Beginner-friendly introduction to all four IELTS sections with vocabulary building.", category: "ielts", level: "beginner", duration: 60, price: 8000 },
    { code: "CRS-IELTS-ADV", title: "IELTS Advanced 7.0+", slug: "ielts-advanced-7-plus", description: "Targeted preparation for students aiming for band 7.0 or above.", category: "ielts", level: "advanced", duration: 80, price: 12000 },
    { code: "CRS-PTE-ACAD", title: "PTE Academic Mastery", slug: "pte-academic-mastery", description: "Complete PTE Academic preparation with AI-scored speaking practice.", category: "pte", level: "intermediate", duration: 50, price: 9000 },
    { code: "CRS-TOEFL-IBT", title: "TOEFL iBT Complete", slug: "toefl-ibt-complete", description: "Comprehensive TOEFL iBT preparation across all four skills.", category: "toefl", level: "intermediate", duration: 55, price: 9500 },
    { code: "CRS-DUOLINGO", title: "Duolingo English Test Prep", slug: "duolingo-english-test-prep", description: "Adaptive test strategies and sample questions for DET success.", category: "duolingo", level: "all", duration: 30, price: 5000 },
    { code: "CRS-OIETC", title: "OIETC Preparation", slug: "oietc-preparation", description: "Targeted preparation for the OIETC exam accepted by UK universities.", category: "oietc", level: "intermediate", duration: 40, price: 6000 },
    { code: "CRS-ELLT", title: "Oxford ELLT Preparation", slug: "oxford-ellt-preparation", description: "Master the Oxford English Language Level Test with mock tests.", category: "ellt", level: "intermediate", duration: 35, price: 5500 },
    { code: "CRS-SPOKEN", title: "Spoken English Fluency", slug: "spoken-english-fluency", description: "Build confidence and fluency in everyday spoken English.", category: "spoken", level: "beginner", duration: 40, price: 7000 },
    { code: "CRS-BUSINESS", title: "Business English Pro", slug: "business-english-pro", description: "Professional emails, presentations, and meetings for the workplace.", category: "business", level: "intermediate", duration: 45, price: 10000 },
    { code: "CRS-GRAMMAR", title: "English Grammar Bootcamp", slug: "english-grammar-bootcamp", description: "Foundational to advanced grammar with guided practice drills.", category: "grammar", level: "all", duration: 30, price: 4000 },
  ];

  for (const c of courseDefs) {
    await prisma.course.upsert({
      where: { courseCode: c.code },
      update: {
        title: c.title,
        slug: c.slug,
        description: c.description,
        category: c.category,
        level: c.level,
        duration: c.duration,
        price: c.price,
        currency: "BDT",
        isActive: true,
      },
      create: {
        courseCode: c.code,
        title: c.title,
        slug: c.slug,
        description: c.description,
        category: c.category,
        level: c.level,
        duration: c.duration,
        price: c.price,
        currency: "BDT",
        isActive: true,
      },
    });
  }
  console.log(`  ✓ ${courseDefs.length} courses seeded`);

  // -------------------- QUESTIONS --------------------
  const questions: Array<{
    code: string;
    examCode: string;
    sectionName: string;
    type: QuestionType;
    difficulty: Difficulty;
    prompt: string;
    passage?: string;
    options?: string[];
    correctAnswer?: unknown;
    correctIndices?: number[];
    modelAnswer?: string;
    explanation?: string;
    scoreValue?: number;
    isPublished?: boolean;
  }> = [
    {
      code: "Q-IELTS-READ-001",
      examCode: "IELTS",
      sectionName: "Reading",
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      prompt: "According to the passage, what is the primary cause of rising sea levels?",
      passage: "Climate scientists have observed that rising global temperatures are accelerating the melting of polar ice caps. This, combined with the thermal expansion of seawater as it warms, contributes significantly to the rise in global sea levels.",
      options: [
        "Increased rainfall in coastal regions",
        "Melting polar ice and thermal expansion of seawater",
        "Underwater volcanic activity",
        "Changes in ocean currents",
      ],
      correctAnswer: 1,
      explanation: "The passage explicitly states that melting polar ice caps and thermal expansion of seawater are the primary contributors.",
      scoreValue: 1,
      isPublished: true,
    },
    {
      code: "Q-PTE-READALOUD-001",
      examCode: "PTE",
      sectionName: "Speaking & Writing",
      type: QuestionType.SHORT_ANSWER,
      difficulty: Difficulty.EASY,
      prompt: "Read the following sentence aloud, clearly and at a natural pace: \"The university library is open to all enrolled students from 8 a.m. until midnight on weekdays.\"",
      modelAnswer: "Fluent pronunciation with correct stress on 'university', 'library', 'enrolled', and 'midnight'.",
      scoreValue: 1,
      isPublished: true,
    },
    {
      code: "Q-IELTS-WRITE-001",
      examCode: "IELTS",
      sectionName: "Writing",
      type: QuestionType.ESSAY,
      difficulty: Difficulty.HARD,
      prompt: "Some people believe that universities should focus on providing academic skills, while others argue they should prepare students for the workplace. Discuss both views and give your own opinion. Write at least 250 words.",
      modelAnswer: "Band-9 essay with clear introduction, two body paragraphs discussing both views, and a conclusion that states the writer's opinion. Uses cohesive devices, varied vocabulary, and complex grammatical structures.",
      scoreValue: 9,
      isPublished: true,
    },
    {
      code: "Q-IELTS-LIST-001",
      examCode: "IELTS",
      sectionName: "Listening",
      type: QuestionType.FILL_BLANK,
      difficulty: Difficulty.MEDIUM,
      prompt: "Complete the sentence with the missing word: The lecture will take place in the ________ Hall on Friday at 3 p.m.",
      audioScript: "[Narrator] The lecture will take place in the Main Hall on Friday at 3 p.m.",
      correctAnswer: "Main",
      explanation: "The speaker clearly states 'Main Hall'.",
      scoreValue: 1,
      isPublished: true,
    },
    {
      code: "Q-TOEFL-READ-001",
      examCode: "TOEFL",
      sectionName: "Reading",
      type: QuestionType.TRUE_FALSE_NOT_GIVEN,
      difficulty: Difficulty.MEDIUM,
      prompt: "Decide whether the following statement is True, False, or Not Given based on the passage: \"Renewable energy sources now account for over half of global electricity production.\"",
      passage: "While renewable energy capacity has grown rapidly in the past decade, fossil fuels still dominate global electricity production, accounting for roughly 60% of total output as of 2024.",
      options: ["True", "False", "Not Given"],
      correctAnswer: 1,
      explanation: "The passage states that fossil fuels still account for ~60%, implying renewables account for less than half — so the statement is False.",
      scoreValue: 1,
      isPublished: true,
    },
  ];

  for (const q of questions) {
    const examTypeId = examTypeIds[q.examCode];
    const sectionId = sectionIds[`${q.examCode}:${q.sectionName}`];
    if (!examTypeId || !sectionId) {
      console.warn(`  ⚠ Skipping ${q.code}: missing exam/section`);
      continue;
    }

    await prisma.question.upsert({
      where: { questionCode: q.code },
      update: {
        examTypeId,
        sectionId,
        type: q.type,
        difficulty: q.difficulty,
        prompt: q.prompt,
        passage: q.passage ?? null,
        audioScript: q.audioScript ?? null,
        options: q.options ?? undefined,
        correctAnswer: q.correctAnswer ?? undefined,
        correctIndices: q.correctIndices ?? undefined,
        modelAnswer: q.modelAnswer ?? null,
        explanation: q.explanation ?? null,
        scoreValue: q.scoreValue ?? 1,
        isActive: true,
        isPublished: q.isPublished ?? false,
        createdById: admin.id,
      },
      create: {
        questionCode: q.code,
        examTypeId,
        sectionId,
        type: q.type,
        difficulty: q.difficulty,
        prompt: q.prompt,
        passage: q.passage ?? null,
        audioScript: q.audioScript ?? null,
        options: q.options ?? undefined,
        correctAnswer: q.correctAnswer ?? undefined,
        correctIndices: q.correctIndices ?? undefined,
        modelAnswer: q.modelAnswer ?? null,
        explanation: q.explanation ?? null,
        scoreValue: q.scoreValue ?? 1,
        isActive: true,
        isPublished: q.isPublished ?? false,
        createdById: admin.id,
      },
    });
  }
  console.log(`  ✓ ${questions.length} questions seeded`);

  // -------------------- MOCK TESTS --------------------
  const mockTestDefs: Array<{
    code: string;
    examCode: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    duration: number;
    totalQuestions: number;
  }> = [
    {
      code: "MT-IELTS-001",
      examCode: "IELTS",
      title: "IELTS Academic — Full Mock Test #1",
      description: "Full-length IELTS Academic mock test covering all four sections with detailed AI feedback.",
      difficulty: Difficulty.MEDIUM,
      duration: 175,
      totalQuestions: 40,
    },
    {
      code: "MT-PTE-001",
      examCode: "PTE",
      title: "PTE Academic — Full Mock Test #1",
      description: "Computer-based PTE Academic mock test with automated scoring across all sections.",
      difficulty: Difficulty.MEDIUM,
      duration: 120,
      totalQuestions: 52,
    },
  ];

  for (const mt of mockTestDefs) {
    const examTypeId = examTypeIds[mt.examCode];
    if (!examTypeId) continue;
    await prisma.mockTest.upsert({
      where: { mockCode: mt.code },
      update: {
        examTypeId,
        title: mt.title,
        description: mt.description,
        difficulty: mt.difficulty,
        duration: mt.duration,
        totalQuestions: mt.totalQuestions,
        isPublished: true,
      },
      create: {
        mockCode: mt.code,
        examTypeId,
        title: mt.title,
        description: mt.description,
        difficulty: mt.difficulty,
        duration: mt.duration,
        totalQuestions: mt.totalQuestions,
        isPublished: true,
      },
    });
  }
  console.log(`  ✓ ${mockTestDefs.length} mock tests seeded`);

  // -------------------- SYSTEM SETTINGS --------------------
  const settings: Array<{ key: string; value: string; isSecret: boolean }> = [
    { key: "free_quota_alo", value: "3", isSecret: false },
    { key: "free_quota_public", value: "1", isSecret: false },
    { key: "default_currency", value: "BDT", isSecret: false },
    { key: "brand_name", value: "ALO English Education", isSecret: false },
    { key: "brand_primary_color", value: "#0B1F3A", isSecret: false },
    { key: "brand_accent_color", value: "#E8501A", isSecret: false },
    { key: "support_email", value: "support@aloeducation.com", isSecret: false },
    { key: "certificates_public_base_url", value: "https://english.aloeducation.com/verify", isSecret: false },
    { key: "smtp_from_name", value: "ALO English Education", isSecret: false },
    { key: "feature_ai_tutor_enabled", value: "true", isSecret: false },
    { key: "feature_ai_speaking_coach_enabled", value: "true", isSecret: false },
    { key: "feature_ai_writing_evaluator_enabled", value: "true", isSecret: false },
    { key: "max_upload_size_mb", value: "50", isSecret: false },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, isSecret: s.isSecret },
      create: { key: s.key, value: s.value, isSecret: s.isSecret },
    });
  }
  console.log(`  ✓ ${settings.length} system settings seeded`);

  console.log("✅ Seed completed.");
  console.log(`   Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
