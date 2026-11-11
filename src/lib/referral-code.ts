/**
 * Referral codes are public attribution identifiers, never authentication tokens.
 * Normalize once at every trust boundary so links and database lookups agree.
 */

const REFERRAL_CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{2,63}$/;

export function normalizeReferralCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  if (!normalized || !REFERRAL_CODE_PATTERN.test(normalized)) return null;
  return normalized;
}

export function buildReferralUrl(origin: string, referralCode: unknown): string {
  const code = normalizeReferralCode(referralCode);
  if (!code) throw new Error("A valid referral code is required");

  const base = new URL(origin);
  if (base.protocol !== "http:" && base.protocol !== "https:") {
    throw new Error("Referral URLs must use HTTP or HTTPS");
  }

  base.pathname = "/register";
  base.search = "";
  base.hash = "";
  base.searchParams.set("ref", code);
  return base.toString();
}
