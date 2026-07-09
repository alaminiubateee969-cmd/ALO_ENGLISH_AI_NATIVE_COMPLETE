// =============================================================================
// ALO English Test Platform — Original Question Bank
// =============================================================================
// All questions, passages, audio scripts, prompts and model answers in this
// file are 100% ORIGINAL content written for the ALO English Test Platform.
// They are exam-aligned practice only: they mimic the *structure* of well-
// known English proficiency tests (IELTS, PTE, TOEFL, Duolingo, OIETC) but
// do NOT reproduce any official exam content. No claim is made that any of
// these items will appear in a real exam. Scores shown to learners are
// practice estimates only.
// =============================================================================

export type Difficulty = "easy" | "medium" | "hard" | "advanced";

export type QuestionType =
  | "multiple-choice"
  | "true-false-not-given"
  | "matching-headings"
  | "fill-blanks"
  | "short-answer"
  | "sentence-completion"
  | "matching-features"
  | "reading-mcq"
  | "writing-task1"
  | "writing-task2"
  | "speaking-part1"
  | "speaking-part2"
  | "speaking-part3"
  | "read-aloud"
  | "repeat-sentence"
  | "describe-image"
  | "summarize-written-text"
  | "essay"
  | "reorder-paragraphs"
  | "write-from-dictation"
  | "read-and-select"
  | "listen-and-select"
  | "writing-sample"
  | "speaking-sample"
  | "complete-the-sentence"
  | "vocabulary-in-context";

export type ExamType = "IELTS" | "PTE" | "TOEFL" | "Duolingo" | "OIETC";

export type Question = {
  id: string;
  examType: ExamType;
  section: string; // 'Reading', 'Listening', 'Writing', 'Speaking'
  type: QuestionType;
  difficulty: Difficulty;
  tags: string[];
  passage?: string; // for reading questions
  audioScript?: string; // for listening questions (original transcript)
  imagePrompt?: string; // describe-image placeholder text
  prompt: string; // the question/prompt text
  options?: string[]; // for MCQ
  correctIndex?: number; // for MCQ
  correctAnswer?: string; // for fill-blanks / short-answer / multi-select
  modelAnswer?: string; // for writing/speaking prompts
  explanation: string;
  timeSeconds: number; // suggested time
};

// =============================================================================
// IELTS READING (ACADEMIC) — 6 original passages × 3 questions = 18 questions
// =============================================================================

const IELTS_READING_PASSAGE_GREEN = `Urban green spaces — parks, gardens, tree-lined corridors, and rooftop plantings — have long been valued for the visual relief they offer amid dense cityscapes. Yet recent research suggests their benefits extend far beyond aesthetics. Studies in cities as varied as Singapore, Manchester, and Bogota indicate that access to greenery correlates with measurable improvements in mental health, particularly reductions in cortisol levels among residents who spend as little as twenty minutes per week in vegetated settings. These findings have prompted urban planners to reconsider how public land is allocated.

A second, often overlooked benefit is environmental. Vegetated surfaces absorb particulate pollution, lower ambient temperatures through evapotranspiration, and provide habitat for pollinators whose decline threatens food security. In neighbourhoods where canopy cover exceeds thirty percent, surface temperatures during heatwaves can be up to five degrees cooler than in adjacent concrete districts — a margin that, in extreme weather, can prevent fatalities among elderly residents.

Critics, however, argue that ambitious greening programmes risk accelerating gentrification. As leafy streets raise property values, lower-income tenants may be priced out of the very neighbourhoods improved on their behalf. Scholars term this phenomenon "green gentrification", and urge policymakers to pair planting schemes with affordable-housing protections if equity is to be preserved.`;

const IELTS_READING_PASSAGE_COFFEE = `The popular legend that an Ethiopian goatherd named Kaldi discovered coffee after his goats ate red berries and grew unusually frisky is impossible to verify, but it aptly signals the drink's ancient and intimate connection to the Horn of Africa. By the fifteenth century, Sufi monasteries in Yemen were roasting and brewing the beans to sustain worshippers during nighttime devotions, and from there coffee spread along trade routes to Mecca, Cairo, and eventually Istanbul, where the first dedicated coffeehouses appeared in the mid-1500s.

These coffeehouses — known in Arabic as qahveh khaneh — rapidly became more than mere refreshment stalls. They functioned as centres of political debate, musical performance, chess, and news. Authorities in Mecca and Cairo at various times attempted to ban the beverage, fearing that gatherings of caffeinated intellectuals posed a threat to public order. Such prohibitions rarely lasted long, defeated as much by popular demand as by the practical difficulty of enforcement.

Coffee's arrival in Europe via Venetian merchants in the early seventeenth century transformed it again. London's coffeehouses, nicknamed "penny universities" because admission cost one penny and the conversation was said to be worth a scholar's lecture, became incubators of finance, insurance, and journalism. Lloyd's of London, the Royal Society, and the London Stock Exchange each trace their origins to a coffeehouse where like-minded men gathered over the dark, bitter brew.`;

const IELTS_READING_PASSAGE_CORAL = `Coral reefs occupy less than one percent of the ocean floor yet shelter roughly a quarter of all marine species. This improbable productivity rests on a symbiosis between coral polyps — tiny animals related to jellyfish — and photosynthetic algae called zooxanthellae that live within their tissues. The algae supply the polyps with carbohydrates produced through photosynthesis; in return, they receive shelter and nutrients. The partnership is so close that the dazzling colours of a healthy reef are, in fact, the algae's pigments showing through translucent polyp tissue.

When sea temperatures rise even slightly above seasonal norms, the polyps expel their algae, a stress response known as bleaching. Without the algae, the coral loses its colour and, more critically, its primary food source. Bleached reefs are not immediately dead — polyps can reacquire algae if conditions return to normal within weeks — but prolonged or repeated bleaching events cause mass mortality. The 2016 bleaching of Australia's Great Barrier Reef, for instance, is estimated to have killed approximately thirty percent of shallow-water corals in a single season.

Recovery is possible but slow, requiring decades of undisturbed growth and the absence of additional stressors such as agricultural runoff, crown-of-thorns starfish outbreaks, and further temperature spikes. Scientists increasingly argue that protecting reefs in a warming ocean will require not only emissions reductions but active restoration efforts, including coral gardening and the selective breeding of heat-tolerant strains.`;

const IELTS_READING_PASSAGE_REMOTE = `The sudden global experiment in remote work that began in 2020 has settled into something more enduring than many predicted. Surveys conducted in 2024 suggest that roughly a quarter of professional workers in advanced economies now operate in hybrid arrangements, splitting their week between home and office. The economic implications ripple outward in ways that policymakers are only beginning to quantify.

For employees, the financial picture is mixed. Savings on commuting, work clothing, and daily meals are partially offset by increased home energy use and, for many, the cost of outfitting a dedicated workspace. A widely cited 2023 study estimated the average hybrid worker in London saved approximately two thousand pounds annually after these offsetting costs — a meaningful sum, but far less than headline figures that ignored home-side expenditures. For employers, the calculus centres on commercial real estate. Vacant desks have prompted some firms to downsize, releasing capital but also threatening the ancillary economies of city-centre cafes, transport systems, and retail.

The wider urban consequence is a redistribution rather than a disappearance of economic activity. Suburban high streets in many cities have reported increased foot traffic and longer trading hours, while central business districts have struggled to revive pre-pandemic vibrancy. Whether this rebalancing produces more equitable cities or merely new inequalities between well-connected suburbs and peripheral districts remains, for now, an open question.`;

const IELTS_READING_PASSAGE_SLEEP = `For much of the twentieth century, sleep was treated by physicians as a passive state — a mere absence of waking activity whose function, beyond rest, was obscure. The development of electroencephalography in the 1930s, and the discovery in 1953 of rapid eye movement (REM) sleep, overturned that view. Sleep, researchers now agree, is a tightly regulated neurological process during which the brain performs essential housekeeping: clearing metabolic waste, consolidating memories, and recalibrating emotional circuits.

The glymphatic system, identified only in 2012, illustrates this housekeeping role. During deep sleep, channels between brain cells expand, allowing cerebrospinal fluid to flush out proteins such as beta-amyloid, whose accumulation is associated with Alzheimer's disease. Chronic restriction of sleep to fewer than six hours per night has been linked in longitudinal studies to elevated risks of cardiovascular disease, type 2 diabetes, and cognitive decline — associations that persist even after statistically controlling for age, body mass, and lifestyle factors.

Yet the modern environment conspires against sleep. Artificial light, particularly the blue wavelengths emitted by screens, suppresses melatonin secretion and delays sleep onset. Shift work, long commutes, and the cultural valorisation of "hustle" further erode sleep duration. Public health campaigners increasingly argue that sleep ought to be treated not as a luxury but as a pillar of wellbeing on par with diet and exercise.`;

const IELTS_READING_PASSAGE_STORAGE = `The growth of wind and solar generation has outpaced nearly every forecast made a decade ago. Yet the same intermittency that critics long predicted now poses a genuine engineering challenge: the sun does not shine at night, and wind speeds fluctuate hourly. Without reliable storage, renewable-rich grids must either maintain fossil-fuel backup plants or curtail production during periods of surplus — both wasteful outcomes.

Lithium-ion batteries dominate the current storage market, largely on the strength of plunging costs driven by electric-vehicle manufacturing. A typical utility-scale lithium battery can discharge at full capacity for roughly four hours, sufficient to bridge the evening demand peak that follows sunset. For longer durations — multi-day wind lulls, for example — alternative technologies are needed. Pumped hydroelectric storage, in which water is pumped uphill during surplus and released through turbines later, remains the largest form of grid storage worldwide by capacity, but it is constrained by geography.

Emerging chemistries aim to fill the gap. Sodium-ion batteries, which rely on an abundant element rather than scarce lithium, are entering commercial production. Flow batteries, which store energy in liquid electrolytes held in external tanks, can be scaled simply by enlarging the tanks. Compressed-air and thermal storage systems offer further options. Most analysts agree that no single technology will dominate; rather, a portfolio approach combining short-, medium-, and long-duration storage will be required to fully decarbonise electricity systems.`;

// -----------------------------------------------------------------------------
// IELTS LISTENING — 4 original audio scripts × 2 questions = 8 questions
// -----------------------------------------------------------------------------

const IELTS_LISTENING_SCRIPT_ORIENTATION = `Welcome, everyone, to your first week at Northgate University. I'm Dr Patel, the Director of Student Services, and I'm here to walk you through a few essentials before classes begin on Monday. First, your student ID cards. You can collect them from the Registry on the second floor of the Main Building between nine and five today and tomorrow. You'll need the card to access the library, print credits, the gym, and most examination halls.

Second, the IT setup. Your university email account has already been created — your username is your six-digit student number, and your temporary password is your date of birth in eight-digit format, day-month-year. You will be required to change it on first login. If you have trouble, the IT helpdesk is in Building C, Room 14, open weekdays from eight in the morning until seven in the evening.

Finally, a word about well-being. The Counselling Service offers confidential appointments at no charge, and you don't need a referral. You can book online through the student portal or call extension 2275. I encourage you to use it early rather than waiting until things feel overwhelming.`;

const IELTS_LISTENING_SCRIPT_LIBRARY = `Good afternoon, and welcome to the Hartley Library. I'm Marcus, one of the subject librarians, and I'll be giving you a twenty-minute orientation. The library occupies four floors. On the ground floor you'll find the main issue desk, the short-loan collection, and twenty-four-hour study spaces accessible with your card. The first floor houses the social sciences and humanities print collections, arranged by the Library of Congress classification. The second floor holds sciences, engineering, and medicine. The third floor is a silent reading room — no conversation, no phones, no food.

A few rules to highlight. You may borrow up to fifteen items at a time for a standard period of three weeks. Items can be renewed twice online unless another borrower has reserved them. Fines are no longer charged for overdue standard loans, but if an item is more than twenty-eight days overdue your account will be suspended and replacement charges applied.

We also offer specialist support. Each academic department has a named subject librarian who can help with literature searching, referencing software, and systematic reviews. You can book one-to-one appointments of up to forty-five minutes through the library website. I strongly recommend this for anyone starting a dissertation.`;

