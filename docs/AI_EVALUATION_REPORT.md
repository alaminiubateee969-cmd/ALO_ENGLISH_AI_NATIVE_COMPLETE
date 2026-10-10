# AI Evaluation Report

**Audit date:** 2026-10-10  
**Report status:** BLOCKED for provider-backed assessment; practice-only code boundaries are documented below.

## What is implemented in source

| Capability | Source evidence | What the result means |
| --- | --- | --- |
| Objective answer grading | `src/lib/exam/grading.ts`, `/api/attempts/submit` | Supported objective items are checked against stored answer keys. This is deterministic grading of the local key, not a human-validated answer key or publisher score. |
| Practice indicators | `src/lib/exam/indicators.ts`, `src/lib/agents/ExamConductorAgent.ts` | Listening/reading accuracy ratio is mapped linearly to `0–9` and the available sections are averaged. Writing and speaking remain null. The response discloses that this is not an official score. |
| Writing suggestions | `src/lib/agents/WritingEvaluationAgent.ts` | Local text heuristics return word count and generic revision suggestions. No task-specific rubric, numeric band, confidence, or human-rated validation is returned. |
| Speaking transcript suggestions | `src/lib/agents/SpeakingEvaluationAgent.ts` | Generic transcript-only prompts; no acoustic, fluency, pronunciation, timing, intelligibility, or accent score. |
| Speaking conversation/ASR/TTS | `src/lib/ai/examiner/ExaminerEngine.ts`, `/api/speaking/*` | Source calls the configured `z-ai-web-dev-sdk` for conversation, speech transcription, and examiner voice synthesis. This is not proof a provider is configured or reachable. |
| RAG/handbook | `src/lib/ai/rag/RagEngine.ts`, `/api/rag/ask` | Retrieves active public materials and may call a model. The former chunk-count “confidence” value was removed because it was not calibrated. Model answers may still be incomplete or wrong. |
| Automated learning | `src/lib/ai/learning/ExamOrchestrator.ts` | Daily generation returns `BLOCKED`; post-submit learning hook is a no-op and recommendations return null. No unvalidated agent writes are triggered. |

## Verification performed

- Pure AI disclosure tests in `tests/ai-evaluation.test.ts` passed during the available `npx bun test tests/` run: writing does not return a band/dimension score/confidence; interview practice does not return eligibility/risk/score; speaking transcript suggestions do not return acoustic/numeric scores.
- The latest test run was **not a full pass**: Bun reported 100 tests across 13 files, with 98 passing; `exam-attempt` and `rbac` errored before their tests ran (`Cannot find module '.prisma/client/default'`, client not generated). ESLint passes with no findings; `tsc --noEmit` reports only the 10 missing-Prisma-client errors. No model-provider call, prompt-injection test, output-quality benchmark, or human-rating comparison was run.
- No provider secret or `.env` value was read. No staging credentials, approved evaluation dataset, human rater, cost/latency dashboard, or consent/retention policy was available for validation.

## Important limitations

1. The `0–9` objective indicator is a linear accuracy mapping, not IELTS band conversion or a score scale for PTE, TOEFL, DET, OET, GRE, GMAT, SAT, ACT, LSAT, or MCAT.
2. A correct answer key does not establish that a question is current, authorized, unambiguous, or aligned with its claimed exam.
3. Writing suggestions are generic heuristics; they do not assess task achievement, rubric criteria, source use, plagiarism, or language quality with calibrated reliability.
4. A transcript cannot support acoustic conclusions. The transcription route has bounded Base64 input, but the call/provider is not tested, and that route does not persist a securely attempt-linked recording.
5. Provider confidence from ASR is returned as uncalibrated; exam results set confidence to null/not calibrated. No confidence-based review thresholds are verified.
6. RAG “citation” is a short retrieved-text excerpt/material title, not a scholarly citation or guarantee of grounding. Prompt instructions cannot prevent hallucinations.
7. Legacy static AI/agent UI data in unused prototype components is not runtime telemetry. The active `/api/agents/status` endpoint correctly describes its registry as static and readiness as `NOT_VERIFIED`.

## Required evaluation plan before any scoring claim

- Freeze versioned, authorized prompts and answer keys by exam product and task type.
- Establish human-expert rubrics and double-rated benchmark samples; report agreement and per-dimension error, calibration, and subgroup/fairness metrics.
- Test adversarial inputs, prompt injection, empty/noisy audio, transcription errors, language/dialect variation, missing media, timeouts, provider failure, and duplicate submissions.
- Keep accent/dialect differences distinct from pronunciation errors; do not infer pronunciation from transcript text.
- Document user consent, external-provider data processing, recording retention/deletion, model/version/prompt lineage, fallback behavior, latency/cost limits, and incident review.
- Keep automated generation, memory writes, self-evolution, and official-score language disabled until approved and audited.

Provider-backed evaluation is **BLOCKED**. Existing source and disclosure tests support only limited practice behavior; they do not establish accuracy, fairness, or production readiness.
