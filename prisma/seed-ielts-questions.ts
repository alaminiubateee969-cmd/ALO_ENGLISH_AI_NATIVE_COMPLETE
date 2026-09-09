/**
 * prisma/seed-ielts-questions.ts
 *
 * Seeds a complete IELTS Academic practice test with ALL question types:
 * - Listening: Section 1 (form completion), Section 2 (MC + map), Section 3 (MC + matching), Section 4 (fill-blank)
 * - Reading: Passage 1 (T/F/NG + fill-blank), Passage 2 (MC + matching headings), Passage 3 (MC + summary)
 * - Writing: Task 1 (chart description), Task 2 (essay)
 * - Speaking: Part 1, Part 2 (cue card), Part 3
 *
 * Total: 40 questions (like the real IELTS)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding complete IELTS practice test...');

  const ielts = await prisma.examType.findUnique({ where: { code: 'IELTS-A' } });
  if (!ielts) {
    console.error('IELTS exam type not found. Run bun run db:seed first.');
    process.exit(1);
  }

  // Delete old questions
  await prisma.question.deleteMany({});
  console.log('  Cleared old questions');

  // Delete old practice sets (except our new one)
  await prisma.practiceSet.deleteMany({});
  console.log('  Cleared old practice sets');

  // Create the full practice test
  const set = await prisma.practiceSet.create({
    data: {
      examTypeId: ielts.id,
      title: 'IELTS Academic — Full Mock Test (Computer-Delivered)',
      description: 'Complete 4-section IELTS practice test with 40 questions. Listening (40 Q), Reading (40 Q), Writing (2 tasks), Speaking (3 parts). AI-scored with band descriptors.',
      durationMin: 165,
      isActive: true,
    },
  });
  console.log(`  Created practice set: ${set.title}`);

  let order = 0;

  // ═══ LISTENING SECTION (40 questions, 4 subsections) ═════════════════
  // Section 1: Conversation — Form Completion (Fill in the blanks)
  const listeningScript1 = `You will hear a conversation between a student, Sarah, and a library receptionist.

Receptionist: Good morning, how can I help you today?
Sarah: Hi, I'd like to register for a library card. I'm a new student.
Receptionist: Certainly. Could I have your full name please?
Sarah: Sarah Mitchell. That's M-I-T-C-H-E-L-L.
Receptionist: And your student ID number?
Sarah: It's 4-8-2-1-5-7.
Receptionist: Thank you. What course are you studying?
Sarah: I'm enrolled in the Master of Environmental Science program.
Receptionist: And your contact phone number?
Sarah: It's 077-345-9821.
Receptionist: Your email address?
Sarah: s.mitchell@university.edu
Receptionist: Perfect. Your library card will be ready in 3 business days.`;

  const listening1 = [
    { type: 'FILL_BLANK', prompt: 'Student\'s full name:', correctAnswer: 'Sarah Mitchell' },
    { type: 'FILL_BLANK', prompt: 'Student ID number:', correctAnswer: '482157' },
    { type: 'FILL_BLANK', prompt: 'Course enrolled:', correctAnswer: 'Environmental Science' },
    { type: 'FILL_BLANK', prompt: 'Contact phone number:', correctAnswer: '0773459821' },
    { type: 'FILL_BLANK', prompt: 'Email address:', correctAnswer: 's.mitchell@university.edu' },
    { type: 'FILL_BLANK', prompt: 'Library card ready in (days):', correctAnswer: '3' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Where does this conversation take place?', options: '["In a classroom","At the library","In a bookstore","At the registrar"]', correctIndex: 1, correctAnswer: 'At the library' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What is Sarah\'s status?', options: '["Returning student","New student","Visitor","Staff member"]', correctIndex: 1, correctAnswer: 'New student' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What program is Sarah enrolled in?', options: '["Bachelor of Arts","Master of Science","Master of Environmental Science","PhD Program"]', correctIndex: 2, correctAnswer: 'Master of Environmental Science' },
    { type: 'FILL_BLANK', prompt: 'How is the last name spelled? M-I-T-C-H-E-L-____', correctAnswer: 'L' },
  ];

  for (const q of listening1) {
    order++;
    await prisma.question.create({
      data: {
        practiceSetId: set.id,
        section: 'LISTENING',
        type: q.type,
        prompt: q.prompt,
        passage: listeningScript1,
        options: q.options || null,
        correctIndex: (q as any).correctIndex ?? null,
        correctAnswer: q.correctAnswer || null,
        points: 1,
        order,
      },
    });
  }
  console.log(`  ✓ Listening Section 1: 10 questions (form completion)`);

  // Section 2: Monologue — MC + Map Labeling
  const listeningScript2 = `You will hear a tour guide speaking to a group of visitors about a museum.

Welcome to the City Museum. Let me give you a brief overview of our facilities. On the ground floor, we have the main exhibition hall, which currently features "Ancient Civilizations." To your left is the gift shop, and to your right, you'll find the cafeteria. The restrooms are located at the far end of the corridor.

On the first floor, we have three galleries: the Natural History Gallery, the Art Gallery, and the Technology Gallery. The Natural History Gallery is at the top of the stairs. The Art Gallery is to your right, and the Technology Gallery is at the end of the hallway.

On the second floor, you'll find the library and the study area. The library is open to all visitors, but the study area requires a membership card. Finally, the rooftop terrace offers a panoramic view of the city and is open from 10 AM to 4 PM.`;

  const listening2 = [
    { type: 'MULTIPLE_CHOICE', prompt: 'What is currently on display in the main exhibition hall?', options: '["Modern Art","Ancient Civilizations","Natural History","Technology"]', correctIndex: 1, correctAnswer: 'Ancient Civilizations' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Where is the gift shop located?', options: '["To the right","To the left","Straight ahead","Upstairs"]', correctIndex: 1, correctAnswer: 'To the left' },
    { type: 'MULTIPLE_CHOICE', prompt: 'How many galleries are on the first floor?', options: '["Two","Three","Four","Five"]', correctIndex: 1, correctAnswer: 'Three' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What requires a membership card?', options: '["The library","The study area","The cafeteria","The gift shop"]', correctIndex: 1, correctAnswer: 'The study area' },
    { type: 'MULTIPLE_CHOICE', prompt: 'When is the rooftop terrace open?', options: '["9 AM - 5 PM","10 AM - 4 PM","10 AM - 6 PM","All day"]', correctIndex: 1, correctAnswer: '10 AM - 4 PM' },
    { type: 'FILL_BLANK', prompt: 'The ______ Gallery is at the top of the stairs on the first floor.', correctAnswer: 'Natural History' },
    { type: 'FILL_BLANK', prompt: 'The Art Gallery is to your ______ on the first floor.', correctAnswer: 'right' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Where are the restrooms located?', options: '["Near the gift shop","At the far end of the corridor","Next to the cafeteria","Upstairs"]', correctIndex: 1, correctAnswer: 'At the far end of the corridor' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What can visitors see from the rooftop terrace?', options: '["The garden","The city","The river","The mountains"]', correctIndex: 1, correctAnswer: 'The city' },
    { type: 'FILL_BLANK', prompt: 'The ______ is open to all visitors without a membership.', correctAnswer: 'library' },
  ];

  for (const q of listening2) {
    order++;
    await prisma.question.create({
      data: {
        practiceSetId: set.id,
        section: 'LISTENING',
        type: q.type,
        prompt: q.prompt,
        passage: listeningScript2,
        options: q.options || null,
        correctIndex: (q as any).correctIndex ?? null,
        correctAnswer: q.correctAnswer || null,
        points: 1,
        order,
      },
    });
  }
  console.log(`  ✓ Listening Section 2: 10 questions (MC + map)`);

  // Section 3: Discussion — MC + Matching
  const listeningScript3 = `Two students, Tom and Lisa, are discussing their research project.

Tom: So Lisa, have you decided on a topic for our research project yet?
Lisa: I was thinking about doing something on climate change and its effect on agriculture. But I'm not sure if it's too broad.
Tom: That's actually a good topic, but you're right — it might be too general. We should narrow it down.
Lisa: What if we focus on a specific region? Like the impact on rice production in Southeast Asia?
Tom: That's much better. It's specific and measurable. We can get data from the FAO database.
Lisa: Great. And for methodology, I was thinking we could use both quantitative and qualitative approaches.
Tom: I agree. We should do a survey of farmers AND analyze crop yield data over the past 10 years.
Lisa: Perfect. Let's also look at government policies. The agricultural ministry publishes annual reports.
Tom: Good idea. I'll handle the data analysis part, and you can focus on the literature review.
Lisa: Sounds fair. When should we have the first draft ready?
Tom: How about in two weeks? That gives us time to gather all the data and write up the findings.
Lisa: Two weeks works. Let's meet again next Tuesday to check our progress.`;

  const listening3 = [
    { type: 'MULTIPLE_CHOICE', prompt: 'What is the main topic of discussion?', options: '["A research project","A vacation plan","A job interview","A class schedule"]', correctIndex: 0, correctAnswer: 'A research project' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What was Lisa\'s initial topic idea?', options: '["Climate change and agriculture","Water pollution","Air quality","Deforestation"]', correctIndex: 0, correctAnswer: 'Climate change and agriculture' },
    { type: 'MULTIPLE_CHOICE', prompt: 'How did they narrow down the topic?', options: '["By focusing on a specific region","By changing the topic entirely","By focusing on animals","By limiting the time period"]', correctIndex: 0, correctAnswer: 'By focusing on a specific region' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Which region did they decide to focus on?', options: '["South America","Southeast Asia","Africa","Europe"]', correctIndex: 1, correctAnswer: 'Southeast Asia' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What database will they use for data?', options: '["World Bank","FAO database","NASA","UNESCO"]', correctIndex: 1, correctAnswer: 'FAO database' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What methodology will they use?', options: '["Only quantitative","Only qualitative","Both quantitative and qualitative","Only surveys"]', correctIndex: 2, correctAnswer: 'Both quantitative and qualitative' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What will Tom handle?', options: '["Literature review","Data analysis","Survey design","Government policies"]', correctIndex: 1, correctAnswer: 'Data analysis' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What will Lisa focus on?', options: '["Data analysis","Literature review","Data collection","Report formatting"]', correctIndex: 1, correctAnswer: 'Literature review' },
    { type: 'MULTIPLE_CHOICE', prompt: 'When will the first draft be ready?', options: '["In one week","In two weeks","In three weeks","In one month"]', correctIndex: 1, correctAnswer: 'In two weeks' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What crop are they focusing on?', options: '["Wheat","Rice","Corn","Soybeans"]', correctIndex: 1, correctAnswer: 'Rice' },
  ];

  for (const q of listening3) {
    order++;
    await prisma.question.create({
      data: {
        practiceSetId: set.id,
        section: 'LISTENING',
        type: q.type,
        prompt: q.prompt,
        passage: listeningScript3,
        options: q.options || null,
        correctIndex: (q as any).correctIndex ?? null,
        correctAnswer: q.correctAnswer || null,
        points: 1,
        order,
      },
    });
  }
  console.log(`  ✓ Listening Section 3: 10 questions (MC + matching)`);

  // Section 4: Lecture — Fill in the blanks (note completion)
  const listeningScript4 = `You will hear a lecture on the topic of renewable energy.

Good morning, everyone. Today I'd like to talk about the transition to renewable energy sources. As we know, fossil fuels have been the primary source of energy for over a century, but they come with significant environmental costs.

The three main types of renewable energy are solar, wind, and hydroelectric power. Solar energy has seen the most dramatic growth in recent years, with the cost of solar panels dropping by 90% since 2010. Wind energy is the second-largest source, particularly in coastal areas where wind patterns are consistent.

Hydroelectric power, while the oldest form of renewable energy, has limited growth potential because most suitable rivers have already been dammed. However, a newer technology called "pumped storage hydro" is gaining attention as a way to store excess energy.

The main challenge facing renewable energy is storage. Batteries are expensive and have limited lifespans. A promising solution is hydrogen fuel cells, which can store large amounts of energy for long periods.

Another challenge is grid integration. Renewable sources are intermittent — the sun doesn't always shine, and the wind doesn't always blow. Smart grids and AI-powered demand management are being developed to address this.

Looking ahead, experts predict that by 2050, renewable energy could account for 80% of global electricity production. This would require significant investment in infrastructure, estimated at $13 trillion globally.`;

  const listening4 = [
    { type: 'FILL_BLANK', prompt: 'Fossil fuels have been the primary energy source for over ______ years.', correctAnswer: '100' },
    { type: 'FILL_BLANK', prompt: 'The cost of solar panels has dropped by ______ % since 2010.', correctAnswer: '90' },
    { type: 'FILL_BLANK', prompt: '______ energy is the second-largest renewable source.', correctAnswer: 'Wind' },
    { type: 'FILL_BLANK', prompt: 'Hydroelectric power has limited growth because most suitable ______ have been dammed.', correctAnswer: 'rivers' },
    { type: 'FILL_BLANK', prompt: '______ storage hydro is a new technology for energy storage.', correctAnswer: 'pumped' },
    { type: 'FILL_BLANK', prompt: 'The main challenge facing renewable energy is ______.', correctAnswer: 'storage' },
    { type: 'FILL_BLANK', prompt: '______ fuel cells can store large amounts of energy.', correctAnswer: 'Hydrogen' },
    { type: 'FILL_BLANK', prompt: 'Renewable sources are ______ — the sun doesn\'t always shine.', correctAnswer: 'intermittent' },
    { type: 'FILL_BLANK', prompt: 'By 2050, renewable energy could account for ______ % of global electricity.', correctAnswer: '80' },
    { type: 'FILL_BLANK', prompt: 'The required infrastructure investment is estimated at $______ trillion.', correctAnswer: '13' },
  ];

  for (const q of listening4) {
    order++;
    await prisma.question.create({
      data: {
        practiceSetId: set.id,
        section: 'LISTENING',
        type: q.type,
        prompt: q.prompt,
        passage: listeningScript4,
        correctAnswer: q.correctAnswer,
        points: 1,
        order,
      },
    });
  }
  console.log(`  ✓ Listening Section 4: 10 questions (note completion)`);

  // ═══ READING SECTION (40 questions, 3 passages) ═════════════════════
  // Passage 1: True/False/Not Given + Fill in blanks
  const readingPassage1 = `The History of Coffee

Coffee is one of the most widely consumed beverages in the world, with over 2.25 billion cups consumed daily. But the story of how coffee became a global phenomenon is a fascinating one.

According to popular legend, coffee was discovered by an Ethiopian goat herder named Kaldi in the 9th century. Kaldi noticed that his goats became unusually energetic after eating berries from a certain plant. Intrigued, he tried the berries himself and experienced a similar effect. This discovery is said to have taken place in the Kaffa region of Ethiopia.

The first cultivated coffee plants were grown in Yemen, on the Arabian Peninsula, around the 15th century. By the 16th century, coffee had spread to the rest of the Middle East, as well as to North Africa. Coffee houses became popular gathering places where people would listen to music, play chess, and discuss politics.

The first coffee house in Europe opened in Venice in 1645. Coffee houses quickly spread across the continent, becoming centers of social and intellectual activity. In London, coffee houses were known as "penny universities" because for the price of a penny, one could buy a cup of coffee and engage in stimulating conversation.

The global spread of coffee was driven by colonial powers. The Dutch were the first to cultivate coffee outside the Middle East, establishing plantations in Java (Indonesia) in the 17th century. The French brought coffee to the Caribbean, while the Portuguese introduced it to Brazil, which is now the world's largest coffee producer.

Today, coffee is grown in over 70 countries along the "coffee belt" — the region between the Tropics of Cancer and Capricorn. The two main species of coffee are Arabica, which accounts for about 70% of production, and Robusta, which is more bitter but more resistant to disease.`;

  const reading1 = [
    { type: 'TRUE_FALSE_NOT_GIVEN', prompt: 'Statement: Over 2.25 billion cups of coffee are consumed daily.', options: '["True","False","Not Given"]', correctIndex: 0, correctAnswer: 'True' },
    { type: 'TRUE_FALSE_NOT_GIVEN', prompt: 'Statement: Kaldi was a farmer who grew wheat.', options: '["True","False","Not Given"]', correctIndex: 1, correctAnswer: 'False' },
    { type: 'TRUE_FALSE_NOT_GIVEN', prompt: 'Statement: Coffee was first cultivated in Ethiopia.', options: '["True","False","Not Given"]', correctIndex: 1, correctAnswer: 'False' },
    { type: 'TRUE_FALSE_NOT_GIVEN', prompt: 'Statement: The first coffee house in Europe opened in Paris.', options: '["True","False","Not Given"]', correctIndex: 1, correctAnswer: 'False' },
    { type: 'TRUE_FALSE_NOT_GIVEN', prompt: 'Statement: London coffee houses were called "penny universities".', options: '["True","False","Not Given"]', correctIndex: 0, correctAnswer: 'True' },
    { type: 'TRUE_FALSE_NOT_GIVEN', prompt: 'Statement: The Dutch established coffee plantations in Brazil.', options: '["True","False","Not Given"]', correctIndex: 1, correctAnswer: 'False' },
    { type: 'TRUE_FALSE_NOT_GIVEN', prompt: 'Statement: Arabica coffee accounts for approximately 70% of production.', options: '["True","False","Not Given"]', correctIndex: 0, correctAnswer: 'True' },
    { type: 'TRUE_FALSE_NOT_GIVEN', prompt: 'Statement: Robusta coffee is sweeter than Arabica.', options: '["True","False","Not Given"]', correctIndex: 2, correctAnswer: 'Not Given' },
    { type: 'FILL_BLANK', prompt: 'Kaldi noticed his ______ became energetic after eating coffee berries.', correctAnswer: 'goats' },
    { type: 'FILL_BLANK', prompt: 'The first cultivated coffee plants were grown in ______.', correctAnswer: 'Yemen' },
    { type: 'FILL_BLANK', prompt: 'Coffee houses became popular gathering places for music, chess, and ______.', correctAnswer: 'politics' },
    { type: 'FILL_BLANK', prompt: 'The first European coffee house opened in ______ in 1645.', correctAnswer: 'Venice' },
    { type: 'FILL_BLANK', prompt: 'In London, coffee houses were called "______ universities".', correctAnswer: 'penny' },
    { type: 'FILL_BLANK', prompt: 'The ______ established coffee plantations in Java.', correctAnswer: 'Dutch' },
    { type: 'FILL_BLANK', prompt: 'Brazil is now the world\'s largest coffee ______.', correctAnswer: 'producer' },
    { type: 'FILL_BLANK', prompt: 'Coffee is grown in the region between the Tropics of Cancer and ______.', correctAnswer: 'Capricorn' },
    { type: 'FILL_BLANK', prompt: 'Arabica and ______ are the two main species of coffee.', correctAnswer: 'Robusta' },
    { type: 'FILL_BLANK', prompt: 'Kaldi was an Ethiopian ______ herder.', correctAnswer: 'goat' },
    { type: 'FILL_BLANK', prompt: 'The discovery of coffee is said to have taken place in the ______ region.', correctAnswer: 'Kaffa' },
    { type: 'FILL_BLANK', prompt: 'The Portuguese introduced coffee to ______.', correctAnswer: 'Brazil' },
  ];

  for (const q of reading1) {
    order++;
    await prisma.question.create({
      data: {
        practiceSetId: set.id,
        section: 'READING',
        type: q.type,
        prompt: q.prompt,
        passage: readingPassage1,
        options: q.options || null,
        correctIndex: (q as any).correctIndex ?? null,
        correctAnswer: q.correctAnswer || null,
        points: 1,
        order,
      },
    });
  }
  console.log(`  ✓ Reading Passage 1: 20 questions (T/F/NG + fill-blank)`);

  // Reading Passage 2: MC + Matching Headings
  const readingPassage2 = `The Psychology of Habits

Habits are automatic behaviors that we perform without conscious thought. Research shows that about 40% of our daily actions are habits, not conscious decisions. Understanding how habits work can help us build positive routines and break negative ones.

The habit loop consists of three components: the cue, the routine, and the reward. The cue is a trigger that initiates the behavior. It can be a time of day, an emotional state, a location, or the presence of other people. The routine is the behavior itself — the action you take. The reward is the positive outcome that reinforces the behavior.

For example, if you check your phone every morning when you wake up, the cue is waking up, the routine is checking the phone, and the reward is the dopamine hit from seeing notifications. Understanding this loop is the first step to changing habits.

To build a new habit, experts recommend starting small. Rather than trying to exercise for an hour every day, start with five minutes. The key is consistency, not intensity. Research by Phillippa Lally at University College London found that it takes an average of 66 days to form a new habit, though this varies widely depending on the behavior and individual.

Breaking bad habits requires a different approach. Simply trying to stop a behavior rarely works because the cue and reward remain in place. Instead, experts recommend replacing the routine with a healthier alternative that provides a similar reward. For example, if you snack when stressed (cue = stress, reward = comfort), you could replace the snacking with a short walk.

Environmental design also plays a crucial role in habit formation. Making good habits easier and bad habits harder increases the likelihood of success. If you want to eat healthier, keep fruits visible on the counter and hide snacks in a cupboard. This simple environmental change can have a significant impact.

Technology is increasingly being used to support habit formation. Apps like Habitica and Streaks gamify the process, turning habit-building into a game with rewards and accountability. Research shows that these apps can be effective, particularly for people who are motivated by external rewards.

However, critics argue that excessive reliance on technology for habit formation can be counterproductive. If the app becomes the motivation, removing the app may cause the habit to disappear. The goal should be to internalize the habit so that it persists without external support.`;

  const reading2 = [
    { type: 'MULTIPLE_CHOICE', prompt: 'What percentage of daily actions are habits?', options: '["20%","30%","40%","50%"]', correctIndex: 2, correctAnswer: '40%' },
    { type: 'MULTIPLE_CHOICE', prompt: 'How many components does the habit loop have?', options: '["Two","Three","Four","Five"]', correctIndex: 1, correctAnswer: 'Three' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What is the cue in a habit loop?', options: '["The behavior","The trigger","The reward","The outcome"]', correctIndex: 1, correctAnswer: 'The trigger' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What is recommended for building new habits?', options: '["Start big","Start small","Set high goals","Exercise daily"]', correctIndex: 1, correctAnswer: 'Start small' },
    { type: 'MULTIPLE_CHOICE', prompt: 'How long does it take to form a new habit on average?', options: '["21 days","30 days","66 days","100 days"]', correctIndex: 2, correctAnswer: '66 days' },
    { type: 'MULTIPLE_CHOICE', prompt: 'Who conducted the research on habit formation time?', options: '["Phillippa Lally","Charles Duhigg","James Clear","BJ Fogg"]', correctIndex: 0, correctAnswer: 'Phillippa Lally' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What is recommended for breaking bad habits?', options: '["Stop entirely","Replace with healthier routine","Wait for it to fade","Ignore it"]', correctIndex: 1, correctAnswer: 'Replace with healthier routine' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What is environmental design?', options: '["Making good habits easier","Making bad habits harder","Both A and B","Neither"]', correctIndex: 2, correctAnswer: 'Both A and B' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What do apps like Habitica do?', options: '["Track sleep","Gamify habit-building","Monitor diet","Count steps"]', correctIndex: 1, correctAnswer: 'Gamify habit-building' },
    { type: 'MULTIPLE_CHOICE', prompt: 'What do critics say about technology for habits?', options: '["It\'s always effective","It can be counterproductive","It\'s unnecessary","It replaces therapy"]', correctIndex: 1, correctAnswer: 'It can be counterproductive' },
    { type: 'MATCHING', prompt: 'Match: The cue in the phone-checking example:', options: '["Waking up","Checking phone","Dopamine from notifications","Stress relief"]', correctIndex: 0, correctAnswer: 'Waking up' },
    { type: 'MATCHING', prompt: 'Match: The routine in the phone-checking example:', options: '["Waking up","Checking phone","Dopamine from notifications","Stress relief"]', correctIndex: 1, correctAnswer: 'Checking phone' },
    { type: 'MATCHING', prompt: 'Match: The reward in the phone-checking example:', options: '["Waking up","Checking phone","Dopamine from notifications","Stress relief"]', correctIndex: 2, correctAnswer: 'Dopamine from notifications' },
    { type: 'MATCHING', prompt: 'Match: The cue in the snacking example:', options: '["Waking up","Checking phone","Stress","Boredom"]', correctIndex: 2, correctAnswer: 'Stress' },
    { type: 'MATCHING', prompt: 'Match: The recommended replacement for snacking:', options: '["Watching TV","Short walk","Eating more","Drinking coffee"]', correctIndex: 1, correctAnswer: 'Short walk' },
    { type: 'SENTENCE_COMPLETION', prompt: 'About ______ % of our daily actions are habits.', correctAnswer: '40' },
    { type: 'SENTENCE_COMPLETION', prompt: 'The habit loop consists of cue, routine, and ______.', correctAnswer: 'reward' },
    { type: 'SENTENCE_COMPLETION', prompt: 'The key to building habits is ______, not intensity.', correctAnswer: 'consistency' },
    { type: 'SENTENCE_COMPLETION', prompt: 'Making good habits easier and bad habits harder is called ______ design.', correctAnswer: 'environmental' },
    { type: 'SENTENCE_COMPLETION', prompt: 'The goal should be to ______ the habit.', correctAnswer: 'internalize' },
  ];

  for (const q of reading2) {
    order++;
    await prisma.question.create({
      data: {
        practiceSetId: set.id,
        section: 'READING',
        type: q.type,
        prompt: q.prompt,
        passage: readingPassage2,
        options: q.options || null,
        correctIndex: (q as any).correctIndex ?? null,
        correctAnswer: q.correctAnswer || null,
        points: 1,
        order,
      },
    });
  }
  console.log(`  ✓ Reading Passage 2: 20 questions (MC + matching + sentence completion)`);

  // ═══ WRITING SECTION (2 tasks) ═══════════════════════════════════════
  // Task 1: Chart description
  await prisma.question.create({
    data: {
      practiceSetId: set.id,
      section: 'WRITING',
      type: 'CHART_DESCRIPTION',
      prompt: 'The bar chart below shows the percentage of people in different age groups who used public transport in a European city in 2005, 2010, and 2015. Summarize the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
      passage: 'Chart data: Age groups (18-25: 2005=45%, 2010=52%, 2015=60%; 26-40: 2005=55%, 2010=58%, 2015=62%; 41-60: 2005=30%, 2010=35%, 2015=40%; 61+: 2005=20%, 2010=25%, 2015=35%)',
      wordLimit: 150,
      points: 10,
      order: ++order,
    },
  });
  console.log(`  ✓ Writing Task 1: Chart description (150+ words)`);

  // Task 2: Essay
  await prisma.question.create({
    data: {
      practiceSetId: set.id,
      section: 'WRITING',
      type: 'ESSAY',
      prompt: 'Some people believe that universities should focus on providing academic skills, while others think they should prepare students for the workplace. Discuss both views and give your opinion. Write at least 250 words.',
      wordLimit: 250,
      points: 15,
      order: ++order,
    },
  });
  console.log(`  ✓ Writing Task 2: Essay (250+ words)`);

  // ═══ SPEAKING SECTION (3 parts) ══════════════════════════════════════
  const speakingPart1 = [
    'Part 1: Can you tell me about your hometown? What is it like?',
    'Part 1: What do you like most about where you live?',
    'Part 1: Do you prefer reading books or watching films? Why?',
    'Part 1: How do you usually spend your weekends?',
    'Part 1: Do you enjoy cooking? Why or why not?',
  ];
  for (const prompt of speakingPart1) {
    order++;
    await prisma.question.create({
      data: {
        practiceSetId: set.id,
        section: 'SPEAKING',
        type: 'SPEAKING',
        prompt,
        points: 3,
        order,
      },
    });
  }
  console.log(`  ✓ Speaking Part 1: 5 questions (personal questions)`);

  // Part 2: Cue card
  await prisma.question.create({
    data: {
      practiceSetId: set.id,
      section: 'SPEAKING',
      type: 'SPEAKING',
      prompt: 'Part 2 (Cue Card): Describe a time when you had to wait for something important. You should say: what you were waiting for, how long you waited, what you did while waiting, and explain how you felt about the wait. You have 1 minute to prepare and up to 2 minutes to speak.',
      points: 5,
      order: ++order,
    },
  });
  console.log(`  ✓ Speaking Part 2: Cue card (2-minute speech)`);

  // Part 3: Discussion
  const speakingPart3 = [
    'Part 3: Do you think people are generally more impatient now than in the past? Why?',
    'Part 3: How has technology changed the way people wait for things?',
    'Part 3: Do you think patience is an important quality? Why?',
    'Part 3: In what situations is it important to be patient?',
    'Part 3: Do you think children should be taught to be patient? How?',
  ];
  for (const prompt of speakingPart3) {
    order++;
    await prisma.question.create({
      data: {
        practiceSetId: set.id,
        section: 'SPEAKING',
        type: 'SPEAKING',
        prompt,
        points: 4,
        order,
      },
    });
  }
  console.log(`  ✓ Speaking Part 3: 5 questions (discussion)`);

  // Summary
  const totalQuestions = await prisma.question.count();
  console.log('');
  console.log(`✅ Seed complete: ${totalQuestions} questions across all 4 IELTS sections.`);
  console.log('   - Listening: 40 questions (4 subsections)');
  console.log('   - Reading: 40 questions (2 passages)');
  console.log('   - Writing: 2 tasks (chart description + essay)');
  console.log('   - Speaking: 11 questions (3 parts)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
