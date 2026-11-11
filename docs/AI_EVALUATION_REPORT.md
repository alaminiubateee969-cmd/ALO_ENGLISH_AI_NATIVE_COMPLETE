# AI Evaluation Report

**Last updated:** 2026-10-19  
**Report status:** the platform's own evaluation agent is implemented, wired into
the attempt pipeline and exercised end to end. It is **practice feedback only**:
it produces no band, grade or score, and it has not been calibrated against
human raters.

## What the platform now does

| Capability | Source evidence | What the result means |
| --- | --- | --- |
| Objective answer grading | `src/lib/exam/grading.ts`, `/api/attempts/submit` | Supported objective items are checked against the stored answer key. Deterministic grading of the local key — not a publisher score. A language model is deliberately **not** used to decide a multiple-choice answer. |
| Practice indicators | `src/lib/exam/indicators.ts`, `src/lib/agents/ExamConductorAgent.ts` | Listening/reading accuracy ratio is mapped linearly to `0–9` and the available sections are averaged. Writing and speaking stay null in the `Score` row. |
| **Writing evaluation (the platform's own agent)** | `src/lib/ai/evaluation/ai-evaluation.ts`, `src/lib/ai/evaluation/rubrics.ts` | The written response is assessed against the rubric **for the learner's own exam** — the tasks that exam contains and the criteria that matter for it. The result is criterion-level qualitative feedback: strengths, what to improve, next steps. No band, grade or score. |
| **Speaking evaluation (the platform's own agent)** | same modules, `SPEAKING` section | The speaking transcript is assessed against the same kind of rubric. It is **transcript-based only**: nothing about pronunciation, accent, intelligibility, pace or pausing is inferred or reported. |
| Rubric coverage | `src/lib/ai/evaluation/rubrics.ts` | A rubric exists for **every exam the platform offers** (20 codes: ACT, ALO-PLACEMENT, CAMBRIDGE, DUOLINGO, GMAT, GRE, IELTS-A, IELTS-G, IELTS-UKVI, LANGUAGECERT, LINGUASKILL, LSAT, MCAT, OET, OIETC, PTE-A, SAT, TOEFL-iBT, TOEIC, VISA-INTERVIEW). An unknown code gets a generic rubric that discloses it. |
| Provider layer | `src/lib/ai/providers/ai-provider.ts`, `src/lib/ai/routing/ModelRouter.ts` | The only module that performs an outbound model call. Chain: Groq → OpenRouter → Gemini → HuggingFace → local rule engine. It never throws, never blocks a submission, and never sends student work when no credential is configured or `AI_ENABLED=false`. |
| Persistence | `AttemptEvaluation` model, `prisma/migrations/20261019060000_attempt_evaluation/` | One row per (attempt, section). The row records which engine produced the result (`providerUsed`) and whether the local rule engine was used as a fallback (`fallbackUsed`). |
| Retrieval of the result | `GET /api/attempts/:id/evaluation` | Owner or administrator only. Returns the stored evaluation document for each assessed section. |
| Speaking conversation/ASR/TTS | `src/lib/ai/examiner/ExaminerEngine.ts`, `/api/speaking/*` | Session-only conversational practice via `z-ai-web-dev-sdk`. It is not an exam attempt and produces no score. |
| RAG/handbook | `src/lib/ai/rag/RagEngine.ts`, `/api/rag/ask` | Retrieves active public materials and may call a model. Model answers may still be incomplete or wrong. |
| Automated learning | `src/lib/ai/learning/ExamOrchestrator.ts` | Daily generation returns `BLOCKED`; the post-submit learning hook is a no-op. No unvalidated agent writes are triggered. |

## How the agent behaves

1. The rubric for the exam is looked up. Its criteria are the only criterion
   keys the model may comment on; anything else the model invents is dropped.
2. The prompt carries the exam, the task, the task prompt the learner was
   given, the evaluation focus, the criteria, and the learner's work inside a
   `<student_work>` block that is explicitly labelled as untrusted data.
3. The model's answer is validated against a strict schema. If it does not
   match, or if it yields no usable criterion comment, the result is **not**
   guessed at: the local rule engine produces the evaluation instead and the
   row records `fallbackUsed = true`.
4. The result is persisted and returned to the learner with its disclosure.

## Verification performed (2026-10-19)

- `bun test tests/` — **151 pass, 0 fail across 14 files** (696 assertions).
  `tests/ai-evaluation-layer.test.ts` covers: rubric coverage for all 20 exam
  codes; no acoustic claim in any speaking criterion; generic fallback for an
  unknown code; the unverified-identity disclosure; the provider being
  unavailable without a credential; the router falling back to local; the
  local engine always being available; JSON parsing from plain, fenced and
  prose-wrapped responses; the evaluation falling back to the local rule engine
  with no provider; the result never containing a band/grade/score field; too
  short a response not being sent for evaluation; an exam with no spoken
  section producing no speaking evaluation.
- `npx tsc --noEmit` — 0 errors. `npx eslint .` — 0 findings.
- **End-to-end, against the running application** (local SQLite database seeded
  with the sample bank):
  - login → start attempt → submit writing + speaking answers → `200`,
    attempt `SCORED`;
  - the evaluation agent produced a document for **both** the `WRITING` and the
    `SPEAKING` section, each with the task type of that exam;
  - the score provider stayed `deterministic_objective` — the numeric result is
    still computed only from the objective grader;
  - both documents were persisted and were read back through
    `GET /api/attempts/:id/evaluation` (200, 2 rows).
- **The model path was exercised** against a local OpenAI-compatible mock
  provider, with `AI_ENABLED=true` and a provider key present. The prompt
  received by the provider was captured and inspected: it contained the exam,
  the task, the learner's task prompt, the rubric criteria and the delimited
  student work. A criterion key invented by the model was dropped by the
  validator, and a response that commented only on out-of-scope criteria was
  rejected in favour of the local rule engine.

**Not verified:** no live provider credential was used, so no real model was
called. There is no human-rated benchmark, no agreement statistic, no cost or
latency measurement, and no production traffic through this path.

## Important limitations

1. The `0–9` objective indicator is a linear accuracy mapping, not IELTS band
   conversion or a score scale for PTE, TOEFL, DET, OET, GRE, GMAT, SAT, ACT,
   LSAT, or MCAT.
2. A correct answer key does not establish that a question is current,
   authorized, unambiguous, or aligned with its claimed exam.
3. The writing and speaking evaluation is **qualitative**. No rubric here has
   been calibrated against human raters, so no band, grade or score is
   published, and none is written to the `Score` row.
4. A transcript cannot support acoustic conclusions. Nothing about
   pronunciation, accent, intelligibility, pace or pausing is assessed.
5. Provider confidence from ASR is returned as uncalibrated; exam results set
   confidence to null/not calibrated.
6. RAG "citation" is a short retrieved-text excerpt/material title, not a
   scholarly citation or guarantee of grounding. Prompt instructions cannot
   prevent hallucinations.
7. The evaluation agent is only as good as the model behind it. When the model
   misbehaves, the platform falls back — it does not publish the misbehaviour.
8. The speaking evaluation is only produced when the attempt carries a
   transcript. A typed transcript is not a recording, and the platform says so
   wherever the result is shown.
9. The rubric for `OIETC` is generic because that product's identity has not
   been verified. The result must not be presented as being against any named
   test.
10. The static AI/agent UI data in unused prototype components is not runtime
    telemetry. The active `/api/agents/status` endpoint describes its registry
    as static and readiness as `NOT_VERIFIED`.

## Required evaluation plan before any scoring claim

- Freeze versioned, authorized prompts and answer keys by exam product and
  task type.
- Establish human-expert rubrics and double-rated benchmark samples; report
  agreement and per-dimension error, calibration, and subgroup/fairness
  metrics.
- Test adversarial inputs, prompt injection, empty/noisy audio, transcription
  errors, language/dialect variation, missing media, timeouts, provider
  failure, and duplicate submissions.
- Keep accent/dialect differences distinct from pronunciation errors; do not
  infer pronunciation from transcript text.
- Document user consent, external-provider data processing, recording
  retention/deletion, model/version/prompt lineage, fallback behavior,
  latency/cost limits, and incident review.
- Keep automated generation, memory writes, self-evolution, and official-score
  language disabled until approved and audited.

The evaluation agent is implemented and working. It is **not** a validated
scoring system, and it must not be presented as one.
