# Communication Hub

**Status:** ingestion, storage, retention, outbound delivery and the after-hours assistant are implemented and tested. What remains before live traffic is configuration, not code: provider credentials, business verification and approved templates.
**Gate:** `npm run content:provenance` and `npm run content:validate` remain the release gates for exam content; this document covers the CRM/communication side.
**Schema:** migrations `20261014120000_communication_hub` (7 new tables, 17 new columns),
`20261014140000_message_outbox` (the outbound queue) and `20261014160000_consent_lead_capture` (consent
captured before there was a student to attach it to)

This is the approved architecture for central student communication: WhatsApp, Facebook, Instagram, SMS and email through one hub, with automatic student identity, permanent records, and a human in the loop wherever a mistake would be irreversible.

## What exists after this change

| Layer | Where | Verified by |
| --- | --- | --- |
| Student code `ALO-YYYY-NNNNNN` | `src/lib/crm/identity.ts` | `tests/communication-hub.test.ts` |
| Identity matching (never merges on a name) | `src/lib/crm/identity.ts` | 8 tests, including the ambiguity cases |
| Webhook idempotency keys | `src/lib/crm/automation.ts` | 8 tests, including replayed and re-serialised events |
| Webhook signature verification (HMAC, constant-time) | `src/lib/crm/webhook-signature.ts` | refused when unconfigured or mismatched |
| Inbound pipeline: verify → deduplicate → identify → record | `src/lib/crm/ingest.ts` | 14 tests driving the whole flow with an in-memory store |
| Public webhook endpoint | `src/app/api/webhooks/[provider]/route.ts` | POST ingest + GET handshake, 503 when unconfigured |
| Private document storage | `src/lib/crm/document-storage.ts` | 15 tests, including traversal and tamper attacks |
| Authorized document access | `src/app/api/crm/documents/[id]/download/route.ts` | permission-checked, hash-verified, always audited |
| Backup restore drill | `scripts/restore-drill.sh` (`npm run drill:restore`) | exercised end to end, including three failure paths |
| Send policy: consent, channel window, cap, quiet hours | `src/lib/crm/messaging-policy.ts` | 12 tests |
| Permission matrix (passport access, deletion, credentials) | `src/lib/crm/permissions.ts` | 12 tests |
| Tables: sequences, channel accounts, conversations, document versions, assignment history, consent, automation events | `prisma/migrations/20261014120000_communication_hub/` | applied to a fresh SQLite database; schema/migration parity passes |
| Outbound queue (`MessageOutbox`), send policy gate, retry backoff, delivery receipts | `prisma/migrations/20261014140000_message_outbox/`, `src/lib/crm/outbound.ts` | 46 tests; parity passes (56 tables) |
| Consent register, capture workflows and promotion | `src/lib/crm/consent.ts`, `/api/crm/consent`, `/employee/consent` | 30 tests + 6 ingest tests |
| Review queue (conversations, documents, flagged students) | `src/lib/crm/review-queue.ts`, `/api/crm/review-queue`, `/employee/review-queue` | 21 tests |
| Consent captured on the public form | `prisma/migrations/20261014160000_consent_lead_capture/`, `/api/auth/register` | parity passes; rendered copy names the channels in words |
| After-hours assistant (reviewed answers, human handoff, kill switch) | `src/lib/crm/assistant.ts`, `src/lib/crm/assistant-runner.ts`, `/api/crm/assistant/reply` | 43 tests, including the promise guard over the whole vocabulary |
| Inbound provider media fetcher | `src/lib/crm/media-fetcher.ts` | 25 tests: SSRF refusal, size ceiling, token handling |

## Section-by-section status against the specification

