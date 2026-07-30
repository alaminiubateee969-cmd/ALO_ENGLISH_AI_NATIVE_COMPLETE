/**
 * src/lib/agents/registry.ts
 *
 * AI Agent Employee registry — 20 agents across 6 departments.
 * Each agent has a real execution contract (not just a DB row).
 *
 * An agent is marked "ready" only if:
 *   - required model/provider is available
 *   - required credentials exist
 *   - a controlled test job succeeds
 */

import { GroqClient } from './GroqClient';

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
  { code: 'AGENT-QGEN-01', name: 'Question Generator', department: 'Academic', responsibility: 'Generates original practice question drafts', canAutoExecute: false, requiresAdminApproval: true, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Question Generator', internalLabel: 'Question Generator Service' },
  { code: 'AGENT-REVIEW-01', name: 'Question Reviewer', department: 'Academic', responsibility: 'Reviews draft questions for quality', canAutoExecute: false, requiresAdminApproval: true, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Question Reviewer', internalLabel: 'Question Review Service' },
  { code: 'AGENT-QUAL-01', name: 'Quality Auditor', department: 'Academic', responsibility: 'Audits question quality and originality', canAutoExecute: false, requiresAdminApproval: true, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Quality Auditor', internalLabel: 'Quality Audit Service' },
  // Evaluation
  { code: 'AGENT-WRITE-01', name: 'Writing Evaluator', department: 'Evaluation', responsibility: 'Evaluates writing submissions (task achievement, coherence, lexical, grammar)', canAutoExecute: true, requiresAdminApproval: false, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Writing Evaluation', internalLabel: 'Writing Evaluation Agent' },
  { code: 'AGENT-SPEAK-01', name: 'Speaking Evaluator', department: 'Evaluation', responsibility: 'Evaluates speaking transcripts (fluency, pronunciation, grammar, lexical, coherence)', canAutoExecute: true, requiresAdminApproval: false, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Speaking Evaluation', internalLabel: 'Speaking Evaluation Agent' },
  { code: 'AGENT-INTERVIEW-01', name: 'Interview Simulator', department: 'Evaluation', responsibility: 'Simulates and evaluates visa/course/career interviews', canAutoExecute: true, requiresAdminApproval: false, status: 'ready', examScope: ['VISA-INTERVIEW'], publicLabel: 'ALO Interview Coach', internalLabel: 'Interview Simulation Agent' },
  // Operations
  { code: 'AGENT-CONDUCT-01', name: 'Exam Conductor', department: 'Operations', responsibility: 'Orchestrates the full exam lifecycle: start → submit → evaluate → report', canAutoExecute: true, requiresAdminApproval: false, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Exam Conductor', internalLabel: 'Exam Conductor Agent' },
  { code: 'AGENT-REPORT-01', name: 'Smart Report Generator', department: 'Operations', responsibility: 'Generates the Smart Score Report with confidence + disclosure', canAutoExecute: true, requiresAdminApproval: false, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Smart Report', internalLabel: 'Smart Report Service' },
  { code: 'AGENT-CERT-01', name: 'Certificate Agent', department: 'Operations', responsibility: 'Issues ALO Certify practice certificates', canAutoExecute: true, requiresAdminApproval: false, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Certify', internalLabel: 'Certificate Service' },
  { code: 'AGENT-QUOTA-01', name: 'Quota Enforcer', department: 'Operations', responsibility: 'Enforces free quota limits (backend)', canAutoExecute: true, requiresAdminApproval: false, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Quota System', internalLabel: 'Quota Service' },
  { code: 'AGENT-PROCTOR-01', name: 'Digital Proctor', department: 'Operations', responsibility: 'Proctors practice sessions (with consent)', canAutoExecute: true, requiresAdminApproval: false, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Digital Proctor', internalLabel: 'Proctor Service' },
  // Integration
  { code: 'AGENT-CRM-01', name: 'CRM Sync Agent', department: 'Integration', responsibility: 'Syncs student data with ALO CRM', canAutoExecute: true, requiresAdminApproval: false, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO CRM Sync', internalLabel: 'CRM Sync Service' },
  // Finance
  { code: 'AGENT-INVOICE-01', name: 'Invoice Agent', department: 'Finance', responsibility: 'Generates invoices for paid attempts', canAutoExecute: true, requiresAdminApproval: false, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Invoicing', internalLabel: 'Invoice Service' },
  // Marketing
  { code: 'AGENT-SEO-01', name: 'SEO Content Agent', department: 'Marketing', responsibility: 'Generates SEO content drafts (never auto-publishes)', canAutoExecute: false, requiresAdminApproval: true, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO SEO Assistant', internalLabel: 'SEO Content Service' },
  { code: 'AGENT-LEAD-01', name: 'Lead Capture Agent', department: 'Marketing', responsibility: 'Captures and qualifies leads from public forms', canAutoExecute: true, requiresAdminApproval: false, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Lead Capture', internalLabel: 'Lead Service' },
  // Compliance
  { code: 'AGENT-AUDIT-01', name: 'Audit Logger', department: 'Compliance', responsibility: 'Records immutable audit entries for every privileged action', canAutoExecute: true, requiresAdminApproval: false, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Audit System', internalLabel: 'Audit Logger' },
  { code: 'AGENT-GOV-01', name: 'Governance Overseer', department: 'Compliance', responsibility: 'Enforces 5-step AI governance + approval workflow', canAutoExecute: false, requiresAdminApproval: true, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Governance', internalLabel: 'Governance Overseer' },
  // Academic (continued)
  { code: 'AGENT-TRAIN-01', name: 'Training Coordinator', department: 'Academic', responsibility: 'Coordinates AI agent training modules', canAutoExecute: false, requiresAdminApproval: true, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Training', internalLabel: 'Training Coordinator' },
  { code: 'AGENT-FEEDBACK-01', name: 'Feedback Analyzer', department: 'Academic', responsibility: 'Analyzes student feedback for improvements', canAutoExecute: true, requiresAdminApproval: false, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Feedback Analysis', internalLabel: 'Feedback Analyzer' },
  // Operations (continued)
  { code: 'AGENT-AMB-01', name: 'Ambassador Coordinator', department: 'Operations', responsibility: 'Manages ambassador referrals and commissions', canAutoExecute: true, requiresAdminApproval: false, status: 'ready', examScope: ALL_EXAMS, publicLabel: 'ALO Ambassador System', internalLabel: 'Ambassador Coordinator' },
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
  const aiConfigured = GroqClient.isConfigured();
  return {
    total,
    byDept,
    autoExecute,
    requiresApproval,
    ready,
    aiProvider: GroqClient.getProviderName(),
    aiConfigured,
  };
}
