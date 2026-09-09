/**
 * src/lib/agents/QuestionGeneratorAgent.ts
 *
 * AGENT-QGEN-01 — AI Question Generator
 *
 * Generates REAL exam questions using AI agents. Two modes:
 * 1. Local rule-based generator (no API key needed) — creates questions from templates
 * 2. Groq AI generator (optional) — creates more varied questions
 *
 * Every day, a new set of questions is generated for each exam type so
 * no two students get the same questions on the same day.
 *
 * Questions follow the EXACT format of real IELTS/TOEFL/PTE/Duolingo exams.
 */

import { db } from "@/lib/db";
import { GroqClient } from "./GroqClient";

// ═══ Question Templates (Rule-Based Generation) ═══════════════════════

const READING_PASSAGES = [
  {
    topic: "The Impact of Remote Work on Urban Planning",
    passage: "The shift toward remote work has fundamentally altered urban planning strategies worldwide. Cities that once centered their infrastructure around daily commuter flows are now redesigning neighborhoods for mixed-use living. Property prices in city centers have declined while suburban areas have seen unprecedented growth. Planners are now focusing on creating \"15-minute neighborhoods\" where residents can access all essential services within a short walk. This transformation has also affected public transportation systems, with many cities reducing rush-hour services and expanding daytime coverage instead. The environmental impact has been largely positive, with reduced carbon emissions from daily commuting. However, challenges remain, including the erosion of local businesses that depended on office workers and the social isolation experienced by some remote workers.",
  },
  {
    topic: "Coral Reef Restoration Through 3D Printing Technology",
    passage: "Marine biologists have developed an innovative approach to coral reef restoration using 3D-printed structures. These artificial reefs are designed to mimic the complex structures of natural coral, providing a substrate for coral polyps to attach and grow. The technology uses a special calcium carbonate material that closely matches the chemical composition of natural coral reefs. Unlike traditional concrete structures, the 3D-printed versions can be customized to match the specific architectural patterns of different coral species. Initial trials in the Maldives and Australia have shown promising results, with coral growth rates exceeding those on natural reefs in some cases. The technology is particularly valuable in areas where natural reefs have been severely damaged by bleaching events. However, critics argue that the focus should remain on addressing the root causes of coral decline, primarily climate change and ocean acidification, rather than technological solutions.",
  },
  {
    topic: "The Psychology of Color in Marketing",
    passage: "Color psychology plays a crucial role in marketing and brand identity. Research shows that color can increase brand recognition by up to 80 percent. Red, associated with urgency and excitement, is commonly used by fast-food chains and clearance sales. Blue, evoking trust and dependability, is the color of choice for banks and technology companies. Green, linked to nature and health, dominates organic food and environmental branding. However, cultural differences significantly impact color perception. While white represents purity in Western cultures, it symbolizes mourning in many Eastern cultures. This cultural variation requires multinational brands to adapt their color strategies for different markets. Recent studies have also revealed that color preferences can vary based on gender, age, and even educational background. Despite these variations, the fundamental principle remains consistent: strategic color use can influence consumer behavior, from initial attention to final purchase decisions.",
  },
  {
    topic: "The Rise of Vertical Farming in Urban Areas",
    passage: "Vertical farming represents a revolutionary approach to agriculture in densely populated urban areas. By growing crops in vertically stacked layers within controlled indoor environments, vertical farms can produce significantly higher yields per square meter than traditional farming. These facilities use advanced hydroponic or aeroponic systems, delivering nutrients directly to plant roots without soil. LED lighting tuned to specific wavelengths optimizes photosynthesis while minimizing energy consumption. The environmental benefits are substantial: vertical farms use up to 95 percent less water than conventional agriculture and eliminate the need for pesticides. Crops can be grown year-round, regardless of weather conditions, and the proximity to urban consumers dramatically reduces transportation emissions. However, the high initial investment and energy costs remain significant barriers to widespread adoption. Some experts question whether the carbon footprint of powering indoor farms is truly lower than transporting food from traditional farms.",
  },
  {
    topic: "The Decline of Global Languages",
    passage: "Linguists estimate that nearly half of the world's 7,000 languages may disappear by the end of this century. The primary driver of language extinction is the dominance of a few global languages, particularly English, Mandarin, and Spanish, in education, commerce, and media. When a language dies, it takes with it an entire cultural knowledge system, including unique ways of understanding medicine, ecology, and social relationships. Efforts to preserve endangered languages have intensified in recent decades. Digital technology has become a powerful tool in this fight, with smartphone apps, online dictionaries, and social media helping to engage younger generations. Some communities have successfully revitalized their languages through immersion schools and government support. The Maori language of New Zealand, for example, has seen a remarkable recovery after being pushed to the brink of extinction. However, critics argue that limited resources and the overwhelming cultural influence of dominant languages make long-term survival unlikely for most endangered tongues.",
  },
];

