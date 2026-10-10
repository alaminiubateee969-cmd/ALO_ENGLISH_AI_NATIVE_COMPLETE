import { buildReferralUrl, normalizeReferralCode } from "./referral-code";

export const AMBASSADOR_MARKETING_ASSETS = [
  { id: "poster", title: "A4 practice poster", description: "Print-ready SVG with your referral link.", format: "SVG · A4" },
  { id: "social-square", title: "Social post graphic", description: "Square branded artwork for a social post.", format: "SVG · 1080 × 1080" },
  { id: "story", title: "Story graphic", description: "Vertical artwork sized for a story placement.", format: "SVG · 1080 × 1920" },
  { id: "caption-pack", title: "Caption pack", description: "English and Bangla copy with your tracked link.", format: "Markdown · 5 captions" },
  { id: "whatsapp", title: "WhatsApp message", description: "Copy-ready English and Bangla referral messages.", format: "Text" },
  { id: "referral-card", title: "Referral link card", description: "Shareable landscape card showing your code.", format: "SVG · 1200 × 630" },
  { id: "brand-guide", title: "Brand quick guide", description: "ALO colours, voice, and safe-claims checklist.", format: "Markdown" },
] as const;

export type MarketingAssetId = (typeof AMBASSADOR_MARKETING_ASSETS)[number]["id"];

export type MarketingAssetDownload = {
  filename: string;
  mimeType: string;
  content: string;
};

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[char];
  });
}

