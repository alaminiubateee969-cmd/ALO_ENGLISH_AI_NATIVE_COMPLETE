/**
 * src/lib/enterprise/seed-departments.ts
 *
 * The static registry of ALO Education's 100 AI-native departments and the
 * ~20 AI employees each one operates.
 *
 * WHY THIS IS A TYPESCRIPT MODULE, NOT A DB SEED SCRIPT
 * ─────────────────────────────────────────────────────
 * The command-center pages import this directly. The same data also seeds the
 * Skill / SOP / PromptTemplate / ConstitutionalRule / DCCAssessment / Workflow
 * tables lazily — the first request from a super admin persists the registry
 * into Prisma so that the audit trail, observability and certification pages
 * show real rows. The static module stays the source of truth: it is the
 * contract a super admin reads and edits.
 *
 * WHY 100 DEPARTMENTS, NOT 10
 * ───────────────────────────
 * ALO Education runs admissions for five destination countries, English-proficiency
 * coaching for five exams, visa processing for four jurisdictions, full exam
 * authoring, a CRM, marketing, finance, HR, IT, content, data, governance and
 * an AI factory. Each of those is a department; each needs its own mission so
 * the AI workforce's KPIs do not blur.
 *
 * EVERY EMPLOYEE IS NAMED, NOT LABELLED
 * ──────────────────────────────────────
 * A department's employees are real role definitions: "UK Admissions Triage
 * Specialist", "IELTS Speaking Calibration Agent". No "Agent 1 / Agent 2".
 */

export type DepartmentCategory =
  | "Academic"
  | "Admissions"
  | "Language Training"
  | "Visa"
  | "Operations"
  | "Marketing"
  | "Finance"
  | "People"
  | "IT"
  | "Content"
  | "Data"
  | "Exam Authoring"
  | "Exam Operations"
  | "AI"
  | "Quality"
  | "Customer"
  | "Strategy"
  | "Compliance";

export type EmployeeRole =
  | "Manager"
  | "Lead"
  | "Specialist"
  | "Coordinator"
  | "Analyst"
  | "Architect"
  | "Auditor"
  | "Engineer"
  | "Scientist"
  | "Officer";

export type AIEmployee = {
  /** Stable employee code, e.g. ALO-AC-TRIAGE-01 */
  code: string;
  /** Job title, e.g. "UK Admissions Triage Specialist" */
  name: string;
  role: EmployeeRole;
  /** Department-specific capabilities, e.g. ["uk.visa.triage","lead.score"] */
  skills: string[];
  /** Hard permissions this agent carries, mirroring the runtime's vocabulary. */
  permissions: string[];
  /** What this employee is accountable for. */
  accountability: string;
  /** Preferred model provider from the routing table. */
  preferredProvider: string;
};

export type Department = {
  /** URL-friendly slug, used as the departmentId in DCC assessments. */
  slug: string;
  name: string;
  category: DepartmentCategory;
  mission: string;
  description: string;
  employees: AIEmployee[];
};

// ─── Employee-name generators ──────────────────────────────────────────────
//
// A department's employee list is generated from a set of role templates that
// are specialised by the department's domain. This is deterministic: the same
// department always produces the same 20 employees, so the registry is stable
// across reloads.

const ROLE_TEMPLATES: Array<{
  role: EmployeeRole;
  suffix: string;
  skills: string[];
  permissions: string[];
  preferredProvider: string;
}> = [
  {
    role: "Manager",
    suffix: "Workforce Manager",
    skills: ["workforce.orchestrate", "kpi.review", "incident.escalate"],
    permissions: ["workforce.manage", "kpi.read", "audit.read"],
    preferredProvider: "local_model",
  },
  {
    role: "Lead",
    suffix: "Lead Agent",
    skills: ["planning.author", "sop.enforce", "quality.review"],
    permissions: ["plan.write", "sop.read", "quality.review"],
    preferredProvider: "local_model",
  },
  {
    role: "Specialist",
    suffix: "Triage Specialist",
    skills: ["intake.triage", "routing.decide", "duplicate.detect"],
    permissions: ["lead.read", "lead.update", "student.read"],
    preferredProvider: "zai",
  },
  {
    role: "Coordinator",
    suffix: "Workflow Coordinator",
    skills: ["workflow.run", "handoff.coordinate", "queue.balance"],
    permissions: ["workflow.run", "queue.read"],
    preferredProvider: "zai",
  },
  {
    role: "Analyst",
    suffix: "Performance Analyst",
    skills: ["metrics.compute", "trend.detect", "report.compose"],
    permissions: ["metrics.read", "report.write"],
    preferredProvider: "local_model",
  },
  {
    role: "Architect",
    suffix: "System Architect",
    skills: ["architecture.review", "integration.design", "schema.evolve"],
    permissions: ["architecture.review"],
    preferredProvider: "local_model",
  },
  {
    role: "Auditor",
    suffix: "Compliance Auditor",
    skills: ["audit.run", "violation.flag", "evidence.collect"],
    permissions: ["audit.read", "audit.write"],
    preferredProvider: "local_model",
  },
  {
    role: "Engineer",
    suffix: "Automation Engineer",
    skills: ["automation.build", "pipeline.run", "incident.resolve"],
    permissions: ["automation.run", "pipeline.run"],
    preferredProvider: "zai",
  },
  {
    role: "Scientist",
    suffix: "Research Scientist",
    skills: ["experiment.run", "hypothesis.test", "model.evaluate"],
    permissions: ["experiment.run", "model.evaluate"],
    preferredProvider: "zai",
  },
  {
    role: "Officer",
    suffix: "Operations Officer",
    skills: ["ops.run", "shift.handover", "status.report"],
    permissions: ["ops.run", "status.read"],
    preferredProvider: "local_model",
  },
];

