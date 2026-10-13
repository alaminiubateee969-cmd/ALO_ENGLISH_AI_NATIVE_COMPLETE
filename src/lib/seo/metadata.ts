/**
 * src/lib/seo/metadata.ts
 *
 * What each public page is meant to be found for, in one table.
 *
 * WHY THIS MIRRORS THE PAGES RATHER THAN DRIVING THEM
 * ──────────────────────────────────────────────────
 * Next.js resolves page metadata where the page lives — a `metadata` export in a
 * server page, or in a route `layout.tsx` when the page is a client component.
 * Moving the titles here and importing them into each page would centralise the
 * strings but hide them from the file a writer actually opens, and the usual
 * result is a page whose visible heading and whose metadata have nothing to do
 * with each other.
 *
 * So this table is a *copy* of the truth, and `tests/seo-metadata.test.ts` reads
 * the page and layout files and fails when a title or description here stops
 * matching the one being served. The audit reads this table; the test keeps it
 * honest.
 *
 * The two client pages (/exam-prep, /ask-handbook) get their metadata from a route
 * layout instead of the page module — a client component cannot export metadata,
 * and before those layouts existed both routes served the root layout's default
 * title, which is the same defect as having no title at all.
 */

import type { SeoPageInput } from './audit';

export type SeoPageMetadata = SeoPageInput & {
  /** Where the served metadata comes from, so a reader knows which file to edit. */
  declaredIn: 'PAGE' | 'LAYOUT';
};

