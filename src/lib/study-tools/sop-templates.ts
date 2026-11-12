/**
 * src/lib/study-tools/sop-templates.ts
 *
 * Guided Statement of Purpose / research-proposal section templates.
 * Reference style: Purdue OWL SOP guidance. Each section has a prompt,
 * actionable tips, a target word count, and a short concrete example.
 *
 * This is preparation guidance only — not official university admissions
 * advice. Each programme has its own requirements and word limits.
 */

export type SopSection = {
  id: string;
  order: number;
  title: string;
  prompt: string;
  tips: string[];
  wordCount: { min: number; max: number };
  example: string;
};

export const SOP_SECTIONS: SopSection[] = [
  {
    id: "intro",
    order: 1,
    title: "Introduction",
    prompt:
      "Open with a concrete hook that shows why this field matters to you — a moment, a problem, or a question — and end with a one-sentence statement of what you are applying for and why now is the right time.",
    tips: [
      "Avoid 'I have always wanted to…' — admissions tutors read hundreds of these openings.",
      "Use a specific anecdote, statistic or observation, not a sweeping claim about the field.",
      "The final sentence should name the programme and signal direction; do not list every reason here.",
      "Keep the opening under 90 words — momentum matters.",
    ],
    wordCount: { min: 80, max: 150 },
    example:
      "In the summer of 2022 I spent three weeks observing the dialysis unit at a regional hospital in Dhaka. Watching nurses improvise fluid-balance calculations on paper because the unit had no working software, I realised how much a thoughtfully-built clinical decision tool could change outcomes in resource-limited settings. I am applying to the MSc in Health Informatics at the University of Edinburgh to build the technical and research foundation needed to design such tools.",
  },
  {
    id: "academic-background",
    order: 2,
    title: "Academic Background",
    prompt:
      "Summarise the academic path that prepared you for this programme: degree(s), institutions, the modules or projects most relevant to your research interest, and the grades or outcomes that demonstrate readiness. Connect each item to the programme, not to your CV in general.",
    tips: [
      "Name 2-3 specific courses or projects — admissions tutors can tell a generic list from a chosen one.",
      "If your undergraduate degree is in a different field, explain the bridge explicitly.",
      "Include a quantitative anchor (grade, percentile, project output) where honest.",
      "Do not list every module you took. Select for relevance, not completeness.",
    ],
    wordCount: { min: 120, max: 200 },
    example:
      "I completed my BSc in Computer Science at BRAC University in 2023 with a CGPA of 3.78/4.00. The two most formative modules were Database Systems, in which I designed a schema for tracking medication adherence, and Human-Computer Interaction, where my group project prototyped a low-bandwidth nurse interface. My final-year project, supervised by Dr Rahman, evaluated FHIR-based data exchange between two rural clinics; the resulting paper was accepted at the Bangladesh Health Informatics Conference 2023.",
  },
  {
    id: "research-interests",
    order: 3,
    title: "Research Interests",
    prompt:
      "State the specific research question or area you want to explore. Be concrete: a problem, not a topic. Reference current literature briefly to show you have read it, and explain why this question matters.",
    tips: [
      "Replace broad areas ('AI in healthcare') with a question ('Can lightweight NLP triage models run effectively on edge devices in low-bandwidth clinics?').",
      "Cite 2-3 recent papers or working group reports to demonstrate engagement, not just interest.",
      "Explain WHY this question matters — clinical, economic, or ethical stakes.",
      "Avoid claiming you will solve the entire problem in one degree. Frame as 'a contribution to'.",
    ],
    wordCount: { min: 150, max: 250 },
    example:
      "I am interested in whether lightweight transformer-based triage models can run effectively on edge devices in clinics with intermittent connectivity. Recent work by Wang et al. (2023) showed that distilled models retain 92% of full-model accuracy on chest-X-ray triage when compressed to under 50MB, but their evaluation assumed stable connectivity. In the clinics I observed in Bangladesh, connectivity drops for hours at a time, so the open question is whether local caching plus periodic fine-tuning can preserve that accuracy. I want to contribute empirical evidence on this question, not to solve the broader problem of AI in healthcare.",
  },
  {
    id: "why-university",
    order: 4,
    title: "Why This University",
    prompt:
      "Explain why THIS programme and THIS institution are the right fit. Name specific faculty, labs, courses, or resources — and connect each to your research interest. Avoid generic praise of the campus or the city.",
    tips: [
      "Name 1-2 faculty members whose work directly relates to your question. Show you have read them.",
      "Reference a specific lab, centre, or industry partnership that gives you access you cannot get elsewhere.",
      "If there is a particular course or stream, say what you expect to take from it.",
      "Avoid 'prestigious', 'world-class', 'renowned' — admissions tutors know their own reputation; they want to see fit.",
    ],
    wordCount: { min: 120, max: 200 },
    example:
      "Edinburgh's Usher Institute, and specifically the work of Professor Sana Majeed on clinical decision support in low-resource settings, maps directly onto my proposed research question; her 2022 paper on intermittent-connectivity EHR systems in Malawi is the closest precedent I have found to the work I hope to do. I also intend to take the Health Data Science and Machine Learning for Healthcare modules, which together would give me the methodological depth I currently lack. The institute's partnership with NHS Lothian offers access to a clinical environment where I can validate designs.",
  },
  {
    id: "career-goals",
    order: 5,
    title: "Career Goals",
    prompt:
      "State what you intend to do after the programme, in both the short term (next 1-3 years) and the longer term. Be specific about roles, sectors, or further study. Connect the goals to the research interest, not to a generic ambition.",
    tips: [
      "Short-term goal: a specific role, project, or further qualification.",
      "Long-term goal: the contribution you hope to make over a career, scoped honestly.",
      "If you intend to return to your home country, say so and explain what you will do there.",
      "Avoid 'I want to make the world a better place' — replace with a concrete contribution.",
    ],
    wordCount: { min: 100, max: 180 },
    example:
      "Immediately after the MSc I intend to return to Bangladesh and join a digital-health NGO or a university research group working on clinical tooling, with the goal of leading the development of a working edge-deployed triage prototype within two years. Over the longer term I hope to apply for a PhD continuing this line of work, and ultimately to lead a small applied-research group focused on clinical AI for low-connectivity settings in South Asia.",
  },
  {
    id: "conclusion",
    order: 6,
    title: "Conclusion",
    prompt:
      "Close with a confident, brief restatement of fit: the question you want to pursue, why this programme is the right place, and your readiness to contribute. Do not introduce new material.",
    tips: [
      "Two to three sentences is plenty — most SOP conclusions are too long.",
      "Restate direction with slightly different wording from the introduction.",
      "Close on contribution, not on what you will receive.",
      "Do not thank the reader or use 'I hope you will consider me'.",
    ],
    wordCount: { min: 60, max: 120 },
    example:
      "The combination of the Usher Institute's clinical-AI focus, the Health Data Science stream, and access to NHS Lothian gives me the environment I need to move from observing problems in under-resourced clinics to producing tested tools for them. I am ready to make this contribution, and I would welcome the chance to do so at Edinburgh.",
  },
];

/** Build the canonical draft object from a record of section-id -> text. */
export function buildSopDraftText(sections: Record<string, string>): string {
  return SOP_SECTIONS.map((section) => {
    const body = (sections[section.id] ?? "").trim();
    const header = `${section.order}. ${section.title}`;
    if (!body) return header;
    return `${header}\n\n${body}`;
  }).join("\n\n");
}

/** Word count for a given string (collapses whitespace, splits on spaces). */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