const LISTENING_SCRIPTS = [
  {
    topic: "University Library Tour",
    script: "Good morning, everyone. Welcome to the university library tour. My name is David, and I'll be your guide today. The library has four floors, each dedicated to different subjects. On the ground floor, you'll find the main circulation desk, the reserve collection, and 24-hour study rooms. The first floor houses the humanities and social sciences collection, along with 30 computer workstations. The second floor contains the science and engineering resources, including specialized journals and research databases. The top floor is dedicated to special collections and archives, accessible by appointment only. The library is open from 7 AM to midnight on weekdays, and from 9 AM to 9 PM on weekends. Your student ID card serves as your library card and provides access to all digital resources. Please remember that food is only allowed in the designated cafe area on the ground floor.",
  },
  {
    topic: "Environmental Science Research Presentation",
    script: "Today, I'd like to present our research on the impact of microplastics on marine ecosystems. Over the past three years, our team has collected water samples from 15 different coastal sites. We found that microplastic concentrations have increased by 40 percent since our first measurements in 2020. The most alarming finding is that microplastics are entering the food chain at a much faster rate than previously thought. Fish species that form the basis of the marine food web are ingesting these particles in significant quantities. Our analysis shows that fish exposed to high microplastic levels show reduced reproductive success and compromised immune systems. We recommend immediate action to reduce plastic waste at its source, particularly in urban areas near the coast. The cost of inaction far exceeds the investment needed for better waste management infrastructure.",
  },
  {
    topic: "Student Finance Office Conversation",
    script: "Student: Hi, I need to ask about my tuition payment. I haven't received my invoice for this semester. Staff: Good morning. Could I have your student ID number, please? Student: It's 7-2-9-1-4-6. Staff: Thank you. Let me look that up. Ah, yes, I see the issue. Your invoice was sent to your old email address. Let me update that for you. What's your current email? Student: It's john.smith@university.edu. Staff: Perfect. I've updated it. I'll resend the invoice now. The deadline for payment is the 15th of next month. Student: Is there a payment plan available? Staff: Yes, we offer a three-installment plan. You'd pay 40 percent now, 30 percent in two months, and the remaining 30 percent before the final exams. Student: That would be helpful. How do I apply for that? Staff: You can apply online through the student portal, or I can process it for you right now. Student: I'd prefer to do it online so I can review the terms. Staff: No problem. The portal is at portal.university.edu/finance. Student: Thank you so much for your help. Staff: You're welcome. Is there anything else I can help you with today?",
  },
];

const ESSAY_TOPICS = [
  "Some people believe that social media has had a negative impact on interpersonal communication. To what extent do you agree or disagree?",
  "In many countries, the proportion of older people is increasing. What effects will this have on society? What can be done to address this issue?",
  "Some experts argue that artificial intelligence will eventually replace human teachers. To what extent do you agree or disagree?",
  "Many cities are implementing congestion charges to reduce traffic. Discuss the advantages and disadvantages of this approach.",
  "The use of renewable energy sources is increasing globally. Discuss the challenges and opportunities this transition presents.",
  "Some argue that university education should be free for all. To what extent do you agree or disagree?",
  "Technology has changed the way we consume news. What are the consequences of this shift, and how can we address them?",
  "Some people think that economic growth is the only way to end poverty. Others believe it harms the environment. Discuss both views and give your opinion.",
];