| Spec section | Status | Notes |
| --- | --- | --- |
| 1. First contact → hub → auto Student ID → history → vault → follow-up → memory | **Core implemented** | Identity, idempotency, history and policy exist. The transport (provider webhooks) does not. |
| 2. How a Student ID is created | **Implemented (logic)** | Allocated server-side from `StudentIdSequence` inside a transaction; unique index on `Student.studentCode` is the duplicate guard. No form is required. Identity matching follows the documented rules. |
| 3. Channel account registry | **Schema implemented** | `ChannelAccount` holds staff ownership, provider ids, health, and `credentialRef` — a pointer to secret storage. **No secret, OTP or token is ever stored in a CRM table.** |
| 4. Permanent records, documents, versions | **Schema implemented** | `DocumentVersion` is append-only; `Document.verificationStatus` defaults to `PENDING_REVIEW`, so an automatically received file is never auto-verified. Soft delete only. |
| 5. Marketing/admin/super-admin oversight | **Policy implemented** | `canReadStudentDocument` refuses marketing roles outright, and refuses admins without a named grant or assignment. |
| 6. Automated SMS/WhatsApp marketing | **Policy implemented** | `evaluateSendPolicy` enforces consent, the WhatsApp 24-hour service window, an approved-template requirement, a daily cap and quiet hours. `CommunicationConsent` is the central register, so one opt-out stops every channel. |
| 7. After-hours AI assistance | **Not implemented** | Requires provider credentials and an approved knowledge source. `requiresHumanReview` already routes passport, visa-refusal, financial and legal questions to staff. |
| 8. Implementation order | **Steps 1–3 done** | Step 1: audit complete. Step 2: identity and idempotency foundation done; ingestion adapter pending. Step 3: document vault schema and policy done; storage wiring and restore drill pending. Steps 4–6 need credentials, then staging verification. |

## The design decisions that are not negotiable

1. **Never merge two students automatically.** A name match, or a phone number that matches more than one record, produces a review queue entry — not a merge. Two people's documents and applications ending up under one identity is not recoverable by an apology.
2. **Automatically received documents are never verified automatically.** OCR may suggest a type; only a human with a reviewing role and responsibility for that student may set `VERIFIED`.
3. **Rank is not entitlement.** A super admin without an explicit grant or assignment cannot open a passport scan. Every sensitive read is audited whether it succeeds or fails.
4. **Deletion is not a permission.** Records are soft-deleted. Lawful erasure runs through a separate approved workflow with its own approval and audit trail.
5. **Credentials never enter the CRM database.** `ChannelAccount.credentialRef` points at the host's secret storage. There is no column anywhere in this migration that holds a token, password or OTP.
6. **One opt-out, everywhere.** Consent is recorded per student/channel/purpose but suppression is global for marketing. A student who says stop on WhatsApp is not then messaged on SMS.

## What CRM cannot promise

The CRM protects its own database and storage. It cannot recover a message or file that WhatsApp, Facebook or Instagram removes under their own retention policies. If an inbound file is not collected at delivery time, it is gone. This is why ingestion stores a private copy immediately rather than linking to a provider URL.

## The inbound pipeline, step by step

```
provider → POST /api/webhooks/[provider]
  1. read the raw body, enforce the size ceiling
  2. verify the HMAC signature  → 401 if it fails (nothing is written)
  3. normalise the provider payload (per-provider adapter)
  4. derive the idempotency key → SUCCEEDED / DUPLICATE / PROCESSING short-circuit
  5. resolve identity (student code → channel id → unique phone → unique email)
        MATCHED → attach to the existing student
        NEW     → allocate the next ALO-YYYY-NNNNNN and create the student
        REVIEW  → create a NEW record flagged needsReview; never attach to the
                  existing person, even when the name matches
  6. create/reuse the conversation, append the message
  7. write attachments to private storage as PENDING_REVIEW
  8. mark the event SUCCEEDED (or FAILED so a provider retry may reprocess it)
```

## Fetching inbound media

A webhook carries a *reference* to a file, never the bytes, so `src/lib/crm/media-fetcher.ts` makes the
second authenticated call that turns `mediaRefs` into documents that reach storage. It is the only place
the server follows a URL that arrived in a request, and it is written as a security boundary:

- Only the provider may *resolve* a download URL (the Graph API call for WhatsApp). A URL is never taken
  from the payload and fetched directly, so a caller cannot steer the request.
- Even the resolved URL must be `https`, must be a recognised provider media host
  (`facebook.com`, `fbcdn.net`, `fbsbx.com`, `instagram.com`), and must carry no credentials. Anything
  else is refused — a spoofed response cannot point the server at link-local metadata or an internal host.
- The body is read through a hard size ceiling rather than trusted to `Content-Length`, which a server may
  state wrongly. The declared size is also checked first, so an oversized file is refused before it is
  downloaded.
- The type must already be one accepted for documents (pdf/jpg/png/webp/docx); anything else is refused
  before storage is reached.
