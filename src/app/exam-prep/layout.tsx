import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Metadata for /exam-prep.
 *
 * The page itself is a client component (it loads exam types from the API), and a
 * client component cannot export `metadata`. Without this layout the route served
 * the root layout's default title and description — the same ones as every other
 * page that had none, which is how a catalog page ends up competing with the home
 * page for its own name.
 */
export const metadata: Metadata = {
  title: "Exam Preparation Center",
  description: "Active exam types and practice-set counts from the local catalog, with official format links and a plain statement of what a practice result does not establish.",
  openGraph: {
    title: "Exam Preparation Center",
    description: "Browse active exam types and practice sets, with official format references and honest limits on what practice scoring means.",
    type: "website",
  },
};

export default function ExamPrepLayout({ children }: { children: ReactNode }) {
  return children;
}
