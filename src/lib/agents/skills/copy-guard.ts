type UnsafeClaim = {
  ruleId: string;
  match: string;
  reason: string;
  description: string;
  index: number;
};

const RULES: Array<{ ruleId: string; pattern: RegExp; reason: string; description: string }> = [
  { ruleId: "guarantee", pattern: /\bguarantee[ds]?\b/gi, reason: "Avoid guarantee claims", description: "Don't use 'guarantee'" },
  { ruleId: "100-percent", pattern: /\b100%/gi, reason: "Avoid absolute claims", description: "Don't use '100%'" },
  { ruleId: "official", pattern: /\bofficial\b/gi, reason: "Avoid 'official' claims", description: "Don't claim to be official" },
  { ruleId: "certified", pattern: /\bcertified\b/gi, reason: "Avoid 'certified' claims", description: "Don't claim certification" },
  { ruleId: "authorized", pattern: /\bauthorized\b/gi, reason: "Avoid 'authorized' claims", description: "Don't claim authorization" },
];

export function findUnsafeClaims(text: string): UnsafeClaim[] {
  const found: UnsafeClaim[] = [];
  for (const rule of RULES) {
    const m = text.match(rule.pattern);
    if (m && m.length > 0) {
      found.push({
        ruleId: rule.ruleId,
        match: m[0],
        reason: rule.reason,
        description: rule.description,
        index: text.indexOf(m[0]),
      });
    }
  }
  return found;
}
