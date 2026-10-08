# GLOBAL AI AGENT REGISTRY (§25) — 2026-09-18

## In-repo agents (this service) — from `src/lib/agents/registry.ts` + code inspection
| agent_id | Name | Purpose | Model | Tools/DB write | Auto-execute | Approval | Risk | Status |
|---|---|---|---|---|---|---|---|---|
| EVAL-EXAMINER | AI Voice Examiner (5 Bengali personas) | Live spoken exam via ASR→LLM→TTS | env-config (Groq optional; local rule engine fallback) | reads exam data; writes Attempt/Score | yes (scoped to the student's own session) | n/a (student-initiated) | LOW-MED | CONFIGURED (code); live sidecar NOT in CD — WARNING |
| EVAL-WRITING | WritingEvaluationAgent | Essay/task scoring | Groq optional + rules | writes Score | yes | post-hoc admin review (registry flag) | LOW | CONFIGURED |
| EVAL-SPEAKING | SpeakingEvaluationAgent | Spoken-response scoring | same | writes Score | yes | post-hoc | LOW | CONFIGURED |
| GEN-QUESTION | QuestionGeneratorAgent | Daily question generation | same | writes Question/DailyQuestionSet | yes | cron-gated (CRON_ENABLED default false) | MED | CONFIGURED (disabled by default ✅ §110) |
| AGENT-CONDUCTOR | ExamConductorAgent | Exam session orchestration | rules | session state | yes | n/a | LOW | CONFIGURED |
| AGENT-INTERVIEW | InterviewSimulationAgent | Visa/college interview practice | same | session state | yes | n/a | LOW | CONFIGURED |
| SELF-BUILDER | AgentSelfBuilder (learning loop) | Creates new AgentSpecialist rows from weakness patterns | rules | writes AgentSpecialist/AgentEvolution | yes | **NO human gate on creation** | MED | CONFIGURED — recommend approval gate (§71/§110) |
| ORCH-LEARNING | learning/orchestrator | Daily learning loop driver | rules | LearningMemory | yes | n/a | LOW | CONFIGURED |
| RAG-HANDBOOK | RagEngine (public handbook chat) | Grounded Q&A over public materials | z-ai SDK / fallback | read-only (isPublic-filtered) | yes | n/a | LOW | CONFIGURED |

Registry metadata (departments, `canAutoExecute`, `requiresAdminApproval`) is exposed
PUBLICLY at `/api/agents/status` (S-10).

## What these agents CANNOT do (verified absence in code)
- No shell/exec/spawn anywhere in `src/` agent code. No filesystem writes outside Prisma DB.
- No network egress except: Groq API (optional, env-keyed) and z-ai SDK. No SSH. No deploy path.
- No MCP: zero MCP references in tracked code → MCP registry for this service is EMPTY.
- No permission/policy self-modification: AgentSelfBuilder writes agent *data rows*, not
  permissions, prompts-of-record, or security policy (§68 respected in kind; add human gate).

## Ecosystem agents OUTSIDE this repo
| Domain | Agent evidence | Registry status |
|---|---|---|
| bdtech360.com | PUBLIC chat agent "TECH360 Assistant — Real AI Agent" (OBSERVED on live site) | EXTERNAL — UNKNOWN model/tools/policy → security review REQUIRED before integration (§2.11) |
| agents.alolabs.net | reported AI-agent infrastructure; site unreachable | UNKNOWN — inspect when reachable |
| panel.alolabs.net | reported privileged panel | UNKNOWN — treat ZONE 4+ |

Kill switches (§73): none exist yet anywhere → build into central config (proposed,
docs/GLOBAL-CENTRAL-CONFIGURATION.md). Budgets/loops (§66/§67): GroqClient has timeout +
bounded retries-by-null; examiner-stream has per-session state maps but NO session/time
budget caps yet → TODO before production reliance.
