/**
 * src/lib/agents/registry.ts
 *
 * Static inventory of proposed/registered workflows.
 *
 * No entry is marked "ready" until credentials, runtime execution, persistence,
 * authorization, and a controlled test job have all been verified. Registration
 * metadata alone is not proof that a workflow is operational.
 */

export type AgentStatus = 'registered' | 'configured' | 'ready' | 'running' | 'waiting_for_approval' | 'succeeded' | 'failed' | 'disabled';

export type AiAgent = {
  code: string;
  name: string;
  department: string;
  responsibility: string;
  canAutoExecute: boolean;
  requiresAdminApproval: boolean;
  status: AgentStatus;
  examScope: string[];
  publicLabel: string;
  internalLabel: string;
};

const ALL_EXAMS = ['ALL'];

export const AI_AGENTS: AiAgent[] = [
  // Academic
  { code: 'AGENT-QGEN-01', name: 'Question Generator', department: 'Academic', responsibility: 'Automatic question generation is disabled; source, answer-key, coverage, and approval workflow are not verified', canAutoExecute: false, requiresAdminApproval: true, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Question Generator', internalLabel: 'Question Generator Service' },
  { code: 'AGENT-REVIEW-01', name: 'Question Reviewer', department: 'Academic', responsibility: 'No controlled human-review workflow is verified', canAutoExecute: false, requiresAdminApproval: true, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Question Reviewer', internalLabel: 'Question Review Service' },
  { code: 'AGENT-QUAL-01', name: 'Quality Auditor', department: 'Academic', responsibility: 'No end-to-end question-quality audit job is verified', canAutoExecute: false, requiresAdminApproval: true, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Quality Auditor', internalLabel: 'Quality Audit Service' },
  // Evaluation
  { code: 'AGENT-WRITE-01', name: 'Writing Evaluator', department: 'Evaluation', responsibility: 'Generic local writing suggestions only; no exam-specific rubric, calibrated band, or human validation', canAutoExecute: true, requiresAdminApproval: false, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Writing Evaluation', internalLabel: 'Writing Evaluation Agent' },
  { code: 'AGENT-SPEAK-01', name: 'Speaking Evaluator', department: 'Evaluation', responsibility: 'Speaking score disabled; transcript-only hints are not acoustic or pronunciation assessment', canAutoExecute: true, requiresAdminApproval: false, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Speaking Evaluation', internalLabel: 'Speaking Evaluation Agent' },
  { code: 'AGENT-INTERVIEW-01', name: 'Interview Simulator', department: 'Evaluation', responsibility: 'Provides local topic-coverage prompts only; no eligibility, risk, or outcome assessment', canAutoExecute: true, requiresAdminApproval: false, status: 'registered', examScope: ['VISA-INTERVIEW'], publicLabel: 'ALO Interview Coach', internalLabel: 'Interview Simulation Agent' },
  // Operations
  { code: 'AGENT-CONDUCT-01', name: 'Exam Conductor', department: 'Operations', responsibility: 'Attempt pipeline persists objective indicators in code; database round-trip is not verified', canAutoExecute: true, requiresAdminApproval: false, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Exam Conductor', internalLabel: 'Exam Conductor Agent' },
  { code: 'AGENT-REPORT-01', name: 'Smart Report Generator', department: 'Operations', responsibility: 'No separate report-generation workflow is verified; score confidence is unavailable', canAutoExecute: true, requiresAdminApproval: false, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Smart Report', internalLabel: 'Smart Report Service' },
  { code: 'AGENT-CERT-01', name: 'Certificate Agent', department: 'Operations', responsibility: 'Certificate issuance and verification workflow are not verified', canAutoExecute: true, requiresAdminApproval: false, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Certify', internalLabel: 'Certificate Service' },
  { code: 'AGENT-QUOTA-01', name: 'Quota Enforcer', department: 'Operations', responsibility: 'Quota checks exist in backend code; live database and concurrent-use verification are pending', canAutoExecute: true, requiresAdminApproval: false, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Quota System', internalLabel: 'Quota Service' },
  { code: 'AGENT-PROCTOR-01', name: 'Digital Proctor', department: 'Operations', responsibility: 'No verified consent-based monitoring or proctoring workflow is active', canAutoExecute: true, requiresAdminApproval: false, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Digital Proctor', internalLabel: 'Proctor Service' },
  // Integration
  { code: 'AGENT-CRM-01', name: 'CRM Sync Agent', department: 'Integration', responsibility: 'CRM synchronization provider, credentials, and end-to-end delivery are not verified', canAutoExecute: true, requiresAdminApproval: false, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO CRM Sync', internalLabel: 'CRM Sync Service' },
  // Finance
  { code: 'AGENT-INVOICE-01', name: 'Invoice Agent', department: 'Finance', responsibility: 'Invoice generation/provider workflow is not verified', canAutoExecute: true, requiresAdminApproval: false, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Invoicing', internalLabel: 'Invoice Service' },
  // Marketing
  { code: 'AGENT-SEO-01', name: 'SEO Content Agent', department: 'Marketing', responsibility: 'Static draft helper only; no automated generation or publishing integration is verified', canAutoExecute: false, requiresAdminApproval: true, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO SEO Assistant', internalLabel: 'SEO Content Service' },
  { code: 'AGENT-LEAD-01', name: 'Lead Capture Agent', department: 'Marketing', responsibility: 'Lead submission route exists; database persistence and downstream delivery are not verified', canAutoExecute: true, requiresAdminApproval: false, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Lead Capture', internalLabel: 'Lead Service' },
  // Compliance
  { code: 'AGENT-AUDIT-01', name: 'Audit Logger', department: 'Compliance', responsibility: 'Audit logging code exists for selected actions; coverage and immutability are not verified', canAutoExecute: true, requiresAdminApproval: false, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Audit System', internalLabel: 'Audit Logger' },
  { code: 'AGENT-GOV-01', name: 'Governance Overseer', department: 'Compliance', responsibility: 'No complete, tested governance and approval workflow is verified', canAutoExecute: false, requiresAdminApproval: true, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Governance', internalLabel: 'Governance Overseer' },
  // Academic (continued)
  { code: 'AGENT-TRAIN-01', name: 'Training Coordinator', department: 'Academic', responsibility: 'No agent-training execution workflow is verified', canAutoExecute: false, requiresAdminApproval: true, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Training', internalLabel: 'Training Coordinator' },
  { code: 'AGENT-FEEDBACK-01', name: 'Feedback Analyzer', department: 'Academic', responsibility: 'No feedback-analysis workflow is verified', canAutoExecute: true, requiresAdminApproval: false, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Feedback Analysis', internalLabel: 'Feedback Analyzer' },
  // Operations (continued)
  { code: 'AGENT-AMB-01', name: 'Ambassador Coordinator', department: 'Operations', responsibility: 'Referral and partner code exists; commission calculation and payout are not verified', canAutoExecute: true, requiresAdminApproval: false, status: 'registered', examScope: ALL_EXAMS, publicLabel: 'ALO Ambassador System', internalLabel: 'Ambassador Coordinator' },
];

export function getAgentStats() {
  const total = AI_AGENTS.length;
  const byDept = AI_AGENTS.reduce((acc, a) => {
    acc[a.department] = (acc[a.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const autoExecute = AI_AGENTS.filter(a => a.canAutoExecute).length;
  const requiresApproval = AI_AGENTS.filter(a => a.requiresAdminApproval).length;
  const ready = AI_AGENTS.filter(a => a.status === 'ready').length;
  return {
    total,
    byDept,
    autoExecute,
    requiresApproval,
    ready,
    readinessStatus: 'NOT_VERIFIED' as const,
  };
}
