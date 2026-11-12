export function findUnsafeClaims(text: string): string[] {
  const unsafe = [
    /\bguarantee\b/gi, /\b100%/gi, /\bofficial\b/gi,
    /\bcertified\b/gi, /\bauthorized\b/gi,
  ];
  const found: string[] = [];
  for (const pattern of unsafe) {
    const matches = text.match(pattern);
    if (matches) found.push(...matches);
  }
  return found;
}