function svgDocument(width: number, height: number, title: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">${escapeXml(title)}</title>
<desc id="desc">ALO English practice promotion. Practice scores are estimates, not official exam results.</desc>
${body}
</svg>`;
}

function getLink(origin: string, referralCode: string): string {
  return buildReferralUrl(origin, referralCode);
}

function posterSvg(url: string, code: string): string {
  return svgDocument(794, 1123, "ALO English A4 practice poster", `
<rect width="794" height="1123" fill="#0B1F3A"/>
<circle cx="710" cy="105" r="200" fill="#0057B8" opacity="0.35"/>
<circle cx="80" cy="1010" r="230" fill="#E8501A" opacity="0.18"/>
<rect x="62" y="66" width="82" height="82" rx="20" fill="#E8501A"/>
<text x="103" y="119" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="28" font-weight="700">ALO</text>
<text x="165" y="105" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="25" font-weight="700">ALO ENGLISH</text>
<text x="165" y="132" fill="#D6E5F6" font-family="Arial, sans-serif" font-size="14" letter-spacing="2">PRACTICE WITH PURPOSE</text>
<text x="62" y="310" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="60" font-weight="700">Your next step</text>
<text x="62" y="382" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="60" font-weight="700">starts with</text>
<text x="62" y="454" fill="#F47745" font-family="Arial, sans-serif" font-size="60" font-weight="700">practice.</text>
<text x="64" y="520" fill="#D6E5F6" font-family="Arial, sans-serif" font-size="24">IELTS · PTE · TOEFL · Duolingo English Test</text>
<rect x="62" y="584" width="670" height="186" rx="24" fill="#FFFFFF"/>
<text x="96" y="643" fill="#0B1F3A" font-family="Arial, sans-serif" font-size="25" font-weight="700">Practise with original exam-aligned questions</text>
<text x="96" y="691" fill="#43546A" font-family="Arial, sans-serif" font-size="19">Review your work and plan what to practise next.</text>
<text x="96" y="731" fill="#43546A" font-family="Arial, sans-serif" font-size="17">Scores are practice estimates, not official results.</text>
<text x="62" y="855" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="18" font-weight="700">YOUR REFERRAL CODE</text>
<text x="62" y="903" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="33" font-weight="700" letter-spacing="2">${escapeXml(code)}</text>
<text x="62" y="956" fill="#D6E5F6" font-family="Arial, sans-serif" font-size="15">${escapeXml(url)}</text>
<rect x="62" y="1001" width="670" height="2" fill="#FFFFFF" opacity="0.3"/>
<text x="62" y="1047" fill="#D6E5F6" font-family="Arial, sans-serif" font-size="14">ALO Education · Original practice for exam preparation</text>`);
}

function socialSvg(url: string, code: string): string {
  return svgDocument(1080, 1080, "ALO English square social graphic", `
<rect width="1080" height="1080" fill="#EEF6FF"/>
<path d="M0 0h1080v310c-184 72-348 80-540 45C340 318 165 330 0 404z" fill="#0B1F3A"/>
<circle cx="970" cy="97" r="185" fill="#E8501A"/>
<rect x="78" y="78" width="72" height="72" rx="18" fill="#E8501A"/>
<text x="114" y="126" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="24" font-weight="700">ALO</text>
<text x="174" y="110" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="26" font-weight="700">ALO ENGLISH</text>
<text x="78" y="490" fill="#0B1F3A" font-family="Arial, sans-serif" font-size="69" font-weight="700">Make your</text>
<text x="78" y="574" fill="#0B1F3A" font-family="Arial, sans-serif" font-size="69" font-weight="700">practice count.</text>
<text x="82" y="647" fill="#0057B8" font-family="Arial, sans-serif" font-size="25">IELTS · PTE · TOEFL · Duolingo</text>
<text x="82" y="710" fill="#43546A" font-family="Arial, sans-serif" font-size="21">Original questions. Useful feedback.</text>
<text x="82" y="749" fill="#43546A" font-family="Arial, sans-serif" font-size="18">Practice estimates are not official scores.</text>
<rect x="78" y="824" width="924" height="164" rx="24" fill="#FFFFFF" stroke="#D9E8FF" stroke-width="2"/>
<text x="112" y="875" fill="#6B7280" font-family="Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="1">PRACTISE WITH MY REFERRAL</text>
<text x="112" y="927" fill="#0B1F3A" font-family="Arial, sans-serif" font-size="24" font-weight="700">${escapeXml(code)}</text>
<text x="112" y="962" fill="#0057B8" font-family="Arial, sans-serif" font-size="17">${escapeXml(url)}</text>`);
}

function storySvg(url: string, code: string): string {
  return svgDocument(1080, 1920, "ALO English vertical story graphic", `
<rect width="1080" height="1920" fill="#0B1F3A"/>
<circle cx="1000" cy="180" r="310" fill="#0057B8" opacity="0.65"/>
<circle cx="38" cy="1590" r="350" fill="#E8501A" opacity="0.24"/>
<rect x="84" y="112" width="82" height="82" rx="20" fill="#E8501A"/>
<text x="125" y="165" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="27" font-weight="700">ALO</text>
<text x="190" y="146" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="28" font-weight="700">ALO ENGLISH</text>
<text x="84" y="535" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="84" font-weight="700">A little practice</text>
<text x="84" y="642" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="84" font-weight="700">goes a long way.</text>
<rect x="84" y="742" width="912" height="350" rx="32" fill="#FFFFFF"/>
<text x="132" y="823" fill="#0057B8" font-family="Arial, sans-serif" font-size="23" font-weight="700">PRACTISE FOR</text>
<text x="132" y="897" fill="#0B1F3A" font-family="Arial, sans-serif" font-size="35" font-weight="700">IELTS · PTE · TOEFL</text>
<text x="132" y="952" fill="#0B1F3A" font-family="Arial, sans-serif" font-size="35" font-weight="700">Duolingo English Test</text>
<text x="132" y="1031" fill="#43546A" font-family="Arial, sans-serif" font-size="20">Original exam-aligned practice questions.</text>
<text x="84" y="1212" fill="#F47745" font-family="Arial, sans-serif" font-size="25" font-weight="700">YOUR REFERRAL CODE</text>
<text x="84" y="1285" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="48" font-weight="700" letter-spacing="3">${escapeXml(code)}</text>
<text x="84" y="1362" fill="#D6E5F6" font-family="Arial, sans-serif" font-size="20">${escapeXml(url)}</text>
<rect x="84" y="1464" width="912" height="108" rx="24" fill="#E8501A"/>
<text x="540" y="1531" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="26" font-weight="700">Start practising</text>
<text x="84" y="1654" fill="#D6E5F6" font-family="Arial, sans-serif" font-size="20">Practice scores are estimates, not official results.</text>
<text x="84" y="1740" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="16" opacity="0.75">ALO Education · Your Dream — Our Commitment</text>`);
}

function referralCardSvg(url: string, code: string): string {
  return svgDocument(1200, 630, "ALO English referral card", `
<rect width="1200" height="630" rx="0" fill="#0B1F3A"/>
<circle cx="1120" cy="50" r="225" fill="#0057B8" opacity="0.7"/>
<circle cx="25" cy="640" r="210" fill="#E8501A" opacity="0.8"/>
<rect x="68" y="62" width="68" height="68" rx="17" fill="#E8501A"/>
<text x="102" y="107" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="23" font-weight="700">ALO</text>
<text x="158" y="101" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="24" font-weight="700">ALO ENGLISH</text>
<text x="68" y="246" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="50" font-weight="700">Practise for your next step.</text>
<text x="70" y="302" fill="#D6E5F6" font-family="Arial, sans-serif" font-size="22">IELTS · PTE · TOEFL · Duolingo English Test</text>
<rect x="68" y="372" width="1064" height="172" rx="24" fill="#FFFFFF"/>
<text x="104" y="421" fill="#6B7280" font-family="Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="1">SHARE THIS REFERRAL</text>
<text x="104" y="473" fill="#0B1F3A" font-family="Arial, sans-serif" font-size="25" font-weight="700">Code: ${escapeXml(code)}</text>
<text x="104" y="515" fill="#0057B8" font-family="Arial, sans-serif" font-size="17">${escapeXml(url)}</text>
<text x="70" y="590" fill="#D6E5F6" font-family="Arial, sans-serif" font-size="14">Practice scores are estimates, not official exam results.</text>`);
}

function captionPack(url: string, code: string): string {
  return `# ALO English ambassador caption pack\n\nReferral code: ${code}\nTracked link: ${url}\n\n## English — short\nPreparing for IELTS, PTE, TOEFL or Duolingo? Try original exam-aligned practice with ALO English. Practice scores are estimates, not official results. Start here: ${url}\n\n## English — community post\nA steady practice routine can help you see what to work on next. ALO English offers original practice questions for IELTS, PTE, TOEFL and Duolingo English Test. Share your next step: ${url}\n\n## English — story\nYour next step starts with practice. IELTS · PTE · TOEFL · Duolingo. Use my ALO English link: ${url}\n\n## বাংলা — সংক্ষিপ্ত\nIELTS, PTE, TOEFL বা Duolingo পরীক্ষার প্রস্তুতি নিচ্ছেন? ALO English-এ অনুশীলনের জন্য রয়েছে original exam-aligned practice questions। Practice score অফিসিয়াল পরীক্ষার ফল নয়। শুরু করুন: ${url}\n\n## বাংলা — কমিউনিটি পোস্ট\nনিয়মিত অনুশীলন আপনাকে পরবর্তী প্রস্তুতির ধাপ ঠিক করতে সাহায্য করতে পারে। IELTS, PTE, TOEFL ও Duolingo English Test-এর practice resources দেখতে আমার ALO English referral link ব্যবহার করুন: ${url}\n\n## Before publishing\n- Keep the referral link intact so visits are attributed.\n- Do not promise admissions, visas, scholarships, official scores or guaranteed outcomes.\n- Only add prices, dates, performance claims or testimonials after ALO approves them.\n`;
}