- One message may carry at most 5 attachments, and download is sequential — providers rate-limit by account.
- **No token, no fetch.** Without `WHATSAPP_ACCESS_TOKEN` / `META_PAGE_ACCESS_TOKEN` every attachment comes
  back as a described `NOT_CONFIGURED` rejection and is named in `uncollectedMedia`. A fetch that fails
  never fails the message: the message is recorded and the reason is reported.

Because a media-only message that could not be collected is not an *empty* message, the pipeline records it
(an operator can see the sender did send something) rather than rejecting it and inviting endless retries.

## Document storage

- Files are written under `UPLOAD_DIR` with mode `0600`, outside the web root, addressed as
  `students/<studentId>/documents/<documentId>/v<version>.<ext>` — derived from ids, never from the uploaded file name.
- A storage key is re-validated on every read: traversal, absolute paths, backslashes and null bytes are refused, and the resolved path must stay inside the upload root.
- Every version is kept. Uploading a new passport does not remove the old one, and the previously verified file stays readable in history.
- Reads go through `/api/crm/documents/[id]/download`, which applies the permission policy, verifies the recorded SHA-256 before serving, and audits the attempt whether it is allowed or denied.
- `DELETE /api/crm/documents/[id]` is now a **soft delete**. It previously called the generic CRUD delete, which removed the row permanently — an admin could have destroyed a student's documents. It now sets `deletedAt` and records the action.

## Outbound delivery

Sending is a single funnel: `POST /api/crm/messages/send` is the only route that sends anything, so every
outbound message — a counsellor's reply, a campaign, or a queued reminder — passes the same policy gate, the
same exactly-once claim and the same audit trail.

The order is the point: **policy → claim → credentials → network**. Any other order either messages someone
who said stop, messages them twice, or attempts an unauthenticated send.

1. **Policy.** `evaluateSendPolicy` is asked, never re-implemented. The answer becomes an action:
   - `REFUSE` when waiting cannot help — an opt-out, missing consent for marketing, a closed WhatsApp window
     (the fix is an approved template, not patience) — recorded with its reason;
   - `DEFER` when it is only about *when* — quiet hours go to the next business window, the daily cap to the
     next local day's window;
   - `SEND` otherwise. Guards that run before policy: an empty body, a missing recipient handle (never
     guessed), a body over the channel's ceiling (WhatsApp rejects >4096), and a channel with no provider.
2. **Claim.** The send key is derived from channel, student, purpose, content and schedule, and is unique in
   `MessageOutbox`. A second attempt at the same send returns `DUPLICATE` and touches no network. A `PENDING`
   row that already has attempts is an attempt in flight and is refused too, so two workers cannot both send;
   an attempt older than 10 minutes is treated as abandoned and may be re-claimed, because a stranded
   message is worse than a rare duplicate.
3. **Credentials.** No credential, no send: `describeReadiness()` names the variable to set and the send is
   recorded as `NOT_CONFIGURED`. Tokens never appear in a response, a log line or the database.
4. **Network.** Failures are classified, not guessed: 401/403 `AUTH_FAILED` (not retryable — retrying a wrong
   credential is how an account gets suspended), 429 `RATE_LIMITED` and 5xx `HTTP_ERROR` (retryable), other
   4xx `PROVIDER_REJECTED` (not retryable), network faults `NETWORK_ERROR` (retryable). Backoff is bounded
   (5m → 30m → 2h → 12h), and after the last step the message stays `FAILED` for a human rather than
   retrying forever.

**Delivery receipts.** Providers report progress through the same webhook endpoint, so
`POST /api/webhooks/[provider]` applies them instead of ignoring a payload with no inbound message. Receipts
never move a message backwards: a stale `DELIVERED` for a message already `READ` is ignored and recorded, and
a `FAILED` is applied unless the student had already read the message.

**The queue is drained by a scheduler, not a timer.** `POST /api/crm/messages/queue/run` is called by the host
scheduler holding `CRON_SECRET` (compared in constant time), or by an authenticated `ADMIN` for a manual run;
with no secret configured, anonymous callers are refused outright. Every row it picks up is re-decided by the
same policy gate, so a deferral can never become a way around a withdrawal of consent.

## The consent register

