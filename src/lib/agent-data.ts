// ALO English Test Platform — AI Agent Employee data (internal/admin only)
// 20 AI Agent Employees operate all 32 computer-based exam types.
// Public-facing labels use approved wording only (no "AI teacher", "bot", etc.)

export type AiAgent = {
  id: number;
  agentCode: string;
  agentName: string;
  department: string;
  responsibility: string;
  examScope: string; // "ALL" or specific exam types
  isActive: boolean;
  publicLabel: string;
  internalLabel: string;
  canAutoExecute: boolean;
  requiresAdminApproval: boolean;
  tasksToday: number;
  tasksCompleted: number;
  tasksFailed: number;
  successRate: number;
  avgDurationSeconds: number;
};

export const AI_AGENTS: AiAgent[] = [
  { id: 1, agentCode: "AGENT-INTAKE-01", agentName: "Exam Intake Agent", department: "Intake", responsibility: "Registers student, checks exam goal, target country, target score, ALO student status, free quota", examScope: "ALL", isActive: true, publicLabel: "ALO Evaluation System", internalLabel: "Exam Intake Agent", canAutoExecute: true, requiresAdminApproval: false, tasksToday: 84, tasksCompleted: 82, tasksFailed: 2, successRate: 97.6, avgDurationSeconds: 3 },
  { id: 2, agentCode: "AGENT-ELIGIBILITY-01", agentName: "Exam Eligibility Agent", department: "Intake", responsibility: "Verifies 3 free mocks (ALO) or 1 free mock (public), checks CRM match, validates ALO Student ID, prevents quota bypass", examScope: "ALL", isActive: true, publicLabel: "ALO Evaluation System", internalLabel: "Exam Eligibility Agent", canAutoExecute: true, requiresAdminApproval: false, tasksToday: 84, tasksCompleted: 81, tasksFailed: 3, successRate: 96.4, avgDurationSeconds: 2 },
  { id: 3, agentCode: "AGENT-SETUP-01", agentName: "Exam Setup Agent", department: "Operations", responsibility: "Selects exam type, practice set, assigns sections, prepares timer, prepares instructions", examScope: "ALL", isActive: true, publicLabel: "ALO Evaluation System", internalLabel: "Exam Setup Agent", canAutoExecute: true, requiresAdminApproval: false, tasksToday: 76, tasksCompleted: 76, tasksFailed: 0, successRate: 100, avgDurationSeconds: 4 },
  { id: 4, agentCode: "AGENT-PROCTOR-01", agentName: "Digital Proctor Agent", department: "Operations", responsibility: "Monitors timer, logs tab switch, pause/resume, suspicious refresh, attempt integrity", examScope: "ALL", isActive: true, publicLabel: "Digital Practice Session", internalLabel: "Digital Proctor Agent", canAutoExecute: true, requiresAdminApproval: false, tasksToday: 312, tasksCompleted: 312, tasksFailed: 0, successRate: 100, avgDurationSeconds: 1 },
  { id: 5, agentCode: "AGENT-LISTENING-01", agentName: "Listening Test Agent", department: "Exam Operations", responsibility: "Manages audio playback, listening section timing, prevents replay when rules disallow", examScope: "ALL", isActive: true, publicLabel: "ALO Evaluation System", internalLabel: "Listening Test Agent", canAutoExecute: true, requiresAdminApproval: false, tasksToday: 28, tasksCompleted: 28, tasksFailed: 0, successRate: 100, avgDurationSeconds: 2 },
  { id: 6, agentCode: "AGENT-READING-01", agentName: "Reading Test Agent", department: "Exam Operations", responsibility: "Manages passages, tracks reading answers, checks completion", examScope: "ALL", isActive: true, publicLabel: "ALO Evaluation System", internalLabel: "Reading Test Agent", canAutoExecute: true, requiresAdminApproval: false, tasksToday: 28, tasksCompleted: 28, tasksFailed: 0, successRate: 100, avgDurationSeconds: 2 },
  { id: 7, agentCode: "AGENT-WRITING-01", agentName: "Writing Evaluation Agent", department: "Evaluation", responsibility: "Reviews essays/writing, estimates score, gives task achievement/coherence/vocabulary/grammar feedback, improvement plan", examScope: "ALL", isActive: true, publicLabel: "Automated Practice Feedback", internalLabel: "Writing Evaluation Agent", canAutoExecute: false, requiresAdminApproval: true, tasksToday: 18, tasksCompleted: 14, tasksFailed: 1, successRate: 93.3, avgDurationSeconds: 12 },
  { id: 8, agentCode: "AGENT-SPEAKING-01", agentName: "Speaking Interview Agent", department: "Evaluation", responsibility: "Conducts speaking practice, professional examiner-style card, exam-style prompts, records answer, fluency/pronunciation/grammar/lexical/coherence/confidence feedback", examScope: "ALL", isActive: true, publicLabel: "ALO Practice Examiner", internalLabel: "Speaking Interview Agent", canAutoExecute: false, requiresAdminApproval: true, tasksToday: 15, tasksCompleted: 12, tasksFailed: 0, successRate: 100, avgDurationSeconds: 18 },
  { id: 9, agentCode: "AGENT-INTERVIEW-01", agentName: "Interview Practice Agent", department: "Evaluation", responsibility: "UK credibility, CAS, visa, scholarship, admission interviews, follow-up questions, risk-level scoring", examScope: "VisaInterview", isActive: true, publicLabel: "Practice Interview Coach", internalLabel: "Interview Practice Agent", canAutoExecute: false, requiresAdminApproval: true, tasksToday: 8, tasksCompleted: 6, tasksFailed: 0, successRate: 100, avgDurationSeconds: 22 },
  { id: 10, agentCode: "AGENT-SCORING-01", agentName: "Scoring Agent", department: "Evaluation", responsibility: "Calculates estimated score, maps by exam (IELTS 0-9, PTE 10-90, TOEFL 0-120, etc.), marks as estimated practice score only", examScope: "ALL", isActive: true, publicLabel: "ALO Estimated Score Engine", internalLabel: "Scoring Agent", canAutoExecute: true, requiresAdminApproval: false, tasksToday: 76, tasksCompleted: 76, tasksFailed: 0, successRate: 100, avgDurationSeconds: 3 },
  { id: 11, agentCode: "AGENT-FEEDBACK-01", agentName: "Feedback Agent", department: "Evaluation", responsibility: "Creates strengths, weaknesses, next study plan, recommends next practice set, recommends counseling if needed", examScope: "ALL", isActive: true, publicLabel: "Automated Practice Feedback", internalLabel: "Feedback Agent", canAutoExecute: true, requiresAdminApproval: false, tasksToday: 76, tasksCompleted: 76, tasksFailed: 0, successRate: 100, avgDurationSeconds: 4 },
  { id: 12, agentCode: "AGENT-REPORT-01", agentName: "Report Agent", department: "Operations", responsibility: "Generates Smart Score Report, adds disclaimer, creates PDF, saves report, syncs to CRM if connected", examScope: "ALL", isActive: true, publicLabel: "Smart Score Report", internalLabel: "Report Agent", canAutoExecute: true, requiresAdminApproval: false, tasksToday: 76, tasksCompleted: 75, tasksFailed: 1, successRate: 98.7, avgDurationSeconds: 6 },
  { id: 13, agentCode: "AGENT-CRM-01", agentName: "CRM Sync Agent", department: "Integration", responsibility: "Sends registration, exam attempt, score, weak area, counseling task to CRM; logs pending if CRM unavailable", examScope: "ALL", isActive: true, publicLabel: "ALO Evaluation System", internalLabel: "CRM Sync Agent", canAutoExecute: true, requiresAdminApproval: false, tasksToday: 82, tasksCompleted: 79, tasksFailed: 3, successRate: 96.3, avgDurationSeconds: 5 },
  { id: 14, agentCode: "AGENT-VOUCHER-01", agentName: "Voucher & Payment Agent", department: "Operations", responsibility: "Checks voucher, checks paid access, blocks over-quota free attempt, shows payment/contact CTA", examScope: "ALL", isActive: true, publicLabel: "ALO Evaluation System", internalLabel: "Voucher & Payment Agent", canAutoExecute: true, requiresAdminApproval: false, tasksToday: 24, tasksCompleted: 24, tasksFailed: 0, successRate: 100, avgDurationSeconds: 2 },
  { id: 15, agentCode: "AGENT-QUESTION-01", agentName: "Question Bank Agent", department: "Content", responsibility: "Drafts new original questions, never copies official exam content, tags difficulty, creates explanations, sends to review queue", examScope: "ALL", isActive: true, publicLabel: "ALO Evaluation System", internalLabel: "Question Bank Agent", canAutoExecute: false, requiresAdminApproval: true, tasksToday: 12, tasksCompleted: 10, tasksFailed: 0, successRate: 100, avgDurationSeconds: 8 },
  { id: 16, agentCode: "AGENT-WEEKLY-01", agentName: "Weekly Update Agent", department: "Content", responsibility: "Every week drafts new original questions, checks duplicates/grammar/answer keys/readability, sends to admin approval, does not auto-publish", examScope: "ALL", isActive: true, publicLabel: "ALO Evaluation System", internalLabel: "Weekly Update Agent", canAutoExecute: false, requiresAdminApproval: true, tasksToday: 4, tasksCompleted: 4, tasksFailed: 0, successRate: 100, avgDurationSeconds: 15 },
  { id: 17, agentCode: "AGENT-QUALITY-01", agentName: "Quality Review Agent", department: "Content", responsibility: "Reviews question quality, flags weak/duplicate questions, flags official-content risk, flags unclear answer keys", examScope: "ALL", isActive: true, publicLabel: "ALO Evaluation System", internalLabel: "Quality Review Agent", canAutoExecute: false, requiresAdminApproval: true, tasksToday: 8, tasksCompleted: 7, tasksFailed: 1, successRate: 87.5, avgDurationSeconds: 10 },
  { id: 18, agentCode: "AGENT-COMPLIANCE-01", agentName: "Compliance Agent", department: "Compliance", responsibility: "Checks no fake official wording, disclaimer exists, no real-examiner claim, no official partnership claim, no guaranteed real exam question", examScope: "ALL", isActive: true, publicLabel: "ALO Evaluation System", internalLabel: "Compliance Agent", canAutoExecute: true, requiresAdminApproval: false, tasksToday: 156, tasksCompleted: 156, tasksFailed: 0, successRate: 100, avgDurationSeconds: 1 },
  { id: 19, agentCode: "AGENT-AUDIT-01", agentName: "Audit Agent", department: "Compliance", responsibility: "Logs every attempt, scoring, quota use, report generation, admin action, weekly update", examScope: "ALL", isActive: true, publicLabel: "ALO Evaluation System", internalLabel: "Audit Agent", canAutoExecute: true, requiresAdminApproval: false, tasksToday: 412, tasksCompleted: 412, tasksFailed: 0, successRate: 100, avgDurationSeconds: 1 },
  { id: 20, agentCode: "AGENT-SUPPORT-01", agentName: "Support Agent", department: "Support", responsibility: "Answers student help questions, explains how to start exam, quota, score report, escalates to ALO advisor if needed", examScope: "ALL", isActive: true, publicLabel: "ALO Evaluation System", internalLabel: "Support Agent", canAutoExecute: true, requiresAdminApproval: false, tasksToday: 32, tasksCompleted: 30, tasksFailed: 2, successRate: 93.8, avgDurationSeconds: 5 },
];