const IELTS_LISTENING_SCRIPT_MARINE = `Today we turn to the open ocean — specifically, the mesopelagic zone, often called the "twilight zone". This region lies between two hundred and one thousand metres below the surface, where sunlight fades to a faint blue gloom and eventually disappears altogether. For decades it was dismissed as a biological desert. We now know it is anything but.

The mesopelagic is home to the largest daily migration on Earth. Each night, countless fish, squid, and crustaceans rise toward the surface to feed under cover of darkness, then descend again at dawn to avoid predators. This vertical commute, known as diel vertical migration, transports enormous quantities of carbon from surface waters to the deep ocean — a service whose climate significance researchers have only recently grasped.

Estimates of the zone's total biomass have been revised upward dramatically. A 2014 sonar survey suggested mesopelagic fish alone may weigh between ten and fifteen billion metric tonnes — roughly one hundred times earlier estimates and far exceeding the combined weight of all humans on Earth. The implications for fisheries policy and climate modelling are profound, and the twilight zone is now firmly on the international research agenda.`;

const IELTS_LISTENING_SCRIPT_ACCOMMODATION = `Receptionist: Good morning, Parkview Student Housing, how can I help?
Student: Hi, I've just been offered a place at the university and I'm calling about the studio apartments advertised on your website.
Receptionist: Of course. We have two studio layouts available from September. The standard studio is twenty-two square metres with a kitchenette and en-suite bathroom, at six hundred and twenty pounds per month. The deluxe is thirty square metres with a separate kitchen and a small balcony, at seven hundred and ninety pounds.
Student: What's included in the rent?
Receptionist: Heating, water, and Wi-Fi are included. Electricity is metered and billed separately — most tenants pay around forty pounds a month. A refundable damage deposit of five hundred pounds is required at sign-on, and the minimum contract is forty-four weeks.
Student: Is there a laundry?
Receptionist: Yes, a shared laundry in the basement — two pounds eighty per wash, and one pound fifty for the dryer. There's also a secure bike store, a small gym, and a common room with a TV on the ground floor.
Student: Sounds great. Could I book a viewing?
Receptionist: Absolutely — we run viewings Tuesday and Thursday afternoons at two, three, and four. Which would suit you?`;

// =============================================================================
// MAIN QUESTION BANK
// =============================================================================

