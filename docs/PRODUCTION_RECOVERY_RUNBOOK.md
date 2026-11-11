# Production recovery runbook

Production origin: `https://english.alolabs.net`  
Expected host checkout (operator-supplied): `/home/aloedu/projects/ALO_ENGLISH_AI_NATIVE_COMPLETE`

This runbook does **not** assert that production has been changed. Run it on the production host with the same environment as the application. Never run a sample question seeder, `migrate reset`, `db push`, or `migrate dev` against production.

## 1. Verify the release and database before writes

```bash
cd /home/aloedu/projects/ALO_ENGLISH_AI_NATIVE_COMPLETE
git status --short --branch
git rev-parse HEAD
git log -1 --oneline
node --version
npm run db:generate
npx prisma migrate status
```

Confirm the Hostinger panel runs `main`, `npm install`, `npm run build`, and `npm start`, with `server.js` as the entry file. The application environment must contain an **absolute** SQLite `DATABASE_URL`, `APP_DATA_DIR` outside the release directory, `APP_URL=https://english.alolabs.net`, `EXAM_REQUIRE_LISTENING_AUDIO=true`, and a stable `AUTH_SECRET`. Do not print secrets.

Resolve and inspect the exact database without writing:

```bash
node --input-type=module <<'NODE'
import { DatabaseSync } from 'node:sqlite';
const url = process.env.DATABASE_URL;
if (!url?.startsWith('file:/')) throw new Error('absolute SQLite DATABASE_URL required');
const path = url.slice(5).split('?')[0];
if (path.includes('/.next/')) throw new Error('database is inside replaceable build output');
const db = new DatabaseSync(path, { readOnly: true });
console.log('integrity:', db.prepare('PRAGMA integrity_check').get());
for (const table of ['User','Session','Student','Attempt','Score','ExamType','PracticeSet','Question','AgentDefinition','AgentJob']) {
  console.log(table, db.prepare(`SELECT COUNT(*) AS n FROM "${table}"`).get().n);
}
console.log('migrations:', db.prepare('SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at').all());
db.close();
NODE
```

The repository schema is SQLite and currently has 64 models. `scripts/check-schema-migrations.mjs` checks schema/migration parity. Production migration status and the live file must still be checked on the host; a local schema check is not deployment evidence.

## 2. Back up and prove restoration

```bash
export BACKUP_DIR=/home/aloedu/alo-english-backups
npm run backup
npm run drill:restore -- /home/aloedu/alo-english-backups/alo-english-backup-YYYYmmdd_HHMMSS.tar.gz
```

The backup uses SQLite `.backup` or `VACUUM INTO`; it never falls back to copying a live DB/WAL. The copied database is integrity-checked. The restore drill must end in `RESULT: PASS` before any content or metadata write. Keep the archive, checksum, and drill output in the release record.

## 3. Initialize only missing exam metadata

Dry-run first:

```bash
npm run exam-types:init
npm run exam-types:init -- --apply
```

This inserts only missing `ExamType` codes from `prisma/seed.mjs`. It does not upsert or update users, administrator credentials, sessions, students, sets, or questions. It creates and verifies its own pre-write backup. Existing inactive exam types are left unchanged. The core admin seed is not needed for this operation.

## 4. Audit the 176 source candidates

```bash
npm run content:audit -- --output /secure/release-record/source-question-audit.json
```

A non-zero result is expected while any source item is unsupported, duplicated, unkeyed, or lacks verified listening media. Structural eligibility is not publication approval. The source header claiming originality is not independent evidence.

## 5. Prepare a reviewed import bundle

The importer accepts only a separate JSON bundle approved by a named human. It does not import `src/lib/question-bank.ts` automatically. A bundle has this shape:

```json
{
  "schemaVersion": 1,
  "bundleId": "unique-release-bundle-id",
  "approval": {
    "status": "APPROVED",
    "reference": "immutable-review-record-reference",
    "decidedBy": "named accountable reviewer",
    "decidedAt": "YYYY-MM-DD",
    "formatApproved": true,
    "originalityApproved": true,
    "approvedQuestionIds": ["stable-question-id"]
  },
  "practiceSets": [{
    "id": "stable-practice-set-id",
    "title": "Reviewed original practice",
    "description": "Scope and practice-only disclosure",
    "durationMin": 60,
    "examType": { "code": "IELTS-A", "name": "IELTS Academic", "category": "English Proficiency" },
    "questions": [{
      "id": "stable-question-id",
      "section": "READING",
      "type": "MULTIPLE_CHOICE",
      "prompt": "Reviewed prompt",
      "passage": "Reviewed original passage",
      "options": ["A", "B"],
      "correctIndex": 0,
      "points": 1,
      "order": 0
    }]
  }]
}
```

