# Branch consolidation — 2026-10-08

Every branch in this repository is now an ancestor of `main`. This records what
was merged, what content moved, and — where content did not move — exactly why.

## Before

`main` was a **single orphan commit**:

```
c5ef20d  Repair merge corruption, manifest/Prisma drift, CI false-greens;
         add missing migration (#6)
```

It had no parent. `git merge-base main <any other branch>` returned nothing for
six of the seven open branches, so none of them could be merged normally: a
content merge against an unrelated history conflicts on every file, and
resolving it in the obvious direction would have reverted the repairs that
commit was created to make.

Seven branches were open:

| Branch | Commits ahead | Common ancestor with `main` |
| --- | --- | --- |
| `arena/21ea772f-…` | 1 | **yes** — `main`'s tip |
| `arena/847f6969-…` | 68 | none |
| `arena/c61b298e-…` | 64 | none |
| `arena/01a0ee4c-…` | 62 | none |
| `arena/01a0b208-…` | 58 | none |
| `arena/01a0eea6-…` | 56 | none |
| `upload/complete-project-2026-09-30` | 1 | none |

## What was done

### 1. The one branch that could be merged normally, was

`arena/21ea772f-…` descends from `main`'s tip, so it merged as an ordinary
three-way merge (`5cff1c7`) and its single change applied cleanly alongside the
CI restructuring: the "Validate question content" step now re-emits the
question-bank numbers as `::notice` annotations while still exiting with the
validator's own code.

### 2. The other six were recorded with `-s ours`

```
git merge -s ours --allow-unrelated-histories --no-ff origin/<branch>
```

`-s ours` makes the branch an ancestor of `main` while keeping `main`'s tree.
Their commits become reachable from `main` — 143 of them, taking `main` from 1
reachable commit to 144; `git branch --merged main` reports every branch;
nothing is orphaned, and any of it can be recovered with
`git checkout <branch> -- <path>` at any time. What it does **not** do is change
a single file — which is the point, because on every overlapping path `main` was
the newer side.

Each merge commit carries the branch-specific reasoning. Summary:

| Branch | Merge | Unique content | Disposition |
| --- | --- | --- | --- |
| `arena/847f6969-…` | `57b9f54` | none | Fully superseded. Its own tip had already merged `main` in (`aada8fa`); `main` then repaired the result. |
| `arena/c61b298e-…` | *(already reachable via `57b9f54`)* | `deploy-vps.sh`, `ecosystem.config.js` | Superseded. Its exam engine is in `main` as `src/lib/exam/*` with two test suites. Its `env.ts` is the older fail-fast variant that throws in production. |
| `arena/01a0eea6-…` | `547266c` | `deploy-vps.sh`, `ecosystem.config.js` | Superseded. |
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
- `arena/21ea772f-…` is listed above as one commit ahead at `ca5d32c`. It is now
  two commits ahead at `21ad483`, and both are reachable from this branch.

## Result

```
at consolidation   144 commits reachable from main   (was 1)
                   7 branches merged                 (was 0)
                   0 branches with unique content that is not either in main
                     or accounted for above

now                151 commits reachable from this branch
                   147 ahead of main, 0 behind
                   all 7 branches and origin/main are ancestors of HEAD
```

Verified with:

```bash
for b in $(git branch -r --format='%(refname:short)' | grep -v HEAD); do
  git merge-base --is-ancestor "$b" main && echo "$b merged" || echo "$b NOT merged"
done
```

Once `main` has this, the remote branches can be deleted from GitHub without
losing anything: their tips are ancestors of `main`, so every commit stays
reachable. Deleting them is optional and reversible only until garbage
collection runs, so it is worth doing once, deliberately, after the merge to
`main` is confirmed.
