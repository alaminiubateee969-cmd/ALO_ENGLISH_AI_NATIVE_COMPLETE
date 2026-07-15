# AI Agent Governance Framework — 5-Step Control System

## Overview
Every AI Agent Employee operates under a strict 5-step governance framework that prevents uncontrolled actions, protects infrastructure, and ensures continuous improvement with admin oversight.

## STEP 1 — Single Objective Lock
Each AI performs ONE responsibility only. Never combines unrelated responsibilities.

**Per-agent objective includes:**
- Single Objective (text)
- Measurable Output (text)
- Allowed Workflows (JSON array)
- Forbidden Workflows (JSON array)
- Success Condition (text)
- Failure Condition (text)

**Enforcement:** `AiGovernanceService::validateWorkflow(agentId, workflow)` checks allowed/forbidden lists before every action. Forbidden workflows are rejected + audit-logged.

**Example:**
- Scoring Agent objective: "Calculate estimated score, map by exam type"
- Allowed: `["score.calculate", "scale.map", "practice.label"]`
- Forbidden: `["writing.evaluate", "speaking.evaluate", "certificate.revoke"]`

## STEP 2 — Structured Memory Layer
Memory is permission-controlled. AI may use:
- Current Task Memory
- Infrastructure SOP
- Hosting Documentation
- Department Knowledge
- Approved RAG Documents
- Configuration Templates

**Rules:**
- AI may NOT permanently learn without admin approval (`is_approved = 0` on write)
- `AiGovernanceService::writeMemory()` always sets `is_approved = 0`
- `AiGovernanceService::readMemory()` only returns `is_approved = 1` entries
- Admin must explicitly approve memory via `approveMemory()`
- Infrastructure memory never leaks between companies (access_level: private/department/system/public)

## STEP 3 — Tool Isolation
Every tool runs independently. Modules:
- Backup Module
- Monitoring Module
- Deployment Module
- AI Runtime Module
- Database Module
- Email Module
- CRM Module
- Scoring Module
- Report Module
- Certificate Module
- Voucher Module
- Proctor Module

**Rules:**
- Each tool has: `max_retries`, `timeout_seconds`, `fallback_tool_code`
- `AiGovernanceService::executeTool()` retries on failure, then uses fallback
- If fallback also fails: platform CONTINUES (logged, but not blocked)
- Tool failures logged to `exam_ai_agent_tool_failures` with `platform_continued = 1`
- One tool failure NEVER stops the complete platform

## STEP 4 — Controlled Decision Pipeline
AI never makes uncontrolled decisions. Every request follows 14 stages:

```
Input → Authentication → RBAC Verification → Protection Mode →
Payment Guard → Infrastructure Validation → Workflow Selection →
AI Selection → Tool Selection → Execution → Verification →
Logging → Review → Learning Suggestion → Approval (if required) →
Completed
```

**Enforcement:**
- `AiGovernanceService::startPipeline()` creates a pipeline record
- `AiGovernanceService::advanceStage()` moves through stages with history
- `AiGovernanceService::rejectPipeline()` blocks at any stage (e.g., RBAC fail, payment block)
- Full stage history stored in JSON column
- Every stage transition is audit-logged

**NEVER:**
- Modify production without validation
- Delete customer data
- Expose secrets
- Bypass approval
- Skip logging

## STEP 5 — Feedback & Continuous Improvement
After every task, generate reports:
- Infrastructure Report
- Performance Report
- Security Report
- Resource Report
- Backup Report
- Error Report
- Optimization Suggestions
- Learning Suggestions

**Rules:**
- `AiGovernanceService::generateFeedback()` creates feedback with `is_approved = 0`
- Permanent improvements require administrator approval via `approveFeedback()`
- AI may NOT auto-approve its own suggestions
- All feedback is audit-logged

## Database Tables (6)
1. `exam_ai_agent_objectives` — Single objective locks (21 agents)
2. `exam_ai_agent_memory` — Permission-controlled memory layer
3. `exam_ai_agent_tools` — Tool registry with fallback chains
4. `exam_ai_agent_tool_failures` — Tool failure + fallback logs
5. `exam_ai_decision_pipelines` — 14-stage decision pipeline records
6. `exam_ai_agent_feedback` — Feedback + learning suggestions (admin-approved)

## Settings (12 governance flags)
- `governance_framework_enabled = 1`
- `governance_single_objective_lock = 1`
- `governance_memory_isolation = 1`
- `governance_tool_isolation = 1`
- `governance_decision_pipeline = 1`
- `governance_feedback_loop = 1`
- `governance_auto_learning = 0` (AI may NOT permanently learn without approval)
- `governance_production_action_requires_approval = 1`
- `governance_never_delete_customer_data = 1`
- `governance_never_expose_secrets = 1`
- `governance_never_bypass_approval = 1`
- `governance_never_skip_logging = 1`