All 19 canonical types in `src/lib/exam/question-types.json` are supported, subject to their key rules. Objective questions require usable keys; subjective items require the appropriate evaluation workflow. Every question ID must appear exactly once in `approvedQuestionIds`.

Each `LISTENING` item additionally requires `audioUrl` and:

```json
"audio": {
  "verified": true,
  "verifiedBy": "named media reviewer",
  "verifiedAt": "YYYY-MM-DDTHH:mm:ssZ",
  "sha256": "64-lowercase-hex-characters",
  "mimeType": "audio/mpeg",
  "byteSize": 12345,
  "audioFile": "/absolute/reviewed/file.mp3"
}
```

When `audioFile` is present, the importer verifies its hash. The separate provenance manifest must pass `content:provenance`, declare exactly the bundle's per-exam question counts and listening-audio total, and contain actual rights, format, answer-key, and human-review evidence. Do not copy placeholders into a production manifest.

## 6. Dry-run, stage, validate, then publish

```bash
export DATABASE_URL='file:/absolute/persistent/path/production.db'
export QUESTION_PROVENANCE_FILE='/secure/release-record/question-provenance.json'

npm run content:import -- \
  --bundle /secure/release-record/reviewed-bundle.json \
  --provenance "$QUESTION_PROVENANCE_FILE"

npm run content:import -- \
  --bundle /secure/release-record/reviewed-bundle.json \
  --provenance "$QUESTION_PROVENANCE_FILE" \
  --apply --backup-dir /home/aloedu/alo-english-backups
```

`--apply` stages new sets **inactive**. The command is transactional and idempotent. It refuses changed content under an existing ID and normalized-prompt duplicates; it never overwrites an existing row. Every write has an integrity-checked backup and a rollback receipt. Logs contain IDs and counts, not answer keys.

Run all validation and end-to-end review against staged content. Publication is a separate explicit decision:

```bash
npm run content:import -- \
  --bundle /secure/release-record/reviewed-bundle.json \
  --provenance "$QUESTION_PROVENANCE_FILE" \
  --apply --publish --backup-dir /home/aloedu/alo-english-backups

npm run content:validate
npm run content:provenance -- --database
```

## 7. Roll back only an import's own new records

```bash
npm run content:rollback -- \
  /home/aloedu/alo-english-backups/alo-content-pre-write-....db.rollback.json \
  --backup-dir /home/aloedu/alo-english-backups
```

Rollback verifies every imported question hash, refuses to delete content used by attempts or sets that gained other questions, creates another verified backup, and deletes only the receipt's new questions, sets, and exam types. It does not roll back user data or substitute a whole-database restore. Activation-only receipts do not deactivate sets; use the administrator workflow for a deliberate unpublish decision.

## 8. Agent workforce

The runtime registers 14 handlers. The worker endpoint requires either an ADMIN/SUPER_ADMIN session or `AGENT_WORKER_TOKEN`; job events, artifacts, metrics, and `AgentApproval` records provide the audit trail. Publication requires human approval.

Set the worker token in the host's secret environment, never Git. Use the same value for the app and worker, configure `AGENT_WORKER_URL=http://127.0.0.1:3000` on the host, then test:

```bash
node scripts/agent-worker.mjs --once --max 1
curl -H "x-agent-worker-token: $AGENT_WORKER_TOKEN" \
  http://127.0.0.1:3000/api/agents/worker/run
```

Only after an authenticated test succeeds, install the host-specific cron entry based on `server-config/alo-english-agent-worker.cron`. Confirm the cron log and database `AgentJob`/`AgentJobEvent` records. A repository cron template is not evidence that a host schedule is active.

## 9. Required release evidence

- TypeScript, ESLint, all unit/integration tests, build, content validation, provenance validation, and artifact smoke test.
- Authenticated registration/login and a real learner attempt: frozen selection, server timer, autosave, listening playback, speaking capture/transcript, writing, submission, deterministic objective grading, evaluation persistence, result reload, and admin analytics.
- Production counts before/after and the deployed commit observed on the host.
- A real password-reset delivery test to an operator-controlled mailbox. Until then, the intentionally disabled reset endpoint must remain disabled and delivery is **BLOCKED**.
- Verify that `marketingos` and every unrelated PM2/systemd/Hostinger service remain configured and running. Do not run global process-manager or service reset commands.