export const SEO_PAGE_METADATA: readonly SeoPageMetadata[] = [
  {
    path: '/',
    title: 'ALO English — English Test Practice & Study-Abroad Guidance',
    description:
      'Explore English-test practice, skill-focused preparation and study-abroad guidance from ALO Education. Check the active practice catalog.',
    primaryKeyword: 'English test practice',
    supportingKeywords: ['study abroad guidance', 'IELTS practice', 'PTE practice'],
    hasOpenGraph: true,
    declaredIn: 'PAGE',
  },
  {
    path: '/exam-prep',
    title: 'Exam Preparation Center',
    description:
      'Active exam types and practice-set counts from the local catalog, with official format links and a plain statement of what a practice result does not establish.',
    primaryKeyword: 'exam preparation',
    supportingKeywords: ['practice sets', 'exam catalog'],
    hasOpenGraph: true,
    declaredIn: 'LAYOUT',
  },
  {
    path: '/language-prep',
    title: 'English Test Preparation',
    description:
      'Explore IELTS, PTE, TOEFL iBT and Duolingo English Test preparation resources with clear limits on practice availability and scoring.',
    primaryKeyword: 'IELTS PTE TOEFL preparation',
    supportingKeywords: ['English test preparation', 'writing practice'],
    declaredIn: 'PAGE',
  },
  {
    path: '/resources',
    title: 'Study and Test Preparation Resources',
    description: 'Browse ALO English practice, test-provider references, and study-abroad planning resources.',
    primaryKeyword: 'study and test preparation resources',
    supportingKeywords: ['practice roadmap', 'study resources'],
    hasOpenGraph: true,
    declaredIn: 'PAGE',
  },
  {
    path: '/destinations',
    title: 'Study Destinations',
    description: 'Explore destinations and find links to official government study or student-visa guidance.',
    primaryKeyword: 'study destinations',
    supportingKeywords: ['student visa guidance', 'country guides'],
    declaredIn: 'PAGE',
  },
  {
    path: '/universities',
    title: 'University Research',
    description: 'A checklist for comparing institutions and verifying course information with official sources.',
    primaryKeyword: 'university research',
    supportingKeywords: ['course verification', 'institution checklist'],
    declaredIn: 'PAGE',
  },
  {
    path: '/scholarships',
    title: 'Scholarship Research',
    description: 'A practical checklist for verifying international scholarships and funding opportunities.',
    primaryKeyword: 'scholarship research',
    supportingKeywords: ['funding opportunities', 'international scholarships'],
    declaredIn: 'PAGE',
  },
  {
    path: '/course-finder',
    title: 'Course Finder',
    description: 'Explore course-planning options and prepare a study-abroad consultation request.',
    primaryKeyword: 'course finder',
    supportingKeywords: ['course planning', 'consultation request'],
    declaredIn: 'PAGE',
  },
  {
    path: '/services',
    title: 'Study Planning Services',
    description: 'Explore study-abroad planning topics and English-test practice available from ALO Education.',
    primaryKeyword: 'study planning services',
    supportingKeywords: ['counselling', 'test preparation services'],
    declaredIn: 'PAGE',
  },
  {
    path: '/ask-handbook',
    title: 'Study Handbook',
    description:
      'Ask about study-abroad planning and English-test preparation and read sourced answers, with the limits of each answer stated rather than implied.',
    primaryKeyword: 'study handbook',
    supportingKeywords: ['study abroad questions', 'sourced answers'],
    hasOpenGraph: true,
    declaredIn: 'LAYOUT',
  },
  {
    path: '/events',
    title: 'Events and Information Sessions',
    description:
      'University fairs, webinars and information sessions from ALO Education, with what each event covers and how to reserve a place.',
    primaryKeyword: 'university events',
    supportingKeywords: ['information sessions', 'webinars'],
    declaredIn: 'PAGE',
  },
  {
    path: '/book-consultation',
    title: 'Book a Study-Abroad Consultation',
    description:
      'Request a consultation about destinations, courses, budgets or English-test preparation. A counsellor replies during office hours.',
    primaryKeyword: 'book a consultation',
    supportingKeywords: ['study abroad consultation', 'counsellor appointment'],
    declaredIn: 'PAGE',
  },
  {
    path: '/contact',
    title: 'Contact ALO Education',
    description: 'Send ALO Education a question about English-test preparation or study-abroad planning.',
    primaryKeyword: 'contact ALO Education',
    supportingKeywords: ['office address', 'support contact'],
    declaredIn: 'PAGE',
  },
  {
    path: '/portals',
    title: 'Student, Partner & Staff Portals',
    description:
      'Sign in to the ALO Education student, partner, employee or administrator portal to reach your applications, students or CRM workspace.',
    primaryKeyword: 'student portal login',
    supportingKeywords: ['partner portal', 'employee portal'],
    declaredIn: 'PAGE',
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy',
    description:
      'How ALO Education collects, uses and keeps personal information, what we never do with it, and how to ask us to correct or remove it.',
    primaryKeyword: 'privacy policy',
    supportingKeywords: ['data protection', 'personal information'],
    declaredIn: 'PAGE',
  },
  {
    path: '/terms',
    title: 'Terms of Service',
    description:
      'The terms that apply when you use ALO Education practice material, guidance and portals, including what practice results do and do not establish.',
    primaryKeyword: 'terms of service',
    supportingKeywords: ['acceptable use', 'practice result limits'],
    declaredIn: 'PAGE',
  },
  {
    path: '/cookie-policy',
    title: 'Cookie Policy',
    description:
      'Which cookies this site sets, what each one is for, and how the built-in analytics counts visits without storing any identifier for a visitor.',
    primaryKeyword: 'cookie policy',
    supportingKeywords: ['cookies', 'privacy-first analytics'],
    declaredIn: 'PAGE',
  },
];

/**
 * Phrases that matter to a consultancy in this market. The audit reports which
 * ones no page owns — a gap to write for, not a ranking to chase.
 */
export const BUSINESS_KEYWORDS: readonly string[] = [
  'IELTS preparation Dhaka',
  'student visa documents',
  'study in the UK from Bangladesh',
  'study in Canada from Bangladesh',
  'IELTS practice test',
  'scholarship application help',
  'SOP writing guidance',
  'university shortlisting',
  'PTE practice test',
  'English test practice',
];

export function findSeoPage(path: string): SeoPageMetadata | undefined {
  return SEO_PAGE_METADATA.find((page) => page.path === path);
}
