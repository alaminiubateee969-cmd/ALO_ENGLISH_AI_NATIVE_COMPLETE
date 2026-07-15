# AI Agent Training & Update Guide

## Overview
The ALO English Test Platform uses 20 internal AI Agent Employees that are trained and updated through a structured workflow. No agent prompt auto-updates live without admin approval.

## Training Tables (6 + 1 rule versions)
1. `exam_ai_agent_training_modules` — 12 training modules
2. `exam_ai_agent_training_runs` — Individual training run records (agent × module)
3. `exam_ai_agent_knowledge_base` — Agent rules, rubrics, templates, references
4. `exam_ai_agent_update_logs` — Update workflow records (draft → approval → publish)
5. `exam_ai_agent_model_versions` — Model version tracking
6. `exam_ai_agent_quality_scores` — Daily quality metrics per agent
7. `exam_rule_versions` — Exam rule version history

## 12 Training Modules
| Code | Name | Pass Score |
|---|---|---|
| TC-M01-CONDUCT | Exam Conduct Rules | 80% |
| TC-M02-ORIGINALITY | Question Originality | 85% |
| TC-M03-SCORING | Scoring Rubric | 80% |
| TC-M04-COMPLIANCE | Compliance Wording | 85% |
| TC-M05-QUOTA | Free Quota Enforcement | 80% |
| TC-M06-REPORT | Report Generation | 80% |
| TC-M07-CRM | CRM Sync | 80% |
| TC-M08-WEEKLY | Weekly Update Process | 85% |
| TC-M09-SPEAKING | Speaking Evaluation Rubric | 80% |
| TC-M10-WRITING | Writing Evaluation Rubric | 80% |
| TC-M11-INTERVIEW | Interview Evaluation Rubric | 80% |
| TC-M12-ESCALATION | Student Support Escalation | 80% |

## 12-Step Agent Update Workflow
1. Weekly exam rule review
2. Weekly question bank health check
3. Draft new original questions
4. Quality check
5. Compliance check
6. Rubric check
7. Admin approval (REQUIRED — no auto-publish)
8. Publish approved update
9. Version old rules/questions
10. Log training/update
11. Update agent prompt/template if approved
12. Report changes to admin dashboard

## Admin Dashboard Metrics
- Last agent training date
- Next training date
- Training pass/fail rate
- Agent quality score
- Outdated agents
- Agents needing review
- Compliance warnings
- Weekly update summary

## Critical Rule
**No agent prompt auto-updates live without admin approval.** All changes go through the 12-step workflow. Training runs verify agents against the latest rules, but prompt/template changes require explicit admin approval.

## Compliance
- All training content uses approved public labels only
- No "AI teacher", "bot", "robot", "fake human", "real examiner" wording
- Internal labels (admin-only) may use "Agent" terminology
- Every update is logged to `exam_ai_agent_update_logs` + `exam_audit_logs`
