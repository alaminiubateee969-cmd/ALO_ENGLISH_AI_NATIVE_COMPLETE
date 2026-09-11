/**
 * prisma/seed-gre-gmat-sat-act.ts
 * Seeds questions for GRE, GMAT, SAT, ACT, ALO Placement
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding GRE, GMAT, SAT, ACT, ALO Placement...');

  // ═══ GRE ═══════════════════════════════════════════════════════════
  const gre = await prisma.examType.findUnique({ where: { code: 'GRE' } });
  if (gre) {
    const greSet = await prisma.practiceSet.create({
      data: { examTypeId: gre.id, title: 'GRE General — Full Practice Test', description: 'Verbal Reasoning + Quantitative Reasoning + Analytical Writing', durationMin: 198, isActive: true },
    });

    // Verbal Reasoning
    const verbal = [
      { type: 'MULTIPLE_CHOICE', prompt: 'Choose the word most nearly OPPOSITE to "BENEVOLENT":', options: '["malicious","kind","generous","charitable"]', correctIndex: 0 },
      { type: 'MULTIPLE_CHOICE', prompt: 'Choose the word most nearly OPPOSITE to "VERBOSE":', options: '["concise","wordy","talkative","lengthy"]', correctIndex: 0 },
      { type: 'MULTIPLE_CHOICE', prompt: 'Choose the word most nearly OPPOSITE to "MITIGATE":', options: '["exacerbate","reduce","lessen","ease"]', correctIndex: 0 },
      { type: 'MULTIPLE_CHOICE', prompt: 'The passage suggests that the author views the new policy with:', options: '["enthusiasm","skepticism","indifference","approval"]', correctIndex: 1 },
      { type: 'MULTIPLE_CHOICE', prompt: 'According to the passage, the primary cause of the decline was:', options: '["economic factors","social changes","environmental pressures","political instability"]', correctIndex: 2 },
      { type: 'MULTIPLE_CHOICE', prompt: 'The word "PARADIGM" in context most nearly means:', options: '["a model or pattern","a contradiction","a conclusion","an error"]', correctIndex: 0 },
      { type: 'MULTIPLE_CHOICE', prompt: 'It can be inferred that the author believes:', options: '["change is always good","change can be harmful","stability is preferred","innovation is risky"]', correctIndex: 1 },
      { type: 'MULTIPLE_CHOICE', prompt: 'The primary purpose of the passage is to:', options: '["argue a position","describe a process","narrate events","compare alternatives"]', correctIndex: 0 },
      { type: 'FILL_BLANK', prompt: 'Sentence: Despite the criticism, the researcher remained ______ in her conviction.', correctAnswer: 'steadfast' },
      { type: 'FILL_BLANK', prompt: 'Sentence: The findings were ______, contradicting decades of established theory.', correctAnswer: 'revolutionary' },
    ];

    const passageText = 'The rapid urbanization of the 20th century transformed not only physical landscapes but social structures. As rural populations migrated to cities, traditional community bonds weakened. The resulting anonymity of urban life created both freedom and isolation. Social scientists debate whether this transformation represents progress or loss. Some argue that urban diversity fosters innovation and tolerance. Others contend that the erosion of community has led to increased mental health problems and social fragmentation.';

    for (let i = 0; i < verbal.length; i++) {
      const q = verbal[i];
      await prisma.question.create({
        data: {
          practiceSetId: greSet.id, section: 'READING', type: q.type,
          prompt: q.prompt, passage: passageText,
          options: (q as any).options || null,
          correctIndex: (q as any).correctIndex ?? null,
          correctAnswer: (q as any).correctAnswer || null,
          points: 1, order: i + 1,
        },
      });
    }

    // Quantitative Reasoning
    const quant = [
      { type: 'MULTIPLE_CHOICE', prompt: 'If 3x + 7 = 22, what is x?', options: '["3","5","7","15"]', correctIndex: 1 },
      { type: 'MULTIPLE_CHOICE', prompt: 'What is 15% of 240?', options: '["30","36","40","45"]', correctIndex: 1 },
      { type: 'MULTIPLE_CHOICE', prompt: 'A train travels 60 km in 45 minutes. What is its speed in km/h?', options: '["70","75","80","85"]', correctIndex: 2 },
      { type: 'MULTIPLE_CHOICE', prompt: 'If x² = 144, what is the positive value of x?', options: '["10","11","12","13"]', correctIndex: 2 },
      { type: 'MULTIPLE_CHOICE', prompt: 'The average of 5, 8, 12, 15, 20 is:', options: '["10","11","12","13"]', correctIndex: 2 },
      { type: 'MULTIPLE_CHOICE', prompt: 'A shirt costs $80 after a 20% discount. What was the original price?', options: '["$90","$96","$100","$110"]', correctIndex: 2 },
      { type: 'MULTIPLE_CHOICE', prompt: 'If 2/3 of a number is 48, what is the number?', options: '["60","64","72","80"]', correctIndex: 2 },
      { type: 'MULTIPLE_CHOICE', prompt: 'What is the area of a circle with radius 7? (π = 22/7)', options: '["144","154","164","176"]', correctIndex: 1 },
      { type: 'FILL_BLANK', prompt: 'Solve: 7 × 8 - 4 = ?', correctAnswer: '52' },
      { type: 'FILL_BLANK', prompt: 'If a triangle has angles 60° and 80°, the third angle is ___ degrees.', correctAnswer: '40' },
    ];

    for (let i = 0; i < quant.length; i++) {
      const q = quant[i];
      await prisma.question.create({
        data: {
          practiceSetId: greSet.id, section: 'READING', type: q.type,
          prompt: q.prompt, options: (q as any).options || null,
          correctIndex: (q as any).correctIndex ?? null,
          correctAnswer: (q as any).correctAnswer || null,
          points: 1, order: i + 11,
        },
      });
    }

    // Analytical Writing
    await prisma.question.create({
      data: { practiceSetId: greSet.id, section: 'WRITING', type: 'ESSAY',
        prompt: 'Analyze an Argument: The following appeared in a memo from a company president: "Our competitor reduced prices by 15% and saw sales increase. Therefore, we should also reduce prices." Discuss what evidence would strengthen or weaken the argument.',
        wordLimit: 500, points: 20, order: 21 },
    });

    console.log('  ✓ GRE: 21 questions');
  }

  // ═══ GMAT ══════════════════════════════════════════════════════════
  const gmat = await prisma.examType.findUnique({ where: { code: 'GMAT' } });
  if (gmat) {
    const gmatSet = await prisma.practiceSet.create({
      data: { examTypeId: gmat.id, title: 'GMAT Focus — Full Practice Test', description: 'Quantitative + Verbal + Data Insights', durationMin: 135, isActive: true },
    });

    const gmatQs = [
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'The main idea of the passage is that:', options: '["markets are efficient","markets can be irrational","investors are rational","theory is perfect"]', correctIndex: 1 },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'The author uses "bubble" to refer to:', options: '["economic growth","inflated asset prices","market stability","consumer confidence"]', correctIndex: 1 },
      { section: 'READING', type: 'FILL_BLANK', prompt: 'The passage argues that investor psychology plays a ______ role in market behavior.', correctAnswer: 'significant' },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'If 5x - 3 = 2x + 12, then x = ?', options: '["3","5","7","15"]', correctIndex: 1 },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'A store marks up items 40% above cost. If cost is $50, selling price is:', options: '["$60","$65","$70","$75"]', correctIndex: 2 },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'The ratio 3:5 is equivalent to:', options: '["6:10","9:12","12:15","15:20"]', correctIndex: 0 },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'Data shows: Q1=100, Q2=120, Q3=90, Q4=110. Average is:', options: '["100","105","110","115"]', correctIndex: 1 },
      { section: 'READING', type: 'FILL_BLANK', prompt: 'If 2^x = 32, then x = ?', correctAnswer: '5' },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'Choose the synonym of "PRUDENT":', options: '["careful","risky","bold","hasty"]', correctIndex: 0 },
      { section: 'READING', type: 'MULTIPLE_CHOICE', prompt: 'Choose the antonym of "AMPLIFY":', options: '["increase","reduce","maintain","extend"]', correctIndex: 1 },
    ];

    const gmatPassage = 'Behavioral economics challenges the traditional assumption that investors are rational. Studies show that investors exhibit systematic biases: they overreact to recent events, follow the crowd, and hold losing positions too long. These behaviors create market anomalies that traditional models cannot explain. Understanding investor psychology has become essential for modern financial analysis.';

    for (let i = 0; i < gmatQs.length; i++) {
      const q = gmatQs[i];
      await prisma.question.create({
        data: {
          practiceSetId: gmatSet.id, section: q.section, type: q.type,
          prompt: q.prompt, passage: gmatPassage,
          options: (q as any).options || null,
          correctIndex: (q as any).correctIndex ?? null,
          correctAnswer: (q as any).correctAnswer || null,
          points: 1, order: i + 1,
        },
      });
    }

    await prisma.question.create({
      data: { practiceSetId: gmatSet.id, section: 'WRITING', type: 'ESSAY',
        prompt: 'Analysis of an Argument: "A company should always prioritize cost reduction over quality improvement." Discuss the reasoning and provide evidence.',
        wordLimit: 300, points: 15, order: 11 },
    });

    console.log('  ✓ GMAT: 11 questions');
  }

  // ═══ SAT ═══════════════════════════════════════════════════════════
  const sat = await prisma.examType.findUnique({ where: { code: 'SAT' } });
  if (sat) {
    const satSet = await prisma.practiceSet.create({
      data: { examTypeId: sat.id, title: 'Digital SAT — Full Practice Test', description: 'Reading/Writing + Math (2 modules each)', durationMin: 134, isActive: true },
    });

    const satQs = [
      { type: 'MULTIPLE_CHOICE', prompt: 'The author\'s use of the word "resilient" suggests:', options: '["fragility","adaptability","resistance","permanence"]', correctIndex: 1 },
      { type: 'MULTIPLE_CHOICE', prompt: 'Which choice best states the main idea?', options: '["Nature is unpredictable","Nature adapts to change","Nature is destructive","Nature is fragile"]', correctIndex: 1 },
      { type: 'MULTIPLE_CHOICE', prompt: 'The function of the second paragraph is to:', options: '["provide examples","present counterargument","offer solution","conclude argument"]', correctIndex: 0 },
      { type: 'FILL_BLANK', prompt: 'The passage describes ecosystems as ______ systems.', correctAnswer: 'complex' },
      { type: 'MULTIPLE_CHOICE', prompt: 'If 3(x + 2) = 21, then x = ?', options: '["3","5","7","9"]', correctIndex: 1 },
      { type: 'MULTIPLE_CHOICE', prompt: 'What is the value of 2³ + 3²?', options: '["13","15","17","19"]', correctIndex: 2 },
      { type: 'MULTIPLE_CHOICE', prompt: 'A line passes through (2, 3) and (4, 7). What is the slope?', options: '["1","2","3","4"]', correctIndex: 1 },
      { type: 'FILL_BLANK', prompt: 'Solve: 5x = 45, so x = ?', correctAnswer: '9' },
      { type: 'MULTIPLE_CHOICE', prompt: 'The area of a rectangle with length 8 and width 5 is:', options: '["13","30","40","45"]', correctIndex: 2 },
      { type: 'MULTIPLE_CHOICE', prompt: 'If f(x) = 2x + 1, what is f(5)?', options: '["9","10","11","12"]', correctIndex: 2 },
    ];

    const satPassage = 'Ecosystems demonstrate remarkable resilience when faced with environmental changes. After forest fires, new growth emerges within weeks. Coral reefs, though damaged by bleaching, can recover when conditions improve. This adaptability suggests that nature has built-in mechanisms for survival. However, scientists warn that rapid climate change may exceed the capacity of some ecosystems to adapt, leading to permanent transformation rather than recovery.';

    for (let i = 0; i < satQs.length; i++) {
      const q = satQs[i];
      await prisma.question.create({
        data: {
          practiceSetId: satSet.id, section: 'READING', type: q.type,
          prompt: q.prompt, passage: satPassage,
          options: (q as any).options || null,
          correctIndex: (q as any).correctIndex ?? null,
          correctAnswer: (q as any).correctAnswer || null,
          points: 1, order: i + 1,
        },
      });
    }

    await prisma.question.create({
      data: { practiceSetId: satSet.id, section: 'WRITING', type: 'ESSAY',
        prompt: 'Write an essay analyzing how the author builds an argument to persuade readers that environmental conservation requires immediate action. Use evidence from the passage.',
        wordLimit: 250, points: 15, order: 11 },
    });

    console.log('  ✓ SAT: 11 questions');
  }

  // ═══ ACT ═══════════════════════════════════════════════════════════
  const act = await prisma.examType.findUnique({ where: { code: 'ACT' } });
  if (act) {
    const actSet = await prisma.practiceSet.create({
      data: { examTypeId: act.id, title: 'ACT — Full Practice Test', description: 'English + Math + Reading + Science', durationMin: 175, isActive: true },
    });

    const actQs = [
      { type: 'MULTIPLE_CHOICE', prompt: 'English: Choose the correct sentence:', options: '["She dont like tea","She doesn\'t like tea","She not like tea","She no like tea"]', correctIndex: 1 },
      { type: 'MULTIPLE_CHOICE', prompt: 'English: Which word correctly fills the blank? "The results were ___ than expected."', options: '["good","better","best","well"]', correctIndex: 1 },
      { type: 'MULTIPLE_CHOICE', prompt: 'Math: What is 25% of 80?', options: '["15","20","25","30"]', correctIndex: 1 },
      { type: 'MULTIPLE_CHOICE', prompt: 'Math: Solve for x: 2x + 5 = 17', options: '["4","5","6","7"]', correctIndex: 2 },
      { type: 'MULTIPLE_CHOICE', prompt: 'Reading: The passage is primarily about:', options: '["space exploration","marine biology","climate patterns","geological formations"]', correctIndex: 1 },
      { type: 'MULTIPLE_CHOICE', prompt: 'Science: Which gas do plants primarily absorb?', options: '["oxygen","nitrogen","carbon dioxide","hydrogen"]', correctIndex: 2 },
      { type: 'MULTIPLE_CHOICE', prompt: 'Science: At what temperature does water boil at sea level?', options: '["90°C","95°C","100°C","105°C"]', correctIndex: 2 },
      { type: 'FILL_BLANK', prompt: 'Math: 12 × 12 = ?', correctAnswer: '144' },
      { type: 'FILL_BLANK', prompt: 'English: The past tense of "go" is ____.', correctAnswer: 'went' },
      { type: 'MULTIPLE_CHOICE', prompt: 'Math: The perimeter of a square with side 6 is:', options: '["12","24","36","48"]', correctIndex: 1 },
    ];

    for (let i = 0; i < actQs.length; i++) {
      const q = actQs[i];
      await prisma.question.create({
        data: {
          practiceSetId: actSet.id, section: 'READING', type: q.type,
          prompt: q.prompt, options: (q as any).options || null,
          correctIndex: (q as any).correctIndex ?? null,
          correctAnswer: (q as any).correctAnswer || null,
          points: 1, order: i + 1,
        },
      });
    }

    await prisma.question.create({
      data: { practiceSetId: actSet.id, section: 'WRITING', type: 'ESSAY',
        prompt: 'Some educators believe that schools should focus on STEM subjects, while others argue for a balanced curriculum including arts and humanities. Write an essay discussing both perspectives. Take a position and support it with specific examples.',
        wordLimit: 300, points: 12, order: 11 },
    });

    console.log('  ✓ ACT: 11 questions');
  }

  // ═══ ALO Placement ══════════════════════════════════════════════════
  const alo = await prisma.examType.findUnique({ where: { code: 'ALO-PLACEMENT' } });
  if (alo) {
    const aloSet = await prisma.practiceSet.create({
      data: { examTypeId: alo.id, title: 'ALO English Placement Test', description: 'Grammar + Vocabulary + Reading + Listening + Writing. CEFR level assessment.', durationMin: 75, isActive: true },
    });

    const aloQs = [
      { type: 'MULTIPLE_CHOICE', prompt: 'Grammar: Choose the correct article: "I saw ___ elephant at the zoo."', options: '["a","an","the","no article"]', correctIndex: 1 },
      { type: 'MULTIPLE_CHOICE', prompt: 'Grammar: She ___ to school every day.', options: '["go","goes","going","gone"]', correctIndex: 1 },
      { type: 'MULTIPLE_CHOICE', prompt: 'Grammar: I have been studying ___ three hours.', options: '["for","since","from","at"]', correctIndex: 0 },
      { type: 'FILL_BLANK', prompt: 'Grammar: The comparative form of "good" is ____.', correctAnswer: 'better' },
      { type: 'MULTIPLE_CHOICE', prompt: 'Vocabulary: Choose the synonym of "difficult":', options: '["easy","hard","simple","quick"]', correctIndex: 1 },
      { type: 'MULTIPLE_CHOICE', prompt: 'Vocabulary: Choose the antonym of "ancient":', options: '["old","modern","historic","traditional"]', correctIndex: 1 },
      { type: 'MULTIPLE_CHOICE', prompt: 'Vocabulary: "Frequently" most nearly means:', options: '["rarely","often","never","always"]', correctIndex: 1 },
      { type: 'FILL_BLANK', prompt: 'Vocabulary: A person who treats sick animals is called a ____.', correctAnswer: 'veterinarian' },
      { type: 'MULTIPLE_CHOICE', prompt: 'Reading: What is the main idea of the passage?', options: '["Exercise benefits health","Diet is important","Sleep matters","Stress is harmful"]', correctIndex: 0 },
      { type: 'FILL_BLANK', prompt: 'Reading: The author recommends ___ minutes of daily exercise.', correctAnswer: '30' },
    ];

    const aloPassage = 'Regular exercise has been shown to improve both physical and mental health. Studies indicate that even 30 minutes of daily activity can reduce the risk of heart disease by 40%. Exercise also releases endorphins, which improve mood and reduce stress. For students, physical activity has been linked to better academic performance, improved concentration, and enhanced memory. Health experts recommend a combination of aerobic exercise, strength training, and flexibility exercises for optimal health benefits.';

    for (let i = 0; i < aloQs.length; i++) {
      const q = aloQs[i];
      await prisma.question.create({
        data: {
          practiceSetId: aloSet.id, section: 'READING', type: q.type,
          prompt: q.prompt, passage: aloPassage,
          options: (q as any).options || null,
          correctIndex: (q as any).correctIndex ?? null,
          correctAnswer: (q as any).correctAnswer || null,
          points: 1, order: i + 1,
        },
      });
    }

    await prisma.question.create({
      data: { practiceSetId: aloSet.id, section: 'WRITING', type: 'ESSAY',
        prompt: 'Write a short paragraph (100-150 words) about your reasons for learning English and your goals for the future.',
        wordLimit: 150, points: 10, order: 11 },
    });

    await prisma.question.create({
      data: { practiceSetId: aloSet.id, section: 'SPEAKING', type: 'SPEAKING',
        prompt: 'Please introduce yourself. Tell us your name, where you are from, and why you want to learn English.',
        points: 10, order: 12 },
    });

    console.log('  ✓ ALO Placement: 12 questions');
  }

  const total = await prisma.question.count();
  const sets = await prisma.practiceSet.count();
  console.log(`\n✅ Total: ${total} questions across ${sets} practice sets`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