export const QUESTIONS: Question[] = [
  // ---------------------------------------------------------------------------
  // IELTS READING — Passage 1: Urban Green Spaces
  // ---------------------------------------------------------------------------
  {
    id: "ielts-reading-1",
    examType: "IELTS",
    section: "Reading",
    type: "multiple-choice",
    difficulty: "medium",
    tags: ["academic-reading", "main-idea", "detail"],
    passage: IELTS_READING_PASSAGE_GREEN,
    prompt:
      "According to the passage, what is the minimum weekly exposure to greenery linked to reduced cortisol levels?",
    options: [
      "Five minutes",
      "Twenty minutes",
      "One hour",
      "Two hours",
    ],
    correctIndex: 1,
    explanation:
      "Paragraph 1 states that measurable reductions in cortisol occur among residents who spend 'as little as twenty minutes per week' in vegetated settings. The other options are plausible distractors but are not supported by the text.",
    timeSeconds: 90,
  },
  {
    id: "ielts-reading-2",
    examType: "IELTS",
    section: "Reading",
    type: "true-false-not-given",
    difficulty: "medium",
    tags: ["academic-reading", "detail"],
    passage: IELTS_READING_PASSAGE_GREEN,
    prompt:
      "Do the following statements agree with the information in the passage? Statement: Green spaces have been shown to reduce surface temperatures by more than ten degrees during heatwaves.",
    options: ["True", "False", "Not Given"],
    correctIndex: 1,
    explanation:
      "FALSE. Paragraph 2 states the cooling margin is 'up to five degrees', which directly contradicts the claim of 'more than ten degrees'. Where a passage gives a specific figure that conflicts with the statement, the answer is False — not Not Given.",
    timeSeconds: 75,
  },
  {
    id: "ielts-reading-3",
    examType: "IELTS",
    section: "Reading",
    type: "sentence-completion",
    difficulty: "hard",
    tags: ["academic-reading", "inference", "vocabulary"],
    passage: IELTS_READING_PASSAGE_GREEN,
    prompt:
      "Complete the sentence using words from the passage. Critics warn that ambitious greening programmes can contribute to a process known as __________.",
    correctAnswer: "green gentrification",
    explanation:
      "The final paragraph names the phenomenon 'green gentrification' and defines it as lower-income tenants being priced out of newly leafy neighbourhoods. Use the exact term from the text for sentence-completion items.",
    timeSeconds: 75,
  },

  // ---------------------------------------------------------------------------
  // IELTS READING — Passage 2: History of Coffee
  // ---------------------------------------------------------------------------
  {
    id: "ielts-reading-4",
    examType: "IELTS",
    section: "Reading",
    type: "matching-headings",
    difficulty: "medium",
    tags: ["academic-reading", "main-idea"],
    passage: IELTS_READING_PASSAGE_COFFEE,
    prompt:
      "Choose the most suitable heading for the SECOND paragraph of the passage.",
    options: [
      "The Spread of Coffee to Europe",
      "Coffeehouses as Social and Political Hubs",
      "The Religious Origins of Coffee",
      "Attempts to Legally Cultivate Coffee",
    ],
    correctIndex: 1,
    explanation:
      "Paragraph 2 describes coffeehouses as centres of debate, music, chess, news, and political concern to authorities — making 'Coffeehouses as Social and Political Hubs' the best fit. Option A refers to paragraph 3, and C/D do not match any paragraph accurately.",
    timeSeconds: 90,
  },
  {
    id: "ielts-reading-5",
    examType: "IELTS",
    section: "Reading",
    type: "multiple-choice",
    difficulty: "easy",
    tags: ["academic-reading", "detail"],
    passage: IELTS_READING_PASSAGE_COFFEE,
    prompt:
      'Why were coffeehouses in London nicknamed "penny universities"?',
    options: [
      "Because they charged university-level tuition fees",
      "Because one penny granted admission and the conversation was said to be as valuable as a scholar's lecture",
      "Because they were built next to existing universities",
      "Because only university graduates were admitted",
    ],
    correctIndex: 1,
    explanation:
      "Paragraph 3 explains the nickname: admission cost one penny and the conversation inside was said to equal a scholar's lecture. The distractors play on the word 'university' but are not supported by the text.",
    timeSeconds: 75,
  },
  {
    id: "ielts-reading-6",
    examType: "IELTS",
    section: "Reading",
    type: "true-false-not-given",
    difficulty: "easy",
    tags: ["academic-reading", "detail"],
    passage: IELTS_READING_PASSAGE_COFFEE,
    prompt:
      "Statement: Authorities in Mecca successfully banned coffee on a permanent basis.",
    options: ["True", "False", "Not Given"],
    correctIndex: 1,
    explanation:
      "FALSE. Paragraph 2 states that prohibitions 'rarely lasted long'. The word 'successfully' and 'permanent' both contradict the passage. Be careful to read qualifiers such as 'rarely', 'seldom', or 'rarely lasted'.",
    timeSeconds: 70,
  },

  // ---------------------------------------------------------------------------
  // IELTS READING — Passage 3: Coral Reef Ecology
  // ---------------------------------------------------------------------------
  {
    id: "ielts-reading-7",
    examType: "IELTS",
    section: "Reading",
    type: "multiple-choice",
    difficulty: "medium",
    tags: ["academic-reading", "detail", "vocabulary"],
    passage: IELTS_READING_PASSAGE_CORAL,
    prompt:
      "What is the primary food source that zooxanthellae provide to coral polyps?",
    options: [
      "Calcium carbonate from the skeleton",
      "Carbohydrates produced through photosynthesis",
      "Plankton filtered from the surrounding seawater",
      "Nitrogen fixed from dissolved gases",
    ],
    correctIndex: 1,
    explanation:
      "Paragraph 1 states explicitly that the algae 'supply the polyps with carbohydrates produced through photosynthesis'. The distractors name real biological materials but are not the substance mentioned.",
    timeSeconds: 80,
  },
  {
    id: "ielts-reading-8",
    examType: "IELTS",
    section: "Reading",
    type: "sentence-completion",
    difficulty: "hard",
    tags: ["academic-reading", "inference"],
    passage: IELTS_READING_PASSAGE_CORAL,
    prompt:
      "Complete the sentence using information from the passage. A bleached reef is not immediately dead, provided that __________ within a few weeks.",
    correctAnswer: "conditions return to normal",
    explanation:
      "Paragraph 2 explains that polyps can reacquire algae — and survive — if 'conditions return to normal within weeks'. Accept paraphrases such as 'environmental conditions recover' but the key concept is the return of normal conditions.",
    timeSeconds: 90,
  },
  {
    id: "ielts-reading-9",
    examType: "IELTS",
    section: "Reading",
    type: "true-false-not-given",
    difficulty: "medium",
    tags: ["academic-reading", "detail"],
    passage: IELTS_READING_PASSAGE_CORAL,
    prompt:
      "Statement: The 2016 bleaching event killed roughly half of all shallow-water corals on the Great Barrier Reef.",
    options: ["True", "False", "Not Given"],
    correctIndex: 1,
    explanation:
      "FALSE. Paragraph 2 gives the figure as 'approximately thirty percent'. 'Roughly half' (= 50%) directly contradicts 30%. Distinguish carefully between 'thirty percent' and 'half' under exam pressure.",
    timeSeconds: 70,
  },

  // ---------------------------------------------------------------------------
  // IELTS READING — Passage 4: Remote Work Economics
  // ---------------------------------------------------------------------------
  {
    id: "ielts-reading-10",
    examType: "IELTS",
    section: "Reading",
    type: "multiple-choice",
    difficulty: "medium",
    tags: ["academic-reading", "detail"],
    passage: IELTS_READING_PASSAGE_REMOTE,
    prompt:
      "According to the passage, what is the net annual saving estimated for the average hybrid worker in London?",
    options: [
      "Approximately five hundred pounds",
      "Approximately two thousand pounds",
      "Approximately five thousand pounds",
      "Approximately ten thousand pounds",
    ],
    correctIndex: 1,
    explanation:
      "Paragraph 2 cites a 2023 study estimating the saving at 'approximately two thousand pounds annually after these offsetting costs'. The headline figures that ignore home-side costs are explicitly criticised in the passage.",
    timeSeconds: 80,
  },
  {
    id: "ielts-reading-11",
    examType: "IELTS",
    section: "Reading",
    type: "true-false-not-given",
    difficulty: "hard",
    tags: ["academic-reading", "inference", "main-idea"],
    passage: IELTS_READING_PASSAGE_REMOTE,
    prompt:
      "Statement: The shift to remote work has resulted in the complete disappearance of economic activity from city centres.",
    options: ["True", "False", "Not Given"],
    correctIndex: 1,
    explanation:
      "FALSE. Paragraph 3 describes the shift as 'a redistribution rather than a disappearance of economic activity'. The economic activity has moved (e.g. to suburban high streets), not vanished.",
    timeSeconds: 80,
  },
  {
    id: "ielts-reading-12",
    examType: "IELTS",
    section: "Reading",
    type: "sentence-completion",
    difficulty: "hard",
    tags: ["academic-reading", "vocabulary"],
    passage: IELTS_READING_PASSAGE_REMOTE,
    prompt:
      "Complete the sentence using words from the passage. Some firms have downsized their offices, freeing up capital but threatening the __________ of city centres.",
    correctAnswer: "ancillary economies",
    explanation:
      "Paragraph 2 refers to 'the ancillary economies of city-centre cafes, transport systems, and retail'. The phrase 'ancillary economies' captures the supporting businesses that suffer when offices sit empty.",
    timeSeconds: 90,
  },

  // ---------------------------------------------------------------------------
  // IELTS READING — Passage 5: Sleep Science
  // ---------------------------------------------------------------------------
  {
    id: "ielts-reading-13",
    examType: "IELTS",
    section: "Reading",
    type: "matching-headings",
    difficulty: "medium",
    tags: ["academic-reading", "main-idea"],
    passage: IELTS_READING_PASSAGE_SLEEP,
    prompt:
      "Choose the most suitable heading for the SECOND paragraph of the passage.",
    options: [
      "The Discovery of REM Sleep",
      "Sleep as a Passive State",
      "The Brain's Nighttime Cleaning System",
      "Cultural Attitudes Toward Sleep",
    ],
    correctIndex: 2,
    explanation:
      "Paragraph 2 introduces the glymphatic system — channels that expand during deep sleep to flush out waste proteins such as beta-amyloid. 'The Brain's Nighttime Cleaning System' best captures this housekeeping role.",
    timeSeconds: 90,
  },
  {
    id: "ielts-reading-14",
    examType: "IELTS",
    section: "Reading",
    type: "multiple-choice",
    difficulty: "easy",
    tags: ["academic-reading", "detail"],
    passage: IELTS_READING_PASSAGE_SLEEP,
    prompt: "According to the passage, the glymphatic system was first identified in:",
    options: ["1930", "1953", "2012", "2020"],
    correctIndex: 2,
    explanation:
      "Paragraph 2 states that the glymphatic system was 'identified only in 2012'. The other dates refer to other milestones in the passage (electroencephalography in the 1930s, REM sleep in 1953).",
    timeSeconds: 70,
  },
  {
    id: "ielts-reading-15",
    examType: "IELTS",
    section: "Reading",
    type: "sentence-completion",
    difficulty: "medium",
    tags: ["academic-reading", "vocabulary"],
    passage: IELTS_READING_PASSAGE_SLEEP,
    prompt:
      "Complete the sentence using a word from the passage. Blue light from screens suppresses the secretion of __________, delaying sleep onset.",
    correctAnswer: "melatonin",
    explanation:
      "Paragraph 3 explicitly states that blue wavelengths 'suppress melatonin secretion and delay sleep onset'. Melatonin is the hormone that signals night-time to the body.",
    timeSeconds: 70,
  },

  // ---------------------------------------------------------------------------
  // IELTS READING — Passage 6: Renewable Energy Storage
  // ---------------------------------------------------------------------------
  {
    id: "ielts-reading-16",
    examType: "IELTS",
    section: "Reading",
    type: "multiple-choice",
    difficulty: "medium",
    tags: ["academic-reading", "detail"],
    passage: IELTS_READING_PASSAGE_STORAGE,
    prompt:
      "For how long can a typical utility-scale lithium battery discharge at full capacity?",
    options: [
      "One hour",
      "Two hours",
      "Four hours",
      "Twenty-four hours",
    ],
    correctIndex: 2,
    explanation:
      "Paragraph 2 states that a typical utility-scale lithium battery can discharge at full capacity 'for roughly four hours' — long enough to bridge the evening demand peak but insufficient for multi-day lulls.",
    timeSeconds: 75,
  },
  {
    id: "ielts-reading-17",
    examType: "IELTS",
    section: "Reading",
    type: "true-false-not-given",
    difficulty: "easy",
    tags: ["academic-reading", "detail"],
    passage: IELTS_READING_PASSAGE_STORAGE,
    prompt:
      "Statement: Pumped hydroelectric storage is currently the largest form of grid storage worldwide by capacity.",
    options: ["True", "False", "Not Given"],
    correctIndex: 0,
    explanation:
      "TRUE. Paragraph 2 states explicitly that pumped hydroelectric storage 'remains the largest form of grid storage worldwide by capacity'.",
    timeSeconds: 60,
  },
  {
    id: "ielts-reading-18",
    examType: "IELTS",
    section: "Reading",
    type: "sentence-completion",
    difficulty: "medium",
    tags: ["academic-reading", "vocabulary"],
    passage: IELTS_READING_PASSAGE_STORAGE,
    prompt:
      "Complete the sentence using a word from the passage. Sodium-ion batteries are attractive because they rely on an element that is __________ rather than scarce.",
    correctAnswer: "abundant",
    explanation:
      "Paragraph 3 describes sodium as 'an abundant element rather than scarce lithium'. The contrast 'abundant rather than scarce' is the key contextual clue.",
    timeSeconds: 70,
  },

  // ---------------------------------------------------------------------------
  // IELTS LISTENING — Script A: University Orientation
  // ---------------------------------------------------------------------------
  {
    id: "ielts-listening-1",
    examType: "IELTS",
    section: "Listening",
    type: "fill-blanks",
    difficulty: "easy",
    tags: ["listening-detail"],
    audioScript: IELTS_LISTENING_SCRIPT_ORIENTATION,
    prompt:
      "Complete the notes. Write NO MORE THAN TWO WORDS for each answer. Student ID cards can be collected from the (1) ______ on the (2) ______ floor of the Main Building.",
    correctAnswer: "Registry | second",
    explanation:
      "The speaker says: 'You can collect them from the Registry on the second floor of the Main Building.' Each blank takes one word; spelling must be exact. Numbers may be written as digits or words.",
    timeSeconds: 90,
  },
  {
    id: "ielts-listening-2",
    examType: "IELTS",
    section: "Listening",
    type: "multiple-choice",
    difficulty: "medium",
    tags: ["listening-detail"],
    audioScript: IELTS_LISTENING_SCRIPT_ORIENTATION,
    prompt: "What is the temporary password for the university email account?",
    options: [
      "Your six-digit student number",
      "Your full name followed by your student number",
      "Your date of birth in eight-digit day-month-year format",
      "A random code emailed to your personal address",
    ],
    correctIndex: 2,
    explanation:
      "The speaker specifies the temporary password as 'your date of birth in eight-digit format, day-month-year'. The username (option A) is the six-digit student number, but the password is the date of birth.",
    timeSeconds: 80,
  },

  // ---------------------------------------------------------------------------
  // IELTS LISTENING — Script B: Library Tour
  // ---------------------------------------------------------------------------
  {
    id: "ielts-listening-3",
    examType: "IELTS",
    section: "Listening",
    type: "short-answer",
    difficulty: "medium",
    tags: ["listening-detail"],
    audioScript: IELTS_LISTENING_SCRIPT_LIBRARY,
    prompt:
      "Answer the question in NO MORE THAN FIVE WORDS. How many items may a student borrow at one time, and for how long?",
    correctAnswer: "15 items for 3 weeks",
    explanation:
      "The librarian states: 'You may borrow up to fifteen items at a time for a standard period of three weeks.' Both numbers must appear to score full marks. Watch for the keywords 'borrow' and 'period'.",
    timeSeconds: 90,
  },
  {
    id: "ielts-listening-4",
    examType: "IELTS",
    section: "Listening",
    type: "fill-blanks",
    difficulty: "medium",
    tags: ["listening-detail"],
    audioScript: IELTS_LISTENING_SCRIPT_LIBRARY,
    prompt:
      "Complete the sentence. Write ONE WORD AND/OR A NUMBER. Overdue fines have been abolished, but accounts are suspended if a loan is more than ______ days overdue.",
    correctAnswer: "28",
    explanation:
      "The librarian states: 'if an item is more than twenty-eight days overdue your account will be suspended.' The number 28 (or 'twenty-eight') is the required answer. 'Twenty-eight days' would exceed the word limit.",
    timeSeconds: 80,
  },

  // ---------------------------------------------------------------------------
  // IELTS LISTENING — Script C: Marine Biology Lecture
  // ---------------------------------------------------------------------------
  {
    id: "ielts-listening-5",
    examType: "IELTS",
    section: "Listening",
    type: "fill-blanks",
    difficulty: "medium",
    tags: ["listening-detail"],
    audioScript: IELTS_LISTENING_SCRIPT_MARINE,
    prompt:
      "Complete the sentence. Write ONE WORD AND/OR A NUMBER. The mesopelagic zone lies between two hundred and ______ metres below the surface.",
    correctAnswer: "1000",
    explanation:
      "The lecturer describes the zone as lying 'between two hundred and one thousand metres below the surface'. The answer can be written as '1000' or 'one thousand'.",
    timeSeconds: 80,
  },
  {
    id: "ielts-listening-6",
    examType: "IELTS",
    section: "Listening",
    type: "multiple-choice",
    difficulty: "hard",
    tags: ["listening-detail", "main-idea"],
    audioScript: IELTS_LISTENING_SCRIPT_MARINE,
    prompt:
      "According to the 2014 sonar survey, the estimated biomass of mesopelagic fish is approximately:",
    options: [
      "One billion metric tonnes",
      "Between ten and fifteen billion metric tonnes",
      "One hundred billion metric tonnes",
      "Equal to the combined weight of all humans",
    ],
    correctIndex: 1,
    explanation:
      "The lecturer states the survey suggests 'between ten and fifteen billion metric tonnes'. The survey also notes this far exceeds the combined weight of all humans — option D — but the question asks for the figure, not the comparison.",
    timeSeconds: 90,
  },

  // ---------------------------------------------------------------------------
  // IELTS LISTENING — Script D: Accommodation Conversation
  // ---------------------------------------------------------------------------
  {
    id: "ielts-listening-7",
    examType: "IELTS",
    section: "Listening",
    type: "fill-blanks",
    difficulty: "medium",
    tags: ["listening-detail"],
    audioScript: IELTS_LISTENING_SCRIPT_ACCOMMODATION,
    prompt:
      "Complete the notes. Write NO MORE THAN TWO WORDS AND/OR A NUMBER. The deluxe studio costs £(1) ______ per month and includes a small (2) ______.",
    correctAnswer: "790 | balcony",
    explanation:
      "The receptionist says the deluxe studio is 'at seven hundred and ninety pounds' and includes 'a small balcony'. Distinguish carefully between the standard (£620) and deluxe (£790) studios — both figures appear in the script.",
    timeSeconds: 90,
  },
  {
    id: "ielts-listening-8",
    examType: "IELTS",
    section: "Listening",
    type: "short-answer",
    difficulty: "easy",
    tags: ["listening-detail"],
    audioScript: IELTS_LISTENING_SCRIPT_ACCOMMODATION,
    prompt:
      "Answer the question in NO MORE THAN THREE WORDS AND/OR A NUMBER. What is the minimum contract length at Parkview Student Housing?",
    correctAnswer: "44 weeks",
    explanation:
      "The receptionist states: 'the minimum contract is forty-four weeks.' The figure must be included; 'forty-four' or '44' are both acceptable, but the unit 'weeks' must accompany the number.",
    timeSeconds: 70,
  },

  // ---------------------------------------------------------------------------
  // IELTS WRITING — Task 1 (3 chart/diagram prompts with model answers)
  // ---------------------------------------------------------------------------
  {
    id: "ielts-writing-1",
    examType: "IELTS",
    section: "Writing",
    type: "writing-task1",
    difficulty: "medium",
    tags: ["task-response", "coherence"],
    imagePrompt:
      "Line chart titled 'Households owning at least one electric vehicle, 2015–2023'. Four lines for Germany, France, Spain, Sweden. All start near 1–2% in 2015; all rise, with a clear acceleration after 2019; Sweden ends highest at ~28%, Germany ~19%, France ~14%, Spain lowest at ~6%.",
    prompt:
      "The chart below shows the percentage of households in four European countries (Germany, France, Spain, Sweden) that owned at least one electric vehicle between 2015 and 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
    modelAnswer: `The line chart illustrates the percentage of households in four European countries — Germany, France, Spain, and Sweden — that owned at least one electric vehicle between 2015 and 2023.

Overall, ownership rose in all four countries over the period, but the rate and timing of growth varied considerably. Sweden experienced the steepest increase, rising from approximately 2% in 2015 to nearly 28% by 2023, overtaking every other country by the end of the period. Germany, which started at around 1%, climbed steadily and reached about 19% by 2023. France showed a similar but slower trajectory, ending at roughly 14%. Spain lagged behind throughout, beginning at under 1% and finishing at only about 6%.

A noticeable acceleration occurred in all four countries after 2019, coinciding with the introduction of national purchase subsidies and tighter EU emissions targets. Before 2019, growth was modest; afterwards, the lines for Sweden and Germany in particular steepened sharply.

In summary, electric-vehicle ownership expanded substantially across the four nations, with Sweden and Germany leading the trend and Spain remaining the slowest adopter.`,
    explanation:
      "Band 8–9 model. Opens with a paraphrase of the prompt, gives an overview sentence, then groups data by trend rather than country-by-country, notes a key turning point (2019), and finishes with a one-sentence summary. Aim for at least 150 words.",
    timeSeconds: 1200,
  },
  {
    id: "ielts-writing-2",
    examType: "IELTS",
    section: "Writing",
    type: "writing-task1",
    difficulty: "hard",
    tags: ["task-response", "coherence"],
    imagePrompt:
      "Process diagram titled 'Community recycling process'. Six stages shown left-to-right with arrows: (1) kerbside separation by residents; (2) collection vehicle; (3) materials recovery facility — manual sorting; (4) mechanical separators (magnets, eddy currents, optical scanners); (5) processing plants (paper pulping, glass melting, plastic shredding); (6) remanufacture into new products.",
    prompt:
      "The diagram below illustrates the stages of a community recycling process, from kerbside collection through sorting, processing, and remanufacture into new goods. Summarise the information by selecting and reporting the main features. Write at least 150 words.",
    modelAnswer: `The diagram illustrates the stages of a community recycling process, from the collection of household waste to the manufacture of new products.

The process begins at the kerbside, where residents separate recyclable materials — typically paper, glass, plastic, and metal — into designated bins. Collection vehicles then transport these bins to a materials recovery facility, where the first stage is manual sorting to remove non-recyclable contamination such as food waste or plastic bags.

Next, the cleaned materials pass along conveyor belts to mechanical separators: magnets remove steel cans, eddy currents separate aluminium, and optical scanners sort plastics by type. Glass is crushed into cullet, paper is baled, and plastics are shredded and washed.

The separated materials are then transported to specialist processing plants. Paper is pulped and reformed into new sheets; glass cullet is melted and remoulded; plastics are pelletised for reuse; and metals are smelted. Finally, these secondary raw materials are sold to manufacturers who produce new goods — from newspapers and bottles to clothing and packaging — which re-enter the consumer market, completing the loop.

Overall, the process is a multi-stage system in which household waste is sorted, cleaned, processed, and remanufactured into new products.`,
    explanation:
      "Band 8–9 model. Uses sequencing language ('begins', 'then', 'next', 'finally', 'overall') and passive voice appropriate for describing a process. Mentions every stage without copying the prompt wording verbatim.",
    timeSeconds: 1200,
  },
  {
    id: "ielts-writing-3",
    examType: "IELTS",
    section: "Writing",
    type: "writing-task1",
    difficulty: "medium",
    tags: ["task-response", "coherence"],
    imagePrompt:
      "Bar chart titled 'Average monthly rainfall (mm) for three coastal cities'. Twelve bars per city (Jan–Dec). Mumbai: near-zero Dec–Apr, sharp climb May, peak ~820mm in Jul, decline by Oct. Lagos: peak ~350mm in Jun, smaller secondary peak in Sep. Sydney: relatively flat, ranging ~70mm (Sep) to ~130mm (Mar).",
    prompt:
      "The bar chart below shows the average monthly rainfall, in millimetres, for three coastal cities (Mumbai, Lagos, and Sydney) over a one-year period. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
    modelAnswer: `The bar chart compares the average monthly rainfall, in millimetres, for three coastal cities — Mumbai, Lagos, and Sydney — over a one-year period.

The most striking feature is the contrast between Mumbai and Lagos, which experience strongly seasonal rainfall, and Sydney, whose rainfall is more evenly distributed across the year. Mumbai receives almost no rain between December and April, but rainfall climbs sharply from May, peaking at over 800 mm in July, before falling again by October. Lagos follows a similar but less extreme pattern, with a peak of approximately 350 mm in June and a smaller secondary peak in September.

Sydney, by contrast, records relatively consistent monthly totals throughout the year, ranging from about 70 mm in September to roughly 130 mm in March. Its wettest months fall in the southern-hemisphere autumn, while Mumbai and Lagos are wettest in their respective northern-hemisphere summers.

Overall, the chart highlights the monsoon-driven pattern of South Asian and West African coastal cities, in which the great majority of annual rainfall is concentrated in a few months, compared with the more temperate and uniform distribution seen in Sydney.`,
    explanation:
      "Band 8–9 model. Identifies a key contrast up front, gives supporting figures, and finishes with an overall summary that interprets rather than simply repeats the data. Avoids listing every month's value — only key peaks are cited.",
    timeSeconds: 1200,
  },

  // ---------------------------------------------------------------------------
  // IELTS WRITING — Task 2 (3 essay prompts with model answers)
  // ---------------------------------------------------------------------------
  {
    id: "ielts-writing-4",
    examType: "IELTS",
    section: "Writing",
    type: "writing-task2",
    difficulty: "hard",
    tags: ["task-response", "coherence", "vocabulary"],
    prompt:
      "Remote work allows employees to balance their professional and personal lives more effectively, but some argue it reduces collaboration and team cohesion. Do the advantages of remote work outweigh the disadvantages? Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.",
    modelAnswer: `Remote work has become a defining feature of modern professional life, accelerated by the pandemic but now firmly embedded in many industries. While some worry that working from home erodes collaboration and team cohesion, I believe the advantages — for individuals and society — clearly outweigh the disadvantages.

The most significant benefit is the recovery of time. The average worker in a major city spends over two hundred hours a year commuting; eliminating that commute restores time for family, exercise, and rest. Remote work also broadens opportunity. A talented developer in a small town no longer needs to relocate to a costly capital to access top employers, and parents of young children — particularly mothers — are less likely to be forced out of the workforce by inflexible office expectations. For employers, the gains include lower real-estate costs and access to a global talent pool.

Critics argue that physical proximity fosters spontaneous collaboration and loyalty. This is not entirely wrong: hallway conversations and shared lunches do build trust, and some teams report weaker cohesion after extended remote arrangements. Yet these costs are manageable. Hybrid models, regular in-person offsites, and deliberate use of collaborative tools can preserve much of the serendipity of office life without abandoning the gains of flexibility.

In conclusion, while remote work presents genuine challenges for team culture, these are largely solvable through thoughtful design. The benefits — recovered time, broader access to opportunity, and reduced geographic inequality — are too substantial to dismiss. For most knowledge workers, the future is hybrid at worst, and that is a welcome shift.`,
    explanation:
      "Band 8–9 model (≈260 words). Clearly states a position in the introduction, develops two body paragraphs (one pro, one con-then-rebuttal), and concludes. Uses hedged language, varied sentence structures, and topic-specific vocabulary ('hybrid models', 'serendipity', 'geographic inequality').",
    timeSeconds: 2400,
  },
  {
    id: "ielts-writing-5",
    examType: "IELTS",
    section: "Writing",
    type: "writing-task2",
    difficulty: "hard",
    tags: ["task-response", "coherence", "vocabulary"],
    prompt:
      "Some governments offer university education free of charge to all citizens, while others charge tuition fees. Discuss the advantages and disadvantages of free university education, and give your own opinion. Write at least 250 words.",
    modelAnswer: `The question of whether university education should be free for all citizens is among the most contested in higher-education policy. While removing tuition fees widens access and reduces graduate debt, it also imposes significant costs on taxpayers and risks devaluing degrees through over-enrolment. In my view, free tuition is desirable in principle but must be paired with capacity safeguards to be effective.

The strongest argument for free university is equality of opportunity. In fee-charging systems, bright students from low-income backgrounds are often deterred from applying, or graduate with crippling debt that delays homeownership and family formation. Countries such as Germany and the Nordic states demonstrate that free tuition, funded through progressive taxation, can produce highly educated workforces without saddling young people with loans. The economic returns — higher productivity, higher tax revenues, lower welfare dependence — often repay the public investment.

However, the policy is not without drawbacks. When tuition is free, demand tends to rise sharply, and unless capacity is expanded accordingly, standards can fall as universities struggle to maintain student-to-staff ratios. There is also a fairness concern: a flat-funded system effectively asks non-graduate taxpayers to subsidise the education of those who will go on to earn above-average salaries.

In my view, the best compromise is a means-tested system in which tuition is free or heavily subsidised for students from lower- and middle-income backgrounds, while those from wealthier households contribute a fair share. This preserves access for those who need it most without imposing unsustainable costs on the public purse, and avoids the over-enrolment problems seen in some fully free systems.`,
    explanation:
      "Band 8–9 model (≈280 words). Discusses both sides, then offers a nuanced opinion in the conclusion rather than at the start. Uses connectors ('however', 'in my view', 'this preserves') and precise vocabulary ('means-tested', 'over-enrolment', 'progressive taxation').",
    timeSeconds: 2400,
  },
  {
    id: "ielts-writing-6",
    examType: "IELTS",
    section: "Writing",
    type: "writing-task2",
    difficulty: "advanced",
    tags: ["task-response", "coherence", "vocabulary"],
    prompt:
      "Technology is increasingly being used in classrooms, from tablets to artificial-intelligence tutors. To what extent do you agree that technology improves the quality of education? Give reasons for your answer and include any relevant examples. Write at least 250 words.",
    modelAnswer: `The presence of technology in classrooms has expanded rapidly, from interactive whiteboards and tablets to artificial-intelligence tutors that adapt to each learner. While some educators warn that screens distract and depersonalise learning, I largely agree that, when used thoughtfully, technology improves educational quality — though it is not a substitute for skilled teaching.

The clearest benefit is personalisation. A traditional classroom forces a single pace on thirty pupils; an adaptive learning platform can identify in seconds whether a child has misunderstood long division and offer targeted practice. For students with learning differences, technology can be transformative: text-to-speech tools assist dyslexic readers, and translation tools help recent immigrants access grade-level content. Technology also broadens access to expertise. A rural school without a physics specialist can stream lectures from leading universities, and free platforms offer world-class instruction to anyone with an internet connection.

These benefits, however, depend on implementation. Tablets used as digital worksheets add little; games marketed as 'educational' often are not. There is also evidence that excessive screen time harms attention spans, particularly in young children, and that the constant presence of devices can undermine the social fabric of a classroom. Critics rightly point out that no app can replace a teacher who notices a child is upset, or who models curiosity through a great question.

In conclusion, technology is a powerful servant but a poor master in education. When it amplifies the work of skilled teachers and broadens access for underserved learners, it genuinely improves quality. Where it is adopted as a shortcut or a cost-saving device, it tends to disappoint. The answer is not more or less technology, but wiser technology.`,
    explanation:
      "Band 8–9 model (≈290 words). Takes a qualified position ('largely agree... though not a substitute') and develops two body paragraphs in genuine balance. Uses metaphor ('servant but a poor master') and concrete examples (dyslexia, rural schools) without becoming anecdotal.",
    timeSeconds: 2400,
  },

  // ---------------------------------------------------------------------------
  // IELTS SPEAKING — Part 1 (3 familiar-topic prompts)
  // ---------------------------------------------------------------------------
  {
    id: "ielts-speaking-1",
    examType: "IELTS",
    section: "Speaking",
    type: "speaking-part1",
    difficulty: "easy",
    tags: ["fluency", "vocabulary"],
    prompt:
      "Let's talk about your hometown. Where is it, and what is it most known for?",
    modelAnswer:
      "Tip: aim for 3–5 sentences. Name the place, locate it briefly, and add one personal detail. Avoid one-word answers. Example opener: 'I'm from X, a mid-sized city in the south of Y. It's probably best known for its annual music festival, although I actually grew up just outside the city centre, in a quieter suburb.'",
    explanation:
      "Part 1 tests fluency and basic vocabulary on familiar topics. The examiner is listening for natural flow, range of vocabulary, and grammatical accuracy. Don't memorise long answers — they sound rehearsed and lose marks for fluency.",
    timeSeconds: 60,
  },
  {
    id: "ielts-speaking-2",
    examType: "IELTS",
    section: "Speaking",
    type: "speaking-part1",
    difficulty: "easy",
    tags: ["fluency", "vocabulary"],
    prompt: "Do you enjoy cooking? Why or why not?",
    modelAnswer:
      "Tip: state a clear preference, give one reason, then add an example. Example: 'Yes, I really enjoy cooking, mostly because it's a way to switch off after work. At the weekend I usually try a new recipe — last week it was a Thai green curry from scratch.'",
    explanation:
      "Part 1 answers should be short but developed (≈15–25 seconds). Include a 'because' clause to demonstrate complex sentences, and a concrete detail to demonstrate vocabulary range.",
    timeSeconds: 60,
  },
  {
    id: "ielts-speaking-3",
    examType: "IELTS",
    section: "Speaking",
    type: "speaking-part1",
    difficulty: "easy",
    tags: ["fluency", "coherence"],
    prompt: "How do you usually spend your weekends?",
    modelAnswer:
      "Tip: describe two or three typical activities, then add a contrast. Example: 'Most weekends I try to get outdoors — usually a long walk or a cycle on Saturday morning. Sunday is lazier; I'll cook something slow, read, and prep for the week. If I'm honest, the ideal weekend is a mix of both.'",
    explanation:
      "Listen for the cue 'usually' — answer about routine, not a single exceptional weekend. Use frequency adverbs ('usually', 'most weekends', 'if I'm honest') to demonstrate range.",
    timeSeconds: 60,
  },

  // ---------------------------------------------------------------------------
  // IELTS SPEAKING — Part 2 cue cards (3 prompts)
  // ---------------------------------------------------------------------------
  {
    id: "ielts-speaking-4",
    examType: "IELTS",
    section: "Speaking",
    type: "speaking-part2",
    difficulty: "medium",
    tags: ["fluency", "coherence", "task-response"],
    prompt:
      "Describe a skill you would like to learn in the future. You should say: what the skill is, why you want to learn it, how you would go about learning it, and explain how this skill might benefit you in the future. You will have one minute to prepare and should speak for one to two minutes.",
    modelAnswer:
      "Structure tip: spend ~20 seconds on each bullet, then ~20 seconds on the 'explain'. Use signposting language: 'The skill I'd most like to learn is...', 'What attracts me to it is...', 'My plan would be to...', 'Looking ahead, I think this would help me because...'. Aim for natural connectors rather than memorised phrases.",
    explanation:
      "Part 2 is scored on fluency, lexical resource, grammatical range, and pronunciation. The cue card is a scaffold, not a checklist — you may re-order bullets. Avoid stopping at one minute; the examiner will not prompt you to continue.",
    timeSeconds: 120,
  },
  {
    id: "ielts-speaking-5",
    examType: "IELTS",
    section: "Speaking",
    type: "speaking-part2",
    difficulty: "medium",
    tags: ["fluency", "coherence", "task-response"],
    prompt:
      "Describe an important decision you have made. You should say: what the decision was, when you made it, why you made it, and explain whether you think it was the right decision. You will have one minute to prepare and should speak for one to two minutes.",
    modelAnswer:
      "Structure tip: pick a concrete decision with a clear before/after (e.g. choosing a university, switching jobs, moving city). Use past tenses accurately ('I had been considering...', 'I eventually decided to...', 'Looking back, I realise...'). Avoid vague generalities.",
    explanation:
      "The decision itself is not assessed — the language is. Choose something you can talk about for two minutes with specific details. Demonstrating a range of past tenses (past simple, past continuous, past perfect) will lift your grammatical range score.",
    timeSeconds: 120,
  },
  {
    id: "ielts-speaking-6",
    examType: "IELTS",
    section: "Speaking",
    type: "speaking-part2",
    difficulty: "medium",
    tags: ["fluency", "coherence", "vocabulary"],
    prompt:
      "Describe a place you have visited that left a strong impression on you. You should say: where it was, why you went there, what you did there, and explain why it impressed you. You will have one minute to prepare and should speak for one to two minutes.",
    modelAnswer:
      "Structure tip: vivid sensory detail raises your lexical score. Mention what you saw, heard, smelled, or felt. Example connectors: 'What struck me most was...', 'I hadn't expected...', 'Even now, I can picture...'. End with a reflection, not a new fact.",
    explanation:
      "Use descriptive adjectives and at least one comparison ('unlike anywhere I'd been before'). Avoid listing attractions like a guidebook — examiners reward personal, evaluative language over factual recitation.",
    timeSeconds: 120,
  },

  // ---------------------------------------------------------------------------
  // IELTS SPEAKING — Part 3 discussion (3 prompts)
  // ---------------------------------------------------------------------------
  {
    id: "ielts-speaking-7",
    examType: "IELTS",
    section: "Speaking",
    type: "speaking-part3",
    difficulty: "hard",
    tags: ["coherence", "vocabulary", "inference"],
    prompt:
      "Some people believe that learning practical skills is more important than acquiring academic knowledge. What is your view?",
    modelAnswer:
      "Structure tip: give a clear position, then a reason, then a counter-consideration, then a brief conclusion. Example: 'I think the dichotomy is misleading. Practical skills are essential for employability, but academic knowledge underpins them — a mechanic who understands thermodynamics diagnoses problems faster than one who doesn't. Ideally, education should integrate both rather than choose between them.'",
    explanation:
      "Part 3 rewards abstract reasoning and extended answers (≈40–60 seconds). Use hedging language ('tends to', 'in most cases', 'arguably') to show awareness of complexity. Avoid 'I agree' or 'I disagree' alone — always justify.",
    timeSeconds: 90,
  },
  {
    id: "ielts-speaking-8",
    examType: "IELTS",
    section: "Speaking",
    type: "speaking-part3",
    difficulty: "hard",
    tags: ["coherence", "vocabulary", "inference"],
    prompt:
      "How have advances in technology changed the way people make decisions?",
    modelAnswer:
      "Structure tip: identify a change, give a cause, then evaluate. Example: 'Decisions are faster but arguably less reflective. Algorithms curate everything from news to romantic partners, which removes friction but also narrows the options we even consider. The risk is that we mistake convenience for good judgement.'",
    explanation:
      "Use cause–effect structures ('which removes', 'the risk is that') and abstract nouns ('friction', 'convenience', 'judgement'). Avoid sweeping generalisations — qualify with 'in many cases', 'for some groups'.",
    timeSeconds: 90,
  },
  {
    id: "ielts-speaking-9",
    examType: "IELTS",
    section: "Speaking",
    type: "speaking-part3",
    difficulty: "advanced",
    tags: ["coherence", "vocabulary", "task-response"],
    prompt:
      "In your opinion, should governments invest more in preserving historic places or in building new infrastructure?",
    modelAnswer:
      "Structure tip: acknowledge both sides, then take a position with a condition. Example: 'It's a false choice in the long run — cities need both. But if forced to prioritise, I'd argue for a balanced approach: new infrastructure should be designed to coexist with, and sometimes fund, the preservation of historic sites. Demolishing heritage for short-term gain tends to erode the identity that makes a city worth investing in.'",
    explanation:
      "Demonstrate evaluative language ('false choice', 'short-term gain', 'erode identity') and conditional structures ('if forced to prioritise', 'should be designed to'). Avoid taking an extreme position; nuance is rewarded at Band 7+.",
    timeSeconds: 90,
  },

  // ---------------------------------------------------------------------------
  // PTE — 10 questions
  // ---------------------------------------------------------------------------
  {
    id: "pte-read-aloud-1",
    examType: "PTE",
    section: "Speaking",
    type: "read-aloud",
    difficulty: "easy",
    tags: ["pronunciation", "fluency"],
    prompt:
      "Read the following sentence aloud as naturally and clearly as you can.",
    passage:
      "The migration of monarch butterflies spans thousands of kilometres across North America, yet no single butterfly completes the round trip; instead, several generations cooperate to finish the journey.",
    modelAnswer:
      "Pronunciation tip: stress content words (migration, monarch, butterflies, spans, kilometres, generations, cooperate) and glide over function words. Pause briefly at the semicolon. Avoid rushing the long word 'kilometres' — three clear syllables: ki-LOM-e-tres.",
    explanation:
      "PTE Read Aloud scores both content (correct words, no omissions or substitutions) and oral fluency (smooth pace, no hesitations). Pronunciation should be clear but does not need to be native-like. Aim for 30–40 seconds at a steady pace.",
    timeSeconds: 40,
  },
  {
    id: "pte-read-aloud-2",
    examType: "PTE",
    section: "Speaking",
    type: "read-aloud",
    difficulty: "medium",
    tags: ["pronunciation", "fluency"],
    prompt: "Read the following sentence aloud as naturally and clearly as you can.",
    passage:
      "Renewable energy now accounts for nearly a third of global electricity generation, with solar and wind capacity expanding faster than any previous energy technology in recorded history.",
    modelAnswer:
      "Pronunciation tip: chunk the sentence into three idea units — 'Renewable energy now accounts for nearly a third / of global electricity generation, / with solar and wind capacity expanding faster / than any previous energy technology in recorded history.' Brief micro-pauses at the slashes keep the rhythm natural.",
    explanation:
      "Long sentences benefit from thought-group chunking. Do not insert a long pause mid-phrase as the system may register it as a disfluency. Maintain rising intonation within each chunk and falling intonation at the end of the sentence.",
    timeSeconds: 40,
  },
  {
    id: "pte-repeat-sentence-1",
    examType: "PTE",
    section: "Speaking",
    type: "repeat-sentence",
    difficulty: "medium",
    tags: ["pronunciation", "fluency", "listening-detail"],
    prompt:
      "You will hear a sentence. Repeat it exactly, with the same word order and wording.",
    audioScript: "The lecture has been moved to the main auditorium.",
    modelAnswer:
      "Target: 'The lecture has been moved to the main auditorium.' Repeat immediately after the audio ends — do not wait. Capture the article 'The' and the past participle 'moved', not 'moved to' replaced with 'is in'.",
    explanation:
      "PTE Repeat Sentence scores content (each correct word scored), pronunciation, and fluency. You are not penalised for accent, but you must reproduce word order and content words. Aim to start speaking within 3 seconds of the audio ending.",
    timeSeconds: 25,
  },
  {
    id: "pte-repeat-sentence-2",
    examType: "PTE",
    section: "Speaking",
    type: "repeat-sentence",
    difficulty: "medium",
    tags: ["pronunciation", "fluency", "listening-detail"],
    prompt:
      "You will hear a sentence. Repeat it exactly, with the same word order and wording.",
    audioScript: "Please submit your assignment by Friday at noon.",
    modelAnswer:
      "Target: 'Please submit your assignment by Friday at noon.' Common errors: dropping 'Please', substituting 'before' for 'by', or adding 'the' before 'noon'. Listen for the preposition 'by' and the time phrase 'at noon'.",
    explanation:
      "If you miss a word, do not pause or say 'um' — continue fluently. A smooth partial repetition scores higher than a hesitant complete one. Capture content words (submit, assignment, Friday, noon) even if function words are lost.",
    timeSeconds: 25,
  },
  {
    id: "pte-describe-image-1",
    examType: "PTE",
    section: "Speaking",
    type: "describe-image",
    difficulty: "hard",
    tags: ["fluency", "coherence", "main-idea"],
    imagePrompt:
      "Line graph titled 'Global smartphone sales 2010–2024 (millions of units)'. Steady rise 2010 (≈300m) to 2016 (≈1,470m); plateau 2016–2019; sharp dip in 2020 to ≈1,290m; gradual recovery 2021–2024 to ≈1,520m.",
    prompt:
      "Describe the image below in 40 seconds. You have 25 seconds to prepare.",
    modelAnswer:
      "Model answer (≈35 seconds): 'The line graph shows global smartphone sales from 2010 to 2024 in millions of units. Sales rose steadily between 2010 and 2016, then plateaued for three years. A sharp dip occurred in 2020, most likely reflecting pandemic supply disruption. From 2021 onwards, sales recovered and reached their highest point of around 1.52 billion units by 2024. Overall, the trend is one of strong long-term growth interrupted by a temporary 2020 decline.'",
    explanation:
      "PTE Describe Image rewards a clear structure: introduction (what the image shows), key features (highest/lowest/trends), and a brief conclusion. You do not need to mention every data point — pick two or three significant features.",
    timeSeconds: 65,
  },
  {
    id: "pte-describe-image-2",
    examType: "PTE",
    section: "Speaking",
    type: "describe-image",
    difficulty: "hard",
    tags: ["fluency", "coherence", "main-idea"],
    imagePrompt:
      "Pie chart titled 'Average household monthly expenditure'. Slices: Housing 35%, Food 15%, Savings 13%, Transport 12%, Other 10%, Utilities 8%, Entertainment 7%.",
    prompt:
      "Describe the image below in 40 seconds. You have 25 seconds to prepare.",
    modelAnswer:
      "Model answer (≈35 seconds): 'The pie chart breaks down an average household's monthly expenditure into seven categories. Housing is by far the largest expense at thirty-five percent, followed by food at fifteen and savings at thirteen. Transport, utilities, and entertainment each account for between seven and twelve percent. Overall, essential costs — housing, food, transport, and utilities — together account for roughly seventy percent of monthly spending, leaving limited room for savings and discretionary items.'",
    explanation:
      "For pie charts, identify the largest and smallest slices, group similar categories (essentials vs discretionary), and conclude with the overall pattern. Numbers can be given as percentages or fractions ('just over a third').",
    timeSeconds: 65,
  },
  {
    id: "pte-summarize-written-text-1",
    examType: "PTE",
    section: "Writing",
    type: "summarize-written-text",
    difficulty: "hard",
    tags: ["task-response", "coherence", "vocabulary"],
    passage:
      "Beavers are often described as ecosystem engineers because their dam-building activity transforms streams into wetlands. These wetlands slow the flow of water, reducing downstream flooding during storms and storing water that sustains streamflow during dry periods. The ponds created by beaver dams also trap sediment, improve water quality by filtering pollutants, and provide habitat for fish, amphibians, birds, and insects. In recent decades, conservationists in North America and Europe have reintroduced beavers to rivers from which they had been eradicated, with measurable improvements in biodiversity and flood resilience.",
    prompt:
      "Read the passage and summarise it in ONE sentence. Your response must be between 5 and 75 words.",
    modelAnswer:
      "By building dams that create wetlands, beavers reduce flooding, sustain streamflow, improve water quality, and support biodiversity, which has led conservationists to reintroduce them to rivers in North America and Europe with measurable ecological benefits.",
    explanation:
      "PTE Summarize Written Text requires exactly ONE sentence (only one full stop). Aim for 25–40 words covering the main idea and 2–3 key supporting points. Use a complex sentence with relative clauses or conjunctions to pack in detail. Avoid copying long phrases verbatim — paraphrase.",
    timeSeconds: 600,
  },
  {
    id: "pte-summarize-written-text-2",
    examType: "PTE",
    section: "Writing",
    type: "summarize-written-text",
    difficulty: "hard",
    tags: ["task-response", "coherence", "vocabulary"],
    passage:
      "The discovery of penicillin by Alexander Fleming in 1928 is often cited as a triumph of serendipity in science. Returning from holiday, Fleming noticed that a petri dish of staphylococcus bacteria had been contaminated by a mould, around which the bacteria had been destroyed. Identifying the mould as Penicillium notatum, he deduced that it released a substance — later named penicillin — capable of killing bacteria. It took another decade, and the work of Howard Florey and Ernst Chain, to develop penicillin into a mass-producible drug that would save millions of lives during and after the Second World War.",
    prompt:
      "Read the passage and summarise it in ONE sentence. Your response must be between 5 and 75 words.",
    modelAnswer:
      "Although Alexander Fleming accidentally discovered penicillin's bacteria-killing properties in 1928, it was only through the later work of Howard Florey and Ernst Chain that the substance was developed into a mass-producible drug that saved millions of lives during and after the Second World War.",
    explanation:
      "Single-sentence summary using a concessive structure ('Although X, Y'). Captures both the serendipitous discovery and the decade-long development. Note the comma joining the dependent and independent clauses — grammatically correct in one sentence.",
    timeSeconds: 600,
  },
  {
    id: "pte-essay-1",
    examType: "PTE",
    section: "Writing",
    type: "essay",
    difficulty: "hard",
    tags: ["task-response", "coherence", "vocabulary", "grammar"],
    prompt:
      "In many countries, the average weight of children is increasing. Some people believe the government is responsible for solving this problem, while others think it is the responsibility of parents. Discuss both views and give your opinion. Write 200–300 words.",
    modelAnswer: `The rise in childhood obesity is one of the most visible public health challenges of our time, and disagreement persists over who bears primary responsibility for reversing it. In my view, both parents and governments share responsibility, but government action is the indispensable foundation.

Parents clearly play a central role. They determine which foods enter the household, set routines around meals and screen time, and model eating and exercise habits that children absorb. No policy can replace a parent who consistently serves vegetables, limits sugary drinks, and ensures children play outdoors. Families also mediate cultural attitudes toward food, and parents who treat soft drinks as everyday staples cannot expect schools or regulations to offset that influence.

That said, framing obesity purely as a parental failure ignores the environment in which families operate. Ultra-processed foods are cheaper and more aggressively marketed than fresh produce; school playgrounds have shrunk; and in many cities, safe walking routes to school have disappeared. Only governments have the leverage to reshape this environment — through sugar taxes, restrictions on junk-food advertising to children, mandatory food-labeling standards, and investment in public sports facilities. Without such structural change, even well-intentioned parents face an uphill struggle.

In my opinion, the two responsibilities are complementary rather than competing. Governments must create the conditions in which healthy choices are affordable, available, and normal; parents must then make those choices within the home. Blaming one or the other absolves everyone. The most effective anti-obesity strategies, from Chile to the United Kingdom, have combined regulation with public education aimed directly at families.`,
    explanation:
      "Band 79+ model (≈270 words). Discusses both sides, takes a clear position ('complementary rather than competing'), uses topic-specific vocabulary ('ultra-processed foods', 'sugar taxes', 'structural change'), and varies sentence structures. PTE essays score on content, form, development, structure, vocabulary, and grammar — keep within 200–300 words.",
    timeSeconds: 1200,
  },
  {
    id: "pte-write-from-dictation-1",
    examType: "PTE",
    section: "Listening",
    type: "write-from-dictation",
    difficulty: "medium",
    tags: ["listening-detail", "grammar"],
    prompt:
      "You will hear a sentence. Type the sentence exactly as you hear it, including all articles and word endings.",
    audioScript: "The new policy will take effect at the beginning of next semester.",
    correctAnswer: "The new policy will take effect at the beginning of next semester.",
    explanation:
      "Write-from-dictation is the highest-weight item in PTE Listening. Each correct word scores points; spelling must be correct but minor articles ('the', 'a') also count. Listen for word boundaries ('take effect', not 'take a fact') and tense endings.",
    timeSeconds: 35,
  },

  // ---------------------------------------------------------------------------
  // TOEFL — 8 questions
  // ---------------------------------------------------------------------------
  {
    id: "toefl-reading-1",
    examType: "TOEFL",
    section: "Reading",
    type: "reading-mcq",
    difficulty: "hard",
    tags: ["academic-reading", "inference"],
    passage:
      "The octopus is sometimes described as the closest thing on Earth to an intelligent alien. Its nervous system contains roughly five hundred million neurons — more than those of a rabbit — but unlike vertebrates, the octopus distributes these neurons throughout its body. Only about a third reside in the brain; the remainder are clustered in each of its eight arms, which can taste, manipulate, and even solve simple problems semi-independently. Experiments have shown octopuses opening screw-top jars, navigating mazes, and using coconut shells as portable shelters — behaviours once thought exclusive to mammals and birds. Yet octopus intelligence evolved along a path separated from our own by over six hundred million years, raising profound questions about how many different forms intelligence can take.",
    prompt:
      "What can be inferred about octopus intelligence from the passage?",
    options: [
      "It is identical to mammalian intelligence in its evolutionary origin.",
      "It evolved independently from vertebrate intelligence, suggesting intelligence can take multiple forms.",
      "It is inferior to mammalian intelligence because neurons are distributed across the body.",
      "It is limited to problem-solving tasks performed in laboratory settings.",
    ],
    correctIndex: 1,
    explanation:
      "The passage describes octopus intelligence as 'the closest thing on Earth to an intelligent alien' and notes it 'evolved along a path separated from our own by over six hundred million years'. The author concludes this raises 'questions about how many different forms intelligence can take' — supporting option B. Options A, C, and D each contradict the passage's tone or specific wording.",
    timeSeconds: 120,
  },
  {
    id: "toefl-reading-2",
    examType: "TOEFL",
    section: "Reading",
    type: "reading-mcq",
    difficulty: "medium",
    tags: ["academic-reading", "vocabulary"],
    passage:
      "The practice of crop rotation — alternating the species grown on a parcel of land across seasons — was once dismissed by some agronomists as a relic of pre-industrial farming. Yet modern research has vindicated it. Rotating cereals with legumes, whose roots host nitrogen-fixing bacteria, can reduce the need for synthetic fertiliser by up to a quarter. Rotations also break the life cycles of pests specialised to a single crop, lowering the demand for pesticides. Far from being a relic, rotation is now central to the philosophy of regenerative agriculture.",
    prompt:
      'The word "vindicated" in the passage is closest in meaning to:',
    options: [
      "condemned",
      "supported or justified",
      "misunderstood",
      "ignored",
    ],
    correctIndex: 1,
    explanation:
      "The context ('Yet modern research has vindicated it') contrasts with the earlier 'dismissed as a relic'. 'Vindicated' here means shown to be correct or justified — option B. The transition word 'Yet' signals that the modern research overturned the earlier dismissal.",
    timeSeconds: 90,
  },
  {
    id: "toefl-listening-1",
    examType: "TOEFL",
    section: "Listening",
    type: "multiple-choice",
    difficulty: "medium",
    tags: ["listening-detail", "academic-reading"],
    audioScript:
      "Today we're going to look at one of the worst environmental disasters in American history — the Dust Bowl of the 1930s. The term refers to a series of severe dust storms that struck the southern Great Plains, particularly Oklahoma, Texas, and Kansas. The causes were a combination of natural drought and human mismanagement. During the First World War, grain prices soared and millions of acres of native grassland — whose deep roots had held the soil in place for millennia — were ploughed under for wheat. When drought arrived in 1931 and lasted the better part of the decade, the exposed topsoil simply blew away. Some storms carried dust as far east as Washington, D.C. The disaster prompted the federal government to establish the Soil Conservation Service in 1935 and to promote practices such as contour ploughing and shelterbelt planting that remain influential today.",
    prompt:
      "According to the lecture, what happened to much of the native grassland during the First World War?",
    options: [
      "It was flooded to create reservoirs for irrigation.",
      "It was ploughed under to make way for wheat cultivation.",
      "It was set aside as a protected national park.",
      "It was converted into pasture for cattle ranching.",
    ],
    correctIndex: 1,
    explanation:
      "The lecturer explains that, during the First World War, 'millions of acres of native grassland — whose deep roots had held the soil in place for millennia — were ploughed under for wheat.' Option B is the correct paraphrase. Listen for cause-and-effect cues: removing the grass's deep roots is what later allowed the topsoil to blow away.",
    timeSeconds: 120,
  },
  {
    id: "toefl-listening-2",
    examType: "TOEFL",
    section: "Listening",
    type: "multiple-choice",
    difficulty: "hard",
    tags: ["main-idea", "listening-detail"],
    audioScript:
      "Most of us associate circadian rhythms with the human sleep-wake cycle, but plants have them too, and they're just as important. A sunflower, for instance, doesn't just passively track the sun across the sky — its internal clock anticipates dawn, orienting the young plant eastward before sunrise so it can warm up quickly and attract pollinators. Arabidopsis, the lab rat of plant biology, switches on a different set of genes depending on the time of day, coordinating photosynthesis with light availability and defense against herbivores with the hours when attack is most likely. Understanding these rhythms matters for agriculture: experiments have shown that crop yields can be improved simply by scheduling irrigation and harvesting to match a plant's internal clock.",
    prompt: "What is the main idea of the lecture?",
    options: [
      "Plants do not have circadian rhythms.",
      "Plant circadian rhythms influence growth, defense, and could inform agricultural practice.",
      "Only sunflowers are capable of tracking the sun.",
      "Human circadian rhythms are more important than plant circadian rhythms.",
    ],
    correctIndex: 1,
    explanation:
      "Option B captures the lecture's overall argument: plants have circadian rhythms (sunflowers, Arabidopsis), these rhythms influence growth and defense, and understanding them has practical agricultural applications. The other options are either contradicted by the lecture or are too narrow.",
    timeSeconds: 120,
  },
  {
    id: "toefl-speaking-1",
    examType: "TOEFL",
    section: "Speaking",
    type: "speaking-sample",
    difficulty: "medium",
    tags: ["fluency", "task-response", "coherence"],
    prompt:
      "Some students prefer to study alone, while others prefer to study in groups. Which do you prefer, and why? You will have 15 seconds to prepare and 45 seconds to speak.",
    modelAnswer:
      "Sample response (≈40 seconds): 'I generally prefer studying alone, mostly because I learn best when I can control the pace. In a group, I often feel pressure to move on before I've fully grasped a concept, or to slow down for the sake of others. That said, I do recognise the value of group study for brainstorming essay topics or rehearsing presentations — those tasks genuinely benefit from other people's perspectives. So my ideal approach is a mix: solo work for absorbing new material, group work for applying it.'",
    explanation:
      "TOEFL Independent Speaking rewards a clear position, a reason, a brief example or concession, and a conclusion within 45 seconds. State your preference in the first sentence, then justify. Use signposting ('That said', 'So my ideal approach') to demonstrate coherence.",
    timeSeconds: 60,
  },
  {
    id: "toefl-speaking-2",
    examType: "TOEFL",
    section: "Speaking",
    type: "speaking-sample",
    difficulty: "hard",
    tags: ["fluency", "task-response", "coherence"],
    prompt:
      "Do you agree or disagree with the following statement? It is more important for children to learn to play a musical instrument than to learn a second language. Use specific reasons and examples to support your answer. You will have 15 seconds to prepare and 45 seconds to speak.",
    modelAnswer:
      "Sample response (≈45 seconds): 'I disagree with the statement as written. While learning a musical instrument has clear benefits — discipline, self-expression, and even cognitive transfer — a second language is, in my view, more broadly useful. Language opens doors to communication with billions of people, supports career mobility, and is much harder to acquire in adulthood. A child who learns an instrument at six and a language at twenty-five is at a real disadvantage compared with the reverse. Ideally, of course, schools would prioritise both, but if forced to choose, I would allocate scarce curriculum time to language.'",
    explanation:
      "Acknowledge the opposing view briefly, then take a clear position. Use specific, concrete reasons (career mobility, critical-period effects) rather than vague generalisations. End with a brief concession ('Ideally... both') to demonstrate balanced reasoning.",
    timeSeconds: 60,
  },
  {
    id: "toefl-writing-1",
    examType: "TOEFL",
    section: "Writing",
    type: "writing-task2",
    difficulty: "advanced",
    tags: ["task-response", "coherence", "inference"],
    prompt:
      "Read a short passage about the honeybee 'waggle dance' — a figure-eight movement that foragers perform to communicate the direction and distance of food sources to nestmates. Then listen to a lecture (audioScript provided) in which a professor questions whether the waggle dance is actually used by foragers in the field. Summarise the points made in the lecture, being sure to explain how they cast doubt on the points made in the reading passage. Write 150–225 words.",
    passage:
      "The honeybee waggle dance is one of the most celebrated examples of animal communication. When a forager returns to the hive after finding a rich food source, she performs a figure-eight pattern whose angle indicates the direction of the food relative to the sun, and whose duration indicates the distance. For decades, biologists have regarded the dance as a sophisticated symbolic language that allows bees to share precise foraging information and dramatically improve the colony's efficiency.",
    audioScript:
      "It's true that the waggle dance looks like a remarkable communication system, but recent field studies suggest it may matter much less than the textbook account implies. First, when researchers tracked bees leaving the hive after observing a dance, fewer than ten percent actually flew in the indicated direction — most simply followed odour trails they had already learned. Second, the dance seems to be most common when the colony already has abundant food, which is precisely when the information is least needed. And third, several solitary foragers that never observed a dance at all still found food efficiently by relying on scent and memory. Taken together, these findings suggest the waggle dance is a fascinating behaviour, but its actual function in field foraging has been overstated.",
    modelAnswer: `The reading passage presents the honeybee waggle dance as a sophisticated symbolic communication system that allows bees to share precise foraging information and improve colony efficiency. The lecturer challenges this account on three grounds.

First, she notes that field-tracking studies show fewer than ten percent of bees observing a dance actually fly in the indicated direction; the majority rely on previously learned odour trails. This directly undermines the reading's claim that the dance communicates direction effectively.

Second, the lecturer observes that dances are most commonly performed when the colony already has abundant food, which is precisely when the information is least needed. This timing weakens the reading's argument that the dance meaningfully improves foraging efficiency.

Third, she reports that solitary foragers with no exposure to any dance still locate food efficiently using scent and memory alone. If bees can forage successfully without the dance, the dance's contribution to colony efficiency — the central claim of the reading — must be smaller than traditionally assumed.

In short, the lecturer does not deny that the waggle dance occurs; she argues that its actual function in field foraging has been overstated, casting doubt on the reading's celebratory account.`,
    explanation:
      "TOEFL Integrated Writing rewards a clear structure: brief summary of the reading, then three body paragraphs each matching a lecture point to the corresponding reading point. Use reporting verbs ('notes', 'observes', 'reports') and connectors ('First', 'Second', 'Third', 'In short'). Do NOT introduce your own opinion. Stay within 150–225 words (this model is ~220).",
    timeSeconds: 1200,
  },
  {
    id: "toefl-writing-2",
    examType: "TOEFL",
    section: "Writing",
    type: "writing-task2",
    difficulty: "hard",
    tags: ["task-response", "coherence", "vocabulary"],
    prompt:
      "Academic Discussion prompt. A professor posts: 'Some educators argue that universities should abolish traditional letter grades (A, B, C, D, F) and replace them with detailed narrative evaluations written by professors. What is your view?' Write a response of 100–150 words in which you contribute to the discussion, supporting your view with reasons.",
    modelAnswer:
      "I would oppose a complete abolition of letter grades, though I support supplementing them with narrative feedback. Grades matter because they compress a great deal of information into a form that employers, scholarship committees, and graduate admissions offices can interpret at a glance. A purely narrative system risks becoming inconsistent across professors and departments, and may disadvantage students whose evaluators write less persuasively. That said, the objection driving this proposal is real: a single letter can hide very different strengths and weaknesses. A hybrid approach — letter grades accompanied by a short standardised comment on key skills — would preserve the comparability of grades while addressing the 'black box' problem. The goal should be more information, not different information.",
    explanation:
      "TOEFL Academic Discussion responses should be 100–150 words and contribute meaningfully to an ongoing conversation. Reference the professor's prompt, take a clear position, give at least one reason and ideally a counter-consideration, and end with a constructive suggestion. Avoid restating the prompt at length.",
    timeSeconds: 600,
  },

  // ---------------------------------------------------------------------------
  // DUOLINGO — 6 questions
  // ---------------------------------------------------------------------------
  {
    id: "duolingo-read-select-1",
    examType: "Duolingo",
    section: "Reading",
    type: "read-and-select",
    difficulty: "easy",
    tags: ["vocabulary"],
    prompt:
      "Select every real English word from the list below. Do not select made-up or misspelled words.",
    options: [
      "elephant",
      "blizzard",
      "twilight",
      "nonsense",
      "pencil",
      "glimmer",
      "computer",
      "lighthouse",
      "frozn",
      "phlosphy",
      "oxegan",
      "wisper",
    ],
    correctAnswer:
      "elephant, blizzard, twilight, nonsense, pencil, glimmer, computer, lighthouse",
    explanation:
      "The real English words are: elephant, blizzard, twilight, nonsense, pencil, glimmer, computer, lighthouse. The fakes are common misspellings: 'frozn' (frozen), 'phlosphy' (philosophy), 'oxegan' (oxygen), 'wisper' (whisper). Duolingo Read-and-Select tests both vocabulary size and spelling accuracy; select ONLY genuine words.",
    timeSeconds: 60,
  },
  {
    id: "duolingo-read-select-2",
    examType: "Duolingo",
    section: "Reading",
    type: "read-and-select",
    difficulty: "medium",
    tags: ["vocabulary"],
    prompt:
      "Select every real English word from the list below. Do not select made-up or misspelled words.",
    options: [
      "season",
      "weather",
      "breeze",
      "tempest",
      "horizon",
      "quantum",
      "shadow",
      "vizor",
      "skwer",
      "neevr",
      "batry",
      "palidy",
    ],
    correctAnswer:
      "season, weather, breeze, tempest, horizon, quantum, shadow",
    explanation:
      "The real English words are: season, weather, breeze, tempest, horizon, quantum, shadow. 'Vizor' is a non-standard spelling (the correct form is 'visor'); 'skwer', 'neevr', 'batry', and 'palidy' are not English words. Be alert to plausible-looking pseudo-words that share letter patterns with real vocabulary.",
    timeSeconds: 60,
  },
  {
    id: "duolingo-writing-1",
    examType: "Duolingo",
    section: "Writing",
    type: "writing-sample",
    difficulty: "medium",
    tags: ["task-response", "coherence", "grammar"],
    prompt:
      "Describe a tradition in your country or community that is important to you. Write 50–100 words explaining what the tradition is, when it takes place, and why it matters to you.",
    modelAnswer:
      "Sample answer (≈85 words): 'In my community, the most important tradition is the annual harvest festival in October. Families gather to share a meal prepared from locally grown produce, and elders recount stories from the year. As a child, I looked forward to it for the food; as an adult, I value it as one of the few moments when three generations sit together without distractions. The tradition matters to me because it reminds us that our lives are bound to a place, a season, and the people who came before us.'",
    explanation:
      "Duolingo Writing Sample rewards clarity, grammatical accuracy, and relevance. Aim for the upper end of the word range — short answers do not let you demonstrate vocabulary range. Include a concrete example and a brief reflection.",
    timeSeconds: 300,
  },
  {
    id: "duolingo-speaking-1",
    examType: "Duolingo",
    section: "Speaking",
    type: "speaking-sample",
    difficulty: "medium",
    tags: ["fluency", "task-response", "pronunciation"],
    prompt:
      "Speak for 30–60 seconds about a person who has had a significant influence on your life. Describe who they are, how you know them, and in what ways they have influenced you.",
    modelAnswer:
      "Sample response outline: identify the person in one sentence (e.g. a grandparent, teacher, or mentor); say how you know them; give one concrete example of their influence (specific advice or modelled behaviour); finish with a brief reflection on the lasting effect. Avoid memorising a script — the system detects overly rehearsed delivery and may reduce the score.",
    explanation:
      "Duolingo Speaking Sample is scored on fluency, pronunciation, content, and lexical range. Speak at a steady pace; brief pauses between clauses are acceptable, but long silences lower the fluency score. Aim for the full 60 seconds — abrupt endings may register as disfluency.",
    timeSeconds: 90,
  },
  {
    id: "duolingo-describe-image-1",
    examType: "Duolingo",
    section: "Speaking",
    type: "describe-image",
    difficulty: "hard",
    tags: ["fluency", "coherence", "main-idea"],
    imagePrompt:
      "Bar chart titled 'Adults reporting they read at least one book per month'. Five bars: India 78%, China 71%, Thailand 65%, USA 53%, UK 49%. Y-axis 0–100%.",
    prompt:
      "Look at the image and speak about it for at least 30 seconds. Describe what you see and any patterns you notice.",
    modelAnswer:
      "Sample response (≈35 seconds): 'The bar chart shows the percentage of adults in five countries who report reading at least one book per month. India has the highest share at seventy-eight percent, followed by China at seventy-one and Thailand at sixty-five. The United States and the United Kingdom sit lower, at fifty-three and forty-nine percent respectively. Overall, the three Asian countries shown all report higher reading rates than the two Western ones, with India roughly thirty percentage points ahead of the UK.'",
    explanation:
      "Duolingo Describe Image (Speaking) rewards naming the chart type, identifying the highest/lowest values, and offering a brief overall pattern in a smooth delivery. Numbers may be spoken as percentages or fractions. Avoid simply listing every value.",
    timeSeconds: 60,
  },
  {
    id: "duolingo-complete-sentence-1",
    examType: "Duolingo",
    section: "Reading",
    type: "complete-the-sentence",
    difficulty: "medium",
    tags: ["grammar", "vocabulary"],
    prompt:
      "Complete the sentence by selecting the correct form of the word in brackets. Despite the heavy rain, the marathon runners continued, ______ (decide) that finishing the race was more important than staying dry.",
    options: ["decide", "deciding", "decided", "decision"],
    correctIndex: 1,
    explanation:
      "'Deciding' is correct because the present participle introduces a participial phrase that modifies the main clause (the runners continued BECAUSE they were deciding...). 'Decided' would create a comma splice or require 'and'; 'decide' is the bare infinitive (incorrect here); 'decision' is a noun and would need a preposition such as 'with the decision that'.",
    timeSeconds: 40,
  },

  // ---------------------------------------------------------------------------
  // OIETC / ELLT — 5 questions
  // ---------------------------------------------------------------------------
  {
    id: "oietc-reading-1",
    examType: "OIETC",
    section: "Reading",
    type: "reading-mcq",
    difficulty: "medium",
    tags: ["academic-reading", "inference"],
    passage:
      "Urban beekeeping has grown sharply in popularity over the past two decades, with hives now a familiar sight on the rooftops of hotels, offices, and private homes in cities from London to Melbourne. Proponents argue that urban environments can, paradoxically, be healthier for bees than intensively farmed countryside, where monoculture and pesticide use limit forage. City gardens, parks, and balconies offer a diverse succession of flowering plants across the seasons. Honey produced in cities frequently contains pollen from dozens of species, compared with the single-source honeys typical of rural apiaries. Yet urban beekeeping is not without its critics. Some ecologists warn that the rapid growth of hobby hives may outstrip available forage, placing competitive pressure on wild pollinators — bumblebees, solitary bees, and hoverflies — that are already in decline. They urge would-be beekeepers to plant for pollinators before installing hives.",
    prompt:
      "According to the passage, why might urban environments be healthier for bees than intensively farmed countryside?",
    options: [
      "Cities have lower overall air pollution than rural areas.",
      "Rural areas contain no flowering plants at all.",
      "Countryside monoculture and pesticide use limit forage, whereas cities offer diverse flowering plants.",
      "Bees reproduce more quickly in warmer urban temperatures.",
    ],
    correctIndex: 2,
    explanation:
      "The passage attributes the urban advantage to 'monoculture and pesticide use' limiting rural forage, contrasted with 'a diverse succession of flowering plants' in cities. Option C paraphrases this directly. Options A and D introduce factors not mentioned in the passage; option B is an overstatement (the passage says rural forage is 'limited', not absent).",
    timeSeconds: 120,
  },
  {
    id: "oietc-listening-1",
    examType: "OIETC",
    section: "Listening",
    type: "fill-blanks",
    difficulty: "medium",
    tags: ["listening-detail", "main-idea"],
    audioScript:
      "Welcome to this week's study skills session. Today I want to challenge a popular assumption: that good time management is about squeezing more tasks into each day. In fact, the most effective students I've worked with do something quite different. They begin not by listing tasks, but by clarifying priorities. They distinguish between what is urgent and what is important — a distinction popularised by the American president Dwight Eisenhower. Urgent tasks demand immediate attention; important tasks contribute to long-term goals. Many students spend their days responding to the urgent and neglect the important. I'd suggest blocking out at least ninety minutes each morning for important, non-urgent work — typically reading, writing, or revision — before opening email or messages.",
    prompt:
      "Complete the summary. Write ONE WORD for each blank. The lecturer recommends distinguishing between tasks that are (1) ______ and tasks that are (2) ______, and suggests blocking out ninety minutes each morning for important, non-urgent work.",
    correctAnswer: "urgent | important",
    explanation:
      "The lecturer explicitly contrasts 'urgent' tasks (which demand immediate attention) with 'important' tasks (which contribute to long-term goals). Both words must be present and correctly spelled. The Eisenhower distinction is the central organising idea of the talk.",
    timeSeconds: 120,
  },
  {
    id: "oietc-writing-1",
    examType: "OIETC",
    section: "Writing",
    type: "essay",
    difficulty: "hard",
    tags: ["task-response", "coherence", "vocabulary"],
    prompt:
      "In some countries, the number of young people choosing to study vocational subjects such as plumbing, electrical work, or nursing has declined sharply. Why do you think this is happening, and what are the effects on society? Write 250–350 words.",
    modelAnswer: `The decline in young people pursuing vocational subjects such as plumbing, electrical work, and nursing is a worrying trend in many advanced economies. In my view, the cause is largely cultural — a sustained bias toward university education as the only 'respectable' path — and the effects on society are both economic and social.

The cultural pressure begins early. Schools, parents, and careers advisers often treat university as the default destination for academically able students and reserve vocational training for those perceived to have 'failed' academically. League tables reward schools for the proportion of pupils sent to university, not for the proportion who enter secure, well-paid trades. Media portrayals reinforce this hierarchy: the electrician and the nurse rarely feature in stories of success, while the corporate lawyer and the software engineer are ubiquitous. Small wonder that teenagers, asked to imagine their futures, reach instinctively for a degree.

The effects on society are profound. Economically, the shortage of skilled tradespeople drives up wages for those who remain — a happy outcome for individuals but a serious inflationary pressure on essential services such as home repair, healthcare, and construction. Nursing shortages, in particular, threaten patient safety in many countries. Socially, the bias toward university produces a generation saddled with debt and underemployed in roles that did not require a degree in the first place, while vital work goes begging. The mismatch is corrosive: it devalues practical skill, narrows the definition of success, and weakens the very services on which communities depend.

Reversing the trend will require more than exhortation. Schools must present vocational and academic routes as equally valid from an early age; apprenticeships must be properly funded and visible; and public messaging must celebrate skilled trades as the essential, well-rewarded professions they are.`,
    explanation:
      "Strong OIETC essay (≈330 words). Answers both parts of the prompt (causes AND effects), uses topic sentences, and develops each point with concrete examples (league tables, media portrayals, nursing shortages). The conclusion offers a brief recommendation, which is acceptable but not required. Avoid generic statements — anchor every claim in a specific example.",
    timeSeconds: 1800,
  },
  {
    id: "oietc-speaking-1",
    examType: "OIETC",
    section: "Speaking",
    type: "speaking-part1",
    difficulty: "easy",
    tags: ["fluency", "vocabulary"],
    prompt:
      "This is the first part of your OIETC speaking interview. Please answer the following question in two to three sentences: 'Where are you from, and what do you enjoy most about living there?' You will have one minute to prepare and two minutes to speak.",
    modelAnswer:
      "Sample answer: 'I'm from Chennai, a coastal city in southern India. What I enjoy most is the food — particularly the filter coffee and the breakfast dishes, which are unlike anything I've tasted elsewhere. The seafront is also a calm place to walk in the evenings, even though the city itself is busy and loud.'",
    explanation:
      "OIETC Part 1 mirrors IELTS Part 1: short, personal answers showing fluency, basic vocabulary, and grammatical accuracy. Aim for 2–3 connected sentences. Use one descriptive adjective or detail to demonstrate vocabulary range. Avoid one-word answers and overly rehearsed monologues.",
    timeSeconds: 120,
  },
  {
    id: "oietc-vocab-1",
    examType: "OIETC",
    section: "Reading",
    type: "vocabulary-in-context",
    difficulty: "hard",
    tags: ["vocabulary", "inference"],
    prompt:
      'Read the sentence and choose the closest meaning of the word in bold. "Despite the manager\'s conciliatory tone, the employees remained skeptical, having heard similar promises many times before." What does "conciliatory" most nearly mean in this context?',
    options: [
      "hostile and aggressive",
      "apologetic and intended to placate",
      "boastful and self-promoting",
      "indifferent and detached",
    ],
    correctIndex: 1,
    explanation:
      "Context is decisive here. The employees remain skeptical 'despite' the manager's tone, implying the tone was meant to reassure or appease them — 'apologetic and intended to placate' (option B). The contrast word 'despite' signals that the tone should have reassured them but did not. Options A, C, and D would not produce that contrast.",
    timeSeconds: 60,
  },
];

