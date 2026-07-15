"use client";

import { useState } from "react";

/**
 * Small client-side copy-to-clipboard button used by the ambassador
 * dashboard. Kept as a separate client component so the parent dashboard
 * can stay a server component.
 */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (e.g. insecure context). Silently fail.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg bg-alo-orange px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
