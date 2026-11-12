# REF-FEATURES — Reference features backfill

Task id: `REF-FEATURES`
Agent: main
Date: 2026-11-13
Scope: Build the 6 missing features identified from the cloned IELTS-Mock
reference repo. Do NOT modify CI workflow files. Do NOT break existing
functionality.

## Context reviewed

- `worklog.md` — project conventions.
- `prisma/schema.prisma` — `Payment`, `Score`, `Attempt`, `PracticeSet`,
  `ExamType`, `User` models.
- `src/lib/responses.ts`, `src/lib/auth.ts`, `src/lib/db.ts` — response helpers,
  auth, prisma client.
- `src/proxy.ts` — public route allowlist.
- `src/lib/public-routes.ts` — indexable routes.
- `src/app/layout.tsx`, `src/components/site/site-header.tsx` — layout shell.
- `src/app/api/payment/route.ts`, `src/app/api/exam-types/route.ts`,
  `src/app/api/exam/analytics/route.ts` — API route conventions.
- `src/components/exam/*` — existing exam components for style reference.

## Files created

### Components (`src/components/exam/`)
- `DonutChart.tsx` — SVG donut chart with animated stroke-dashoffset fill on
  mount. Renders the four IELTS section bands (Listening / Reading / Writing /
  Speaking) as concentric segments.
- `ResultReveal.tsx` — Loading spinner ("Calculating score… / স্কোর হিসাব
  হচ্ছে") shown for ~1s then a fade-in reveal of results. Controlled by an
  optional `loadingMs` prop.
- `ExamAudio.tsx` — Audio player with `onePlay` mode (single listen, no replay,
  no seekbar skipping, autostop at end, "plays remaining" badge) and a
  `compact` mode.
- `InstructionTour.tsx` — Guided tour overlay with 4 steps (Select exam type /
  Start exam / Timer counts down / Submit when done), Skip button, persisted
  dismissal in `localStorage`.
- `PaymentFlow.tsx` — Wallet payment form (bKash / Nagad / Rocket / Upay) with
  wallet number, transaction ID and sender-number inputs. Submits to
  `POST /api/payment/wallet`.

### Pages (`src/app/`)
- `leaderboard/page.tsx` — Public leaderboard page that fetches
  `/api/leaderboard` and renders a podium with gold/silver/bronze styling for
  the top 3 plus a ranked table for the rest (top 50).

### API routes (`src/app/api/`)
- `payment/wallet/route.ts` — `POST /api/payment/wallet` (auth required).
  Accepts `walletType`, `transactionId`, `senderNumber`, `courseId`,
  validates them, creates a `PENDING` `Payment` row with `method` set to the
  wallet code and `txnId` set to the transaction id, then returns the record.
  No attempt credit is granted (consistent with the existing `payment/route.ts`
  note: this deployment has no verified provider webhook flow).
- `leaderboard/route.ts` — `GET /api/leaderboard` (public). Returns the top 50
  students by `Score.overall` descending, with rank, name, exam type code/name
  and the date the score was created.

## Files modified

- `src/proxy.ts` — added `/leaderboard` to `PUBLIC_PAGES` and
  `/^\/api\/leaderboard$/` to `PUBLIC_API_PATTERNS`.
- `src/lib/public-routes.ts` — added `/leaderboard` to
  `INDEXABLE_PUBLIC_ROUTES`.

## Notes / decisions

- Payment records are created as `PENDING` only — never `COMPLETED`. The
  existing `POST /api/payment` route intentionally blocks because no verified
  provider webhook exists; the wallet route is the manual/intent equivalent and
  matches that posture. A staff member would verify the transaction id and flip
  the row to `COMPLETED`.
- The leaderboard is anonymous-by-name: the user's `name` is shown if present,
  otherwise a masked email handle (e.g. `r***@example.com`). This matches the
  "no PII leak in shared surfaces" posture of the public site.
- `ResultReveal` uses Tailwind's `animate-spin` and a CSS transition for the
  fade-in — no extra animation library required (the project already uses
  `tw-animate-css`).
- `ExamAudio` disables the native seekbar by overlaying a transparent input
  range on top of a hidden `<audio controls>` element; in onePlay mode the
  range is `disabled` and the audio element itself is hidden.
- `InstructionTour` selectors target stable `data-tour` attributes so the tour
  is not coupled to one specific page — any host page can drop
  `data-tour="exam-select"` etc. on its own elements.

## Lint status

`bun run lint` passes (0 errors, 0 warnings in my new files; the only
remaining warning is a pre-existing "unused eslint-disable directive" in
`src/components/factory/control-center.tsx`, which is not in scope here).

`bun run typecheck` (tsc --noEmit) passes — no TypeScript errors.

## Dev-server note

The system-managed dev server (`bun run dev`, port 3000) was unresponsive at
the end of this task: `next-development.log` shows an `Error: write EIO` at
`00:05:15` and no further activity, and `curl http://127.0.0.1:3000/leaderboard`
times out with no bytes received. The system manages the dev server lifecycle
so it was not restarted manually. Both `tsc --noEmit` and `eslint .` pass on
the new code, so the routes should compile cleanly once the dev server is
restarted by the system.