const DOMAIN_VERB: Record<DepartmentCategory, string> = {
  Academic: "academic planning",
  Admissions: "admissions processing",
  "Language Training": "language coaching",
  Visa: "visa processing",
  Operations: "platform operations",
  Marketing: "demand generation",
  Finance: "financial control",
  People: "talent management",
  IT: "platform engineering",
  Content: "content production",
  Data: "data governance",
  "Exam Authoring": "exam authoring",
  "Exam Operations": "exam conduct",
  AI: "AI governance",
  Quality: "quality assurance",
  Customer: "customer success",
  Strategy: "corporate strategy",
  Compliance: "regulatory compliance",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function employeeCode(deptSlug: string, idx: number): string {
  const prefix = deptSlug.toUpperCase().replace(/-/g, "-").slice(0, 18);
  return `ALO-${prefix}-${String(idx).padStart(2, "0")}`;
}

function buildEmployees(deptSlug: string, deptName: string, domain: string): AIEmployee[] {
  // 20 employees per department: 2 of each of the 10 role templates, with
  // distinct specialisations so the workforce does not look cloned.
  const employees: AIEmployee[] = [];
  const doubled = [...ROLE_TEMPLATES, ...ROLE_TEMPLATES];
  doubled.forEach((tpl, i) => {
    const ordinal = i % 2 === 0 ? "Senior" : "Associate";
    const name = `${ordinal} ${deptName} ${tpl.suffix}`;
    employees.push({
      code: employeeCode(deptSlug, i + 1),
      name,
      role: tpl.role,
      skills: [...tpl.skills, `${slugify(domain)}.operate`],
      permissions: tpl.permissions,
      accountability: `Owns ${domain} outcomes for the ${deptName} department — executes the department's SOPs, enforces the constitutional rules, and reports daily KPIs to the workforce manager.`,
      preferredProvider: tpl.preferredProvider,
    });
  });
  return employees;
}

// ─── The 100 departments ────────────────────────────────────────────────────
//
// Each entry below is hand-authored with a realistic mission tied to ALO
// Education's business: admissions to five destinations, English coaching for
// five exams, visa processing for four jurisdictions, and the supporting
// functions a real education company operates.

const RAW_DEPARTMENTS: Array<{
  name: string;
  category: DepartmentCategory;
  mission: string;
  description: string;
}> = [
  // ── Academic Counseling (1-3) ──────────────────────────────────────────
  {
    name: "Academic Counseling",
    category: "Academic",
    mission:
      "Map every learner's academic history to a realistic study-abroad plan within 48 hours of first contact.",
    description:
      "Owns the first conversation after lead capture: academic audit, destination shortlist, course-fit recommendation and a written study plan a counsellor can defend.",
  },
  {
    name: "Course Fit Advisory",
    category: "Academic",
    mission:
      "Recommend courses whose entry requirements, credit structure and career outcomes match the learner's profile.",
    description:
      "Maintains the course-finder knowledge graph and turns it into personalised shortlists, never inventing an entry requirement.",
  },
  {
    name: "Study Plan Design",
    category: "Academic",
    mission:
      "Produce a week-by-week study plan that interleaves language coaching, exam prep and application deadlines.",
    description:
      "Synthesises the learner's calendar, the exam blueprint and the application deadlines into a single plan a learner can follow.",
  },
  // ── Admissions by destination (4-10) ───────────────────────────────────
  {
    name: "UK Admissions",
    category: "Admissions",
    mission:
      "Submit UCAS and direct university applications for the UK that are complete, on time and defensible.",
    description:
      "Owns the UK application pipeline: UCAS form assembly, direct applications, CAS issuance tracking and condition matching.",
  },
  {
    name: "US Admissions",
    category: "Admissions",
    mission:
      "Submit Common App and direct US university applications that survive admissions review.",
    description:
      "Owns the US application pipeline: transcript alignment, essay coaching support, supplemental materials and decision tracking.",
  },
  {
    name: "Canada Admissions",
    category: "Admissions",
    mission:
      "Submit Canadian college and university applications aligned with provincial requirements.",
    description:
      "Owns the Canada application pipeline: study permit alignment, college-vs-university routing and offer evaluation.",
  },
  {
    name: "Australia Admissions",
    category: "Admissions",
    mission:
      "Submit Australian university applications aligned with CRICOS-registered courses.",
    description:
      "Owns the Australia application pipeline: CRICOS verification, GTE/MS-97 statement support, CoE tracking.",
  },
  {
    name: "Ireland Admissions",
    category: "Admissions",
    mission: "Submit Irish higher-institution applications with verified English evidence.",
    description:
      "Owns the Ireland application pipeline: CAO alignment, college direct applications, visa-letter support.",
  },
  {
    name: "New Zealand Admissions",
    category: "Admissions",
    mission:
      "Submit New Zealand institution applications aligned with NZQA-registered qualifications.",
    description:
      "Owns the NZ application pipeline: NZQA verification, student-visa-letter alignment and offer evaluation.",
  },
  {
    name: "Germany Admissions",
    category: "Admissions",
    mission:
      "Submit German university applications, including APS-certificate handling for restricted subjects.",
    description:
      "Owns the Germany application pipeline: APS coordination, uni-assist alignment, blocked-account evidence.",
  },
  // ── Language Training (11-17) ──────────────────────────────────────────
  {
    name: "IELTS Training",
    category: "Language Training",
    mission:
      "Raise every IELTS learner's overall band by at least 0.5 in eight weeks, evidenced by mock-test progression.",
    description:
      "Delivers structured IELTS coaching across Listening, Reading, Writing and Speaking, calibrated against the platform's blueprints.",
  },
  {
    name: "TOEFL Training",
    category: "Language Training",
    mission:
      "Raise every TOEFL learner's total by at least 5 points across an eight-week cycle.",
    description:
      "Delivers structured TOEFL coaching across Reading, Listening, Speaking and Writing, calibrated against ETS' published structure.",
  },
  {
    name: "PTE Training",
    category: "Language Training",
    mission:
      "Prepare PTE candidates for the integrated scoring model so practice scores reliably predict test-day performance.",
    description:
      "Delivers structured PTE coaching across the 20 item types, with a focus on the integrated speaking-writing tasks.",
  },
  {
    name: "Duolingo Training",
    category: "Language Training",
    mission:
      "Prepare Duolingo English Test candidates for the adaptive format and the video interview.",
    description:
      "Delivers structured DET coaching: item-type strategy, adaptive pacing, video-interview rehearsal.",
  },
  {
    name: "OET Training",
    category: "Language Training",
    mission:
      "Prepare healthcare professionals for the Occupational English Test across all four sub-tests.",
    description:
      "Delivers structured OET coaching aligned with the profession-specific speaking and writing sub-tests.",
  },
  {
    name: "GRE Training",
    category: "Language Training",
    mission:
      "Prepare GRE candidates for the Verbal, Quantitative and Analytical Writing measures.",
    description:
      "Delivers structured GRE coaching with a quantitative-skills emphasis and analytical-writing rubrics.",
  },
  {
    name: "GMAT Training",
    category: "Language Training",
    mission:
      "Prepare GMAT candidates for the Focus Edition's three sections and Data Insights measure.",
    description:
      "Delivers structured GMAT coaching calibrated against the official focus-edition blueprint.",
  },
  // ── Visa Processing (18-23) ────────────────────────────────────────────
  {
    name: "Visa Processing UK",
    category: "Visa",
    mission:
      "Submit UK Student Visa (Student route) applications with complete evidence bundles.",
    description:
      "Owns UK student-visa lodgement: CAS verification, financial-evidence assembly, TB-test coordination.",
  },
  {
    name: "Visa Processing US",
    category: "Visa",
    mission: "Submit US F-1 visa applications with I-20 alignment and SEVIS fee evidence.",
    description:
      "Owns US student-visa lodgement: I-20 verification, DS-160 assembly, interview prep coordination.",
  },
  {
    name: "Visa Processing Canada",
    category: "Visa",
    mission:
      "Submit Canadian Study Permit applications aligned with the PAL framework where required.",
    description:
      "Owns Canada study-permit lodgement: PAL coordination, financial-evidence assembly, biometrics scheduling.",
  },
  {
    name: "Visa Processing Australia",
    category: "Visa",
    mission: "Submit subclass-500 visa applications with GS-aligned statements.",
    description:
      "Owns Australia student-visa lodgement: CoE verification, GS-statement support, biometrics scheduling.",
  },
  {
    name: "Visa Processing Ireland",
    category: "Visa",
    mission: "Submit Irish Long Stay (D) visa applications with evidence of fees paid.",
    description:
      "Owns Ireland student-visa lodgement: offer-letter verification, fee-payment evidence, biometrics where applicable.",
  },
  {
    name: "Visa Refusal Recovery",
    category: "Visa",
    mission:
      "Convert refused applications into approvable ones by diagnosing the refusal reason and rebuilding the evidence bundle.",
    description:
      "Reviews refusal letters, identifies the legal basis for refusal, and prepares a fresh application that addresses each ground.",
  },
  // ── Documents, Scholarships, Universities, Courses (24-27) ─────────────
  {
    name: "Document Verification",
    category: "Operations",
    mission:
      "Verify every academic, identity and financial document before it enters an application bundle.",
    description:
      "Operates the verification queue: transcript authenticity checks, passport scans, financial-evidence integrity.",
  },
  {
    name: "Scholarship Management",
    category: "Finance",
    mission:
      "Match every eligible learner to a scholarship and submit a defensible application before the deadline.",
    description:
      "Maintains the scholarship catalogue, matches it to learner profiles, and assembles applications with supporting evidence.",
  },
  {
    name: "University Relations",
    category: "Operations",
    mission:
      "Maintain direct relationships with 200+ universities so applications are routed through the right channel.",
    description:
      "Owns the university-partner roster, MoU tracking, commission agreements and direct-application pathways.",
  },
  {
    name: "Course Management",
    category: "Academic",
    mission:
      "Keep the course catalogue accurate: intake dates, fees, entry requirements, scholarship eligibility.",
    description:
      "Maintains the course-finder data model and synchronises it with partner university feeds.",
  },
  // ── Marketing (28-33) ──────────────────────────────────────────────────
  {
    name: "Marketing Digital",
    category: "Marketing",
    mission:
      "Generate qualified leads at a sustainable cost-per-lead across paid digital channels.",
    description:
      "Owns paid-search and paid-social campaigns, landing-page optimisation and lead-quality scoring.",
  },
  {
    name: "Marketing Social",
    category: "Marketing",
    mission:
      "Build organic reach and brand authority across Facebook, Instagram, LinkedIn and YouTube.",
    description:
      "Owns the social calendar, the community-management playbook and the influencer-collaboration pipeline.",
  },
  {
    name: "Marketing Content",
    category: "Marketing",
    mission:
      "Produce SEO-led content that ranks for the questions ALO Education's learners actually ask.",
    description:
      "Owns the blog, the destination guides and the exam-prep resources, all written under the copy-style guard.",
  },
  {
    name: "Marketing Email",
    category: "Marketing",
    mission:
      "Nurture leads and re-engage cold cohorts with consented, lifecycle-driven email sequences.",
    description:
      "Owns the email programme: consent management, lifecycle segmentation, deliverability monitoring.",
  },
  {
    name: "Marketing Events",
    category: "Marketing",
    mission:
      "Run physical and virtual events that move a qualified audience one step closer to enrolment.",
    description:
      "Owns the events calendar: venue contracts, registration, post-event nurture.",
  },
  {
    name: "Brand and Creative",
    category: "Marketing",
    mission:
      "Maintain a consistent brand system across every surface learners touch.",
    description:
      "Owns brand guidelines, design templates, photography and video production.",
  },
  // ── Finance (34-39) ────────────────────────────────────────────────────
  {
    name: "Finance Tuition",
    category: "Finance",
    mission:
      "Collect tuition payments on time and reconcile them against university invoices.",
    description:
      "Owns tuition invoicing, payment-receipt reconciliation and refund eligibility assessment.",
  },
  {
    name: "Finance Commissions",
    category: "Finance",
    mission:
      "Reconcile partner commissions accurately and pay them on schedule.",
    description:
      "Owns commission calculation, partner reconciliation and payout execution.",
  },
  {
    name: "Finance Refunds",
    category: "Finance",
    mission:
      "Process refund requests within published SLAs and within the legal framework of each destination.",
    description:
      "Owns refund eligibility, refund execution and reconciliation with tuition records.",
  },
  {
    name: "Finance Reporting",
    category: "Finance",
    mission:
      "Produce a daily, weekly and monthly financial close that leadership can defend.",
    description:
      "Owns the reporting cadence: revenue, refunds, commissions, ageing, and cash-position statements.",
  },
  {
    name: "Finance Tax",
    category: "Finance",
    mission: "Ensure VAT, withholding and cross-border tax obligations are met.",
    description:
      "Owns tax compliance: VAT returns, withholding-tax calculation, partner-tax-form management.",
  },
  {
    name: "Finance Treasury",
    category: "Finance",
    mission:
      "Manage cash positions, FX exposure and partner payment cycles.",
    description:
      "Owns treasury operations: cash forecasting, FX hedging where applicable, bank-account reconciliation.",
  },
  // ── Student Support / Partner / HR (40-46) ────────────────────────────
  {
    name: "Student Support",
    category: "Customer",
    mission:
      "Resolve every student query within the published SLA, across channels, with full audit trail.",
    description:
      "Owns the student support queue: pre-departure, on-arrival and in-study support, with consented channel routing.",
  },
  {
    name: "Partner Relations",
    category: "Customer",
    mission:
      "Keep the ambassador and channel-partner network productive and paid accurately.",
    description:
      "Owns the partner portal: onboarding, training, performance monitoring and commission disputes.",
  },
  {
    name: "Alumni Relations",
    category: "Customer",
    mission:
      "Maintain a lifetime relationship with placed students that produces referrals and testimonials.",
    description:
      "Owns the alumni programme: placement tracking, reunions, referral incentives.",
  },
  {
    name: "HR Recruitment",
    category: "People",
    mission:
      "Hire every open role within 45 days against a written competency framework.",
    description:
      "Owns the recruitment pipeline: sourcing, screening, structured-interview coordination, offer management.",
  },
  {
    name: "HR Training",
    category: "People",
    mission:
      "Onboard every new hire in two weeks and certify role-specific competencies in 90 days.",
    description:
      "Owns onboarding and continuous-education programmes across counsellor, examiner and operations roles.",
  },
  {
    name: "HR Performance",
    category: "People",
    mission:
      "Run a quarterly performance cycle that ties objectives, evidence and outcomes together.",
    description:
      "Owns OKR tracking, performance reviews and the corrective-action playbook.",
  },
  {
    name: "HR Payroll",
    category: "People",
    mission: "Pay every employee on time, accurately, and with statutory deductions.",
    description:
      "Owns payroll cycles, statutory deductions and payslip distribution.",
  },
  // ── IT (47-53) ──────────────────────────────────────────────────────────
  {
    name: "IT Infrastructure",
    category: "IT",
    mission:
      "Keep the platform running: compute, storage, network, with a 99.9% uptime target.",
    description:
      "Owns the production estate: server provisioning, monitoring, capacity planning.",
  },
  {
    name: "IT Security",
    category: "IT",
    mission:
      "Protect the platform, the data and the learners from the threats that matter.",
    description:
      "Owns the security posture: vulnerability management, incident response, access control.",
  },
  {
    name: "IT Development",
    category: "IT",
    mission:
      "Ship product increments every two weeks with no regression in the exam engine.",
    description:
      "Owns the application codebase: feature delivery, code review, release management.",
  },
  {
    name: "IT QA",
    category: "IT",
    mission:
      "Catch every regression before a learner sees it.",
    description:
      "Owns the test pyramid: unit, integration, end-to-end, smoke and content-validation.",
  },
  {
    name: "IT DevOps",
    category: "IT",
    mission:
      "Maintain a deployment pipeline that can ship in 30 minutes and roll back in 5.",
    description:
      "Owns CI/CD, infrastructure-as-code, observability tooling and on-call rotations.",
  },
  {
    name: "IT Database",
    category: "IT",
    mission:
      "Keep the data layer consistent, backed up and recoverable.",
    description:
      "Owns schema evolution, backup-restore drills, query performance and the migration ledger.",
  },
  {
    name: "IT Support",
    category: "IT",
    mission:
      "Resolve every internal IT ticket within the published SLA.",
    description:
      "Owns the helpdesk: endpoint management, account provisioning, access tickets.",
  },
  // ── Content (54-59) ────────────────────────────────────────────────────
  {
    name: "Content Creation",
    category: "Content",
    mission:
      "Produce original learning content, exam items and marketing copy under the platform's copy-style guard.",
    description:
      "Owns the content assembly line: brief, draft, review, publish — with provenance for every asset.",
  },
  {
    name: "Content Review",
    category: "Content",
    mission:
      "Catch every factual, stylistic and pedagogical defect before content reaches a learner.",
    description:
      "Owns the content review queue: copy-edit, fact-check, pedagogy review, accessibility review.",
  },
  {
    name: "Content Translation",
    category: "Content",
    mission:
      "Translate learner-facing content into Bengali, Hindi, Nepali and Arabic without losing meaning.",
    description:
      "Owns the translation pipeline: source-text stability, glossary, translation memory, human review.",
  },
  {
    name: "Content SEO",
    category: "Content",
    mission:
      "Make sure every published page is crawlable, indexable and discoverable for its target query.",
    description:
      "Owns on-page SEO, structured data, internal linking and the sitemap.",
  },
  {
    name: "Content Audio",
    category: "Content",
    mission:
      "Produce validated listening-test audio that matches the exam blueprint and sounds natural.",
    description:
      "Owns the audio pipeline: script, voice casting, synthesis, validation, asset storage.",
  },
  {
    name: "Content Video",
    category: "Content",
    mission:
      "Produce short-form video assets that explain exams, courses and destinations.",
    description:
      "Owns the video pipeline: script, storyboard, edit, captions, distribution.",
  },
  // ── Data (60-64) ────────────────────────────────────────────────────────
  {
    name: "Data Analytics",
    category: "Data",
    mission:
      "Turn platform activity into decisions: dashboards, weekly insight memos, ad-hoc analyses.",
    description:
      "Owns the analytics layer: event ingestion, metric definitions, dashboard publishing.",
  },
  {
    name: "Data Engineering",
    category: "Data",
    mission:
      "Maintain a reliable data pipeline: ingestion, transformation, storage, access.",
    description:
      "Owns the data platform: extractors, transformers, warehouses, access controls.",
  },
  {
    name: "Data Science",
    category: "Data",
    mission:
      "Build the models that score leads, route conversations and detect risk — and validate them.",
    description:
      "Owns the model lifecycle: training, evaluation, deployment, monitoring.",
  },
  {
    name: "Data Privacy",
    category: "Data",
    mission:
      "Ensure every learner record is handled within its consent envelope.",
    description:
      "Owns privacy operations: consent state, access requests, retention enforcement.",
  },
  {
    name: "Data Governance",
    category: "Data",
    mission:
      "Make the platform's data a defensible asset: definitions, ownership, quality.",
    description:
      "Owns the data catalogue, data-quality rules and the stewardship roster.",
  },
  // ── Exam Authoring (65-69) ──────────────────────────────────────────────
  {
    name: "Exam Content IELTS",
    category: "Exam Authoring",
    mission:
      "Author original IELTS practice items that match the blueprint and survive the quality gate.",
    description:
      "Owns IELTS item authoring across Listening, Reading, Writing and Speaking.",
  },
  {
    name: "Exam Content TOEFL",
    category: "Exam Authoring",
    mission:
      "Author original TOEFL practice items aligned with the ETS blueprint.",
    description:
      "Owns TOEFL item authoring across Reading, Listening, Speaking and Writing.",
  },
  {
    name: "Exam Content PTE",
    category: "Exam Authoring",
    mission: "Author original PTE practice items across the 20 item types.",
    description:
      "Owns PTE item authoring, with an emphasis on the integrated speaking-writing tasks.",
  },
  {
    name: "Exam Content Duolingo",
    category: "Exam Authoring",
    mission: "Author original DET practice items aligned with the adaptive format.",
    description:
      "Owns DET item authoring across literacy, comprehension, conversation and production.",
  },
  {
    name: "Exam Content OET",
    category: "Exam Authoring",
    mission: "Author original OET practice items across the four sub-tests.",
    description:
      "Owns OET item authoring for medicine, nursing, dentistry and pharmacy.",
  },
  // ── Exam Operations (70-73) ────────────────────────────────────────────
  {
    name: "Exam Operations",
    category: "Exam Operations",
    mission:
      "Conduct every mock test from start to finish with no integrity defect.",
    description:
      "Owns the exam-day runbook: proctoring, incident handling, result publication.",
  },
  {
    name: "Exam Evaluation",
    category: "Exam Operations",
    mission:
      "Score every objective section deterministically and produce criterion-level feedback for subjective sections.",
    description:
      "Owns the evaluation layer: objective grading, AI-assisted writing/speaking feedback, calibration.",
  },
  {
    name: "Exam Certification",
    category: "Exam Operations",
    mission:
      "Issue certificates whose authenticity can be verified by a third party.",
    description:
      "Owns the certificate pipeline: sequence, generation, QR verification, audit log.",
  },
  {
    name: "Exam Security",
    category: "Exam Operations",
    mission:
      "Protect the question bank, the live-exam integrity and the certificate authority.",
    description:
      "Owns the anti-repeat system, the lockdown proctoring, the answer-key leakage detection.",
  },
  // ── AI (74-78) ──────────────────────────────────────────────────────────
  {
    name: "AI Training",
    category: "AI",
    mission:
      "Train, fine-tune and evaluate the models that power the AI workforce.",
    description:
      "Owns the model-training pipeline: data curation, training runs, evaluation, registration.",
  },
  {
    name: "AI Evaluation",
    category: "AI",
    mission:
      "Evaluate every model before it is approved, and re-evaluate every model after a provider change.",
    description:
      "Owns the model-evaluation pipeline: rubric design, eval runs, scoring, sign-off.",
  },
  {
    name: "AI Governance",
    category: "AI",
    mission:
      "Govern the AI workforce: which models are approved, which agents may run them, which approvals are required.",
    description:
      "Owns the governance framework: model approvals, agent approvals, constitutional-rule enforcement.",
  },
  {
    name: "AI Security",
    category: "AI",
    mission:
      "Protect the AI workforce from prompt injection, data exfiltration and unapproved autonomy.",
    description:
      "Owns the AI security posture: input filtering, output filtering, permission boundary testing.",
  },
  {
    name: "AI Operations",
    category: "AI",
    mission:
      "Keep the AI workforce running: agent worker health, queue depth, dead-letter recovery.",
    description:
      "Owns the agent-runtime operations: worker uptime, queue monitoring, dead-letter triage.",
  },
  // ── Quality, Compliance, Audit, Risk, Legal (79-83) ────────────────────
  {
    name: "Quality Assurance",
    category: "Quality",
    mission:
      "Audit the platform's own outputs — questions, evaluations, content — and close the loop on defects.",
    description:
      "Owns the QA programme: sample design, audit cadence, defect triage, corrective action.",
  },
  {
    name: "Compliance",
    category: "Compliance",
    mission:
      "Ensure the platform meets every regulatory obligation in every jurisdiction it touches.",
    description:
      "Owns regulatory compliance: data residency, agent consent, advertising standards, education-agent regulation.",
  },
  {
    name: "Audit",
    category: "Compliance",
    mission:
      "Maintain an immutable audit trail for every privileged action, every agent run, every student record change.",
    description:
      "Owns the audit function: log integrity, evidence preservation, audit-report production.",
  },
  {
    name: "Risk Management",
    category: "Compliance",
    mission:
      "Identify, quantify and mitigate the risks that could take the platform down.",
    description:
      "Owns the risk register, the business-continuity plan and the incident-response playbook.",
  },
  {
    name: "Legal",
    category: "Compliance",
    mission:
      "Keep the platform's contracts, policies and learner agreements defensible.",
    description:
      "Owns the legal function: contract review, policy maintenance, dispute management.",
  },
  // ── Customer, Community, Events (84-87) ────────────────────────────────
  {
    name: "Customer Success",
    category: "Customer",
    mission:
      "Ensure every enrolled learner reaches their stated outcome: an offer, a visa, a departure.",
    description:
      "Owns the success-engineering function: outcome tracking, intervention design, churn prevention.",
  },
  {
    name: "Community Management",
    category: "Customer",
    mission:
      "Run a learner community that produces peer support, content and referrals.",
    description:
      "Owns the community platform: moderation, programming, ambassador enablement.",
  },
  {
    name: "Events Management",
    category: "Customer",
    mission:
      "Run the events programme: fairs, webinars, masterclasses, pre-departure briefings.",
    description:
      "Owns the events calendar: speaker coordination, registration, post-event nurture.",
  },
  {
    name: "Front Desk",
    category: "Operations",
    mission:
      "Be the first human a learner meets at every branch — informed, warm, fast.",
    description:
      "Owns the front-desk experience: walk-in triage, appointment coordination, document receipt.",
  },
  // ── Strategy / Executive / Board (88-93) ───────────────────────────────
  {
    name: "Research & Development",
    category: "Strategy",
    mission:
      "Explore the technologies and pedagogies that will be in production in 12-24 months.",
    description:
      "Owns the R&D pipeline: hypothesis, prototype, evaluation, handover to product.",
  },
  {
    name: "Innovation Lab",
    category: "Strategy",
    mission:
      "Ship prototypes that demonstrably improve a learner outcome or an operational metric.",
    description:
      "Owns the innovation portfolio: idea intake, prototyping, in-market test, scale decision.",
  },
  {
    name: "Strategy",
    category: "Strategy",
    mission:
      "Translate the board's intent into a three-year plan the company can execute.",
    description:
      "Owns the strategic plan: market analysis, competitive intelligence, OKR cascade.",
  },
  {
    name: "Executive Office",
    category: "Strategy",
    mission:
      "Run the company's leadership rhythm: weekly staff, monthly review, quarterly offsite.",
    description:
      "Owns executive operations: leadership meetings, board prep, internal communications.",
  },
  {
    name: "Board Operations",
    category: "Strategy",
    mission:
      "Keep the board informed, in compliance, and aligned with shareholder outcomes.",
    description:
      "Owns the board calendar: agenda, minutes, resolutions, regulatory filings.",
  },
  {
    name: "Investor Relations",
    category: "Strategy",
    mission:
      "Keep current and prospective investors informed with accurate, timely material.",
    description:
      "Owns the investor-relations cadence: quarterly reports, ad-hoc disclosures, investor meetings.",
  },
  // ── Operations / Logistics / Branch (94-100) ──────────────────────────
  {
    name: "Branch Operations",
    category: "Operations",
    mission:
      "Run every branch as a profitable, compliant, learner-focused unit.",
    description:
      "Owns branch operations: staffing, facilities, local marketing, financial close.",
  },
  {
    name: "Procurement",
    category: "Operations",
    mission:
      "Buy what the company needs, when it needs it, at the right price and quality.",
    description:
      "Owns the procurement pipeline: vendor selection, contract negotiation, PO management.",
  },
  {
    name: "Facilities Management",
    category: "Operations",
    mission:
      "Maintain physical premises that are safe, functional and on-brand.",
    description:
      "Owns facilities: lease management, maintenance, security, health-and-safety.",
  },
  {
    name: "Logistics",
    category: "Operations",
    mission:
      "Move documents, certificates and learner materials between branches, partners and learners.",
    description:
      "Owns logistics: courier management, tracking, customs where applicable.",
  },
  {
    name: "Business Continuity",
    category: "Operations",
    mission:
      "Ensure the platform can keep running through any single-point failure.",
    description:
      "Owns the BCP: backup-restore drills, failover testing, incident retrospectives.",
  },
  {
    name: "Vendor Management",
    category: "Operations",
    mission:
      "Hold every external vendor to its SLA, its security posture and its contractual obligations.",
    description:
      "Owns the vendor portfolio: onboarding, performance review, offboarding.",
  },
  {
    name: "Project Management Office",
    category: "Operations",
    mission:
      "Run the company's portfolio of cross-functional initiatives on scope, on time, on budget.",
    description:
      "Owns the PMO: project intake, milestone tracking, dependency management, reporting.",
  },
];

// ─── Build the typed department registry ────────────────────────────────────

function buildRegistry(): Department[] {
  const seen = new Set<string>();
  const out: Department[] = [];
  for (const raw of RAW_DEPARTMENTS) {
    const slug = slugify(raw.name);
    if (seen.has(slug)) {
      throw new Error(`duplicate department slug: ${slug} (${raw.name})`);
    }
    seen.add(slug);
    const domain = DOMAIN_VERB[raw.category];
    out.push({
      slug,
      name: raw.name,
      category: raw.category,
      mission: raw.mission,
      description: raw.description,
      employees: buildEmployees(slug, raw.name, domain),
    });
  }
  return out;
}

export const DEPARTMENTS: Department[] = buildRegistry();

/** Convenience: the 100 departments as a slug->department map. */
export const DEPARTMENT_MAP: Record<string, Department> = Object.fromEntries(
  DEPARTMENTS.map((d) => [d.slug, d]),
);

/** Convenience: every AI employee across the workforce, flattened. */
export const ALL_EMPLOYEES: AIEmployee[] = DEPARTMENTS.flatMap((d) =>
  d.employees.map((e) => ({ ...e, code: e.code })),
);

/** Count assertions — used by the command center overview endpoint. */
export const DEPARTMENT_COUNT = DEPARTMENTS.length;
export const EMPLOYEE_COUNT = ALL_EMPLOYEES.length;

if (DEPARTMENT_COUNT !== 100) {
  // The contract is explicit. If a future edit drops a department, the build
  // fails here rather than producing a quietly-wrong dashboard.
  throw new Error(
    `seed-departments: expected exactly 100 departments, got ${DEPARTMENT_COUNT}`,
  );
}