export const AGENT_DEPARTMENTS = ["Intake", "Operations", "Exam Operations", "Evaluation", "Integration", "Content", "Compliance", "Support"];

export const AGENT_APPROVAL_QUEUE = [
  { id: "APR-001", agent: "Weekly Update Agent", type: "question_publication", detail: "32 new IELTS questions ready for review", status: "pending", requestedAt: "2 hours ago", priority: "normal" },
  { id: "APR-002", agent: "Writing Evaluation Agent", type: "writing_score_override", detail: "Essay ATT-2026-005 — score 7.0 (confidence 0.82)", status: "pending", requestedAt: "35 min ago", priority: "high" },
  { id: "APR-003", agent: "Speaking Interview Agent", type: "speaking_score_override", detail: "Speaking SS-2026-052 — fluency 88 (confidence 0.79)", status: "pending", requestedAt: "12 min ago", priority: "high" },
  { id: "APR-004", agent: "Interview Practice Agent", type: "interview_risk_review", detail: "UK Credibility Interview — risk level: medium", status: "pending", requestedAt: "8 min ago", priority: "normal" },
  { id: "APR-005", agent: "Question Bank Agent", type: "question_draft_approval", detail: "8 new GRE quantitative questions", status: "pending", requestedAt: "1 hour ago", priority: "normal" },
];