// =============================================================================
// EXAM SECTION METADATA — approximate durations & question counts per section
// (Practice estimate only; not official exam content.)
// =============================================================================

export const EXAM_SECTIONS: Record<
  ExamType,
  { name: string; duration: number; questionCount: number }[]
> = {
  IELTS: [
    { name: "Listening", duration: 1800, questionCount: 40 },
    { name: "Reading", duration: 3600, questionCount: 40 },
    { name: "Writing", duration: 3600, questionCount: 2 },
    { name: "Speaking", duration: 840, questionCount: 3 },
  ],
  PTE: [
    { name: "Speaking & Writing", duration: 3300, questionCount: 28 },
    { name: "Reading", duration: 1800, questionCount: 13 },
    { name: "Listening", duration: 1800, questionCount: 12 },
  ],
  TOEFL: [
    { name: "Reading", duration: 2100, questionCount: 20 },
    { name: "Listening", duration: 2160, questionCount: 28 },
    { name: "Speaking", duration: 960, questionCount: 4 },
    { name: "Writing", duration: 1740, questionCount: 2 },
  ],
  Duolingo: [{ name: "Adaptive", duration: 3000, questionCount: 25 }],
  OIETC: [
    { name: "Reading", duration: 1800, questionCount: 20 },
    { name: "Listening", duration: 1500, questionCount: 20 },
    { name: "Writing", duration: 2400, questionCount: 1 },
    { name: "Speaking", duration: 900, questionCount: 4 },
  ],
};

