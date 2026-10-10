import { describe, expect, test } from "bun:test";
import { generateMarketingDraft, DEFAULT_MARKETING_FACTS } from "@/lib/marketing-content";
import { buildMarketingKitAsset, AMBASSADOR_MARKETING_ASSETS } from "@/lib/marketing-kit";
import { buildReferralUrl, normalizeReferralCode } from "@/lib/referral-code";

describe("Partner referral codes", () => {
  test("normalizes codes and rejects unsafe values", () => {
    expect(normalizeReferralCode("  alo-ab12cd34  ")).toBe("ALO-AB12CD34");
    expect(normalizeReferralCode("<img src=x>" )).toBeNull();
    expect(normalizeReferralCode(" ")).toBeNull();
  });

  test("builds a registration link on the supplied app origin", () => {
    expect(buildReferralUrl("https://english.example.test", "alo-ab12cd34"))
      .toBe("https://english.example.test/register?ref=ALO-AB12CD34");
    expect(() => buildReferralUrl("javascript:alert(1)", "ALO-AB12CD34")).toThrow();
  });
});

describe("Ambassador marketing assets", () => {
  test("every listed kit item creates a real downloadable file", () => {
    for (const item of AMBASSADOR_MARKETING_ASSETS) {
      const file = buildMarketingKitAsset(item.id, "https://english.example.test", "ALO-AB12CD34");
      expect(file.filename.length).toBeGreaterThan(5);
      expect(file.content.length).toBeGreaterThan(100);
      expect(file.content).toContain("ALO-AB12CD34");
      expect(file.content).toContain("https://english.example.test/register?ref=ALO-AB12CD34");
    }
  });

  test("SVG artwork is validly escaped and carries its own accessible title", () => {
    const file = buildMarketingKitAsset("social-square", "https://english.example.test", "ALO-AB12CD34");
    expect(file.mimeType).toContain("image/svg+xml");
    expect(file.content.startsWith("<svg ")).toBe(true);
    expect(file.content).toContain("<title id=\"title\">ALO English square social graphic</title>");
    expect(file.content).toContain("?ref=ALO-AB12CD34");
    expect(() => buildMarketingKitAsset("poster", "https://english.example.test", "<script>" )).toThrow();
  });

  test("caption pack is bilingual and includes safe-claims guidance", () => {
    const file = buildMarketingKitAsset("caption-pack", "https://english.example.test", "ALO-AB12CD34");
    expect(file.content).toContain("বাংলা");
    expect(file.content).toContain("Do not promise admissions");
    expect(file.content).toContain("Practice scores are estimates");
  });
});

describe("Grounded marketing drafts", () => {
  test("drafts use supplied facts without making up outcome statistics", () => {
    const content = generateMarketingDraft({
      type: "LinkedIn Post",
      offer: "ALO English",
      audience: "IELTS candidates",
      facts: DEFAULT_MARKETING_FACTS,
      tone: "practical and supportive",
      callToAction: "Try a practice test",
      url: "https://english.example.test/practice-test",
    });
    expect(content).toContain("IELTS candidates");
    expect(content).toContain("Try a practice test");
    expect(content).toContain("not official exam results");
    expect(content).not.toMatch(/\b\d+%\b/);
    expect(content).not.toContain("beta results");
  });

  test("press-release templates mark unknown details for approval", () => {
    const content = generateMarketingDraft({
      type: "Press Release",
      offer: "ALO English",
      audience: "students",
      facts: DEFAULT_MARKETING_FACTS,
      tone: "clear",
      callToAction: "Learn more",
    });
    expect(content).toContain("FOR REVIEW");
    expect(content).toContain("[Add approved publication date]");
    expect(content).toContain("[Insert an approved spokesperson quote]");
    expect(content).not.toContain("CEO Name");
  });
});
