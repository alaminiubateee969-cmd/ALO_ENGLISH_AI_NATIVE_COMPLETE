export const MARKETING_CONTENT_TYPES = [
  { id: "Facebook Post", label: "Facebook post", charLimit: 5000 },
  { id: "Instagram Caption", label: "Instagram caption", charLimit: 2200 },
  { id: "LinkedIn Post", label: "LinkedIn post", charLimit: 3000 },
  { id: "X Post", label: "X post", charLimit: 280 },
  { id: "Blog Article", label: "Blog article", charLimit: 5000 },
  { id: "Email Newsletter", label: "Email newsletter", charLimit: 5000 },
  { id: "Landing Page", label: "Landing page", charLimit: 5000 },
  { id: "Product Description", label: "Service description", charLimit: 1500 },
  { id: "Press Release", label: "Press release", charLimit: 5000 },
] as const;

export type MarketingContentType = (typeof MARKETING_CONTENT_TYPES)[number]["id"];

export const DEFAULT_MARKETING_FACTS =
  "Practice-set availability and coverage vary by exam and are shown in the active catalog. Any scores or automated feedback are study aids, not official exam results.";

export type MarketingBrief = {
  type: MarketingContentType;
  offer: string;
  audience: string;
  facts: string;
  tone: string;
  callToAction: string;
  url?: string;
};

function clean(value: string, fallback: string): string {
  const normalized = value.trim().replace(/[ \t]+/g, " ");
  return normalized || fallback;
}

function bullets(facts: string): string {
  const items = facts
    .split(/[\n;]+/)
    .map((item) => item.trim().replace(/^[-*•\s]+/, ""))
    .filter(Boolean);
  return items.length ? items.map((item) => `• ${item}`).join("\n") : `• ${DEFAULT_MARKETING_FACTS}`;
}

function ctaLine(callToAction: string, url: string): string {
  return url ? `${callToAction}: ${url}` : callToAction;
}

function sentenceFriendlyAudience(value: string): string {
  const firstWord = value.match(/^[A-Za-z]+/)?.[0] ?? "";
  if (firstWord.length > 1 && firstWord === firstWord.toUpperCase()) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

/**
 * Produce a transparent, template-based first draft. This deliberately does not
 * claim to call an AI model and never invents outcomes, testimonials, prices,
 * audience sizes, or performance statistics.
 */
export function generateMarketingDraft(brief: MarketingBrief): string {
  const offer = clean(brief.offer, "ALO English practice");
  const audience = sentenceFriendlyAudience(clean(brief.audience, "people preparing for an English test"));
  const facts = bullets(brief.facts);
  const tone = clean(brief.tone, "clear and encouraging");
  const callToAction = clean(brief.callToAction, "Explore practice tests");
  const url = brief.url?.trim() ?? "";
  const cta = ctaLine(callToAction, url);

  switch (brief.type) {
    case "Facebook Post":
      return `Preparing for an English test?\n\n${offer} is here to support ${audience} with a ${tone} way to prepare.\n\n${facts}\n\n${cta}\n\n#ALOEnglish #EnglishTestPrep`;
    case "Instagram Caption":
      return `Your next practice session starts here 📚\n\n${offer} helps ${audience} explore preparation resources at their own pace.\n\n${facts.replaceAll("• ", "")}\n\n${cta}\n\n#ALOEnglish #EnglishTestPrep #EnglishPractice`;
    case "LinkedIn Post":
      return `For ${audience}, consistent practice matters.\n\n${offer} can help you explore the preparation resources currently available and choose a clear next step.\n\nWhat we can confirm:\n${facts}\n\n${cta}\n\n#Education #EnglishLearning #ALOEnglish`;
    case "X Post":
      return `${offer}: explore English-test preparation and current practice options. Any estimates are for study, not official results. ${cta}`;
    case "Blog Article":
      return `# A practical way to plan English-test practice\n\nPreparing for an English test can feel more manageable when practice is organised around a clear goal. This guide is for ${audience}.\n\n## Start with the test you need\nChoose the exam that matches your application requirements, then practise the skills and question formats used by that test.\n\n## Build a steady routine\nSet a realistic study schedule, review your answers, and note the areas you want to practise next. Use feedback as a guide for study—not as a promise of an official result.\n\n## What ${offer} provides\n${facts}\n\n## Take the next step\n${cta}\n\n*Always check the official test provider for current test formats, policies and score requirements.*`;
    case "Email Newsletter":
      return `Subject: A simple next step for your English-test practice\n\nHello,\n\nIf you are ${audience}, a clear practice plan can help you decide what to work on next.\n\n${offer}\n\n${facts}\n\n${cta}\n\nPractice feedback is for preparation and should not be treated as an official test result.\n\nALO Education`;
    case "Landing Page":
      return `# Prepare with a clear plan\n\n## ${offer}\n\nA practice space for ${audience}.\n\n### What to expect\n${facts}\n\n### Start practising\n${cta}\n\nPractice scores are estimates for study purposes only. They are not official exam results.`;
    case "Product Description":
      return `${offer}\n\nA practice resource for ${audience}.\n\n${facts}\n\n${cta}\n\nPractice estimates are not official exam results.`;
    case "Press Release":
      return `FOR REVIEW — add approved facts and contact details before publishing\n\n# ${offer}\n\n[Add approved publication date] — ALO Education is sharing information about ${offer}, a practice resource for ${audience}.\n\n## Confirmed details\n${facts}\n\n"[Insert an approved spokesperson quote]" — [Name and role, after approval]\n\nFor more information: [Add approved contact details]\n\n${cta}\n\nEditorial note: verify every statement, date, name and contact detail before release. Practice scores are estimates, not official results.`;
  }
}
