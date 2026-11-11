# Branch consolidation — 2026-10-08

Every branch in this repository is now an ancestor of `main`. This records what
was merged, what content moved, and — where content did not move — exactly why.

## Before

> **Correction, 2026-10-08.** The first version of this section said `main` was
> a single orphan commit with no parent and that six of the seven branches
> shared no ancestor with it. That was wrong, and the reason matters: the clone
> this was analysed in was **shallow**. `.git/shallow` listed `c5ef20d` and
> `cae9429`, so `git rev-list --count` and `git merge-base` silently truncated at
> those boundaries and reported 1 reachable commit and "no common ancestor" for
> branches whose shared history lay below the cut. Everything below is measured
> after `git fetch --unshallow`. The merges themselves were unaffected — `-s ours`
> never changes a tree — but two of them were redundant, and the reasoning
> recorded for them was not the real reasoning.

`main`'s tip before this work was:

```
c5ef20d  Repair merge corruption, manifest/Prisma drift, CI false-greens;
         add missing migration (#6)
```

It had **79 reachable commits**, descending from the root `8efe9b6` ("Initial
commit", 2026-07-09). Seven branches were open, and they fell into three groups,
not two:

| Branch | Ahead of `c5ef20d` | Behind | Root history | Relationship to old `main` |
| --- | --- | --- | --- | --- |
| `arena/21ea772f-…` | 2 | 0 | `8efe9b6` | descends from `main`'s tip |
| `arena/847f6969-…` | **0** | 11 | `8efe9b6` | **already an ancestor of `main`** |
| `arena/c61b298e-…` | **0** | 15 | `8efe9b6` | **already an ancestor of `main`** |
| `arena/01a0eea6-…` | 1 | 24 | `8efe9b6` | shares history; merge-base `918c3c6` |
| `arena/01a0b208-…` | 58 | 79 | `1bd5c44` | genuinely unrelated history |
| `arena/01a0ee4c-…` | 62 | 79 | `1bd5c44` | genuinely unrelated history |
| `upload/complete-project-2026-09-30` | 1 | 79 | `9e80804` | single-commit orphan upload |

So the repository held **three** unrelated root histories — `8efe9b6` (main's
own), `1bd5c44` (the two `01a0…` branches) and `9e80804` (the upload). Only
three branches could not be merged normally, not six.

## What was done

### 1. The branches that could be merged normally, were

`arena/21ea772f-…` descends from `main`'s tip, so it merged as an ordinary
three-way merge (`5cff1c7`) and its change applied cleanly alongside the CI
restructuring: the "Validate question content" step now re-emits the
question-bank numbers as `::notice` annotations while still exiting with the
validator's own code. (A second commit, `21ad483`, later reached `main` through
PR #7 — see *Since consolidation* below.)

### 2. The rest were recorded with `-s ours`

```
git merge -s ours --allow-unrelated-histories --no-ff origin/<branch>
```

`-s ours` makes the branch an ancestor of `main` while keeping `main`'s tree.
Nothing is orphaned, and any of it can be recovered with
`git checkout <branch> -- <path>` at any time. What it does **not** do is change
a single file — which is the point, because on every overlapping path `main` was
the newer side.

It was applied to all six remaining branches. For four of them that was the
right tool: `arena/01a0eea6`, `arena/01a0b208`, `arena/01a0ee4c` and
`upload/complete-project-2026-09-30` each carried content that had to be
deliberately refused rather than auto-resolved. For **two it was a no-op**:
`arena/847f6969` and `arena/c61b298e` were already ancestors of `main`, so
`57b9f54` and the merge recorded for `c61b298e` added a merge commit and nothing
else. Harmless — `-s ours` cannot alter a tree — but they should not have been
needed, and the shallow clone is why they looked necessary.

### The one unique commit on `arena/01a0eea6`

`4c7644f` ("chore: document production secret and provider configuration") adds
27 lines to `.env.example`: `SESSION_SECRET`, `ENCRYPTION_KEY`,
`BOOTSTRAP_ADMIN_{EMAIL,PASSWORD}`, Stripe, SMTP/WhatsApp and S3 variables.
`-s ours` dropped it, and `main`'s `.env.example` was rewritten independently, so
those keys are not documented on `main`.

That was checked rather than assumed. **None of the 14 is read by any code in
`main`** — `src/`, `prisma/`, `scripts/` and `server.js` were all grepped.
(`WHATSAPP_ACCESS_TOKEN` appears once, in `src/components/alo/portals.tsx`, as a
hardcoded *display string* in a client-component status panel; it reads no
environment variable.) Documenting variables nothing consumes is the same defect
in the other direction: it tells an operator to provision integrations that do
not exist. If those integrations are ever built, `git show 4c7644f:.env.example`
has the wording.

Each merge commit carries the branch-specific reasoning. Summary:

| Branch | Merge | Unique content | Disposition |
| --- | --- | --- | --- |
| `arena/847f6969-…` | `57b9f54` | none | **Was already an ancestor of `main`** (0 commits ahead); the merge is a no-op record. Its tip `aada8fa` had merged `main` in and `main` then repaired the result. |
| `arena/c61b298e-…` | *(already reachable via `57b9f54`)* | `deploy-vps.sh`, `ecosystem.config.js` | **Was already an ancestor of `main`** (0 commits ahead). Superseded. Its exam engine is in `main` as `src/lib/exam/*` with two test suites. Its `env.ts` is the older fail-fast variant that throws in production. |
| `arena/01a0eea6-…` | `547266c` | `deploy-vps.sh`, `ecosystem.config.js`, and the `.env.example` keys discussed above | Superseded. Shares history with `main` (merge-base `918c3c6`); 1 unique commit. |
| `upload/complete-project-2026-09-30` | `d1fb02c` | none | Fully superseded; `main` is a strict file-level superset. |
| `arena/01a0b208-…` | `2489e05` | 22 `docs/GLOBAL-*.md`, `docs/domains/**`, `config/DOMAIN-REGISTRY.yaml`, `PROTECTED-SERVICES.md`, the two VPS scripts | Documentation **rescued** into `docs/archive/2026-09-18-ecosystem-audit/`. VPS scripts not carried. |
| `arena/01a0ee4c-…` | `62e312e` | the same documentation, plus 6 Prisma models, 3 agent modules, 2 API routes, 2 audit scripts, 2 migrations | Documentation **rescued**. Code not carried — see below. |

## Content deliberately not carried forward

### The VPS deployment scripts

`deploy-vps.sh` and `ecosystem.config.js` appear on four branches. `main`
retired that deployment path: Hostinger is the single production authority, and
`scripts/check-manifest.mjs` fails CI if any workflow reintroduces an SSH,
rsync or process-manager deployment step. Carrying the scripts back in would
recreate exactly the condition that guard exists to prevent — two authoritative
deployment pipelines, neither of which is.

### Six Prisma models and the code that uses them

`arena/01a0ee4c-…` adds `AgentJob`, `DailyLearningTask`, `PracticeAttempt`,
`Recommendation`, `StudentProgress` and `StudentQuestionHistory`, with
`AgentJobService.ts`, `ExamQuestionAllocationAgent.ts`, `QualityGateAgent.ts`,
`api/practice`, `api/learning/daily-task` and `scripts/audit-production.ts`
built on them.

`main` does not have those models. It implements the same domain with a newer
and wider set — `DailyQuestionSet`, `LearningMemory`, `AgentLearning`,
`AgentEvolution`, `ExamAnalytics`, `AgentSpecialist`, `StudyMaterial`,
`ChatSession`, plus `AttemptQuestion` and `AttemptAnswer` — exposed through
`/api/learning/daily`, `/api/learning/dashboard`, `/api/learning/orchestrator`,
`/api/learning-memory` and `/api/agents/status`, backed by
`src/lib/ai/{learning,memory,self-development,rag,routing,examiner}` and
`src/lib/agents/`. No model exists on that branch that `main` lacks in any other
respect.

Adding the branch's files without its models would fail `tsc` and the build;
`tsconfig.json` includes `**/*.ts`, so even `scripts/audit-production.ts` is
typechecked.

### Two migrations dated before the ones production has applied

This is the one that would have caused an incident rather than a build failure.

`arena/01a0ee4c-…` carries `20260930120000_production_exam_integrity` and
`20260930150000_allocation_agents_practice`. `main`'s chain already contains
`20261008120000_exam_attempt_engine` and `20261008140000_exam_platform_schema`,
which production has applied. Prisma orders migrations lexicographically, so
those two would arrive **out of order**, be recorded as pending, and
`prisma migrate deploy` would replay `ALTER TABLE "Question" ADD COLUMN …` and
`CREATE TABLE …` against objects that already exist — failing the deploy against
a live database.

`scripts/check-schema-migrations.mjs` guards schema/migration parity in CI; it
cannot guard ordering against a database that only exists in production, so the
rule is: a migration whose timestamp sorts before an applied one is never added,
it is written forward with a current timestamp.

### The audit documentation was archived, not filed as current

The 34 files from the ecosystem inspection are in
[`archive/2026-09-18-ecosystem-audit/`](./archive/2026-09-18-ecosystem-audit/)
with a README that dates them and records what has since happened to each of
their 18 findings. They are a genuine record — two of the audit's findings,
S-01 (a committed SQLite database containing password hashes) and S-02 (`main`
red, live site of unknown provenance) — are exactly what the 2026-10-08 work
addressed. But they describe a retired VPS pipeline, six unrelated root domains
and a port map that no longer exists, so placing them in `docs/` as current
architecture would mislead the next person to deploy.

## Since consolidation

`main` moved while this work was being verified. PR #7 merged `arena/21ea772f-…`
into `main` as `cae9429`; that branch's tip had advanced from `ca5d32c` to
`21ad483`, restoring the question-seed chain in `package.json` and making
`scripts/validate-content.mjs` fail on an empty question bank. `origin/main` was
merged back into the deployment-reliability branch (`65ac9a6`) rather than the
other way round, so this branch stays a superset of `main` and the PR is a
fast-forward-equivalent merge.

Two consequences were handled rather than left to the next reader:

- `HOSTINGER_DEPLOYMENT.md` told operators to seed the question bank with
  `node prisma/seed.mjs` + `npm run prisma:seed:exams`. After `21ad483` the
  questions live in the `prisma:seed` chain, so those instructions produced a
  healthy deploy serving an exam platform with no exams in it. The sequence and
  the command table now match `package.json` and end with `content:validate`.
- `arena/21ea772f-…` was recorded as one commit ahead at `ca5d32c`. It is two
  commits ahead at `21ad483`, and both are reachable from `main`.

PR #8 was then merged into `main` as `bebc470` with an ordinary merge commit, so
the 151-commit history of this branch — including every `-s ours` record — is
preserved rather than squashed away.

## Result

`main` is `bebc470` (PR #8 merged 2026-10-08).

```
163 commits reachable from main
  3 root histories:  8efe9b6 (main's own)  1bd5c44  9e80804
  8 branches merged: every arena/* and upload/* branch is an ancestor of main
  0 branches with unique content that is not either in main or accounted for above
```

`git branch -r --merged origin/main` lists all of them.

Verified with:

```bash
# In a FULL clone. Run `git fetch --unshallow` first and confirm
# `git rev-parse --is-shallow-repository` prints false, or the ancestry test
# below silently truncates at the shallow boundary and reports false negatives.
git rev-parse --is-shallow-repository
for b in $(git branch -r --format='%(refname:short)' | grep -v HEAD); do
  git merge-base --is-ancestor "$b" origin/main && echo "$b merged" || echo "$b NOT merged"
done
git rev-list --count origin/main
```

Once `main` has this, the remote branches can be deleted from GitHub without
losing anything: their tips are ancestors of `main`, so every commit stays
reachable. Deleting them is optional and reversible only until garbage
collection runs, so it is worth doing once, deliberately, after the merge to
`main` is confirmed.
