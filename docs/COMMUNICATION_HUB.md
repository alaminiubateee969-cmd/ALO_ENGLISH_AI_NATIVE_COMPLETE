# Communication Hub

**Status:** ingestion, storage and retention layers implemented and tested. Outbound provider delivery and the after-hours assistant are **not** implemented — they require provider credentials, business verification and approved templates.
**Gate:** `npm run content:provenance` and `npm run content:validate` remain the release gates for exam content; this document covers the CRM/communication side.
**Schema:** migration `20261014120000_communication_hub` (7 new tables, 17 new columns)

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

## Backup and restore

`npm run drill:restore` creates a backup, restores it into a scratch directory and verifies it: the archive extracts, the database opens, every schema model has a table, and every stored document hashes without error. It exits 2 (BLOCKED) when it could not run, which is deliberately distinct from a pass.

Failure paths were exercised, not assumed: no database → BLOCKED/2; corrupt archive → FAIL/1; a database missing tables → FAIL/1 listing the missing tables.

## Remaining work, in the order it should be built

1. ~~**Provider media fetcher**~~ — **done** (`src/lib/crm/media-fetcher.ts`, 25 tests). Remaining: set `WHATSAPP_ACCESS_TOKEN` and `META_PAGE_ACCESS_TOKEN` in host secret storage so media is collected rather than reported.
2. **Outbound delivery adapter** — send via WhatsApp Cloud / Messenger / Instagram / SMS, write the send result and delivery receipts back, and honour `evaluateSendPolicy` before queueing anything.
3. **Channel integrations** — WhatsApp Business (Meta) first, then Messenger/Instagram, then an SMS provider. Needs: business verification, phone-number id, approved templates, and the secrets above in host secret storage.
4. **Consent capture in the UI** — the register must be filled by a real workflow (inbound keyword, form checkbox, staff entry), otherwise every marketing send is blocked by design.
5. **Review queue UI** — conversations with `needsReview` and documents with `verificationStatus = PENDING_REVIEW` need one screen where a human resolves them.
6. **After-hours assistant** — only after 1–5 are running, with `requiresHumanReview` gating every answer and no promises on admission, scholarship or visa.