// =============================================================================
// DISCLAIMER — surfaced to learners wherever these questions appear
// =============================================================================

export const PRACTICE_DISCLAIMER =
  "This is original exam-aligned practice for preparation only. Scores are practice estimates. Not official exam content. No guarantee of real-exam repetition.";

// =============================================================================
// HELPER QUERIES
// =============================================================================

export const getQuestionsByExam = (exam: ExamType): Question[] =>
  QUESTIONS.filter((q) => q.examType === exam);

export const getQuestionsBySection = (
  exam: ExamType,
  section: string,
): Question[] =>
  QUESTIONS.filter(
    (q) => q.examType === exam && q.section === section,
  );

export const getQuestionsByDifficulty = (d: Difficulty): Question[] =>
  QUESTIONS.filter((q) => q.difficulty === d);

export const getQuestionsByTag = (tag: string): Question[] =>
  QUESTIONS.filter((q) => q.tags.includes(tag));

export const TOTAL_QUESTION_COUNT: number = QUESTIONS.length;

export const QUESTION_COUNT_BY_EXAM: Record<ExamType, number> = {
  IELTS: QUESTIONS.filter((q) => q.examType === "IELTS").length,
  PTE: QUESTIONS.filter((q) => q.examType === "PTE").length,
  TOEFL: QUESTIONS.filter((q) => q.examType === "TOEFL").length,
  Duolingo: QUESTIONS.filter((q) => q.examType === "Duolingo").length,
  OIETC: QUESTIONS.filter((q) => q.examType === "OIETC").length,
};