export const AGENT_RECENT_LOGS = [
  { id: "LOG-1248", agent: "Audit Agent", action: "attempt.logged", entity: "ATT-2026-005", time: "2 min ago" },
  { id: "LOG-1247", agent: "CRM Sync Agent", action: "crm.sync_success", entity: "ATT-2026-005", time: "5 min ago" },
  { id: "LOG-1246", agent: "Report Agent", action: "report.generated", entity: "RPT-2026-005", time: "6 min ago" },
  { id: "LOG-1245", agent: "Scoring Agent", action: "score.calculated", entity: "ATT-2026-005", time: "7 min ago" },
  { id: "LOG-1244", agent: "Digital Proctor Agent", action: "tab_switch.flagged", entity: "ATT-2026-005", time: "12 min ago" },
  { id: "LOG-1243", agent: "Writing Evaluation Agent", action: "writing.evaluated", entity: "WS-2026-045", time: "14 min ago" },
  { id: "LOG-1242", agent: "Compliance Agent", action: "content.checked", entity: "page:exam-page-ielts", time: "18 min ago" },
  { id: "LOG-1241", agent: "Speaking Interview Agent", action: "speaking.evaluated", entity: "SS-2026-052", time: "22 min ago" },
  { id: "LOG-1240", agent: "Weekly Update Agent", action: "draft.created", entity: "32 questions", time: "1 hour ago" },
  { id: "LOG-1239", agent: "Eligibility Agent", action: "quota.verified", entity: "AE-2026000042", time: "1 hour ago" },
];