Consent is not a boolean and not a checkbox that lives in a form's memory. It is a record that has to
survive being questioned a year later, so `src/lib/crm/consent.ts` enforces three rules and the UI cannot
talk its way around them:

- **A grant needs a source and evidence.** A `GRANTED` row without either is an assertion, not a record, and
  `validateConsentCapture` refuses to store one. A denial or a withdrawal is the opposite case: always
  accepted, immediately, with nothing required — making it easy to say stop is the entire point.
- **Silence is not consent.** `UNKNOWN` is the state of having no record, so it cannot be "recorded", only
  resolved.
- **Marketing is global.** A withdrawal recorded on WhatsApp suppresses marketing on SMS and email too,
  matching `evaluateSendPolicy`. Permission to write on Instagram is not permission to text; an opt-out is a
  statement about the person, not about one app.

Three workflows fill the register, which is the requirement — a register nobody fills is a register that
blocks every marketing send forever:

| Workflow | How | Source recorded |
| --- | --- | --- |
| Inbound keyword | The student writes "stop", "unsubscribe", "বন্ধ করুন" or "bondho korun" in a chat. Applied in the same transaction as the message, with the message id as evidence. | `INBOUND_MESSAGE` |
| Staff entry | `/employee/consent` — search the student, see the whole grid, record a decision with its evidence. | `STAFF_ENTRY` / `FORM` |
| Website form | The registration checkbox (never pre-ticked) states the channels in words: email, SMS and WhatsApp. Recorded against the student if one already exists, otherwise against the lead until the identities line up. | `FORM` |

A capture taken before the person was a student waits in `CommunicationConsent` against the lead's email and
normalised phone, and is **promoted** the next time that student's register is read. It is never attached by
name: two students can share a name, and attaching one person's consent to another is precisely the mistake
this register exists to prevent.

Two deliberate limits:

- A "stop" withdraws **marketing**. It does not cut off service: a student who stops receiving offers must
  still be able to ask about their application. Declining service is recorded only when it was actually said
  ("do not contact me", "no calls", "সব বন্ধ").
- A withdrawal that cannot be applied — the sender could not be identified confidently — is **not** silently
  dropped. It becomes a review-queue entry naming the phrase and telling the operator to apply it by hand
  before any send.

## The review queue

`/employee/review-queue` is the human half of every "we will not guess" rule in this hub. Three things land
there, returned together because they are usually about the same person: a conversation flagged on an
ambiguous match, the documents that arrived with it, and the student record created for it.

- **Oldest first.** A queue sorted by newest buries the student who has waited longest.
- **The reason is always shown**, with the last message quoted, so the decision can be made from the queue
  instead of by opening a conversation in another tab.
- **Linking is not merging.** Linking attaches a conversation, its messages and its orphaned documents to an
  existing student and clears the flag. It never merges two student records: the pipeline created a flagged
  record precisely because merging two people's files is not recoverable by an apology.
- **Dismissing needs a note.** Linking is self-documenting; dismissing a possible duplicate is the decision
  that could quietly lose two people's files. `validateResolution` refuses a dismissal without one.
- **Documents are verified one at a time, by a named person**, through the existing document route, with the
  download audited. There is no "verify all": that would turn a human decision into a click, which is what
  the rule against automatic verification exists to prevent.

Resolving requires `canResolveReview`; reading requires only a signed-in staff account, because hiding a
queue of unanswered students from the people who answer students is how a queue grows.

## The after-hours assistant

A student writing at 1am gets nothing today. The assistant exists to answer the
small, factual questions outside office hours — when the office opens, where to
start, what to bring, how practice tests work, how to stop hearing from us — and
to leave everything else for a person in the morning.

It is a planner plus a sender, and the split matters:

- `src/lib/crm/assistant.ts` decides. It is pure: no database, no network, so
  every rule below is testable and readable in one file.
- `src/lib/crm/assistant-runner.ts` sends. It builds an ordinary outbound draft
  and hands it to the same delivery path a counsellor's message takes.

**What it will not do**, in the order the checks run:

