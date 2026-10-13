# Communication Hub

**Status:** identity, policy and schema layers implemented and tested. Channel integrations and the after-hours assistant are **not** implemented — they require provider credentials, business verification and approved templates.
**Gate:** `npm run content:provenance` and `npm run content:validate` remain the release gates for exam content; this document covers the CRM/communication side.
**Schema:** migration `20261014120000_communication_hub` (7 new tables, 17 new columns)

This is the approved architecture for central student communication: WhatsApp, Facebook, Instagram, SMS and email through one hub, with automatic student identity, permanent records, and a human in the loop wherever a mistake would be irreversible.

## What exists after this change

| Layer | Where | Verified by |
| --- | --- | --- |
| Student code `ALO-YYYY-NNNNNN` | `src/lib/crm/identity.ts` | `tests/communication-hub.test.ts` |
| Identity matching (never merges on a name) | `src/lib/crm/identity.ts` | 8 tests, including the ambiguity cases |
| Webhook idempotency keys | `src/lib/crm/automation.ts` | 8 tests, including replayed and re-serialised events |
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

## Remaining work, in the order it should be built

1. **Ingestion adapter** — `POST /api/webhooks/[provider]`: verify the signature, derive the idempotency key, write `AutomationEvent`, resolve identity, then create conversation/message/document rows. Every step already has a tested pure function; the route is a thin adapter over them.
2. **Document storage wiring** — private storage key, hash on write, authorized read route (`canReadStudentDocument`), and the backup/restore drill.
3. **Channel integrations** — WhatsApp Business (Meta) first, then Messenger/Instagram, then an SMS provider. Needs: business verification, phone-number id, approved templates, and credentials in host secret storage.
4. **Consent capture in the UI** — the register must be filled by a real workflow (inbound keyword, form checkbox, staff entry), otherwise every marketing send is blocked by design.
5. **After-hours assistant** — only after 1–4 are running, with `requiresHumanReview` gating every answer and no promises on admission, scholarship or visa.
