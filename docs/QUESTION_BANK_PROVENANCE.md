# Question-Bank Provenance

**Status:** gate implemented; **no manifest exists, so the gate fails closed.** Closing it requires licensed or original content and named human review — not code.
**Gate:** `npm run content:provenance` (add `--database` to reconcile declared counts against the live database)
**Manifest:** `prisma/question-provenance.json` (not in Git — it names contracts and people)
**Shape reference:** `prisma/question-provenance.example.json` (intentionally fails; placeholders are rejected)

## Why this gate exists

`npm run content:validate` answers one question: *is every selectable objective question gradeable?* A bank of perfectly gradeable questions can still be an unlicensed copy of somebody else's exam paper. Gradeable is not the same as lawful, and the difference is the first release blocker in `docs/FEATURE_GAP_REGISTER.md`.

This gate covers the lawful half. It is deliberately fail-closed:

| Situation | Result |
| --- | --- |
| No manifest at the configured path | **exit 1** — BLOCKED, with the command to create one |
| Manifest contains placeholders (`TBD`, `N/A`, `sample`, blank) | **exit 1** — placeholders are not evidence |
| Manifest complete and internally consistent | exit 0 |
| `--database` requested without `DATABASE_URL` or a generated Prisma client | **exit 2** — the check could not run, which is not a pass |
| Declared counts differ from the database | **exit 1** — with the per-exam diff |

## What must be recorded

For each exam type, the manifest declares:

| Field | What it must contain | Why |
| --- | --- | --- |
| `code`, `name` | The exam code used by `ExamType.code` | Ties the record to real rows |
| `contentOwner` | Who authored the bank | Accountable party for the content |
| `licence.id` / `name` | The licence identity, e.g. `ORIGINAL-ALO` or a contract reference | Says on what basis the content may be published |
| `licence.attributionRequired` + `attributionText` | Exact attribution string when required | Attribution terms are part of the licence |
| `permission.evidenceReference` | Contract or written-grant reference | The evidence, not an assertion that permission exists |
| `permission.grantedBy`, `grantedOn`, `expiresOn` | Human, ISO date, ISO date or `null` | Detects expired or future-dated grants |
| `officialFormat.verified`, `sourceUrl`, `checkedOn`, `notes` | Confirmation the bank matches the provider's current format, from the provider's own domain | Prevents publishing an out-of-date blueprint; a non-provider host is warned about |
| `answerKeySource` | Who verified the keys, and when | Keys drive every score the platform reports |
| `declaredCounts.questionCount`, `listeningWithVerifiedAudio` | Positive integers | Compared against the database with `--database` |
| `audioRights.included`, `licenceId`, `notes` | Required once any listening item claims verified audio | Recording and TTS voices carry their own rights |
| `reviewedBy`, `reviewedOn` | A named human reviewer and date | Review older than 12 months warns |

## What this gate does **not** do

- It does not create content. There is no generator here, by design: synthesised questions must never be labelled as official exam material.
- It does not validate the *quality* or difficulty of a question, or calibrate any score. That requires expert review and rating studies.
- It does not check that an audio file plays, only that rights are recorded. Playback is covered by `npm run audio:verify` and the listening-media gate in the attempt engine.
- It does not verify that a signature on a contract is genuine. It records the reference a human entered, so a later audit has something to check.

## How to close the blocker

1. Obtain content you are entitled to publish: author it in-house, license it, or use material whose licence clearly permits commercial use.
2. Run `cp prisma/question-provenance.example.json prisma/question-provenance.json` and replace every placeholder with real evidence.
3. Load the content into the database and run:

   ```bash
   DATABASE_URL='file:./local-dev.db' npm run content:provenance -- --database
   npm run content:validate
   ```

   Both must pass. `content:validate` proves the bank is gradeable; `content:provenance` proves it is publishable.
4. Keep `prisma/question-provenance.json` out of Git — it names contracts and people. Back it up with the database, and treat it as part of the release record.

## CI behaviour

`.github/workflows/ci.yml` runs this gate immediately after `Validate question content`, with `::notice` annotations so the reason is visible in the checks UI without opening the log. The job is expected to be **red** until a licensed bank and its manifest exist — that is the gate working, not a broken pipeline. Do not weaken the step to make the job green.