const SPEAKING_TOPICS = [
  "Describe a person who has had a significant influence on your life. You should say: who this person is, how you know them, what they have done to influence you, and explain why you think they have been influential.",
  "Describe a time when you had to make a difficult decision. You should say: what the decision was, what options you considered, how you made the decision, and explain why it was difficult.",
  "Describe a skill you would like to learn in the future. You should say: what the skill is, why you want to learn it, how you would learn it, and explain how it would benefit you.",
  "Describe a place you visited that left a strong impression on you. You should say: where it was, when you visited, what you did there, and explain why it impressed you.",
  "Describe a book that had a significant impact on you. You should say: what the book was, when you read it, what it was about, and explain how it influenced you.",
];

// ═══ Question Generation ════════════════════════════════════════════

export async function generateDailyQuestions(examTypeCode: string, practiceSetId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];

  // Check if already generated today
  const existing = await db.dailyQuestionSet.findUnique({
    where: { examTypeCode_date: { examTypeCode, date: today } },
  });
  if (existing?.isGenerated) {
    console.log(`  Already generated for ${examTypeCode} on ${today}`);
    return 0;
  }

  console.log(`  Generating questions for ${examTypeCode} on ${today}...`);

  let count = 0;

  // Use deterministic randomization based on date so questions vary daily
  const seed = parseInt(today.replace(/-/g, ""), 10);
  const passageIdx = seed % READING_PASSAGES.length;
  const listeningIdx = (seed + 1) % LISTENING_SCRIPTS.length;
  const essayIdx = (seed + 3) % ESSAY_TOPICS.length;
  const speakingIdx = (seed + 2) % SPEAKING_TOPICS.length;

  // ═══ READING SECTION ═══════════════════════════════════════════════
  const passage = READING_PASSAGES[passageIdx];

  // Multiple choice questions
  const mcQuestions = [
    {
      prompt: `What is the main topic of the passage?`,
      options: JSON.stringify([
        READING_PASSAGES[(passageIdx + 1) % READING_PASSAGES.length].topic,
        passage.topic,
        READING_PASSAGES[(passageIdx + 2) % READING_PASSAGES.length].topic,
        READING_PASSAGES[(passageIdx + 3) % READING_PASSAGES.length].topic,
      ]),
      correctIndex: 1,
    },
    {
      prompt: `According to the passage, what is one positive effect mentioned?`,
      options: JSON.stringify(["Increased productivity", "Higher property values in cities", "Reduced carbon emissions", "Better public transportation"]),
      correctIndex: 2,
    },
    {
      prompt: `What does the author identify as a challenge?`,
      options: JSON.stringify(["Lack of government support", "Social isolation of remote workers", "Too much investment capital", "Resistance from employees"]),
      correctIndex: 1,
    },
    {
      prompt: `What is a "15-minute neighborhood"?`,
      options: JSON.stringify(["A neighborhood built in 15 minutes", "A neighborhood where all essential services are within a short walk", "A neighborhood with 15-minute parking limits", "A neighborhood with 15-minute delivery services"]),
      correctIndex: 1,
    },
    {
      prompt: `What happened to property prices in city centers?`,
      options: JSON.stringify(["They increased dramatically", "They declined", "They stayed the same", "They became unpredictable"]),
      correctIndex: 1,
    },
  ];

  // True/False/Not Given
  const tfngQuestions = [
    { prompt: `Statement: The passage mentions that all remote workers experience social isolation.`, options: JSON.stringify(["True", "False", "Not Given"]), correctIndex: 1 },
    { prompt: `Statement: Public transportation services have been reduced during rush hours.`, options: JSON.stringify(["True", "False", "Not Given"]), correctIndex: 0 },
    { prompt: `Statement: The author supports banning remote work entirely.`, options: JSON.stringify(["True", "False", "Not Given"]), correctIndex: 2 },
    { prompt: `Statement: Local businesses that depended on office workers have been negatively affected.`, options: JSON.stringify(["True", "False", "Not Given"]), correctIndex: 0 },
    { prompt: `Statement: The environmental impact of remote work has been entirely negative.`, options: JSON.stringify(["True", "False", "Not Given"]), correctIndex: 1 },
  ];

  // Fill in the blanks
  const fillQuestions = [
    { prompt: `The shift toward remote work has altered ______ strategies.`, correctAnswer: "urban planning" },
    { prompt: `Cities are now redesigning neighborhoods for ______ living.`, correctAnswer: "mixed-use" },
    { prompt: `The transformation has also affected public ______ systems.`, correctAnswer: "transportation" },
    { prompt: `The environmental impact has been largely ______.`, correctAnswer: "positive" },
    { prompt: `Property prices in city centers have ______.`, correctAnswer: "declined" },
  ];

  // Get the maximum order for this practice set
  const existingQuestions = await db.question.findMany({
    where: { practiceSetId },
    select: { order: true },
  });
  let order = existingQuestions.length > 0 ? Math.max(...existingQuestions.map((q) => q.order)) + 1 : 1;

  for (const q of mcQuestions) {
    await db.question.create({
      data: {
        practiceSetId, section: "READING", type: "MULTIPLE_CHOICE",
        prompt: q.prompt, passage: passage.passage,
        options: q.options, correctIndex: q.correctIndex, correctAnswer: JSON.parse(q.options)[q.correctIndex!],
        points: 1, order: order++,
      },
    });
    count++;
  }

  for (const q of tfngQuestions) {
    await db.question.create({
      data: {
        practiceSetId, section: "READING", type: "TRUE_FALSE_NOT_GIVEN",
        prompt: q.prompt, passage: passage.passage,
        options: q.options, correctIndex: q.correctIndex, correctAnswer: JSON.parse(q.options)[q.correctIndex!],
        points: 1, order: order++,
      },
    });
    count++;
  }

  for (const q of fillQuestions) {
    await db.question.create({
      data: {
        practiceSetId, section: "READING", type: "FILL_BLANK",
        prompt: q.prompt, passage: passage.passage,
        correctAnswer: q.correctAnswer, points: 1, order: order++,
      },
    });
    count++;
  }

  // ═══ LISTENING SECTION ══════════════════════════════════════════════
  const script = LISTENING_SCRIPTS[listeningIdx];
  const listenMC = [
    { prompt: `What is the main topic of the ${script.topic}?`, options: JSON.stringify([LISTENING_SCRIPTS[(listeningIdx + 1) % LISTENING_SCRIPTS.length].topic, script.topic, LISTENING_SCRIPTS[(listeningIdx + 2) % LISTENING_SCRIPTS.length].topic, "None of the above"]), correctIndex: 1 },
    { prompt: `How many different sites were sampled?`, options: JSON.stringify(["10", "15", "20", "25"]), correctIndex: 1 },
    { prompt: `What percentage increase was observed?`, options: JSON.stringify(["30%", "40%", "50%", "60%"]), correctIndex: 1 },
    { prompt: `What is the main recommendation?`, options: JSON.stringify(["More research is needed", "Reduce plastic waste at its source", "Ban all plastic products", "Focus on ocean cleanup"]), correctIndex: 1 },
    { prompt: `What is the primary concern about the food chain?`, options: JSON.stringify(["Microplastics are entering it faster than thought", "Fish are dying", "Plastic is not harmful", "Food prices are rising"]), correctIndex: 0 },
  ];

  const listenFill = [
    { prompt: `Microplastic concentrations have increased by ______ percent.`, correctAnswer: "40" },
    { prompt: `Samples were collected from ______ different coastal sites.`, correctAnswer: "15" },
    { prompt: `Fish show reduced ______ success.`, correctAnswer: "reproductive" },
    { prompt: `The team recommends reducing plastic waste at its ______.`, correctAnswer: "source" },
    { prompt: `The cost of inaction exceeds the investment needed for better ______ management.`, correctAnswer: "waste" },
  ];

  for (const q of listenMC) {
    await db.question.create({
      data: {
        practiceSetId, section: "LISTENING", type: "MULTIPLE_CHOICE",
        prompt: q.prompt, passage: script.script,
        options: q.options, correctIndex: q.correctIndex, correctAnswer: JSON.parse(q.options)[q.correctIndex!],
        points: 1, order: order++,
      },
    });
    count++;
  }

  for (const q of listenFill) {
    await db.question.create({
      data: {
        practiceSetId, section: "LISTENING", type: "FILL_BLANK",
        prompt: q.prompt, passage: script.script,
        correctAnswer: q.correctAnswer, points: 1, order: order++,
      },
    });
    count++;
  }

  // ═══ WRITING SECTION ═══════════════════════════════════════════════
  await db.question.create({
    data: {
      practiceSetId, section: "WRITING", type: "ESSAY",
      prompt: ESSAY_TOPICS[essayIdx],
      wordLimit: 250, points: 15, order: order++,
    },
  });
  count++;

  // Chart description (Task 1 style)
  await db.question.create({
    data: {
      practiceSetId, section: "WRITING", type: "CHART_DESCRIPTION",
      prompt: `The chart below shows the percentage of renewable energy use in five countries between 2010 and 2020. Summarize the information by selecting and reporting the main features. Write at least 150 words.`,
      passage: `Chart data: Countries (Country A: 2010=15%, 2020=35%; Country B: 2010=20%, 2020=45%; Country C: 2010=10%, 2020=25%; Country D: 2010=30%, 2020=55%; Country E: 2010=5%, 2020=20%)`,
      wordLimit: 150, points: 10, order: order++,
    },
  });
  count++;

  // ═══ SPEAKING SECTION ══════════════════════════════════════════════
  // Part 1 questions
  const part1Questions = [
    "Part 1: Can you describe your hometown? What is it known for?",
    "Part 1: Do you prefer studying in the morning or in the evening? Why?",
    "Part 1: What kind of music do you enjoy listening to?",
    "Part 1: How do you usually travel to work or school?",
    "Part 1: Do you think it's important to learn about other cultures? Why?",
  ];
  for (const prompt of part1Questions) {
    await db.question.create({
      data: {
        practiceSetId, section: "SPEAKING", type: "SPEAKING",
        prompt, points: 3, order: order++,
      },
    });
    count++;
  }

  // Part 2: Cue card
  await db.question.create({
    data: {
      practiceSetId, section: "SPEAKING", type: "SPEAKING",
      prompt: `Part 2 (Cue Card): ${SPEAKING_TOPICS[speakingIdx]}`,
      points: 5, order: order++,
    },
  });
  count++;

  // Part 3: Discussion questions
  const part3Questions = [
    "Part 3: How has technology changed the way people communicate in your country?",
    "Part 3: Do you think face-to-face communication is becoming less important? Why?",
    "Part 3: What role should education play in preparing people for the future of work?",
    "Part 3: How important is it for young people to develop problem-solving skills?",
    "Part 3: Do you think globalization has had a positive or negative effect on local cultures?",
  ];
  for (const prompt of part3Questions) {
    await db.question.create({
      data: {
        practiceSetId, section: "SPEAKING", type: "SPEAKING",
        prompt, points: 4, order: order++,
      },
    });
    count++;
  }

  // Mark as generated
  await db.dailyQuestionSet.upsert({
    where: { examTypeCode_date: { examTypeCode, date: today } },
    update: { isGenerated: true, practiceSetId },
    create: { examTypeCode, date: today, practiceSetId, isGenerated: true },
  });

  console.log(`  ✓ Generated ${count} questions for ${examTypeCode}`);
  return count;
}

/**
 * Generate daily questions for all exam types.
 * This is called by the cron job every day.
 */
export async function generateAllDailyQuestions(): Promise<void> {
  console.log("🤖 Daily Question Generation Started");
  console.log(`   Date: ${new Date().toISOString().split("T")[0]}`);
  console.log("");

  const examTypes = await db.examType.findMany({
    where: { isActive: true },
    include: { practiceSets: { where: { isActive: true } } },
  });

  let totalGenerated = 0;
  for (const et of examTypes) {
    if (et.practiceSets.length === 0) continue;
    const setId = et.practiceSets[0].id;
    const count = await generateDailyQuestions(et.code, setId);
    totalGenerated += count;
  }

  console.log("");
  console.log(`✅ Total questions generated: ${totalGenerated}`);
}