export const AGENT_COMPLIANCE_WARNINGS = [
  { id: "WRN-003", severity: "info", message: "All 20 agents using approved public labels only", count: 0 },
  { id: "WRN-002", severity: "info", message: "Disclosure text present on all exam pages", count: 0 },
  { id: "WRN-001", severity: "warning", message: "1 question flagged for review (possible ambiguity in answer key)", count: 1 },
];

export const AGENT_STATS = {
  totalAgents: 20,
  activeAgents: 20,
  tasksToday: 1423,
  failedTasks: 10,
  pendingApprovals: 5,
  scoringTasks: 76,
  speakingTasks: 15,
  writingTasks: 18,
  reportTasks: 76,
  weeklyUpdateTasks: 4,
  complianceWarnings: 1,
  avgSuccessRate: 97.8,
};

export const SCORE_MAPPINGS: Record<string, { label: string; scale: string }> = {
  IELTS: { label: "Band 0–9", scale: "band" },
  PTE: { label: "10–90", scale: "score" },
  TOEFL: { label: "0–120", scale: "score" },
  Duolingo: { label: "10–160", scale: "score" },
  SAT: { label: "400–1600", scale: "range" },
  GRE: { label: "V 130–170 / Q 130–170", scale: "range" },
  GMAT: { label: "205–805", scale: "score" },
  LSAT: { label: "120–180", scale: "score" },
  MCAT: { label: "472–528", scale: "score" },
  ACT: { label: "1–36", scale: "score" },
  OIETC: { label: "CEFR A2–C1", scale: "cefr" },
  OET: { label: "A–E grades", scale: "grade" },
  LanguageCert: { label: "CEFR A1–C2", scale: "cefr" },
  Linguaskill: { label: "CEFR A1–C2", scale: "cefr" },
  Placement: { label: "A1–C2 + readiness 0–100", scale: "cefr" },
  VisaInterview: { label: "Confidence 0–100 + risk level", scale: "confidence" },
};

export const DISCLOSURE_TEXT = "Some practice tests, scoring, feedback, and interview simulations may be supported by automated digital evaluation tools. This is a practice platform only, not an official exam result.";
