// =============================================================================
// ALO English Test Platform — Original Question Bank
// =============================================================================
// All questions, passages, audio scripts, prompts and model answers in this
// file are 100% ORIGINAL content written for the ALO English Test Platform.
// They are exam-aligned practice only: they mimic the *structure* of well-
// known English-proficiency and admissions tests (IELTS, PTE, TOEFL, Duolingo,
// OIETC, SAT, GRE, GMAT, ACT, LSAT, MCAT, LanguageCert, Linguaskill,
// University Placement, Visa Interview) but do NOT reproduce any official
// exam content. No claim is made that any of these items will appear in a
// real exam. Scores shown to learners are practice estimates only.
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
  | "vocabulary-in-context"
  // CBT expansion (Task 1-cbt) — additional computer-based exam item types
  | "text-completion"
  | "sentence-equivalence"
  | "quantitative-comparison"
  | "grid-in"
  | "data-sufficiency"
  | "critical-reasoning"
  | "sentence-correction"
  | "data-insights"
  | "logic-game"
  | "issue-task"
  | "central-idea"
  | "standard-english"
  | "data-interpretation";

export type ExamType =
  | "IELTS"
  | "PTE"
  | "TOEFL"
  | "Duolingo"
  | "OIETC"
  // CBT expansion (Task 1-cbt)
  | "SAT"
  | "GRE"
  | "GMAT"
  | "ACT"
  | "LSAT"
  | "MCAT"
  | "LanguageCert"
  | "Linguaskill"
  | "Placement"
  | "VisaInterview";

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
  // CBT expansion (Task 1-cbt) — additional fields for new question types
  numericAnswer?: number; // for grid-in / numeric answers
  correctIndices?: number[]; // for multi-select (e.g. sentence equivalence)
  reorderItems?: string[]; // for reorder-paragraphs / reorder items
  correctOrder?: number[]; // correct ordering indices for reorderItems
  matchingPairs?: { left: string; right: string }[]; // for matching items
  dropdownOptions?: { blank: number; options: string[] }[]; // for multi-blank dropdowns
  correctDropdowns?: number[]; // correct index per dropdownOptions blank
  quantityA?: string; // for quantitative-comparison
  quantityB?: string; // for quantitative-comparison
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

// -----------------------------------------------------------------------------
// CBT EXPANSION (Task 1-cbt) — original passages, audio scripts, and data
// descriptions for the additional computer-based exam types: Digital SAT, GRE,
// GMAT, ACT, LSAT, MCAT, LanguageCert, Linguaskill, University Placement, Visa
// Interview. All content 100% original to the ALO English Test Platform. Not
// official exam content.
// -----------------------------------------------------------------------------

const SAT_PASSAGE_CITIZEN_SCIENCE = `In the spring of 1995, a team of ornithologists at a North American university launched an unusual experiment: they asked backyard birders across the continent to count the birds at their feeders on a single weekend and mail in their tallies. The response overwhelmed them. More than ten thousand volunteers participated, generating a dataset no research grant could have funded. Three decades later, that initiative has accumulated over twenty million individual records and has become one of the longest-running citizen-science programs in the world.

The scientific value of such data lies not in any single observation, which may be flawed by misidentification, but in aggregate patterns that emerge only at scale. By pooling observations from thousands of sites, researchers have documented northward shifts in species ranges that track warming winter temperatures, declines in once-common species such as the evening grosbeak, and the slow expansion of cardinals into regions once too cold for them. These findings have appeared in peer-reviewed journals and influenced conservation policy.

Critics of citizen science worry about data quality, and the concern is not frivolous. A birder who misidentifies a sharp-shinned hawk as a Cooper's hawk introduces error. Yet the team has shown that with clear protocols, online training modules, and statistical filters that flag outliers, the signal-to-noise ratio becomes acceptable — and in some analyses, superior to that of professionally collected data, which is often constrained to a few well-studied sites.`;

const SAT_PASSAGE_WHEAT = `The domestication of wheat, which began roughly ten thousand years ago in the Fertile Crescent, represents one of the most consequential transformations in human history. Wild einkorn and emmer wheats had brittle seed heads that shattered upon ripening, scattering their grains — a useful trait for a wild plant intent on reproduction, but disastrous for a harvester. Early farmers selected, generation after generation, for mutations in which the seed head remained intact until threshed. Within a few centuries, the plant had been so thoroughly altered that it could no longer reproduce without human intervention.

This transformation was not the result of conscious breeding in the modern sense. The first farmers had no knowledge of genetics and could not have predicted the long-term consequences of their choices. Yet their steady preference for non-shattering heads, larger grains, and easier-to-thresh husks created a selective pressure as powerful as any later directed by Mendelian principles. The wheat, in turn, reshaped the humans who grew it: settled agriculture required permanent villages, stored surpluses invited taxation, and surplus-fed populations expanded into new territories.

The reciprocity at the heart of this story is often lost in modern accounts that celebrate human ingenuity. The archaeobotanist Jacob Pestel has argued, provocatively, that wheat domesticated humans as much as humans domesticated wheat — that the plant's evolutionary success, measured in hectares cultivated and tonnes harvested, far exceeds anything our species has achieved on its own behalf.`;

const ACT_PASSAGE_BICYCLE = `The modern bicycle, with two wheels of equal size driven by a chain and pedals, emerged only in the late nineteenth century after decades of experimentation. The earliest recognizable ancestor, the "draisine" patented by Karl Drais in 1817, had no pedals at all: riders propelled themselves by pushing against the ground with their feet. The pedaled "boneshaker" of the 1860s added cranks to the front wheel but transmitted every cobblestone directly to the rider's spine, earning its nickname. The high-wheeled "penny-farthing" of the 1870s increased speed through a massive front wheel but posed a constant risk of headers — riders pitching forward over the handlebars.

The breakthrough came in 1885 with John Kemp Starley's "Rover Safety Bicycle," which used a chain drive to power the rear wheel and matched the two wheels in size. Suddenly a rider of average height could travel at speed without risking life and limb. Pneumatic tires, introduced by John Dunlop in 1888, smoothed the ride further. Within a decade the bicycle had become not merely a toy for athletic young men but practical transport for commuters, delivery services, and — most subversively — women, whose newfound mobility is sometimes credited with advancing the late-Victorian campaign for female suffrage.`;

const LSAT_PASSAGE_STANDING = `The doctrine of standing — the requirement that a plaintiff demonstrate a personal stake in the outcome of a lawsuit — has long been a contested boundary in environmental litigation. In the mid-twentieth century, several United States courts began to relax standing requirements for environmental organizations, allowing them to sue on behalf of members who used affected natural areas for recreation. This "aesthetic injury" theory held that a hiker who valued a particular wilderness area had suffered a concrete, redressable injury when that area was degraded, even if no economic harm could be shown.

The Supreme Court's 1972 decision in a landmark environmental case narrowed this trend somewhat. The Court agreed that aesthetic and environmental harm could constitute injury, but insisted that the organization itself, lacking direct injury, could not sue in its own name — it had to identify specific members who would themselves be injured. One influential dissent argued that natural objects themselves ought to have standing, with guardians appointed to speak for them, but this view has never been adopted by a majority.

In the decades since, the precise contours of environmental standing have shifted with the Court's composition, but the core requirement has remained: a plaintiff must show concrete, particularized, and redressable injury. Critics argue that this requirement leaves many environmental harms without any effective champion in court, since harms to public goods such as clean air are by definition widely shared rather than particularized.`;

const MCAT_PASSAGE_PROGRESS = `The Victorian belief in progress — the assumption that human history moves steadily toward higher levels of moral and material achievement — was so pervasive in nineteenth-century European thought that even its critics often accepted its premises while rejecting its conclusions. The historian Thomas Babington Macaulay, writing in 1848, declared that any sensible person comparing his own age with the previous century would find it "impossible not to perceive" that improvement was visible in every dimension of life. The Whig interpretation of history, with its teleological narrative of expanding liberty and enlightenment, drew strength from such confidence.

By the early twentieth century, that confidence had cracked. The industrial slaughter of the First World War, the economic collapse of the 1930s, and the moral catastrophe of totalitarianism suggested to many thinkers that "progress" was at best an illusion and at worst a dangerous myth that concealed the persistence of human cruelty. Oswald Spengler's Decline of the West (1918) argued that civilizations, like organisms, pass through inevitable seasons of growth and decay, and that the West had entered its autumn. Herbert Butterfield's The Whig Interpretation of History (1931) attacked the progressive narrative not as false in its conclusions but as methodologically corrupt: teleological history, he argued, inevitably distorted the past by reading it through the lens of the present.

The contemporary historian's relationship to progress is, if anything, more complicated. Few serious scholars now defend an unqualified narrative of human improvement, yet the language of progress persists in public discourse and in the justifications offered for technological and political projects. To think historically, in the modern sense, may require holding two ideas simultaneously: that some things have demonstrably improved (life expectancy, literacy, the abolition of certain practices) and that improvement in one dimension does not guarantee improvement in others.`;

