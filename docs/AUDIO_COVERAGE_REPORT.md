# Audio Coverage Report

**Audit date:** 2026-10-10  
**Report status:** BLOCKED  
**Verified database audio coverage:** NOT VERIFIED

## Counts

| Evidence source | Count / result | Meaning |
| --- | --- | --- |
| Files under `public/audio/listening/` in this workspace | 0 | No local listening MP3 assets are present; this is not a production file count. |
| Active Listening questions in the database | NOT VERIFIED | `DATABASE_URL` was unset; no DB was opened. |
| `QuestionAudioAsset` READY / FAILED / PENDING rows | NOT VERIFIED | No database query was run. |
| Browser-playable deployed recordings | NOT VERIFIED | No deployed URL, browser, or audio endpoint was tested. |
| Static legacy seed declarations | Some Listening rows exist in guarded sample scripts; see `EXAM_COVERAGE_REPORT.md` | Source declarations are not database rows or audio coverage. |

## Implementation reviewed

- `Question.audioUrl` and `QuestionAudioAsset` are present in `prisma/schema.prisma`. The asset record carries status, location, MIME type, byte size, hash, voice, attempts, error, generation time, and verification time.
- `scripts/generate-listening-audio.mjs` generates candidates with `edge-tts`, requires a usable script (`passage`), checks MP3 structure and bounds, writes a temporary file, atomically renames it, and records the URL/asset state. Remote URLs are not blindly trusted by the generator.
- `scripts/verify-listening-audio.mjs` can check a same-origin public asset or an explicitly allowed HTTPS host with bounded range/content-type/size checks, then records a READY/FAILED state. It requires explicit environment confirmation and an audio public base URL.
- `src/lib/exam/selection.ts` now blocks a new attempt before quota reservation if a gradeable Listening item lacks a matching `READY` asset record, URL, and verification timestamp. The 422 response does not expose question IDs. This is a DB-metadata gate, not a live delivery check.
- The generator’s local MP3 structural checks do not establish speech intelligibility, pronunciation fairness, exam-script validity, voice rights, or browser compatibility. Accent/dialect differences must not be scored as errors.

## Test and runtime evidence

- Pure audio utility tests exercised MP3 signature/size/hash and path traversal handling in the available Bun run. The audio verification test emitted an expected negative-case `FAIL q-missing` log for a deliberately missing fixture; it did not validate any production asset.
- No generation command was run. The generator requires `edge-tts`, an explicit safe database URL, and outbound access to the TTS service. No approved production/test database or audio provider session was available.
- `npm run audio:verify` was not run. It requires `AUDIO_VERIFY_CONFIRM=YES`, `AUDIO_PUBLIC_BASE_URL`, an explicitly selected database, and access to the target public host. The sandbox's outbound network allowlist does not include the production host.
- No browser playback, seek/range behavior, mobile playback, autoplay behavior, or screen-reader audio controls were tested.

## PR #10 review

[PR #10](https://github.com/alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE/pull/10) is open and contains a one-line fix that awaits a file-stat promise before persisting generated audio. Its listed GitHub build/test checks passed, but the PR body explicitly says audio generation and 114/114 coverage were not verified. The current working branch contains a rewritten generator that awaits filesystem checks and validates the output before persistence; no cherry-pick or merge of PR #10 was performed. Neither fact is evidence of deployed playback.

## Required release evidence

1. Approved, safe database snapshot: exact active Listening question count by exam, set, section, and asset status.
2. For every active Listening question: script/content provenance and license, matching URL and asset metadata, exact byte/format validation, and a successful HTTPS response from the target deployment.
3. Browser tests for actual playback, seek/range, repeat policy, keyboard access, mobile devices, and no transcript/answer leakage.
4. Verify assets are copied to the production artifact and persist across redeploys; confirm a backup/restore plan for any external media store.
5. Confirm TTS voice/service use and distribution rights before treating generated files as production materials.

Until these are recorded, Listening coverage remains **BLOCKED**; do not label any exam bank full-length or fully playable.
