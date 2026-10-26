# The AI Agent Workforce

**Status:** implemented and verified — 2026-10-19  
**Fourteen agents, each with a real execution handler.**

This document describes what the workforce is, how it runs, what it is allowed
to do, and what it is not allowed to do. The code is in
`src/lib/agents/runtime/`.

---

## 1. What an agent is here

An agent is **not a row in a dashboard**. The registry used to be a
hand-written list of twenty aspirational entries that all said "not verified".
It is now derived from the runtime's own definitions, so a dashboard can
never show an agent that is not registered, and the description of what an
agent does lives next to the handler that does the work.

Every agent has:

| Requirement | How it is met |
|---|---|
| A registered identity and version | `AgentDefinition.code` and `AgentDefinition.version`; the code is unique and the version is bumped when the handler changes |
| Explicit permissions | `AgentDefinition.permissions` — a list of capabilities, shown in the admin monitor |
| Defined input and output schemas | JSON Schema, checked at enqueue time and at completion time |
| A real execution handler | `AgentHandler` in `src/lib/agents/runtime/agents/` — every one does actual work |
| Persistent job records | `AgentJob` — one row per unit of work, with its status, attempts, error and result |
| Queue and retry handling | Exponential backoff with jitter, then dead-lettering |
| Idempotency protection | A unique `(idempotencyScope, idempotencyKey)` pair; a second enqueue returns the first job |
| Execution logs | `AgentJobEvent` — append-only, one row per transition |
| Measured success and failure | `AgentMetric` (daily counters) and the job table (the measurements the monitor reports) |
| Model/provider provenance | `AgentArtifact.provider`, `.model`, `.promptVersion` |
| Error alerts | Failures and dead-letters are visible in `/api/agents/metrics` and on `/admin/agents` |
| Resource limits | Per-agent time budget, retry budget, concurrency limit and input-size limit, all enforced |
| Admin monitoring | `/admin/agents`, `/api/agents/status`, `/api/agents/metrics`, `/api/agents/jobs`, `/api/agents/approvals` |
| Automated integration tests | `tests/agent-workforce.test.ts` — 45 tests that run the real handlers against the real database |

---

## 2. The fourteen agents

| # | Code | What it actually does |
|---|---|---|
| 001 | `AGENT-EXAM-ORCHESTRATOR-01` | Creates and manages real exam sessions: reserves the attempt, allocates the question set from the exam blueprint, freezes the allocation, sets the server-authoritative deadline. Refuses to start a second attempt for a learner who already has one, and refuses a set whose listening audio is not READY. |
| 002 | `AGENT-QUESTION-GEN-02` | Generates original, blueprint-aligned question drafts. Objective items come from a deterministic generator whose answer key is **correct by construction**; a model may improve the wording but never the key. Refuses an exam with no blueprint. |
| 003 | `AGENT-QUALITY-GATE-03` | Checks a draft for correctness, rubric compliance, ambiguity, originality, answer-key validity and difficulty. A passing draft is raised for human approval. **It never publishes anything by itself.** |
| 004 | `AGENT-SPEAKING-EXAMINER-04` | Evaluates a submitted speaking transcript against the rubric for the learner's own exam. Transcript-based only: no acoustic property is assessed and no score is produced. Records rubric coverage, which is the examiner's own consistency measure. |
| 005 | `AGENT-WRITING-EXAMINER-05` | Evaluates a written submission against the rubric for the learner's own exam and the task the learner was given, with the rubric version and the producing model recorded. |
| 006 | `AGENT-MEDIA-06` | Creates listening audio, validates the resulting file, and records the asset's status. An asset is READY only after it has been verified; a failed asset is recorded with its reason, and **no placeholder audio is ever written**. |
| 007 | `AGENT-TEACHER-07` | Builds a study plan from the learner's real attempt history. A learner with no attempts gets a plan that says so, not a flattering one. |
| 008 | `AGENT-ADAPTIVE-08` | Chooses the next practice step from real performance, and never recommends a question the learner has already seen outside an explicit revision. |
| 009 | `AGENT-DAILY-09` | Creates and schedules the day's validated exercise from the learner's unseen pool. The set is created **inactive** and waits for a human. |
| 010 | `AGENT-ANALYTICS-10` | Computes real performance, weaknesses, improvement trends and readiness indicators from actual attempts, scores and evaluations, and writes per-item difficulty back to the exam analytics table. |
| 011 | `AGENT-CRM-SYNC-11` | Synchronises exam progress into the CRM using a **fixed field allowlist in code**. It copies no answer, no document and no personal identifier, and the allowlist is checked at run time so it cannot be widened by accident. |
| 012 | `AGENT-SECURITY-12` | Scans for suspicious activity: repeated failed logins, abandoned attempts, answer keys in stored payloads, and failed or dead-lettered jobs. It reports; it does not lock accounts or penalise a learner. |
| 013 | `AGENT-MODEL-ROUTER-13` | Probes the self-hosted model server and every configured external provider, and shows the routing order a request would actually take. |
| 014 | `AGENT-QUALITY-IMPROVE-14` | Measures the workforce's own recent output and proposes safe improvements. Every proposal goes to a human; it cannot change a prompt, a rubric or the code by itself. |

