# Operating the platform with an external AI agent (Bill Agent AI)

This platform is **API-first**: every capability a human can reach through the
portals is reachable through an authenticated HTTP API, and every mutating
action lands in the append-only audit log. An external agent (e.g. Bill Agent
AI) can therefore operate the whole platform — CRM, exam centre, content,
workforce — without a browser.

## 1. Authentication model

The API uses HMAC-signed session cookies issued by `POST /api/auth/login`.

```bash
# Log in once, keep the cookie jar for every later call
curl -c agent.jar -X POST https://english.aloeducation.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent-ops@aloeducation.com","password":"…"}'

# Every subsequent request carries the session
curl -b agent.jar https://english.aloeducation.com/api/auth/me
```

Practical rules for an agent operator:

1. **Create a dedicated account per agent** (role `ADMIN` for platform work,
   `COUNSELOR` for pipeline work, `STUDENT` for exam work). The audit log
   records the acting user on every mutation, so per-agent accounts give a
   real accountability trail.
2. **Never reuse the human admin account** — sessions are single-use cookies;
   concurrent agents sharing one account invalidate each other's sessions.
3. **Treat HTTP status codes as the contract**: `401` → log in again,
   `403` → the role lacks the permission (by design), `409` → duplicate,
   `429` → rate limited, `503` → capability deliberately disabled (payments).
4. Log out with `POST /api/auth/logout` when finished.

## 2. Capability map (what the agent can drive)

| Capability | Endpoints | Notes |
|---|---|---|
| Session | `POST /api/auth/login`, `/logout`, `GET /api/auth/me` | Cookie sessions |
| Health | `GET /api/health` | No auth; database + version |
| CRM records | `GET/POST /api/crm/{entity}`, `GET/PUT/DELETE /api/crm/{entity}/{id}` | entities: users, leads, students, applications, tasks, appointments, messages, documents, universities, courses, scholarships, countries, branches, departments, partners, commissions, notifications, audit-logs |
| Lead intelligence | `GET /api/crm/leads/priority` | Scored, ranked call list |
| Review queue | `GET /api/crm/review-queue`, `…/conversations/{id}`, `…/students/{id}` | Human-in-the-loop identity resolution |
| Consent register | `GET/POST /api/crm/consent` | Marketing/service consent per student |
| Outbound messaging | `POST /api/crm/messages/send`, `POST /api/crm/messages/queue/run` | Consent-checked funnel; refuses without consent |
| Assistant drafts | `POST /api/crm/assistant/reply` | Draft preview (`send:false`) or send (`send:true`) |
| Exam catalogue | `GET /api/exam-types`, `GET /api/practice-sets`, `GET /api/questions` | Live DB counts |
| Exam engine | `POST /api/attempts/start`, `GET /api/attempts/{id}`, `POST /api/attempts/save`, `POST /api/attempts/submit`, `GET /api/attempts` | Server-timed, frozen questions, deterministic grading |
| Exam analytics | `GET /api/exam/analytics` | Staff only |
| Learning loop | `GET /api/learning/dashboard`, `GET /api/learning/daily`, `POST /api/learning-memory` | Weakness-driven practice |
| Grammar feedback | `POST /api/grammar/check` | LanguageTool; off until `LANGUAGETOOL_URL` is set |
| RAG handbook | `GET /api/rag/materials`, `POST /api/rag/ask` | Cited answers from uploaded material |
| Agent workforce | `GET /api/agents/status`, `GET /api/agents/metrics`, `GET /api/agents/jobs`, `GET /api/agents/approvals`, `POST /api/agents/worker/run` | The 14-agent queue; approvals gate publishing |
| Admin analytics | `GET /api/admin/analytics?days=N`, `GET /api/admin/stats`, `GET /api/admin/seo/audit`, `GET /api/admin/integrations`, `GET/POST /api/admin/settings` | Platform operations |
| Webhooks in | `POST /api/webhooks/{provider}` | Signature-verified (WhatsApp/Meta/SMS…) |
| Payments | `POST /api/payment` | **Deliberately 503** until a merchant exists |

Full machine-readable inventory: `API_INVENTORY.csv` and
`ROUTE_INVENTORY.csv`, regenerated from source by `npm run inventories`.

Teacher-portal surface (added 2026-10-27): `GET /api/teacher/overview`
(TEACHER role — student roster + recent results + material counts) and
`GET /api/rag/materials?category=` / `GET /api/rag/materials/{id}` (public
study-material library). The users list also accepts `?role=TEACHER`.

## 3. The internal workforce (14 agents) — and how it relates to an external agent

The platform ships its own durable agent workforce on a SQLite-backed job
queue (no Redis needed): exam orchestrator, question generator, quality gate,
model router, daily pipeline, evaluation/learning/integration/compliance
agents, and more. Each one:

- declares an input/output JSON-schema contract,
- runs inside time/retry/concurrency limits,
- writes an append-only event log, artifacts and daily metrics,
- and **requires human approval** before publishing content
  (`GET /api/agents/approvals`).

An external operator agent drives it through the same API: enqueue work,
read metrics, decide approvals. It does not need — and should not have —
direct database access.

## 4. Plugging in open-source model providers

The AI layer is provider-pluggable by design, and open-source endpoints are
first-class citizens:

| Provider | Env | Notes |
|---|---|---|
| Groq (fast open models) | `GROQ_API_KEY` | Recommended default for evaluation |
| OpenRouter (hundreds of open models) | `OPENROUTER_API_KEY` | Multi-model routing |
| Google Gemini | `GEMINI_API_KEY` | |
| HuggingFace | `HUGGINGFACE_API_KEY` | Free tier |
| Self-hosted (Ollama / vLLM / llama.cpp) | `LOCAL_MODEL_URL` + `LOCAL_MODEL_NAME` | Fully open-source path; circuit-breaker + cache included |
| LanguageTool (open-source grammar) | `LANGUAGETOOL_URL` | Public or self-hosted instance |

Configuration lives in the environment only (see `.env.example`); nothing is
hard-coded. The Model Router agent probes configured providers and falls back
to the deterministic local rule engine when none are reachable — so the
platform degrades to "still works, less clever" rather than failing.

To add a **new** open-source provider, extend `src/lib/ai/providers/` and the
routing table in `src/lib/ai/routing/ModelRouter.ts` — the registry pattern
keeps this a one-file change plus tests.

## 5. Suggested operating loop for an external agent

1. `GET /api/health` — confirm the platform is up.
2. Log in with the agent's own account.
3. `GET /api/agents/status` + `GET /api/agents/approvals` — see queue state
   and anything waiting for a human decision.
4. Drive the day's work through the capability map above (create leads,
   start attempts, send consent-checked messages…).
5. `GET /api/admin/analytics` / `GET /api/admin/seo/audit` — verify the
   results of the actions.
6. Log out.

Every mutation the agent makes is auditable in `GET /api/crm/audit-logs`,
attributed to the agent's own account.