const LC_PASSAGE_FOLK = `In the early twentieth century, the folklorists Cecil Sharp and Maud Karpeles traveled through the Appalachian Mountains of the eastern United States collecting songs that had been carried across the Atlantic by British and Irish settlers and preserved, often with remarkable fidelity, in isolated mountain communities. Sharp was astonished to find versions of ballads that had been printed in seventeenth-century broadsides still in active circulation, sung by people who could not read music and had learned the songs orally from their parents and grandparents.

The discovery was both exhilarating and bittersweet. Exhilarating, because it suggested that oral tradition could preserve texts across centuries with an accuracy few scholars had credited. Bittersweet, because the same modernization that was bringing roads, radios, and schools to the Appalachians was already eroding the conditions under which such transmission had been possible. Sharp and Karpeles worked against what they understood to be a closing window.

Subsequent scholarship has complicated the romantic picture of pure, unbroken tradition. Some of the ballads Sharp collected had in fact been modified, sometimes substantially, by the singers who performed them — a finding that does not diminish the music's value but does complicate the notion of faithful preservation. Other songs were not "ancient" at all but had been composed in America in styles that mimicked older forms. The folklorists' enterprise, it turns out, was not simply an act of recovery but also, inevitably, of construction.`;

const LING_PASSAGE_ESCOOTER = `Shared electric scooters, introduced to European and North American cities around 2018, spread with remarkable speed. Within three years, dozens of operators were competing for riders in cities from Paris to Los Angeles, attracted by low start-up costs and eager venture capital. The appeal to users was obvious: scooters filled the gap between walking and transit for trips of one to three kilometres, required no parking, and could be unlocked with a smartphone.

City authorities, however, were less enthusiastic. Abandoned scooters cluttered sidewalks, blocking wheelchair ramps and prompting complaints from disability advocates. Safety concerns mounted: hospital admissions for scooter-related injuries rose sharply in the first two years, with head and limb injuries predominating. Several cities, including Paris and Barcelona, eventually imposed strict regulations or outright bans on shared scooter schemes.

The industry has since consolidated. Several high-profile operators have withdrawn from unprofitable markets, and survivors have invested in sturdier hardware, geofencing technology to prevent sidewalk riding, and battery-swapping systems to reduce operating costs. Whether shared scooters will find a sustainable long-term niche in urban transport, or whether they will be remembered as a brief, venture-funded fad, remains an open question.`;

const PL_PASSAGE_PRINTING = `Johannes Gutenberg's introduction of movable metal type to Europe in the 1450s is often described as one of the most consequential inventions in human history, and the description is not hyperbole. Before Gutenberg, books were copied by hand — a slow, expensive process that confined literacy and learning to a small clerical and aristocratic elite. A single Bible could take a scribe a year to produce and cost the equivalent of a skilled worker's annual wages.

Gutenberg's press did not merely make existing books cheaper; it fundamentally restructured what books could be and who could read them. Within fifty years, printing presses had spread to more than two hundred European cities, and the number of books in circulation had increased by several orders of magnitude. Scholars could consult far more sources than ever before; standardization of texts made cross-referencing reliable; and new genres — newspapers, pamphlets, novels, scientific journals — emerged to exploit the new medium.

The political consequences were profound. The Protestant Reformation, which might have remained a local controversy in a manuscript culture, became a continent-spanning upheaval in part because Martin Luther's theses and pamphlets could be printed in thousands of copies and distributed within weeks. Centuries later, the same logic would make the American and French revolutions possible: ideas traveled faster and farther than any mounted messenger.`;