The platform's own services that are **not** agents are listed separately in
the registry as `PLATFORM_SERVICES` (the speaking practice conversation, the
handbook Q&A, the transcription route, the evaluation layer, the model
provider seam, the exam engine). They are routes and libraries, and saying so
is more honest than giving them a fake agent identity.

---

## 3. The queue

`src/lib/agents/runtime/queue.ts`.

**Why SQLite and not BullMQ.** BullMQ needs Redis. The production deployment
is a single Hostinger node with a SQLite database and no Redis, and adding a
Redis service would mean a second thing that can be down. The queue therefore
lives in the same database as everything else and keeps the properties that
matter:

- a claimed job is **leased**, so a crashed worker cannot lose it;
- a failing job is **retried with exponential backoff and jitter**, then
  dead-lettered;
- an enqueue can be made **idempotent**, so a retried request does not do the
  work twice;
- every transition is a **row**, so the admin monitor can show what happened.

The interface is deliberately close to BullMQ's (`enqueue` / `claim` /
`complete` / `fail` / `retry`), so swapping in Redis later is a contained
change and not a rewrite of every agent.

**Atomicity.** A claim is a single `UPDATE` whose `WHERE` clause names the job
id *and* requires the status to still be `QUEUED`, so exactly one worker can
win the race; the loser sees zero affected rows and moves on. There is no
read-then-write window.

**Ordering.** Jobs are processed in `runAfter, createdAt` order within the
queue, and the per-agent concurrency limit is enforced by counting the jobs
currently `RUNNING` for that agent.

---

## 4. The approval gate

This is the most important property of the whole design.

> **No agent can publish content, change a rubric, or change the code.**

The quality gate writes a draft to `AgentArtifact` and raises an
`AgentApproval`. A draft becomes a live question only when an administrator
approves it and the publish job runs. The publish job **re-checks the
approval's status**, so approving twice cannot publish twice, and it is
idempotent on the approval id, so a repeated approval cannot create a second
publish.

Verified end to end against the running application:

```
GENERATE  → 3 drafts, provider=deterministic_generator, blueprint=2026.1
GATE      → passed: true, checked: 3, failed: 0, approvalId: cmvexgush…
BEFORE approval → questions in the set: 0    (nothing published)
AFTER  approval → publish job created, questions in the set: 3
RE-RUN the same seed → gate rejects: duplicate_of_existing
```

That last line matters: the duplicate check is real, and it caught a genuine
duplicate during the verification run.

---

## 5. The self-hosted model server

`src/lib/ai/local/endpoint.ts`.

The platform must not depend on a paid external API, and it must not send
learner work to a third party by default. The self-hosted server is therefore
tried **first**.

| Environment variable | Meaning |
|---|---|
| `AI_LOCAL_MODEL_ENABLED` | `true` to switch it on (default: off) |
| `AI_LOCAL_MODEL_ENDPOINT` | e.g. `http://127.0.0.1:8080/v1/chat/completions` |
| `AI_LOCAL_MODEL_NAME` | the model id the server advertises |
| `AI_LOCAL_MODEL_MAX_CONCURRENCY` | how many requests may run at once (default 2) |
| `AI_LOCAL_MODEL_TIMEOUT_MS` | per-request timeout (default 60000) |
| `AI_LOCAL_MODEL_CIRCUIT_FAILURES` | failures before the circuit opens (default 3) |
| `AI_LOCAL_MODEL_CIRCUIT_COOLDOWN_MS` | how long the circuit stays open (default 30000) |
| `AI_LOCAL_MODEL_CACHE_ENTRIES` / `_CACHE_TTL_MS` | the bounded response cache |

The endpoint is any server that speaks the OpenAI chat-completions shape:
llama.cpp's `llama-server`, Ollama, vLLM, or an internal gateway.

It provides:
* a **health probe** (`/v1/models`, then `/models`, then `/health`);
* a **circuit breaker** — a server that is down is not hammered by every agent
  that happens to wake up;
* a **concurrency-limited queue** — twenty agents waking at once must not
  produce twenty simultaneous requests on a two-core box;
* a **bounded TTL cache**, so the same rubric evaluation is not recomputed for
  every learner who answers the same task;
* **token accounting**.

When it is not configured, `complete()` falls through to the next provider in
the chain and, at the end, to the deterministic rule engine. **Nothing breaks
and nothing is pretended.**

### What is blocked in this environment

**Hugging Face is not reachable from the audit sandbox** (`huggingface.co`
resolves but every connection is refused), so model weights could not be
downloaded and a local model server could not be stood up here. The
infrastructure is built, tested and configurable; provisioning a server is an
external blocker, and it is documented as one rather than glossed over.

