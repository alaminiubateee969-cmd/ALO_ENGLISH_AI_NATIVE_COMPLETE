/**
 * prisma/seed-all-exams.ts — Seed practice sets + questions for TOEFL, PTE, Duolingo
 * IELTS already seeded by seed-ielts-questions.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding TOEFL, PTE, Duolingo practice tests...');

  const toefl = await prisma.examType.findUnique({ where: { code: 'TOEFL-iBT' } });
  const pte = await prisma.examType.findUnique({ where: { code: 'PTE-A' } });
  const duolingo = await prisma.examType.findUnique({ where: { code: 'DUOLINGO' } });

  // ═══ TOEFL iBT Practice Test ═════════════════════════════════════════
  if (toefl) {
    const toeflSet = await prisma.practiceSet.create({
      data: {
        examTypeId: toefl.id,
        title: 'TOEFL iBT — Full Practice Test',
        description: 'Complete TOEFL iBT practice test: Reading, Listening, Speaking, Writing. AI-scored.',
        durationMin: 116,
        isActive: true,
      },
    });

    // Reading (10 questions)
    const toeflReading = [
      { type: 'MULTIPLE_CHOICE', prompt: 'According to the passage, what is the main cause of climate migration?', options: '["Economic opportunity","Environmental change","Political conflict","Educational access"]', correctIndex: 1 },
      { type: 'MULTIPLE_CHOICE', prompt: 'The word "displacement" in paragraph 2 most nearly means:', options: '["Movement","Destruction","Growth","Change"]', correctIndex: 0 },
      { type: 'MULTIPLE_CHOICE', prompt: 'What can be inferred about the author\'s view on adaptation?', options: '["It is unnecessary","It is possible but difficult","It is impossible","It is guaranteed"]', correctIndex: 1 },
      { type: 'FILL_BLANK', prompt: 'The passage suggests that migration rates have ______ in recent decades.', correctAnswer: 'increased' },
      { type: 'FILL_BLANK', prompt: 'Climate refugees often lack legal ______ under current international law.', correctAnswer: 'protection' },
      { type: 'MULTIPLE_CHOICE', prompt: 'Which of the following is NOT mentioned as a factor?', options: '["Rising sea levels","Drought","Economic recession","Extreme weather"]', correctIndex: 2 },
      { type: 'TRUE_FALSE_NOT_GIVEN', prompt: 'Statement: The international community has a unified policy for climate refugees.', options: '["True","False","Not Given"]', correctIndex: 1 },
      { type: 'FILL_BLANK', prompt: 'The author recommends ______ investment in adaptation strategies.', correctAnswer: 'increased' },
      { type: 'MULTIPLE_CHOICE', prompt: 'What is the author\'s tone?', options: '["Optimistic","Cautionary","Indifferent","Critical"]', correctIndex: 1 },
      { type: 'FILL_BLANK', prompt: 'The passage was primarily written to ______ the issue.', correctAnswer: 'inform' },
    ];

    for (let i = 0; i < toeflReading.length; i++) {
      const q = toeflReading[i];
      await prisma.question.create({
        data: {
          practiceSetId: toeflSet.id,
          section: 'READING',
          type: q.type,
          prompt: q.prompt,
          passage: 'Climate migration is becoming one of the most significant demographic shifts of the 21st century. Rising sea levels, prolonged droughts, and extreme weather events are forcing millions to leave their homes. Unlike traditional refugees, climate migrants lack clear legal protection under international law. The international community has struggled to develop a unified policy response. Experts recommend increased investment in adaptation strategies and stronger legal frameworks to protect vulnerable populations.',
          options: (q as any).options || null,
          correctIndex: (q as any).correctIndex ?? null,
          correctAnswer: (q as any).correctAnswer || null,
          points: 1,
          order: i + 1,
        },
      });
    }

    // Listening (10 questions)
    const toeflListening = [
      { type: 'MULTIPLE_CHOICE', prompt: 'What is the lecture mainly about?', options: '["Ancient Roman engineering","Modern construction","Greek architecture","Egyptian pyramids"]', correctIndex: 0 },
      { type: 'MULTIPLE_CHOICE', prompt: 'Why did the Romans use concrete?', options: '["It was cheaper","It was durable and versatile","It was lighter","It was beautiful"]', correctIndex: 1 },
      { type: 'FILL_BLANK', prompt: 'Roman concrete included volcanic ______.', correctAnswer: 'ash' },
      { type: 'MULTIPLE_CHOICE', prompt: 'What modern structure does the professor compare to Roman aqueducts?', options: '["Skyscrapers","Bridges","Water systems","Highways"]', correctIndex: 2 },
      { type: 'FILL_BLANK', prompt: 'The Pantheon\'s dome is made of unreinforced ______.', correctAnswer: 'concrete' },
      { type: 'MULTIPLE_CHOICE', prompt: 'What surprised modern scientists about Roman concrete?', options: '["Its color","Its durability","Its weight","Its cost"]', correctIndex: 1 },
      { type: 'FILL_BLANK', prompt: 'Roman concrete actually gets ______ over time.', correctAnswer: 'stronger' },
      { type: 'MULTIPLE_CHOICE', prompt: 'How does the professor organize the lecture?', options: '["Chronologically","By theme","By comparison","By problem-solution"]', correctIndex: 2 },
      { type: 'FILL_BLANK', prompt: 'The aqueducts transported water using ______.', correctAnswer: 'gravity' },
      { type: 'MULTIPLE_CHOICE', prompt: 'What is the professor\'s main point?', options: '["Roman engineering was overrated","Roman engineering influences modern construction","Roman engineering is forgotten","Roman engineering was copied from Greeks"]', correctIndex: 1 },
    ];

    for (let i = 0; i < toeflListening.length; i++) {
      const q = toeflListening[i];
      await prisma.question.create({
        data: {
          practiceSetId: toeflSet.id,
          section: 'LISTENING',
          type: q.type,
          prompt: q.prompt,
          passage: 'Today we will discuss Roman engineering, one of the most remarkable achievements of the ancient world. The Romans were master builders who used concrete made with volcanic ash, which made their structures incredibly durable. The Pantheon, built nearly 2,000 years ago, still has the world\'s largest unreinforced concrete dome. Roman aqueducts used gravity to transport water over long distances, and their road network spanned over 400,000 kilometers. Modern scientists have discovered that Roman concrete actually gets stronger over time due to seawater reacting with the volcanic minerals.',
          options: (q as any).options || null,
          correctIndex: (q as any).correctIndex ?? null,
          correctAnswer: (q as any).correctAnswer || null,
          points: 1,
          order: i + 11,
        },
      });
    }

    // Writing
    await prisma.question.create({
      data: {
        practiceSetId: toeflSet.id,
        section: 'WRITING',
        type: 'ESSAY',
        prompt: 'Integrated Writing: The reading passage discusses the decline of honeybee populations and its impact on agriculture. The lecture provides additional perspectives. Summarize the points made in the lecture, explaining how they relate to the reading. Write 150-225 words.',
        wordLimit: 225,
        points: 15,
        order: 21,
      },
    });

    // Speaking
    await prisma.question.create({
      data: {
        practiceSetId: toeflSet.id,
        section: 'SPEAKING',
        type: 'SPEAKING',
        prompt: 'Independent Speaking: Some people prefer to study alone, while others prefer to study in groups. Which do you prefer and why? Use specific reasons and examples to support your answer.',
        points: 10,
        order: 22,
      },
    });

    console.log('  ✓ TOEFL: 22 questions seeded');
  }

  // ═══ PTE Academic Practice Test ══════════════════════════════════════
  if (pte) {
    const pteSet = await prisma.practiceSet.create({
      data: {
        examTypeId: pte.id,
        title: 'PTE Academic — Full Practice Test',
        description: 'Complete PTE Academic practice test with AI scoring.',
        durationMin: 120,
        isActive: true,
      },
    });

    const pteQuestions = [
      // Reading
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct word: The new policy will ____ all employees.', options: '["affect","effect","reflect","defect"]', correctIndex: 0 },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct word: She has a strong ____ for detail.', options: '["preference","ability","skill","talent"]', correctIndex: 0 },
      { section: 'READING', type: 'FILL_BLANK', prompt: 'Fill in the blank: The meeting was ____ because of the storm.', correctAnswer: 'cancelled' },
      { section: 'READING', type: 'FILL_BLANK', prompt: 'Fill in the blank: The research team ____ their findings in a journal.', correctAnswer: 'published' },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'What is the main idea of the passage?', options: '["Technology changes society","Society changes technology","Both are unrelated","Neither matters"]', correctIndex: 0 },
      // Listening
      { section: 'LISTENING', type: 'MULTIPLE_CHOICE', prompt: 'What is the main purpose of the announcement?', options: '["To advertise","To inform","To recruit","To invite"]', correctIndex: 1 },
      { section: 'LISTENING', type: 'FILL_BLANK', prompt: 'The guest speaker will arrive at ____ PM.', correctAnswer: '3' },
      { section: 'LISTENING', type: 'MULTIPLE_CHOICE', prompt: 'Where will the event take place?', options: '["Hall A","Hall B","Auditorium","Conference Room"]', correctIndex: 2 },
      { section: 'LISTENING', type: 'FILL_BLANK', prompt: 'Participants should bring their ____ card.', correctAnswer: 'ID' },
      { section: 'LISTENING', type: 'MULTIPLE_CHOICE', prompt: 'What time does registration close?', options: '["2:30 PM","3:00 PM","3:30 PM","4:00 PM"]', correctIndex: 1 },
    ];

    for (let i = 0; i < pteQuestions.length; i++) {
      const q = pteQuestions[i];
      await prisma.question.create({
        data: {
          practiceSetId: pteSet.id,
          section: q.section,
          type: q.type,
          prompt: q.prompt,
          passage: q.section === 'LISTENING' ? 'Good afternoon, everyone. This is a reminder that the annual research symposium will take place this Friday at 3 PM in the Main Auditorium. All participants should bring their ID cards for registration. Registration closes at 3 PM sharp. Our guest speaker, Dr. Sarah Chen, will present her latest research on renewable energy systems.' : 'Technology has fundamentally changed how society functions. From communication to commerce, education to entertainment, every aspect of modern life has been transformed. The rapid pace of technological advancement continues to reshape social structures, create new industries, and challenge existing norms.',
          options: (q as any).options || null,
          correctIndex: (q as any).correctIndex ?? null,
          correctAnswer: (q as any).correctAnswer || null,
          points: 1,
          order: i + 1,
        },
      });
    }

    // Writing
    await prisma.question.create({
      data: {
        practiceSetId: pteSet.id,
        section: 'WRITING',
        type: 'ESSAY',
        prompt: 'Write an essay (200-300 words) on: "Technology in education has more benefits than drawbacks." Do you agree or disagree? Support your position with reasons and examples.',
        wordLimit: 300,
        points: 15,
        order: 11,
      },
    });

    // Speaking
    await prisma.question.create({
      data: {
        practiceSetId: pteSet.id,
        section: 'SPEAKING',
        type: 'SPEAKING',
        prompt: 'Describe an important decision you made in your life. Explain why it was important and how it affected you.',
        points: 10,
        order: 12,
      },
    });

    console.log('  ✓ PTE: 12 questions seeded');
  }

  // ═══ Duolingo English Test Practice ══════════════════════════════════
  if (duolingo) {
    const duoSet = await prisma.practiceSet.create({
      data: {
        examTypeId: duolingo.id,
        title: 'Duolingo English Test — Full Practice',
        description: 'Complete Duolingo English Test practice with adaptive-style questions.',
        durationMin: 60,
        isActive: true,
      },
    });

    const duoQuestions = [
      { section: 'READING', type: 'FILL_BLANK', prompt: 'Complete: She is interested ___ learning new languages.', correctAnswer: 'in' },
      { section: 'READING', type: 'FILL_BLANK', prompt: 'Complete: The weather was ___ bad that we stayed home.', correctAnswer: 'so' },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct word: I have lived here ___ 2010.', options: '["since","for","from","in"]', correctIndex: 0 },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct word: The book was ___ interesting that I read it twice.', options: '["so","such","very","too"]', correctIndex: 0 },
      { section: 'READING', type: 'FILL_BLANK', prompt: 'Complete: He apologized ___ being late.', correctAnswer: 'for' },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'Choose the synonym of "happy":', options: '["sad","joyful","angry","tired"]', correctIndex: 1 },
      { section: 'READING', type: 'FILL_BLANK', prompt: 'Complete: I look forward ___ seeing you.', correctAnswer: 'to' },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'Choose the correct sentence:', options: '["She don\'t like coffee","She doesn\'t likes coffee","She doesn\'t like coffee","She not like coffee"]', correctIndex: 2 },
      { section: 'READING', type: 'FILL_BLANK', prompt: 'Complete: The meeting will start ___ 10 AM.', correctAnswer: 'at' },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'Choose the antonym of "increase":', options: '["grow","decrease","expand","rise"]', correctIndex: 1 },
    ];

    for (let i = 0; i < duoQuestions.length; i++) {
      const q = duoQuestions[i];
      await prisma.question.create({
        data: {
          practiceSetId: duoSet.id,
          section: q.section,
          type: q.type,
          prompt: q.prompt,
          options: (q as any).options || null,
          correctIndex: (q as any).correctIndex ?? null,
          correctAnswer: (q as any).correctAnswer || null,
          points: 1,
          order: i + 1,
        },
      });
    }

    // Writing
    await prisma.question.create({
      data: {
        practiceSetId: duoSet.id,
        section: 'WRITING',
        type: 'ESSAY',
        prompt: 'Write a short essay (50-100 words) about your favorite hobby and why you enjoy it.',
        wordLimit: 100,
        points: 10,
        order: 11,
      },
    });

    // Speaking
    await prisma.question.create({
      data: {
        practiceSetId: duoSet.id,
        section: 'SPEAKING',
        type: 'SPEAKING',
        prompt: 'Speak for 1-2 minutes about a book you recently read. Describe what it was about and whether you would recommend it.',
        points: 10,
        order: 12,
      },
    });

    console.log('  ✓ Duolingo: 12 questions seeded');
  }

  const total = await prisma.question.count();
  const sets = await prisma.practiceSet.count();
  console.log(`\n✅ Total: ${total} questions across ${sets} practice sets (IELTS + TOEFL + PTE + Duolingo)`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