const LC_SCRIPT_CAREERS = `Good morning, and welcome to the careers service briefing for final-year students. My name is Janet Okafor and I'm the head of careers. I want to use the next ten minutes to walk you through three things: the autumn careers fair, our internship scheme, and the alumni mentoring programme.

First, the careers fair. It takes place on Wednesday the fifteenth of November in the Great Hall, from ten in the morning until four in the afternoon. We have over seventy employers confirmed, including three of the big four accounting firms, several regional law practices, and a strong contingent from the technology and renewable energy sectors. Bring at least ten printed copies of your CV, dress in business attire, and prepare a short introduction — we call it an "elevator pitch" — that you can deliver in thirty seconds.

Second, the internship scheme. Applications open on the first of December and close on the twelfth of January. Placements run for eight weeks during the summer, are paid at the national living wage, and are open to all penultimate and final-year students regardless of discipline. The application requires a CV, a cover letter tailored to the host organisation, and the names of two academic referees.

Third, the alumni mentoring programme. This pairs you with a graduate of the university who is now working in a field that interests you. Mentors offer two one-hour sessions per term, typically by video call. To apply, complete the short form on the careers portal by the end of October.`;

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

  // ===========================================================================
  // CBT EXPANSION — Task 1-cbt
  // 50 NEW original exam-aligned questions across Digital SAT, GRE, GMAT, ACT,
  // LSAT, MCAT, LanguageCert, Linguaskill, University Placement, Visa Interview.
  // All passages, prompts, scenarios, charts/tables (described in text), audio
  // scripts, and model answers are 100% original to the ALO English Test
  // Platform. Not official exam content. Practice estimates only.
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // DIGITAL SAT (8 questions)
  // ---------------------------------------------------------------------------
  {
    id: "Q-SAT-R-001",
    examType: "SAT",
    section: "Reading & Writing",
    type: "reading-mcq",
    difficulty: "hard",
    tags: ["inference", "academic-reading"],
    passage: SAT_PASSAGE_CITIZEN_SCIENCE,
    prompt:
      "The passage suggests that the Cornell team's response to concerns about data quality is best characterized as:",
    options: [
      "dismissive of the criticism as uninformed",
      "accepting of the criticism but defensive of volunteer motives",
      "acknowledging the criticism while arguing it can be mitigated through protocol and statistical methods",
      "conceding that the criticism invalidates most findings",
    ],
    correctIndex: 2,
    explanation:
      "The final paragraph explicitly states the concern is 'not frivolous' but then describes how clear protocols, online training, and statistical filters make the signal-to-noise ratio acceptable and sometimes superior to professionally collected data. This matches option C — the team acknowledges the concern and argues it can be mitigated.",
    timeSeconds: 90,
  },
  {
    id: "Q-SAT-R-002",
    examType: "SAT",
    section: "Reading & Writing",
    type: "vocabulary-in-context",
    difficulty: "medium",
    tags: ["vocabulary", "inference"],
    passage: SAT_PASSAGE_CITIZEN_SCIENCE,
    prompt:
      'As used in the final paragraph, the word "frivolous" most nearly means:',
    options: [
      "trivial or lacking serious foundation",
      "humorous or lighthearted",
      "expensive or wasteful",
      "inappropriate for the setting",
    ],
    correctIndex: 0,
    explanation:
      'In the sentence "the concern is not frivolous," the writer is affirming that the criticism has serious foundation — it is not trivial. Option A captures this meaning. The other options do not fit the logical context of evaluating a methodological criticism.',
    timeSeconds: 60,
  },
  {
    id: "Q-SAT-M-001",
    examType: "SAT",
    section: "Math",
    type: "multiple-choice",
    difficulty: "medium",
    tags: ["algebra", "systems-of-equations"],
    prompt:
      "A bakery sells croissants for $3 each and bagels for $2 each. On Saturday, the bakery sold a total of 240 pastries and collected $660 in revenue. How many croissants were sold?",
    options: ["120", "140", "160", "180"],
    correctIndex: 3,
    explanation:
      "Let c = croissants and b = bagels. We have c + b = 240 and 3c + 2b = 660. Substituting b = 240 − c gives 3c + 2(240 − c) = 660, so 3c + 480 − 2c = 660, hence c = 180. Verify: 180 croissants × $3 + 60 bagels × $2 = $540 + $120 = $660. ✓",
    timeSeconds: 120,
  },
  {
    id: "Q-SAT-M-002",
    examType: "SAT",
    section: "Math",
    type: "multiple-choice",
    difficulty: "hard",
    tags: ["geometry", "circles"],
    prompt:
      "A circular garden has a circumference of 24π metres. A path of uniform width 2 metres is paved around the inside edge of the garden, leaving a smaller circular flower bed in the centre. What is the area, in square metres, of the flower bed?",
    options: ["64π", "100π", "144π", "40π"],
    correctIndex: 1,
    explanation:
      "Circumference C = 2πr, so 24π = 2πr → r = 12 m. The path is 2 m wide on the inside, so the inner flower-bed radius is 12 − 2 = 10 m. Area = πr² = π(10)² = 100π. ✓",
    timeSeconds: 150,
  },
  {
    id: "Q-SAT-M-003",
    examType: "SAT",
    section: "Math",
    type: "grid-in",
    difficulty: "easy",
    tags: ["algebra", "linear-equations"],
    prompt:
      "If 3x − 7 = 2x + 5, what is the value of x² + 1? Enter your answer as a non-negative integer.",
    numericAnswer: 145,
    explanation:
      "Subtract 2x from both sides and add 7 to both sides: x = 12. Then x² + 1 = 144 + 1 = 145. Grid-in 145.",
    timeSeconds: 90,
  },
  {
    id: "Q-SAT-M-004",
    examType: "SAT",
    section: "Math",
    type: "grid-in",
    difficulty: "medium",
    tags: ["statistics", "arithmetic-mean"],
    prompt:
      "The average (arithmetic mean) of five positive integers is 7. If four of the integers are 4, 6, 9, and 10, what is the value of the fifth integer? Enter your answer as a non-negative integer.",
    numericAnswer: 6,
    explanation:
      "Sum of all five integers = 5 × 7 = 35. Sum of the four known integers = 4 + 6 + 9 + 10 = 29. Fifth integer = 35 − 29 = 6. Grid-in 6.",
    timeSeconds: 100,
  },
  {
    id: "Q-SAT-W-001",
    examType: "SAT",
    section: "Reading & Writing",
    type: "standard-english",
    difficulty: "medium",
    tags: ["grammar", "subject-verb-agreement"],
    prompt:
      'Choose the revision that best corrects the error in the sentence: "The architect\'s drawings, which had been misplaced for decades, was finally discovered in the basement of the city archives."',
    options: [
      "NO CHANGE",
      "The architect's drawings, which had been misplaced for decades, were finally discovered in the basement of the city archives.",
      "The architect's drawings, which had been misplaced for decades, finally discovered in the basement of the city archives.",
      "The architect's drawings which had been misplaced for decades was finally discovered in the basement of the city archives.",
    ],
    correctIndex: 1,
    explanation:
      'The subject is "drawings" (plural), so the verb must be the plural "were" — option B. The original "was" is a subject-verb agreement error. Option C drops the auxiliary verb, leaving a fragment. Option D removes the necessary commas around the non-restrictive relative clause and keeps the singular verb.',
    timeSeconds: 70,
  },
  {
    id: "Q-SAT-R-003",
    examType: "SAT",
    section: "Reading & Writing",
    type: "central-idea",
    difficulty: "hard",
    tags: ["main-idea", "academic-reading"],
    passage: SAT_PASSAGE_WHEAT,
    prompt: "The central idea of the passage is that:",
    options: [
      "early farmers understood genetics better than is typically assumed",
      "the domestication of wheat was a mutual process that fundamentally reshaped both the plant and human societies",
      "wheat was the first domesticated crop in human history",
      "modern accounts of agricultural origins are biased against non-European civilizations",
    ],
    correctIndex: 1,
    explanation:
      'The passage emphasises reciprocity: humans shaped wheat through repeated selection, but wheat also "reshaped the humans who grew it" by requiring settled agriculture, villages, and surplus storage. The closing paragraph reinforces this with Pestel\'s argument that wheat domesticated humans as much as the reverse. Option B captures this mutuality. A is contradicted by paragraph two; C and D are not supported.',
    timeSeconds: 90,
  },

  // ---------------------------------------------------------------------------
  // GRE (8 questions)
  // ---------------------------------------------------------------------------
  {
    id: "Q-GRE-V-001",
    examType: "GRE",
    section: "Verbal",
    type: "text-completion",
    difficulty: "medium",
    tags: ["vocabulary", "sentence-completion"],
    prompt:
      "Complete the sentence by selecting the word that best fits the blank. The candidate's performance in the debate was so (i) ______ that even her most ardent supporters struggled to find anything positive to say about it.",
    options: ["luminous", "cogent", "listless", "incandescent", "redolent"],
    correctIndex: 2,
    explanation:
      'The phrase "even her most ardent supporters struggled to find anything positive" signals a poor performance. "Listless" (lacking energy or enthusiasm) fits. "Luminous," "cogent," "incandescent," and "redolent" are all positive or neutral and would not produce the described reaction.',
    timeSeconds: 90,
  },
  {
    id: "Q-GRE-V-002",
    examType: "GRE",
    section: "Verbal",
    type: "text-completion",
    difficulty: "hard",
    tags: ["vocabulary", "sentence-completion"],
    prompt:
      "For each blank, select one entry from the corresponding column. The critic's review was (i) ______ rather than analytical: rather than (ii) ______ the film's themes with care, she dismissed them with (iii) ______ adjectives that revealed more about her mood than about the movie.",
    dropdownOptions: [
      { blank: 1, options: ["tedious", "reactionary", "judicious"] },
      { blank: 2, options: ["engaging with", "glossing over", "distrusting"] },
      { blank: 3, options: ["measured", "peevish", "laudatory"] },
    ],
    correctDropdowns: [1, 0, 1],
    explanation:
      'Blank (i): the review is described as emotional rather than analytical, so "reactionary" (impulsive and emotional) fits. Blank (ii): the contrast "rather than ___ with care" requires the careful, analytical alternative — "engaging with" the themes. Blank (iii): adjectives that "reveal more about her mood than the movie" suggest irritability — "peevish".',
    timeSeconds: 150,
  },
  {
    id: "Q-GRE-V-003",
    examType: "GRE",
    section: "Verbal",
    type: "sentence-equivalence",
    difficulty: "medium",
    tags: ["vocabulary", "synonyms"],
    prompt:
      "Select exactly TWO words that fit the blank and produce sentences that are alike in meaning. Although the experiment appeared rigorous at first glance, subsequent review revealed that the methodology was so ______ as to render the conclusions dubious.",
    options: [
      "sound",
      "specious",
      "cogent",
      "fallacious",
      "meticulous",
      "preliminary",
    ],
    correctIndices: [1, 3],
    explanation:
      'The conclusions are "dubious" because the methodology was flawed. "Specious" (false but plausibly argued) and "fallacious" (based on flawed reasoning) are near-synonyms that both fit. "Sound," "cogent," and "meticulous" are positive. "Preliminary" does not imply flawed reasoning.',
    timeSeconds: 100,
  },
  {
    id: "Q-GRE-V-004",
    examType: "GRE",
    section: "Verbal",
    type: "sentence-equivalence",
    difficulty: "hard",
    tags: ["vocabulary", "synonyms"],
    prompt:
      "Select exactly TWO words that fit the blank and produce sentences that are alike in meaning. The professor's lectures were so ______ that students often left more confused than when they had arrived.",
    options: [
      "lucid",
      "recondite",
      "perspicuous",
      "obscure",
      "trenchant",
      "illuminating",
    ],
    correctIndices: [1, 3],
    explanation:
      'Students leaving "more confused" requires words meaning unclear or difficult. "Recondite" (obscure, dealing with abstruse matters) and "obscure" both fit and are near-synonyms in this context. "Lucid," "perspicuous," and "illuminating" mean clear; "trenchant" means incisive.',
    timeSeconds: 100,
  },
  {
    id: "Q-GRE-Q-001",
    examType: "GRE",
    section: "Quantitative",
    type: "quantitative-comparison",
    difficulty: "medium",
    tags: ["algebra", "exponents"],
    prompt:
      "x is a positive integer greater than 1. Compare Quantity A and Quantity B and select the answer choice that best describes the relationship.",
    quantityA: "2^x + 2^x",
    quantityB: "2^(x+1)",
    options: [
      "Quantity A is greater.",
      "Quantity B is greater.",
      "The two quantities are equal.",
      "The relationship cannot be determined from the information given.",
    ],
    correctIndex: 2,
    explanation:
      "2^x + 2^x = 2 × 2^x = 2^(x+1). The two quantities are algebraically identical for every positive integer x, so they are always equal. Answer C.",
    timeSeconds: 90,
  },
  {
    id: "Q-GRE-Q-002",
    examType: "GRE",
    section: "Quantitative",
    type: "quantitative-comparison",
    difficulty: "easy",
    tags: ["probability"],
    prompt:
      "A fair six-sided die with faces numbered 1 through 6 is rolled once. Compare Quantity A and Quantity B and select the answer choice that best describes the relationship.",
    quantityA: "The probability of rolling an even number",
    quantityB: "The probability of rolling a number greater than 4",
    options: [
      "Quantity A is greater.",
      "Quantity B is greater.",
      "The two quantities are equal.",
      "The relationship cannot be determined from the information given.",
    ],
    correctIndex: 0,
    explanation:
      "P(even) = 3/6 = 1/2 (outcomes 2, 4, 6). P(greater than 4) = 2/6 = 1/3 (outcomes 5, 6). 1/2 > 1/3, so Quantity A is greater. Answer A.",
    timeSeconds: 75,
  },
  {
    id: "Q-GRE-Q-003",
    examType: "GRE",
    section: "Quantitative",
    type: "data-interpretation",
    difficulty: "medium",
    tags: ["percent-change", "data-interpretation"],
    prompt:
      "A small-town library recorded the following new memberships per quarter:\n2022: Q1 = 120, Q2 = 180, Q3 = 210, Q4 = 240\n2023: Q1 = 150, Q2 = 220, Q3 = 260, Q4 = 300\nWhat was the approximate percent increase in new memberships from Q3 2022 to Q3 2023?",
    options: ["12%", "19%", "24%", "31%"],
    correctIndex: 2,
    explanation:
      "Percent increase = (260 − 210) / 210 × 100 = 50 / 210 × 100 ≈ 23.8%, which rounds to 24%. Answer C.",
    timeSeconds: 120,
  },
  {
    id: "Q-GRE-AW-001",
    examType: "GRE",
    section: "Analytical Writing",
    type: "issue-task",
    difficulty: "hard",
    tags: ["argumentation", "issue-task"],
    prompt:
      'Original issue task: "The most valuable knowledge is knowledge that can be applied immediately to solve practical problems." Write a response in which you discuss the extent to which you agree or disagree with the statement and explain your reasoning for the position you take. In developing and supporting your position, you should consider ways in which the statement might or might not hold true and explain how these considerations shape your position.',
    modelAnswer: `MODEL OUTLINE (use as a starting scaffold, not a model essay):

THESIS: Partial agreement. Immediately applicable knowledge has clear instrumental value, but the most valuable knowledge also includes theoretical and disinterested inquiry whose worth may take decades or centuries to surface.

PARAGRAPH 1 — Concession: Practical knowledge (medicine, engineering, accounting) directly improves lives and rewards learners with measurable returns. A newly qualified nurse who can place an IV line on her first day is, in one sense, more immediately "valuable" than a metaphysics PhD.

PARAGRAPH 2 — Qualification: However, "immediate applicability" is the wrong yardstick. Many of the most transformative discoveries — non-Euclidean geometry, the double helix, quantum theory — had no immediate practical use and were pursued for their own sake. Their value surfaced only later, sometimes much later, and often in unanticipated ways (e.g., non-Euclidean geometry underwrote general relativity; number theory underwrites modern cryptography).

PARAGRAPH 3 — Deeper objection: A culture that values only immediately applicable knowledge will systematically under-fund basic research and the humanities. It will produce capable technicians but impoverished citizens, and it will gradually lose the conceptual soil from which future practical breakthroughs grow.

PARAGRAPH 4 — Synthesis: The statement confuses "valuable" with "useful right now." Truly valuable knowledge is knowledge whose worth survives the test of time, whether that worth is practical, intellectual, or moral — and a healthy society cultivates all three.

CONCLUSION: Practical knowledge matters, but elevating it to "most valuable" risks short-sightedness. The deepest value often lies in inquiry whose practical pay-off, if any, lies beyond the horizon.`,
    explanation:
      "A strong GRE issue response takes a clear position, acknowledges counter-arguments, supports each claim with concrete examples, and synthesises rather than merely listing points. This outline scaffolds a 500-600 word essay. Avoid generic examples (e.g., 'Einstein was smart'); prefer specific cases that demonstrate range (medical training AND non-Euclidean geometry AND cryptography).",
    timeSeconds: 1800,
  },

  // ---------------------------------------------------------------------------
  // GMAT (6 questions)
  // ---------------------------------------------------------------------------
  {
    id: "Q-GMAT-Q-001",
    examType: "GMAT",
    section: "Quantitative",
    type: "multiple-choice",
    difficulty: "medium",
    tags: ["percentages", "word-problems"],
    prompt:
      "A store marks up the wholesale price of a jacket by 40% to set the retail price. During a sale, the jacket is sold at a 25% discount off the retail price. If the sale price is $84, what was the wholesale price?",
    options: ["$60", "$70", "$80", "$90"],
    correctIndex: 2,
    explanation:
      "Let wholesale = W. Retail = 1.40W. Sale price = 0.75 × 1.40W = 1.05W. Setting 1.05W = $84 gives W = $80. Verify: $80 × 1.40 = $112 retail; $112 × 0.75 = $84 sale. ✓",
    timeSeconds: 120,
  },
  {
    id: "Q-GMAT-Q-002",
    examType: "GMAT",
    section: "Quantitative",
    type: "multiple-choice",
    difficulty: "medium",
    tags: ["rates", "work-problems"],
    prompt:
      "Working alone, machine A can complete a job in 6 hours, and machine B can complete the same job in 9 hours. If the two machines work together at their respective constant rates, how long, in hours, will it take them to complete the job?",
    options: ["3.0", "3.6", "4.2", "5.4"],
    correctIndex: 1,
    explanation:
      "Rates: A = 1/6 job per hour, B = 1/9 job per hour. Combined rate = 1/6 + 1/9 = 3/18 + 2/18 = 5/18 job per hour. Time = 1 / (5/18) = 18/5 = 3.6 hours.",
    timeSeconds: 120,
  },
  {
    id: "Q-GMAT-Q-003",
    examType: "GMAT",
    section: "Quantitative",
    type: "data-sufficiency",
    difficulty: "hard",
    tags: ["algebra", "data-sufficiency"],
    prompt:
      "What is the value of x?\n(1) 2x + 3y = 12\n(2) 4x + 6y = 24",
    options: [
      "Statement (1) ALONE is sufficient, but statement (2) alone is not sufficient.",
      "Statement (2) ALONE is sufficient, but statement (1) alone is not sufficient.",
      "BOTH statements TOGETHER are sufficient, but NEITHER statement ALONE is sufficient.",
      "EACH statement ALONE is sufficient.",
      "Statements (1) and (2) TOGETHER are NOT sufficient.",
    ],
    correctIndex: 4,
    explanation:
      "Statement (2) is simply statement (1) multiplied by 2 — they describe the same line. With one equation in two unknowns, x cannot be uniquely determined even when both statements are used. Answer E.",
    timeSeconds: 100,
  },
  {
    id: "Q-GMAT-V-001",
    examType: "GMAT",
    section: "Verbal",
    type: "critical-reasoning",
    difficulty: "hard",
    tags: ["critical-reasoning", "causal-reasoning"],
    prompt:
      "A coffee roaster recently switched its packaging from a plastic-lined foil bag to a compostable paper bag. Six months after the switch, the roaster's sales had declined by 8%. The marketing director concluded that customers disliked the new packaging and urged a return to the foil bag. Which of the following, if true, most weakens the marketing director's argument?",
    options: [
      "The new paper bags cost slightly more to produce than the foil bags.",
      "During the same six-month period, two new specialty coffee roasters opened in the same city.",
      "Some customers reported that the paper bags tore more easily than the foil bags.",
      "The roaster's overall profit margin remained unchanged over the six-month period.",
      "The roaster raised its retail prices by 5% at the same time as the packaging change.",
    ],
    correctIndex: 1,
    explanation:
      'Option B offers an alternative explanation for the sales decline — new competitors entering the market — that has nothing to do with the packaging change. This weakens the marketing director\'s causal inference. Option E also weakens somewhat, but a 5% price increase alone would not usually explain an 8% sales drop as directly as the entry of new competitors taking market share. Options A, C, and D do not directly weaken the causal claim.',
    timeSeconds: 120,
  },
  {
    id: "Q-GMAT-V-002",
    examType: "GMAT",
    section: "Verbal",
    type: "sentence-correction",
    difficulty: "medium",
    tags: ["grammar", "subject-verb-agreement"],
    prompt:
      'Choose the version of the underlined portion that best expresses the meaning of the original sentence. "The team of researchers, along with their graduate assistants, have submitted their findings to three prestigious journals."',
    options: [
      "have submitted their findings",
      "has submitted their findings",
      "have submitted its findings",
      "has submitted its findings",
      "are submitting their findings",
    ],
    correctIndex: 3,
    explanation:
      'The grammatical subject is "team" (singular). The phrase "along with their graduate assistants" is parenthetical and does not change the number of the subject, so the verb must be singular "has". Treating the team as a unit, the pronoun "its" is the most consistent choice. Option D ("has submitted its findings") is correct.',
    timeSeconds: 90,
  },
  {
    id: "Q-GMAT-DI-001",
    examType: "GMAT",
    section: "Data Insights",
    type: "data-insights",
    difficulty: "hard",
    tags: ["percent-change", "data-interpretation"],
    prompt:
      "A consumer electronics company reported the following quarterly sales (in thousands of units):\n            Q1   Q2   Q3   Q4\nAudio       12   15   18   20\nWearable     8   11   14   19\nSmart Home   5    9   13   18\nWhich product line had the largest percentage increase in sales from Q1 to Q4?",
    options: ["Audio", "Wearable", "Smart Home", "Audio and Smart Home tied"],
    correctIndex: 2,
    explanation:
      "Audio: (20 − 12) / 12 = 66.7%. Wearable: (19 − 8) / 8 = 137.5%. Smart Home: (18 − 5) / 5 = 260%. Smart Home had the largest percentage increase. Answer C.",
    timeSeconds: 120,
  },

  // ---------------------------------------------------------------------------
  // ACT (5 questions)
  // ---------------------------------------------------------------------------
  {
    id: "Q-ACT-E-001",
    examType: "ACT",
    section: "English",
    type: "standard-english",
    difficulty: "medium",
    tags: ["rhetoric", "transitions"],
    prompt:
      'Read the following passage. "The new community center, which opened last spring, has become a hub for neighborhood activities. It offers after-school tutoring, a weekly farmers\' market, and yoga classes on Saturday mornings. In fact, the center has been so successful that the city council is already considering opening two more locations in nearby districts." The writer is considering deleting the phrase "In fact" from the preceding sentence. Should the phrase be kept or deleted?',
    options: [
      "Keep it, because it signals that the following information strengthens the previous point.",
      "Keep it, because without it the sentence is grammatically incomplete.",
      "Delete it, because the information that follows contradicts the previous sentences.",
      "Delete it, because it is an unnecessary filler phrase that adds no logical relationship.",
    ],
    correctIndex: 0,
    explanation:
      '"In fact" here introduces a piece of evidence that intensifies the previous claim about the center\'s success (city council considering expansion). It carries a clear logical function. The sentence is grammatically complete without it (ruling out B), the information does not contradict (ruling out C), and the phrase is not mere filler (ruling out D).',
    timeSeconds: 90,
  },
  {
    id: "Q-ACT-E-002",
    examType: "ACT",
    section: "English",
    type: "standard-english",
    difficulty: "medium",
    tags: ["grammar", "subject-verb-agreement"],
    prompt:
      "Choose the correct verb form to complete the sentence: \"Neither the manager nor the employees ______ aware of the policy change that had been announced the previous week.\"",
    options: ["was", "were", "had been", "is"],
    correctIndex: 1,
    explanation:
      'With "neither...nor" constructions, the verb agrees with the nearer subject — in this case "employees" (plural). So "were" is correct. This is the standard rule tested on the ACT.',
    timeSeconds: 60,
  },
  {
    id: "Q-ACT-M-001",
    examType: "ACT",
    section: "Math",
    type: "multiple-choice",
    difficulty: "easy",
    tags: ["coordinate-geometry", "linear-equations"],
    prompt:
      "In the xy-plane, the line y = mx + 4 passes through the point (3, 13). What is the value of m?",
    options: ["2", "3", "4", "5"],
    correctIndex: 1,
    explanation:
      "Substituting (3, 13): 13 = 3m + 4, so 9 = 3m, hence m = 3. Answer B.",
    timeSeconds: 90,
  },
  {
    id: "Q-ACT-R-001",
    examType: "ACT",
    section: "Reading",
    type: "central-idea",
    difficulty: "medium",
    tags: ["main-idea", "history"],
    passage: ACT_PASSAGE_BICYCLE,
    prompt: "The main idea of the passage is that:",
    options: [
      "the penny-farthing was the most dangerous bicycle ever invented",
      "the modern bicycle emerged through a long process of refinement and had social consequences beyond transportation",
      "John Kemp Starley invented the first bicycle",
      "pneumatic tires were the single most important innovation in bicycle history",
    ],
    correctIndex: 1,
    explanation:
      'The passage traces the bicycle from the 1817 draisine through the boneshaker, penny-farthing, and 1885 Rover Safety, then notes its social consequences for commuters and women. Option B captures both halves. A and D overstate single points; C is factually wrong (Starley created the Rover Safety, not the first bicycle).',
    timeSeconds: 90,
  },
  {
    id: "Q-ACT-S-001",
    examType: "ACT",
    section: "Science",
    type: "data-interpretation",
    difficulty: "hard",
    tags: ["biology", "photosynthesis", "data-interpretation"],
    prompt:
      "A biology student investigated the effect of light intensity on the rate of photosynthesis in the aquatic plant Elodea. Equal-length sprigs of Elodea were placed in inverted funnels submerged in beakers of water with a small volume of sodium bicarbonate solution (a source of CO2). A water-filled test tube was inverted over each funnel to collect gas produced. Five identical apparatuses were placed at distances of 10, 20, 30, 40, and 50 cm from a fixed light source. After 30 minutes, gas volumes collected were: 10 cm = 8.2 mL; 20 cm = 6.1 mL; 30 cm = 4.5 mL; 40 cm = 3.0 mL; 50 cm = 1.6 mL. Which conclusion is best supported by the data?",
    options: [
      "Light intensity has no measurable effect on photosynthesis in Elodea.",
      "Photosynthesis in Elodea increases as light intensity increases (i.e., as distance from the light source decreases).",
      "Elodea produces the most gas in complete darkness.",
      "The volume of gas produced is directly proportional to the distance from the light source.",
    ],
    correctIndex: 1,
    explanation:
      "Gas volume decreases monotonically as distance from the light source increases (8.2 → 6.1 → 4.5 → 3.0 → 1.6 mL). Since light intensity decreases with the square of distance, this pattern supports a positive relationship between light intensity and photosynthetic gas production. Option D is wrong because the relationship is not linear in distance (light follows an inverse-square law).",
    timeSeconds: 120,
  },

  // ---------------------------------------------------------------------------
  // LSAT (4 questions)
  // ---------------------------------------------------------------------------
  {
    id: "Q-LSAT-LR-001",
    examType: "LSAT",
    section: "Logical Reasoning",
    type: "critical-reasoning",
    difficulty: "hard",
    tags: ["assumption", "logical-reasoning"],
    prompt:
      "All students who complete the summer bridge program with a grade of B or higher are guaranteed admission to the university. Maria completed the summer bridge program with a grade of B+. Therefore, Maria is guaranteed admission to the university. Which of the following is an assumption required by the argument?",
    options: [
      "Maria applied to the university.",
      "The summer bridge program is the only path to guaranteed admission.",
      "Maria's grade of B+ counts as 'B or higher' under the program's policy.",
      "The university has space for all guaranteed-admission students.",
      "Maria has met all other requirements for admission.",
    ],
    correctIndex: 2,
    explanation:
      "The argument depends on treating B+ as satisfying 'B or higher.' If the policy excluded B+ (e.g., by interpreting 'B or higher' as only A−, A, or A+), the conclusion would not follow. This is the necessary assumption. Other options might strengthen the case but are not strictly required by the logic of the argument as stated.",
    timeSeconds: 120,
  },
  {
    id: "Q-LSAT-LR-002",
    examType: "LSAT",
    section: "Logical Reasoning",
    type: "critical-reasoning",
    difficulty: "hard",
    tags: ["weaken", "causal-reasoning"],
    prompt:
      "A recent study found that households that own at least one cat are 30% less likely to report household pest problems than households without cats. The researchers concluded that cats are effective at reducing household pests. Which of the following, if true, most weakens the researchers' conclusion?",
    options: [
      "Cats sometimes bring live prey into the house as 'gifts' for their owners.",
      "Households that own cats tend to live in newer buildings with better-sealed entry points than households without cats.",
      "Some households without cats keep dogs that also deter pests.",
      "The study was funded by a national pet-food manufacturers' association.",
      "Many cat owners allow their cats to roam outdoors for several hours per day.",
    ],
    correctIndex: 1,
    explanation:
      "Option B introduces an alternative explanation for the observed correlation: cat-owning households may have fewer pests because they live in newer, better-sealed buildings, not because of the cats themselves. This undermines the causal claim. The other options either do not address the causal link directly (A, E), concern only subsets (C), or raise a methodological worry that does not by itself overturn the finding (D).",
    timeSeconds: 120,
  },
  {
    id: "Q-LSAT-RC-001",
    examType: "LSAT",
    section: "Reading Comprehension",
    type: "reading-mcq",
    difficulty: "hard",
    tags: ["inference", "legal-reasoning"],
    passage: LSAT_PASSAGE_STANDING,
    prompt:
      "The passage suggests that the influential dissent's view that natural objects should have standing:",
    options: [
      "was eventually adopted in modified form by a later Supreme Court majority",
      "would, if adopted, have eliminated the need for plaintiffs to demonstrate personal injury",
      "was rejected by the Court in the 1972 environmental case",
      "was endorsed by the Sierra Club itself",
      "has no relevance to modern environmental litigation",
    ],
    correctIndex: 1,
    explanation:
      'The passage states the dissent argued "natural objects themselves ought to have standing, with guardians appointed to speak for them." If natural objects themselves had standing, plaintiffs would no longer need to demonstrate their own personal injury — the injury would be to the natural object. Option B captures this implication. The passage explicitly notes the view "has never been adopted by a majority" (ruling out A). C is too strong — the Court did not outright reject the view, it merely did not adopt it. D and E are unsupported.',
    timeSeconds: 120,
  },
  {
    id: "Q-LSAT-AR-001",
    examType: "LSAT",
    section: "Analytical Reasoning",
    type: "logic-game",
    difficulty: "advanced",
    tags: ["sequencing", "logic-games"],
    prompt:
      "Five students — Pia, Quentin, Riya, Sam, and Tomas — are assigned to present their projects on five consecutive days, Monday through Friday. Each student presents on exactly one day. The following conditions apply: (1) Pia must present on an earlier day than Quentin. (2) Riya must present on the day immediately before Sam. (3) Tomas cannot present on Monday or Friday. Which of the following could be the order of presenters, from Monday to Friday?",
    options: [
      "Tomas, Riya, Sam, Pia, Quentin",
      "Pia, Riya, Sam, Quentin, Tomas",
      "Pia, Tomas, Riya, Sam, Quentin",
      "Quentin, Pia, Riya, Sam, Tomas",
      "Riya, Sam, Quentin, Pia, Tomas",
    ],
    correctIndex: 2,
    explanation:
      "Check each option against the three rules. A violates rule 3 (Tomas on Monday). B violates rule 3 (Tomas on Friday). C satisfies all three: Pia (Mon) before Quentin (Fri) ✓; Riya (Wed) immediately before Sam (Thu) ✓; Tomas on Tuesday (not Mon or Fri) ✓. D violates rule 1 (Quentin before Pia) and rule 3 (Tomas on Friday). E violates rule 1 (Quentin on Wed, Pia on Thu). Only C works.",
    timeSeconds: 180,
  },

  // ---------------------------------------------------------------------------
  // MCAT (3 questions)
  // ---------------------------------------------------------------------------
  {
    id: "Q-MCAT-CARS-001",
    examType: "MCAT",
    section: "CARS",
    type: "reading-mcq",
    difficulty: "hard",
    tags: ["inference", "philosophy-of-history"],
    passage: MCAT_PASSAGE_PROGRESS,
    prompt:
      "Based on the passage, which of the following would the author most likely agree with?",
    options: [
      "The Whig interpretation of history is the only defensible account of historical change.",
      "The Victorian belief in progress was entirely without merit.",
      "Modern historians must reject all forms of progress narrative.",
      "Modern historical thinking requires acknowledging that some dimensions of human life have improved while others have not.",
    ],
    correctIndex: 3,
    explanation:
      'The final paragraph explicitly states that modern historical thinking requires holding "two ideas simultaneously: that some things have demonstrably improved... and that improvement in one dimension does not guarantee improvement in others." Option D matches. A is contradicted by Butterfield\'s critique; B and C are too absolute.',
    timeSeconds: 120,
  },
  {
    id: "Q-MCAT-BB-001",
    examType: "MCAT",
    section: "Biological & Biochemical",
    type: "multiple-choice",
    difficulty: "hard",
    tags: ["enzyme-kinetics", "biochemistry"],
    prompt:
      "A researcher is studying an enzyme that catalyses the conversion of substrate S to product P. The wild-type enzyme has a Km of 2.0 mM and a Vmax of 100 μmol/min. A mutant version, in which a single amino acid in the active site has been changed, has a Km of 8.0 mM and the same Vmax. Which of the following best describes the effect of the mutation on the enzyme's function?",
    options: [
      "The mutation increases the enzyme's affinity for substrate S.",
      "The mutation decreases the enzyme's affinity for substrate S without affecting catalytic efficiency at saturation.",
      "The mutation increases the maximum rate of the reaction.",
      "The mutation reduces the Vmax of the enzyme.",
    ],
    correctIndex: 1,
    explanation:
      "Km is inversely related to substrate affinity — a higher Km indicates lower affinity. The increase from 2.0 to 8.0 mM means the mutant requires a higher substrate concentration to reach half-maximal velocity, indicating reduced affinity. Vmax is unchanged, so catalytic rate at saturation is not affected. Option B is correct.",
    timeSeconds: 120,
  },
  {
    id: "Q-MCAT-CP-001",
    examType: "MCAT",
    section: "Chemical & Physical",
    type: "multiple-choice",
    difficulty: "hard",
    tags: ["calorimetry", "thermodynamics"],
    prompt:
      "A 50.0 g sample of water at 80.0 °C is mixed with 100.0 g of water at 20.0 °C in an insulated container. Assuming no heat is lost to the surroundings and the specific heat capacity of water is 4.18 J/(g·°C), what is the final temperature of the mixture?",
    options: ["30.0 °C", "35.0 °C", "40.0 °C", "50.0 °C"],
    correctIndex: 2,
    explanation:
      "Heat lost by hot water = heat gained by cold water: m₁c(T₁ − Tf) = m₂c(Tf − T₂). Substituting: 50(80 − Tf) = 100(Tf − 20). Expanding: 4000 − 50Tf = 100Tf − 2000. So 6000 = 150Tf, hence Tf = 40 °C. Answer C.",
    timeSeconds: 150,
  },

  // ---------------------------------------------------------------------------
  // LanguageCert (4 questions)
  // ---------------------------------------------------------------------------
  {
    id: "Q-LC-R-001",
    examType: "LanguageCert",
    section: "Reading",
    type: "reading-mcq",
    difficulty: "medium",
    tags: ["academic-reading", "detail"],
    passage: LC_PASSAGE_FOLK,
    prompt:
      "According to the passage, what did Cecil Sharp and Maud Karpeles find in the Appalachian Mountains?",
    options: [
      "Printed copies of seventeenth-century broadsides preserved in archives.",
      "Communities that had abandoned their traditional music entirely.",
      "Versions of old British and Irish ballads still being sung and passed down orally.",
      "Evidence that oral tradition was always unreliable.",
    ],
    correctIndex: 2,
    explanation:
      "The first paragraph states Sharp and Karpeles found versions of ballads that had been printed in seventeenth-century broadsides 'still in active circulation, sung by people who could not read music and had learned the songs orally.' Option C matches. A is wrong because the ballads were sung, not printed. B contradicts the discovery. D is contradicted by the third paragraph, which complicates but does not dismiss oral tradition.",
    timeSeconds: 90,
  },
  {
    id: "Q-LC-L-001",
    examType: "LanguageCert",
    section: "Listening",
    type: "fill-blanks",
    difficulty: "medium",
    tags: ["listening-detail", "note-completion"],
    audioScript: LC_SCRIPT_CAREERS,
    prompt:
      "Complete the notes. Write NO MORE THAN TWO WORDS for each blank.\n1. The careers fair takes place on 15 November in the ______.\n2. Students should bring at least ______ copies of their CV.\n3. Internship applications close on 12 ______.\n4. Mentors offer two one-hour sessions per ______.",
    correctAnswer: "Great Hall | ten (10) | January | term",
    explanation:
      '1. "in the Great Hall, from ten in the morning until four in the afternoon" → Great Hall. 2. "Bring at least ten printed copies of your CV" → ten. 3. "Applications open on the first of December and close on the twelfth of January" → January. 4. "Mentors offer two one-hour sessions per term, typically by video call" → term.',
    timeSeconds: 180,
  },
  {
    id: "Q-LC-W-001",
    examType: "LanguageCert",
    section: "Writing",
    type: "essay",
    difficulty: "medium",
    tags: ["email", "complaint", "task-response"],
    prompt:
      "You recently stayed at a hotel for one night on a business trip and were unhappy with several aspects of your stay. Write an email of complaint (150–200 words) to the hotel manager. In your email you should: describe the problems you encountered, explain how these affected you, and state what action you would like the hotel to take.",
    modelAnswer: `Subject: Complaint regarding stay on 14 May — Room 207

Dear Hotel Manager,

I am writing to express my disappointment with my one-night stay at your hotel on 14 May 2025, booked under the reference HM-44782.

Three issues marred the visit. First, my room (207) was not ready at the 3 p.m. check-in time; I waited forty minutes in the lobby after a long working day. Second, the air-conditioning unit in the room made a loud rattling noise throughout the night, which made rest impossible and left me exhausted for my morning client meeting. Third, the breakfast included in my reservation was not honoured — I was told the voucher had expired and was charged £18.

These problems caused genuine inconvenience: poor sleep directly affected my professional commitments the following day, and the overcharge added avoidable stress.

I would be grateful if you would (1) refund the £18 breakfast charge, (2) offer a 50% reduction on the room rate as compensation for the disruption, and (3) confirm what steps you are taking to prevent a recurrence. I look forward to your reply within ten working days.

Yours sincerely,
Daniela Rahman`,
    explanation:
      "Strong LanguageCert B2/C1 writing sample (~195 words). Covers all three required content points, uses appropriate formal email conventions (subject line, salutation, sign-off), and maintains a polite but firm tone. Note the numbered list at the end — a clear, concrete request for action.",
    timeSeconds: 1500,
  },
  {
    id: "Q-LC-S-001",
    examType: "LanguageCert",
    section: "Speaking",
    type: "speaking-part2",
    difficulty: "medium",
    tags: ["fluency", "topic-development"],
    prompt:
      "Describe a hobby or activity that you enjoy outside of work or study. You should say: what the activity is, how often you do it, why you enjoy it, and whether you would recommend it to others. You will have one minute to prepare and two minutes to speak.",
    modelAnswer:
      "Sample answer (≈2 minutes): 'A hobby I've kept up for about six years now is woodworking — specifically small furniture pieces like stools and side tables. I try to spend at least one evening a week in my garage workshop, usually Wednesday, and a longer stretch on Saturday mornings. What I enjoy most is the contrast with my office work, which is entirely screen-based and abstract. With wood, every decision produces a tangible result — a clean dovetail joint, a smoothly sanded surface — and mistakes are visible and immediate, which I find oddly satisfying. I'd definitely recommend it to anyone who spends their working day in front of a computer, although I'd warn that the initial cost of decent tools can be steep. Starting with a small project, like a simple cutting board, is a good way to test whether you enjoy the craft before committing to bigger investments.'",
    explanation:
      "Strong B2/C1 sample. Addresses all four prompt points in order, uses precise vocabulary ('dovetail joint', 'tangible result'), and varies sentence length for natural rhythm. Note the recommendation includes a caveat — this nuance earns higher marks than a flat endorsement.",
    timeSeconds: 150,
  },

  // ---------------------------------------------------------------------------
  // Linguaskill (3 questions)
  // ---------------------------------------------------------------------------
  {
    id: "Q-LING-RL-001",
    examType: "Linguaskill",
    section: "Reading & Listening",
    type: "reading-mcq",
    difficulty: "medium",
    tags: ["academic-reading", "detail"],
    passage: LING_PASSAGE_ESCOOTER,
    prompt:
      "According to the passage, which of the following was NOT cited as a concern about shared electric scooters?",
    options: [
      "Scooters blocked sidewalks and wheelchair ramps.",
      "Hospital admissions for scooter-related injuries increased.",
      "Scooter batteries frequently exploded during charging.",
      "Cities received complaints from disability advocates.",
    ],
    correctIndex: 2,
    explanation:
      "The passage cites sidewalk obstruction (A), injury increases (B), and disability-advocate complaints (D). Battery explosions during charging are not mentioned anywhere in the passage. Option C is the correct answer to the NOT-cited question.",
    timeSeconds: 90,
  },
  {
    id: "Q-LING-W-001",
    examType: "Linguaskill",
    section: "Writing",
    type: "writing-task1",
    difficulty: "easy",
    tags: ["email", "professional-correspondence"],
    prompt:
      "You work in the marketing department of a small company. Write a 120–150 word email to a colleague in another department asking for help with preparing a presentation. You should: explain what the presentation is for, describe the help you need, and suggest a time to meet.",
    modelAnswer: `Subject: Help with Q3 marketing presentation?

Hi Priya,

I hope you're having a good week. I'm putting together the Q3 marketing-performance presentation for the board meeting on the 22nd, and I could really use your help with the data side.

Specifically, I'd love a hand with two things. First, pulling the customer-segment breakdown from the CRM in a format that will play nicely with our slide template — I suspect you already have something close. Second, a quick sanity check on the conversion-rate calculations, since the sales-team numbers and the website-analytics numbers don't quite match and I want to make sure I'm interpreting them correctly before they go in front of the board.

Would you have 30 minutes sometime on Thursday afternoon, say between 2 and 4? Happy to bring coffee and biscuits. If that doesn't work, just let me know what does.

Thanks so much,
Marco`,
    explanation:
      "Solid Linguaskill B1/B2 sample (~140 words). Covers all three required points (purpose, specific help needed, suggested time), uses a natural professional-but-friendly register, and signs off appropriately. Note the concrete detail (CRM, conversion rates, specific time window) — vague requests score lower.",
    timeSeconds: 900,
  },
  {
    id: "Q-LING-S-001",
    examType: "Linguaskill",
    section: "Speaking",
    type: "speaking-part1",
    difficulty: "easy",
    tags: ["fluency", "personal-topic"],
    prompt:
      "Please talk for one minute about a recent journey you took. You should describe where you went, how you travelled, what you did there, and whether you would recommend the destination to a friend.",
    modelAnswer:
      "Sample answer (≈60 seconds): 'Last month I travelled to Porto, in northern Portugal, for a long weekend. I flew directly from London Gatwick, which took about two and a half hours, and then took the metro from the airport into the city centre, which was quick and inexpensive. While I was there I mostly walked — Porto is a very walkable city, although the hills are steep. I visited the Livraria Lello bookshop, which is famous for its carved wooden staircase, took a boat cruise along the Douro river, and tried several different port-wine cellars. I would definitely recommend Porto to a friend. It's smaller and less crowded than Lisbon, the food is excellent and surprisingly affordable, and the combination of the river, the bridges, and the tiled buildings makes it genuinely beautiful. The only word of warning would be to bring comfortable shoes — those hills are no joke.'",
    explanation:
      "Strong B1/B2 sample. Addresses all four prompt points within the time limit, uses specific vocabulary ('Livraria Lello', 'port-wine cellars', 'Douro river'), and ends with a useful caveat that demonstrates evaluative judgement. Aim for similar specificity — generic descriptions ('I went to a nice city and ate nice food') score poorly.",
    timeSeconds: 90,
  },

  // ---------------------------------------------------------------------------
  // University Placement (4 questions)
  // ---------------------------------------------------------------------------
  {
    id: "Q-PL-G-001",
    examType: "Placement",
    section: "Grammar",
    type: "multiple-choice",
    difficulty: "medium",
    tags: ["grammar", "verb-tense"],
    prompt:
      "Choose the option that best completes the sentence: 'By the time the rescue team arrived, the climbers ______ stranded on the mountain for nearly forty-eight hours.'",
    options: ["have been", "had been", "are", "were being"],
    correctIndex: 1,
    explanation:
      'The sentence describes an action (being stranded) that began before and was still in progress at a past moment (the rescue team\'s arrival). The past perfect "had been" is required. "Have been" is present perfect and would not agree with the past-time "arrived".',
    timeSeconds: 60,
  },
  {
    id: "Q-PL-V-001",
    examType: "Placement",
    section: "Vocabulary",
    type: "vocabulary-in-context",
    difficulty: "hard",
    tags: ["vocabulary", "inference"],
    prompt:
      "Read the sentence and choose the word that best fits the blank. 'The professor's comments during the seminar were surprisingly ______, considering that the student's draft had been riddled with factual errors and unclear arguments.'",
    options: ["laudatory", "critical", "brief", "technical"],
    correctIndex: 0,
    explanation:
      'The word "surprisingly" signals that the professor\'s reaction was the opposite of what the poor-quality draft would normally warrant. Given factual errors and unclear arguments, critical comments would be expected; the surprising reaction is therefore praise — "laudatory". Options B, C, and D do not produce the contrast signaled by "surprisingly".',
    timeSeconds: 70,
  },
  {
    id: "Q-PL-R-001",
    examType: "Placement",
    section: "Reading",
    type: "reading-mcq",
    difficulty: "medium",
    tags: ["academic-reading", "main-idea"],
    passage: PL_PASSAGE_PRINTING,
    prompt:
      "According to the passage, what was one major effect of the printing press on the spread of the Protestant Reformation?",
    options: [
      "It allowed scribes to copy Bibles more quickly.",
      "It enabled Luther's writings to be reproduced in large numbers and distributed rapidly.",
      "It reduced the cost of paper across Europe.",
      "It standardized religious doctrine across the continent.",
    ],
    correctIndex: 1,
    explanation:
      'The third paragraph states that the Reformation "became a continent-spanning upheaval in part because Martin Luther\'s theses and pamphlets could be printed in thousands of copies and distributed within weeks." Option B matches. A is wrong (scribes were replaced, not helped). C and D are not supported by the passage.',
    timeSeconds: 90,
  },
  {
    id: "Q-PL-W-001",
    examType: "Placement",
    section: "Writing",
    type: "writing-task2",
    difficulty: "hard",
    tags: ["essay", "argumentation", "task-response"],
    prompt:
      "Some educators argue that schools should abandon traditional homework in favour of project-based learning that students complete during the school day. To what extent do you agree or disagree? Write 300–400 words supporting your position with reasons and examples.",
    modelAnswer: `The debate over whether schools should replace traditional homework with in-school project-based learning has gained momentum in recent years. While I agree that excessive, repetitive homework can be counterproductive, I disagree with the stronger claim that homework should be abandoned altogether. A balanced model — shorter, targeted homework combined with in-class projects — would serve students better than either extreme.

Proponents of project-based learning make a legitimate point about equity. Homework disproportionately burdens students from disadvantaged backgrounds, who may lack quiet study spaces, reliable internet, or parental support. A child sharing a bedroom with two siblings in a noisy flat is unlikely to benefit from an hour of maths worksheets. Moving project work into the school day also allows teachers to coach collaboration and problem-solving skills that worksheets cannot easily develop.

However, abandoning homework entirely carries risks that advocates often understate. Independent practice is not the same as supervised practice; the silent struggle of wrestling with a problem at the kitchen table builds persistence and self-regulation that no teacher can directly observe or scaffold. Research in cognitive psychology consistently shows that distributed practice — short, regular review sessions spaced over time — is one of the most effective ways to consolidate learning. Eliminating homework removes the most natural vehicle for distributed practice from the school day.

A more sensible reform would be to redesign homework rather than abolish it. Short, low-stakes assignments focused on retrieval practice (self-quizzing, brief writing prompts, targeted review) take fifteen to twenty minutes per subject and can be completed by students in almost any home environment. Lengthy projects and complex collaborative work, by contrast, belong in the classroom where teachers can guide and equalise them.

In conclusion, the case against traditional homework has merit but proves too much. The goal should be a thoughtful hybrid: less busywork, more retrieval practice, and project work moved into school hours where its benefits can be distributed fairly. Neither pole of the current debate serves students as well as the middle ground.`,
    explanation:
      "Strong placement-level diagnostic essay (~370 words). States a clear thesis (disagreement with full abolition, advocacy for a hybrid), develops two body paragraphs on each side before synthesising, and grounds each claim in a concrete example (equity at home, cognitive psychology research, retrieval practice). Note the measured tone and the explicit refutation in paragraph 3 — both hallmarks of academic writing at this level.",
    timeSeconds: 1800,
  },

  // ---------------------------------------------------------------------------
  // Visa Interview (5 questions) — speaking-style prompts for UK credibility,
  // CAS, visa, scholarship, and admission interviews. Each is a speaking-part1
  // style prompt with model answer hints.
  // ---------------------------------------------------------------------------
  {
    id: "Q-VISA-001",
    examType: "VisaInterview",
    section: "Speaking",
    type: "speaking-part1",
    difficulty: "medium",
    tags: ["visa-interview", "credibility", "fluency"],
    prompt:
      "Why have you chosen to study in the United Kingdom rather than in your home country or another destination? Please answer in 4–6 sentences as if responding to a UK visa credibility interview.",
    modelAnswer:
      "Model answer hint: Lead with the specific academic reason (a particular course, faculty, or research strength available in the UK and not at home), then add a secondary reason such as the English-language environment or the international recognition of UK qualifications. Be concrete — name the course and institution. Avoid generic phrases like 'UK education is the best in the world.' Sample: 'I chose the UK because the MSc in Data Science at the University of Sheffield offers a module on causal inference that I could not find in any equivalent programme in my country. The UK also gives me the chance to study in English, which is essential for my future work as a quantitative analyst. The one-year duration of UK master's programmes is also more efficient for me than the two-year programmes common elsewhere.'",
    explanation:
      "Credibility interviews reward specificity. Visa officers are trained to detect rehearsed, generic answers. A strong response names the actual course and a specific feature of it, demonstrates that the student researched alternatives, and links the choice to a concrete career or academic goal. Avoid talking vaguely about 'prestige' or 'culture'.",
    timeSeconds: 90,
  },
  {
    id: "Q-VISA-002",
    examType: "VisaInterview",
    section: "Speaking",
    type: "speaking-part1",
    difficulty: "medium",
    tags: ["visa-interview", "cas", "fluency"],
    prompt:
      "Please describe the course you will be studying, the name of your university, and why this particular course is the right choice for your career goals. Answer as if responding to a UK visa officer's question about your Confirmation of Acceptance for Studies (CAS).",
    modelAnswer:
      "Model answer hint: State the course title exactly as it appears on the CAS, name the university, give the start date and duration, and connect at least one specific module or feature of the course to a clearly stated career goal. Sample: 'My CAS is for the MSc Finance programme at the University of Glasgow, starting in September 2025. The course runs for twelve months. I chose it because it includes a CFA-aligned module on portfolio management, which is directly relevant to my goal of working as an investment analyst in my home country after graduation. I also plan to use the university's Bloomberg trading suite to build practical financial-modelling skills.'",
    explanation:
      "Visa officers will compare your spoken answer to the CAS details. Mismatched course names, durations, or start dates are red flags. Memorise the exact course title and duration from your CAS, and be ready to explain why each major element of the course matters for your stated career path.",
    timeSeconds: 90,
  },
  {
    id: "Q-VISA-003",
    examType: "VisaInterview",
    section: "Speaking",
    type: "speaking-part1",
    difficulty: "hard",
    tags: ["visa-interview", "finances", "fluency"],
    prompt:
      "A visa officer asks: 'How will you support yourself financially during your studies in the UK, and what evidence can you provide?' Please answer as you would in a student visa interview.",
    modelAnswer:
      "Model answer hint: Identify the source of funds (parents, self-funding from savings, scholarship, education loan), state the approximate total amount available, name the specific documentary evidence you can show, and confirm the funds have been held for the required 28-day period. Sample: 'My studies will be funded by my parents, who have saved approximately £35,000 to cover tuition and living costs. I can provide bank statements showing these funds have been held in a recognised bank account for more than 28 consecutive days, as required by the Student Visa rules. My father is a senior civil engineer and his employment letter and salary slips are also available as supporting evidence of the source of these funds.'",
    explanation:
      "Financial credibility is one of the most common reasons visas are refused. A strong answer names the source, the amount, the 28-day holding period, and the specific documents you can produce. Vague answers ('my family will support me') without amounts or evidence weaken your case. Always bring original bank statements and a clear paper trail for the source of funds.",
    timeSeconds: 100,
  },
  {
    id: "Q-VISA-004",
    examType: "VisaInterview",
    section: "Speaking",
    type: "speaking-part1",
    difficulty: "medium",
    tags: ["visa-interview", "scholarship", "fluency"],
    prompt:
      "You have been awarded a scholarship for your studies. A visa officer asks: 'Tell me about the scholarship you have received — who awarded it, what it covers, and what conditions are attached?' Please respond as you would in a visa interview.",
    modelAnswer:
      "Model answer hint: Name the awarding body precisely, state exactly what the scholarship covers (full tuition / partial tuition / living stipend / both), name the monetary value if known, and explain any conditions (maintaining a certain grade, returning home after graduation, working for a specific employer). Sample: 'I have been awarded the Chevening Scholarship, which is funded by the UK Foreign, Commonwealth and Development Office. It covers my full tuition fees, provides a monthly living stipend, and pays for my return flights to the UK. The conditions are that I maintain satisfactory academic progress and return to my home country for at least two years after completing my master's degree, which aligns with my plan to work in public health policy at home.'",
    explanation:
      "Visa officers are familiar with major scholarships (Chevening, Commonwealth, university-specific awards) but will still check that you can describe them accurately. Being unable to describe your own scholarship is a serious red flag. Be ready to name the awarding body, coverage, and any post-study return conditions.",
    timeSeconds: 90,
  },
  {
    id: "Q-VISA-005",
    examType: "VisaInterview",
    section: "Speaking",
    type: "speaking-part1",
    difficulty: "medium",
    tags: ["visa-interview", "university-choice", "fluency"],
    prompt:
      "A visa officer asks: 'Why did you choose this particular university, and how did you research your options before applying?' Please respond as you would in a UK student visa interview.",
    modelAnswer:
      "Model answer hint: Give at least one specific reason for choosing this university (course content, faculty, facilities, ranking in your subject, location, employability), then describe the research process (university website, open days, ranking tables, speaking to current students or alumni, education agent). Sample: 'I chose Aston Business School because its MBA programme has AMBA accreditation and a strong focus on placement learning, with an average starting salary for graduates that is well above the UK average. I researched it through the university's own website, attended a virtual open day in March, spoke to two alumni from my country who are now working in consulting, and cross-checked the FT global MBA ranking. I also shortlisted two other UK universities before applying, but Aston's placement year made the difference.'",
    explanation:
      "Visa officers want evidence of genuine research, not a single application sent speculatively. Naming specific accreditation bodies (AMBA, AACSB, EQUIS), virtual or physical open days attended, alumni spoken to, and ranking tables consulted all signal seriousness. Mentioning other universities you considered and rejected strengthens the answer further — it shows genuine comparison shopping rather than desperation.",
    timeSeconds: 100,
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
  // CBT expansion (Task 1-cbt) — approximate durations & question counts.
  SAT: [
    { name: "Reading & Writing (Module 1)", duration: 2040, questionCount: 27 },
    { name: "Reading & Writing (Module 2)", duration: 2040, questionCount: 27 },
    { name: "Math (Module 1)", duration: 2100, questionCount: 22 },
    { name: "Math (Module 2)", duration: 2100, questionCount: 22 },
  ],
  GRE: [
    { name: "Analytical Writing", duration: 1800, questionCount: 1 },
    { name: "Verbal Reasoning (Set 1)", duration: 1740, questionCount: 12 },
    { name: "Verbal Reasoning (Set 2)", duration: 1740, questionCount: 15 },
    { name: "Quantitative Reasoning (Set 1)", duration: 2100, questionCount: 12 },
    { name: "Quantitative Reasoning (Set 2)", duration: 2220, questionCount: 15 },
  ],
  GMAT: [
    { name: "Quantitative Reasoning", duration: 2520, questionCount: 21 },
    { name: "Verbal Reasoning", duration: 2520, questionCount: 23 },
    { name: "Data Insights", duration: 2820, questionCount: 20 },
  ],
  ACT: [
    { name: "English", duration: 2700, questionCount: 75 },
    { name: "Mathematics", duration: 3600, questionCount: 60 },
    { name: "Reading", duration: 2100, questionCount: 40 },
    { name: "Science", duration: 2100, questionCount: 40 },
    { name: "Writing (optional)", duration: 2400, questionCount: 1 },
  ],
  LSAT: [
    { name: "Logical Reasoning (Section I)", duration: 2100, questionCount: 24 },
    { name: "Logical Reasoning (Section II)", duration: 2100, questionCount: 25 },
    { name: "Reading Comprehension", duration: 2100, questionCount: 26 },
    { name: "Analytical Reasoning (variable)", duration: 2100, questionCount: 22 },
  ],
  MCAT: [
    { name: "Chemical & Physical Foundations", duration: 5700, questionCount: 59 },
    { name: "Critical Analysis & Reasoning Skills", duration: 5400, questionCount: 53 },
    { name: "Biological & Biochemical Foundations", duration: 5700, questionCount: 59 },
    { name: "Psychological, Social & Biological Foundations", duration: 5700, questionCount: 59 },
  ],
  LanguageCert: [
    { name: "Listening", duration: 1800, questionCount: 26 },
    { name: "Reading", duration: 1500, questionCount: 26 },
    { name: "Writing", duration: 1500, questionCount: 2 },
    { name: "Speaking", duration: 900, questionCount: 4 },
  ],
  Linguaskill: [
    { name: "Reading & Listening (adaptive)", duration: 4200, questionCount: 60 },
    { name: "Writing", duration: 2400, questionCount: 2 },
    { name: "Speaking", duration: 1800, questionCount: 4 },
  ],
  Placement: [
    { name: "Grammar", duration: 1200, questionCount: 30 },
    { name: "Vocabulary", duration: 1200, questionCount: 30 },
    { name: "Reading", duration: 1800, questionCount: 25 },
    { name: "Writing", duration: 1800, questionCount: 1 },
  ],
  VisaInterview: [
    { name: "Credibility Interview", duration: 600, questionCount: 5 },
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
  // CBT expansion (Task 1-cbt)
  SAT: QUESTIONS.filter((q) => q.examType === "SAT").length,
  GRE: QUESTIONS.filter((q) => q.examType === "GRE").length,
  GMAT: QUESTIONS.filter((q) => q.examType === "GMAT").length,
  ACT: QUESTIONS.filter((q) => q.examType === "ACT").length,
  LSAT: QUESTIONS.filter((q) => q.examType === "LSAT").length,
  MCAT: QUESTIONS.filter((q) => q.examType === "MCAT").length,
  LanguageCert: QUESTIONS.filter((q) => q.examType === "LanguageCert").length,
  Linguaskill: QUESTIONS.filter((q) => q.examType === "Linguaskill").length,
  Placement: QUESTIONS.filter((q) => q.examType === "Placement").length,
  VisaInterview: QUESTIONS.filter((q) => q.examType === "VisaInterview").length,
};