function whatsappText(url: string, code: string): string {
  return `ALO English practice\n\nPreparing for IELTS, PTE, TOEFL or Duolingo? Explore original exam-aligned practice questions and plan what to practise next. Practice scores are estimates, not official results.\n\nMy referral code: ${code}\nStart here: ${url}\n\n--- বাংলা ---\nIELTS, PTE, TOEFL বা Duolingo পরীক্ষার প্রস্তুতি নিচ্ছেন? ALO English-এ original exam-aligned practice questions দিয়ে অনুশীলন করুন। Practice score অফিসিয়াল পরীক্ষার ফল নয়।\n\nআমার referral code: ${code}\nলিংক: ${url}\n`;
}

function brandGuide(referralCode: string, referralUrl: string): string {
  return `# ALO English — ambassador brand quick guide\n\n## Your referral\n- Code: \`${referralCode}\`\n- Tracked link: ${referralUrl}\n\n## Brand colours\n- Navy: \`#0B1F3A\`\n- Blue: \`#0057B8\`\n- Orange: \`#E8501A\`\n- Soft blue: \`#EEF6FF\`\n\n## Voice\nHelpful, specific, calm and encouraging. Explain the next action clearly. Prefer "practise" and "prepare" over promises.\n\n## Safe claims\n- Describe the platform as an exam-preparation resource.\n- Practice scores and automated feedback are estimates; they are not official results.\n- Use only approved prices, dates, outcome statistics and testimonials.\n- Do not imply affiliation with IELTS, Pearson, TOEFL or Duolingo English Test.\n- Do not promise admission, a visa, a scholarship or a particular exam score.\n\n## Asset notes\nThe included graphics are editable SVG files. They use ALO brand colours and original copy, and can be opened in a browser or design editor.\n`;
}

export function buildMarketingKitAsset(
  id: MarketingAssetId,
  origin: string,
  rawReferralCode: unknown,
): MarketingAssetDownload {
  const referralCode = normalizeReferralCode(rawReferralCode);
  if (!referralCode) throw new Error("A valid referral code is required to make this asset");
  const referralUrl = getLink(origin, referralCode);
  const safeSlug = referralCode.toLowerCase();

  switch (id) {
    case "poster":
      return { filename: `alo-english-a4-poster-${safeSlug}.svg`, mimeType: "image/svg+xml;charset=utf-8", content: posterSvg(referralUrl, referralCode) };
    case "social-square":
      return { filename: `alo-english-social-post-${safeSlug}.svg`, mimeType: "image/svg+xml;charset=utf-8", content: socialSvg(referralUrl, referralCode) };
    case "story":
      return { filename: `alo-english-story-${safeSlug}.svg`, mimeType: "image/svg+xml;charset=utf-8", content: storySvg(referralUrl, referralCode) };
    case "caption-pack":
      return { filename: `alo-english-captions-${safeSlug}.md`, mimeType: "text/markdown;charset=utf-8", content: captionPack(referralUrl, referralCode) };
    case "whatsapp":
      return { filename: `alo-english-whatsapp-${safeSlug}.txt`, mimeType: "text/plain;charset=utf-8", content: whatsappText(referralUrl, referralCode) };
    case "referral-card":
      return { filename: `alo-english-referral-card-${safeSlug}.svg`, mimeType: "image/svg+xml;charset=utf-8", content: referralCardSvg(referralUrl, referralCode) };
    case "brand-guide":
      return { filename: "alo-english-ambassador-brand-guide.md", mimeType: "text/markdown;charset=utf-8", content: brandGuide(referralCode, referralUrl) };
  }
}
