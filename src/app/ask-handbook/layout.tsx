import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Metadata for /ask-handbook.
 *
 * Same reason as /exam-prep: the page is a client component, so the metadata
 * lives here rather than in the page module.
 */
export const metadata: Metadata = {
  title: "Study Handbook",
  description: "Ask about study-abroad planning and English-test preparation and read sourced answers, with the limits of each answer stated rather than implied.",
  openGraph: {
    title: "Study Handbook",
    description: "Sourced answers to study-abroad and English-test questions, with the limits of each answer stated.",
    type: "website",
  },
};

export default function AskHandbookLayout({ children }: { children: ReactNode }) {
  return children;
}