The sandbox this was built in has **2 vCPU, 3.8 GB RAM and no GPU**. A large
general-purpose model would not run usefully on that. The realistic
self-hosted choices for this class of machine are a 1.5B–3B instruct model
(Qwen2.5-3B-Instruct, Llama-3.2-3B-Instruct, Gemma-2-2B-it) for reasoning,
whisper.cpp `base`/`small` for speech recognition, Piper for speech synthesis,
and a small ONNX sentence-transformer for embeddings. Each is a decision for
the operator with the real hardware in front of them.

---

## 6. The daily question pipeline

`scripts/daily-question-pipeline.mjs` → `npm run agents:daily`.

```
Research → Generate → Validate → Check Duplicates → Verify Answers
→ Assign Difficulty → Approve → Publish → Allocate → Analyze
```

Every stage is a real job in the platform's own queue. The script does not
generate anything itself; it drives the agents that do.

* **Generate** — Agent 002, per exam family, from the exam's versioned
  blueprint.
* **Validate / Check Duplicates / Verify Answers / Assign Difficulty** — Agent
  003, the quality gate. It checks the type against the blueprint, checks the
  answer key for consistency with the type, checks that the keyed option is
  in range, checks that the options are distinct, checks for placeholder text,
  checks the difficulty range, and checks the prompt against every question
  already in the bank and against the rest of the batch.
* **Approve** — a human. Always.
* **Publish** — the publish job, which runs only after the approval.
* **Analyze** — Agent 010.

The pipeline covers the nine principal examination families plus the eleven
others the platform already offers.

**Nothing is copied from any exam provider.** The generator composes invented
places, organisations and facts at run time. The output is original practice
material; it is not a reproduction of anyone's paper and it is not an official
past paper.

**The platform's real bank, recounted from the database** (2026-10-19, the
seeded sample bank — *not* the historical baselines in the brief):

| Exam family | Questions in the database |
|---|---|
| IELTS Academic | 93 |
| IELTS General Training | 25 |
| TOEFL iBT | 22 |
| PTE Academic | 12 |
| Duolingo English Test | 12 |
| GRE | 21 |
| GMAT | 11 |
| Digital SAT | 11 |
| ACT | 11 |
| ALO Placement | 12 |
| Cambridge | 15 |
| OET | 17 |
| TOEIC | 5 |
| IELTS UKVI / LanguageCert / Linguaskill / OIETC | 5 each |
| MCAT | 12 |
| LSAT | 10 |
| Visa Interview Practice | 11 |
| **Total** | **320** (261 objective, 59 subjective) |

The nine principal families hold **203** of those 320 questions, against a
historical baseline of 395. **The gap is real and is reported here rather than
papered over.** The agent pipeline is the mechanism for closing it, at a rate
of one validated item per exam family per day, gated on human review.

---

## 7. Running it

```bash
# Drain the queue once (needs the platform running and AGENT_WORKER_TOKEN set).
npm run agents:work
node scripts/agent-worker.mjs --max 50
node scripts/agent-worker.mjs --agent AGENT-ANALYTICS-10

# The daily pipeline.
npm run agents:daily
node scripts/daily-question-pipeline.mjs --count 3
node scripts/daily-question-pipeline.mjs --exam IELTS-A --exam TOEFL-iBT

# On the host, from cron (every five minutes):
cd /opt/alo-english/current && node scripts/agent-worker.mjs --once \
  >> /opt/alo-english/shared/logs/agent-worker.log 2>&1
```

`AGENT_WORKER_TOKEN` is the shared secret that lets an unattended call reach
`POST /api/agents/worker/run`. It is set in the host's environment panel and
is never in the repository. An administrator's session cookie works as well,
for a manual "run now".

---

## 8. The routes

| Route | Method | Who | What |
|---|---|---|---|
| `/api/agents/status` | GET | admin | The registry, with each agent's measured status |
| `/api/agents/metrics` | GET | admin | The workforce's numbers, measured from the job table |
| `/api/agents/jobs` | GET, POST | admin | List jobs; enqueue a job (the payload is schema-checked at the door) |
| `/api/agents/approvals` | GET, POST | admin | List the waiting decisions; make one |
| `/api/agents/worker/run` | POST | admin or the worker token | Drain a bounded number of jobs |
| `/admin/agents` | page | admin | The monitoring page: agents, queue, approvals, failures, "run now" |

---

## 9. What the workforce still may not do

* It may not publish content without a human approval.
* It may not change a prompt, a rubric or the code by itself.
* It may not produce a band, a grade or a score. Every evaluation it makes is
  qualitative and carries the disclosure that it is not calibrated against
  human raters.
* It may not assess an acoustic property of speech. A transcript cannot
  evidence pronunciation, and the speaking examiner says so.
* It may not lock an account or penalise a learner.
* It may not send a learner's work to a third party unless an external
  provider has been configured **and** `AI_ENABLED` is not `false`.
