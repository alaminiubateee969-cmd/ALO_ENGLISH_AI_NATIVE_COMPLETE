/**
 * LEGACY SAMPLE-SEED SCRIPT — creates a small synthetic question bank for local
 * fixture/testing use only. It is not licensed, officially authored, or
 * validated against current full-length exam blueprints. A guard limits it to
 * an explicitly opted-in disposable test/sample SQLite database.
 */

import { assertSafeSampleSeedTarget } from "./seed-sample-guard.mjs";
assertSafeSampleSeedTarget();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding practice questions...');

  // Get exam types
  const ielts = await prisma.examType.findUnique({ where: { code: 'IELTS-A' } });
  const pte = await prisma.examType.findUnique({ where: { code: 'PTE-A' } });
  const toefl = await prisma.examType.findUnique({ where: { code: 'TOEFL-iBT' } });
  const duolingo = await prisma.examType.findUnique({ where: { code: 'DUOLINGO' } });

  if (!ielts) {
    console.error('Exam types not found. Run bun run db:seed first.');
    process.exit(1);
  }

  // ═══ IELTS Practice Set ═══════════════════════════════════════════════
  const ieltsSet = await prisma.practiceSet.upsert({
    where: { id: 'ielts-practice-1' },
    update: {
      title: 'IELTS Academic — Synthetic Sample Set (not full-length)',
      description: 'Short development fixture only; not an official, licensed, or full-length IELTS test.',
    },
    create: {
      id: 'ielts-practice-1',
      examTypeId: ielts.id,
      title: 'IELTS Academic — Synthetic Sample Set (not full-length)',
      description: 'Short development fixture only; not an official, licensed, or full-length IELTS test.',
      durationMin: 165,
      isActive: true,
    },
  });

  // IELTS Listening Questions (10 multiple choice)
  const listeningQuestions = [
    { prompt: 'The library is open until ____ on weekdays.', options: '["5:00 PM","6:30 PM","8:00 PM","9:30 PM"]', correctIndex: 1, correctAnswer: '6:30 PM' },
    { prompt: 'What is the main topic of the lecture?', options: '["Climate change","Economic policy","Educational reform","Healthcare system"]', correctIndex: 2, correctAnswer: 'Educational reform' },
    { prompt: 'The student needs to submit the assignment by:', options: '["Monday","Wednesday","Friday","Next week"]', correctIndex: 1, correctAnswer: 'Wednesday' },
    { prompt: 'Where does the conversation take place?', options: '["In a library","In a classroom","In a cafeteria","In a bookstore"]', correctIndex: 0, correctAnswer: 'In a library' },
    { prompt: 'The speaker recommends which book?', options: '["Advanced Grammar","Academic Writing","IELTS Practice","English Vocabulary"]', correctIndex: 1, correctAnswer: 'Academic Writing' },
  ];

  for (let i = 0; i < listeningQuestions.length; i++) {
    const q = listeningQuestions[i];
    await prisma.question.upsert({
      where: { id: `ielts-lis-${i + 1}` },
      update: {},
      create: {
        id: `ielts-lis-${i + 1}`,
        practiceSetId: ieltsSet.id,
        section: 'LISTENING',
        type: 'MULTIPLE_CHOICE',
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        correctAnswer: q.correctAnswer,
        points: 1,
        order: i + 1,
      },
    });
  }

  // IELTS Reading Questions (5 multiple choice + 5 true/false)
  const readingQuestions = [
    { prompt: 'According to the passage, what is the main cause of urbanization?', options: '["Economic opportunity","Climate change","Education","Healthcare"]', correctIndex: 0, correctAnswer: 'Economic opportunity' },
    { prompt: 'The author suggests that the solution is:', options: '["Government intervention","Private investment","Community action","International aid"]', correctIndex: 2, correctAnswer: 'Community action' },
    { prompt: 'What does "sustainable development" mean in this context?', options: '["Economic growth","Environmental protection","Balanced growth","Social equality"]', correctIndex: 2, correctAnswer: 'Balanced growth' },
    { prompt: 'The passage was primarily written to:', options: '["Inform","Persuade","Entertain","Critique"]', correctIndex: 0, correctAnswer: 'Inform' },
    { prompt: 'Which of the following is NOT mentioned in the passage?', options: '["Renewable energy","Public transport","Healthcare","Education"]', correctIndex: 2, correctAnswer: 'Healthcare' },
    // True/False
    { prompt: 'Statement: The government has implemented all recommended policies.', options: '["True","False","Not Given"]', correctIndex: 1, correctAnswer: 'False' },
    { prompt: 'Statement: Urbanization has both positive and negative effects.', options: '["True","False","Not Given"]', correctIndex: 0, correctAnswer: 'True' },
    { prompt: 'Statement: The author supports increasing taxes for infrastructure.', options: '["True","False","Not Given"]', correctIndex: 2, correctAnswer: 'Not Given' },
    { prompt: 'Statement: Community-based solutions are more effective than top-down approaches.', options: '["True","False","Not Given"]', correctIndex: 0, correctAnswer: 'True' },
    { prompt: 'Statement: The research was conducted over 10 years.', options: '["True","False","Not Given"]', correctIndex: 2, correctAnswer: 'Not Given' },
  ];

  for (let i = 0; i < readingQuestions.length; i++) {
    const q = readingQuestions[i];
    await prisma.question.upsert({
      where: { id: `ielts-read-${i + 1}` },
      update: {},
      create: {
        id: `ielts-read-${i + 1}`,
        practiceSetId: ieltsSet.id,
        section: 'READING',
        type: i < 5 ? 'MULTIPLE_CHOICE' : 'TRUE_FALSE',
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        correctAnswer: q.correctAnswer,
        points: 1,
        order: i + 1,
      },
    });
  }

  // IELTS Writing (2 essay questions)
  await prisma.question.upsert({
    where: { id: 'ielts-write-1' },
    update: {},
    create: {
      id: 'ielts-write-1',
      practiceSetId: ieltsSet.id,
      section: 'WRITING',
      type: 'ESSAY',
      prompt: 'Task 2: Some people believe that studying abroad is essential for career success. To what extent do you agree or disagree? Write at least 250 words.',
      wordLimit: 250,
      points: 10,
      order: 1,
    },
  });

  await prisma.question.upsert({
    where: { id: 'ielts-write-2' },
    update: {},
    create: {
      id: 'ielts-write-2',
      practiceSetId: ieltsSet.id,
      section: 'WRITING',
      type: 'ESSAY',
      prompt: 'Task 1: The chart below shows the number of international students in five countries. Summarize the information by selecting and reporting the main features. Write at least 150 words.',
      wordLimit: 150,
      points: 5,
      order: 2,
    },
  });

  // IELTS Speaking (3 speaking prompts questions)
  const speakingPrompts = [
    'Part 1: Tell me about your hometown. What do you like most about it?',
    'Part 2: Describe a challenge you faced and how you overcame it. You have 1 minute to prepare and 2 minutes to speak.',
    'Part 3: How has technology changed the way people communicate? Discuss the advantages and disadvantages.',
  ];

  for (let i = 0; i < speakingPrompts.length; i++) {
    await prisma.question.upsert({
      where: { id: `ielts-speak-${i + 1}` },
      update: {},
      create: {
        id: `ielts-speak-${i + 1}`,
        practiceSetId: ieltsSet.id,
        section: 'SPEAKING',
        type: 'SPEAKING',
        prompt: speakingPrompts[i],
        points: 5,
        order: i + 1,
      },
    });
  }

  console.log(`  ✓ IELTS: ${5 + 10 + 2 + 3} questions seeded`);

  // ═══ PTE Practice Set ════════════════════════════════════════════════
  if (pte) {
    const pteSet = await prisma.practiceSet.upsert({
      where: { id: 'pte-practice-1' },
      update: {
        title: 'PTE Academic — Synthetic Sample Set (not full-length)',
        description: 'Short development fixture only; not an official, licensed, or full-length PTE Academic test.',
      },
      create: {
        id: 'pte-practice-1',
        examTypeId: pte.id,
        title: 'PTE Academic — Synthetic Sample Set (not full-length)',
        description: 'Short development fixture only; not an official, licensed, or full-length PTE Academic test.',
        durationMin: 120,
        isActive: true,
      },
    });

    const pteQuestions = [
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct word: The new policy will ____ all employees.', options: '["affect","effect","reflect","defect"]', correctIndex: 0, correctAnswer: 'affect' },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct word: She has a strong ____ for detail.', options: '["preference","ability","skill","talent"]', correctIndex: 0, correctAnswer: 'preference' },
      { section: 'READING', type: 'FILL_BLANK', prompt: 'Fill in the blank: The meeting was ____ because of the storm.', correctAnswer: 'cancelled' },
      { section: 'LISTENING', type: 'MULTIPLE_CHOICE', prompt: 'What is the main purpose of the announcement?', options: '["To advertise","To inform","To recruit","To invite"]', correctIndex: 1, correctAnswer: 'To inform' },
      { section: 'WRITING', type: 'ESSAY', prompt: 'Write an essay (200-300 words) on: "Technology in education has more benefits than drawbacks." Do you agree?', wordLimit: 300 },
      { section: 'SPEAKING', type: 'SPEAKING', prompt: 'Describe an important decision you made in your life. Explain why it was important.' },
    ];

    for (let i = 0; i < pteQuestions.length; i++) {
      const q = pteQuestions[i];
      await prisma.question.upsert({
        where: { id: `pte-q-${i + 1}` },
        update: {},
        create: {
          id: `pte-q-${i + 1}`,
          practiceSetId: pteSet.id,
          section: q.section,
          type: q.type,
          prompt: q.prompt,
          options: q.options || null,
          correctIndex: q.correctIndex ?? null,
          correctAnswer: q.correctAnswer || null,
          wordLimit: q.wordLimit || null,
          points: q.type === 'ESSAY' ? 10 : q.type === 'SPEAKING' ? 5 : 1,
          order: i + 1,
        },
      });
    }
    console.log(`  ✓ PTE: ${pteQuestions.length} questions seeded`);
  }

  // ═══ TOEFL Practice Set ═══════════════════════════════════════════════
  if (toefl) {
    const toeflSet = await prisma.practiceSet.upsert({
      where: { id: 'toefl-practice-1' },
      update: {
        title: 'TOEFL iBT — Synthetic Sample Set (not full-length)',
        description: 'Short development fixture only; not an official, licensed, or full-length TOEFL iBT test.',
      },
      create: {
        id: 'toefl-practice-1',
        examTypeId: toefl.id,
        title: 'TOEFL iBT — Synthetic Sample Set (not full-length)',
        description: 'Short development fixture only; not an official, licensed, or full-length TOEFL iBT test.',
        durationMin: 120,
        isActive: true,
      },
    });

    const toeflQuestions = [
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'What is the main idea of the passage?', options: '["Climate affects agriculture","Agriculture affects climate","Both are unrelated","Neither matters"]', correctIndex: 0, correctAnswer: 'Climate affects agriculture' },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'The word "adaptation" in paragraph 2 most nearly means:', options: '["Change","Response","Adjustment","Evolution"]', correctIndex: 2, correctAnswer: 'Adjustment' },
      { section: 'LISTENING', type: 'MULTIPLE_CHOICE', prompt: 'What does the professor mainly discuss?', options: '["Ancient civilizations","Modern technology","Climate patterns","Economic systems"]', correctIndex: 0, correctAnswer: 'Ancient civilizations' },
      { section: 'WRITING', type: 'ESSAY', prompt: 'Integrated Writing: Summarize the main points from the lecture and explain how they relate to the reading passage. Write 150-225 words.', wordLimit: 225 },
      { section: 'SPEAKING', type: 'SPEAKING', prompt: 'Independent Speaking: Some people prefer to work alone, while others prefer to work in teams. Which do you prefer and why?' },
    ];

    for (let i = 0; i < toeflQuestions.length; i++) {
      const q = toeflQuestions[i];
      await prisma.question.upsert({
        where: { id: `toefl-q-${i + 1}` },
        update: {},
        create: {
          id: `toefl-q-${i + 1}`,
          practiceSetId: toeflSet.id,
          section: q.section,
          type: q.type,
          prompt: q.prompt,
          options: q.options || null,
          correctIndex: q.correctIndex ?? null,
          correctAnswer: q.correctAnswer || null,
          wordLimit: q.wordLimit || null,
          points: q.type === 'ESSAY' ? 10 : q.type === 'SPEAKING' ? 5 : 1,
          order: i + 1,
        },
      });
    }
    console.log(`  ✓ TOEFL: ${toeflQuestions.length} questions seeded`);
  }

  // ═══ Duolingo Practice Set ═════════════════════════════════════════════
  if (duolingo) {
    const duoSet = await prisma.practiceSet.upsert({
      where: { id: 'duolingo-practice-1' },
      update: {
        title: 'Duolingo English Test — Synthetic Sample Set (not full-length)',
        description: 'Short development fixture only; not an official, licensed, or full-length Duolingo English Test.',
      },
      create: {
        id: 'duolingo-practice-1',
        examTypeId: duolingo.id,
        title: 'Duolingo English Test — Synthetic Sample Set (not full-length)',
        description: 'Short development fixture only; not an official, licensed, or full-length Duolingo English Test.',
        durationMin: 60,
        isActive: true,
      },
    });

    const duoQuestions = [
      { section: 'READING', type: 'FILL_BLANK', prompt: 'Complete the sentence: She is interested ___ learning new languages.', correctAnswer: 'in' },
      { section: 'READING', type: 'FILL_BLANK', prompt: 'Complete: The weather was ___ bad that we stayed home.', correctAnswer: 'so' },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct word: I have lived here ___ 2010.', options: '["since","for","from","in"]', correctIndex: 0, correctAnswer: 'since' },
      { section: 'WRITING', type: 'ESSAY', prompt: 'Write a short essay (50-100 words) about your favorite hobby.', wordLimit: 100 },
      { section: 'SPEAKING', type: 'SPEAKING', prompt: 'Speak for 1-2 minutes about a book you recently read.' },
    ];

    for (let i = 0; i < duoQuestions.length; i++) {
      const q = duoQuestions[i];
      await prisma.question.upsert({
        where: { id: `duo-q-${i + 1}` },
        update: {},
        create: {
          id: `duo-q-${i + 1}`,
          practiceSetId: duoSet.id,
          section: q.section,
          type: q.type,
          prompt: q.prompt,
          options: q.options || null,
          correctIndex: q.correctIndex ?? null,
          correctAnswer: q.correctAnswer || null,
          wordLimit: q.wordLimit || null,
          points: q.type === 'ESSAY' ? 10 : q.type === 'SPEAKING' ? 5 : 1,
          order: i + 1,
        },
      });
    }
    console.log(`  ✓ Duolingo: ${duoQuestions.length} questions seeded`);
  }

  // Summary
  const totalQuestions = await prisma.question.count();
  const totalSets = await prisma.practiceSet.count();
  console.log('');
  console.log(`✅ Seed complete: ${totalQuestions} questions in ${totalSets} practice sets.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