| Check | Outcome |
| --- | --- |
| `ASSISTANT_ENABLED` is not `true` | silent |
| The message is empty | silent |
| The student withdrew service consent or was denied it | silent |
| The message touches admission, scholarship, visa, scores, fees, a complaint or legal/immigration documents | **handoff**, flagged for review |
| It has already replied `ASSISTANT_MAX_REPLIES_PER_CONVERSATION` (2) times here | **handoff** |
| The office is open | silent — a person is there, and a person answers |
| No reviewed answer fits the question | **handoff** |
| The draft would contain a promise, a guarantee, a currency amount or a band/score number | **handoff** |

A handoff is a result, not a fallback: it sets `needsReview` on the conversation
with the reason, which is what makes the left-over questions visible in
`/employee/review-queue` instead of vanishing.

**Why a fixed vocabulary rather than a language model.** Every answer it can send
is in `CANNED_ANSWERS`, in the repository, reviewed like any other student-facing
copy, and each one cites the page a student can check it on. A generated answer
would be different every time, which means it could not be reviewed before it was
sent — and the first unreviewed sentence about a visa is the one that matters.
`containsForbiddenPromise` is run over the whole vocabulary as a test, so
"guaranteed", "100%", "you will get", currency amounts and score numbers cannot
enter it without failing CI.

**The disclosure.** Every reply ends with `ASSISTANT_DISCLOSURE`: it says it is an
automated message, that a counsellor will pick the question up if it needs one,
and that the office is open 9:00–21:00 Dhaka. Staff can also ask what it would say
without sending: `POST /api/crm/assistant/reply` with no `send` returns the plan,
the draft and the sources; with `send: true` it sends through the funnel. Both
paths are audited, and a sent reply is recorded with `createdBy:
after-hours-assistant`, so "did a robot answer this student?" is a query, not a
guess.

## Backup and restore

`npm run drill:restore` creates a backup, restores it into a scratch directory and verifies it: the archive extracts, the database opens, every schema model has a table, and every stored document hashes without error. It exits 2 (BLOCKED) when it could not run, which is deliberately distinct from a pass.

Failure paths were exercised, not assumed: no database → BLOCKED/2; corrupt archive → FAIL/1; a database missing tables → FAIL/1 listing the missing tables.

## Remaining work, in the order it should be built

1. ~~**Provider media fetcher**~~ — **done** (`src/lib/crm/media-fetcher.ts`, 25 tests). Remaining: set `WHATSAPP_ACCESS_TOKEN` and `META_PAGE_ACCESS_TOKEN` in host secret storage so media is collected rather than reported.
2. ~~**Outbound delivery adapter**~~ — **done** (`src/lib/crm/outbound.ts`, `outbound-providers.ts`, `outbox-runner.ts`, `prisma-outbound-store.ts`, 46 tests) together with the `MessageOutbox` queue, the send route and the receipt handling. Remaining: set the channel credentials *and* `CRON_SECRET`, and point the host scheduler at `/api/crm/messages/queue/run`, or deferred and retried messages will wait for a manual run.
3. **Channel integrations** — WhatsApp Business (Meta) first, then Messenger/Instagram, then an SMS provider. Needs: business verification, phone-number id, approved templates, and the secrets above in host secret storage.
4. ~~**Consent capture in the UI**~~ — **done**. Three capture workflows (inbound keyword, staff entry screen, registration form checkbox), the promotion of pre-student captures, and `canRecordConsent` on the write path. 30 tests.
5. ~~**Review queue UI**~~ — **done**. `/employee/review-queue` over conversations, documents and flagged students, with oldest-first ordering, a required note for a dismissal, and no merge action anywhere. 21 tests.
6. ~~**After-hours assistant**~~ — **done** (`src/lib/crm/assistant.ts`, `assistant-runner.ts`, 43 tests). It answers only outside office hours, only from a fixed reviewed set, always with the automated-message disclosure, at most twice per conversation, and it goes silent — not creative — on anything about admission, scholarship, visa, scores, fees, documents-in-legal-context or a complaint. Every reply travels the same outbound funnel as a counsellor's message (`purpose: SERVICE`), and a message it decided not to answer is flagged on the conversation for the review queue. Enable with `ASSISTANT_ENABLED="true"`; it is off by default, and with the channel credentials unset it cannot send at all.
7. **The honest limits, restated.** Nothing in this hub converts a practice result into an official score, and the assistant in particular is built so that it *cannot* say anything about an outcome. Those two things are not configuration gaps that a later release closes; they are the reasons the module is shaped the way it is.
