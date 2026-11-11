/**
 * scripts/validate-content.mjs
 *
 * Database-backed content audit invoked by CI and postbuild. CI treats a
 * non-zero result as a release failure; postbuild logs the issue without
 * stopping the site build. It does not check official-format lengths, source
 * licensing, or whether a referenced audio file actually plays.
 *
 * Checks:
 *   1. Active objective multiple-choice questions have a usable index/key.
 *   2. Active fill-blank / short-answer tasks have a correct answer.
 *   3. Active matching / labeling tasks have valid answer indices.
 *   4. Missing LISTENING audioUrl is a warning only (not a release gate here).
 *   5. Subjective questions are excluded from objective scoring.
 *
 * Missing DATABASE_URL is BLOCKED (non-zero), never reported as an empty-bank
 * success. CI must supply a disposable database explicitly.
 */

// This validator checks database rows only. It does not statically parse seed
// scripts, and it cannot establish content licensing, exam-format fidelity, or
// audio playback. CI supplies a disposable migrated database; local runs must
// provide an explicitly chosen safe DATABASE_URL or receive a blocked result.
// Runtime question selection independently excludes ungradeable objective rows.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * Minimal .env reader. Only fills in variables that are not already set, and
 * only from the repository's own .env / .env.local files. It never overrides
 * an exported value and never writes anything back.
 */
function loadDotEnv() {
  for (const name of ['.env', '.env.local']) {
    const file = join(ROOT, name);
    if (!existsSync(file)) continue;
    let contents;
    try {
      contents = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const line of contents.split('\n')) {
      const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      const key = match[1];
      if (process.env[key] !== undefined) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

const errors = [];
const warnings = [];

/**
 * The question-type vocabulary is shared with the server-side grader and the
 * bank auditor, so "valid type" means the same thing in all three places.
 * See src/lib/exam/question-types.json.
 */
const QUESTION_TYPES = JSON.parse(
  readFileSync(join(ROOT, 'src/lib/exam/question-types.json'), 'utf8'),
);

const INDEX_TYPES = new Set(QUESTION_TYPES.indexTypes);
const TEXT_TYPES = new Set(QUESTION_TYPES.textTypes);
const SET_TYPES = new Set(QUESTION_TYPES.setTypes);
const SUBJECTIVE_TYPES = new Set(QUESTION_TYPES.subjectiveTypes);

function isObjective(t) {
  const u = String(t).toUpperCase().replace(/-/g, '_');
  return INDEX_TYPES.has(u) || TEXT_TYPES.has(u) || SET_TYPES.has(u);
}

function parseJsonArray(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function hasUsableAnswerKey(q, type) {
  if (INDEX_TYPES.has(type)) {
    const options = parseJsonArray(q.options);
    const hasIndex = Number.isInteger(q.correctIndex) && q.correctIndex >= 0;
    const hasTfTextKey = ['TRUE_FALSE', 'TRUE_FALSE_NOT_GIVEN'].includes(type)
      && typeof q.correctAnswer === 'string'
      && q.correctAnswer.trim().length > 0;
    if (hasIndex) {
      const isTrueFalseType = ['TRUE_FALSE', 'TRUE_FALSE_NOT_GIVEN'].includes(type);
      const defaultOptionCount = type === 'TRUE_FALSE' ? 2 : 3;
      const optionCount = options?.length ? options.length : (isTrueFalseType ? defaultOptionCount : 0);
      return optionCount > q.correctIndex;
    }
    return hasTfTextKey;
  }
  if (TEXT_TYPES.has(type)) return typeof q.correctAnswer === 'string' && q.correctAnswer.trim().length > 0;
  if (SET_TYPES.has(type)) {
    const parsed = parseJsonArray(q.correctIndices);
    const arrayKey = parsed && parsed.length > 0 && parsed.every((value) => Number.isInteger(value) && value >= 0);
    const indexKey = Number.isInteger(q.correctIndex) && q.correctIndex >= 0;
    return Boolean(arrayKey || indexKey);
  }
  return false;
}

// Run only against an explicitly configured database. Missing DATABASE_URL is
// a blocked validation, not a successful empty-bank check.
async function validateDb() {
  if (!process.env.DATABASE_URL) {
    // `npm run build` runs this through `postbuild`, and a build does not
    // export the shell environment. Without this the gate printed
    // "BLOCKED: DATABASE_URL is not set" on every local build and never
    // actually checked anything. Load the project's own .env file — but only
    // when DATABASE_URL is still unset, so an explicitly exported value
    // always wins.
    loadDotEnv();
  }
  if (!process.env.DATABASE_URL) {
    console.error('  ✗ BLOCKED: DATABASE_URL is not set; no content validation was performed.');
    process.exitCode = 2;
    return;
  }
  let prisma;
  try {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    const questions = await prisma.question.findMany({
      select: { id: true, section: true, type: true, correctIndex: true, correctAnswer: true, correctIndices: true, options: true, audioUrl: true, practiceSet: { select: { isActive: true } } },
    });

    let objectiveTotal = 0;
    let ungradeable = 0;
    let unsupportedTypes = 0;
    let listeningWithoutAudio = 0;

    for (const q of questions) {
      if (!q.practiceSet?.isActive) continue;
      const t = q.type.toUpperCase().replace(/-/g, '_');
      if (SUBJECTIVE_TYPES.has(t)) continue;
      if (!isObjective(t)) {
        unsupportedTypes++;
        errors.push(`  ✗ Question ${q.id} (${q.section}/${q.type}) has an unsupported question type`);
        continue;
      }
      objectiveTotal++;

      const gradeable = hasUsableAnswerKey(q, t);
      if (!gradeable) {
        ungradeable++;
        errors.push(`  ✗ Question ${q.id} (${q.section}/${q.type}) is not gradeable`);
      }
      if (q.section === 'LISTENING' && !q.audioUrl) {
        listeningWithoutAudio++;
        warnings.push(`  ⚠ Listening question ${q.id} has no audioUrl (will be generated by audio:generate or hidden from audio player)`);
      }
    }

    console.log(`  Content validation: ${questions.length} total questions, ${objectiveTotal} active objective questions, ${ungradeable} ungradeable, ${unsupportedTypes} unsupported types.`);
    if (questions.length === 0) {
      // An empty bank passes every other check vacuously, so say so loudly.
      // This is what happened when `prisma:seed` was reduced to a single seed
      // file: CI reported "all selectable objective questions are gradeable"
      // over a database with no questions in it.
      console.error('\n  ✗ The question bank is EMPTY — this database has no questions.');
      console.error('    The core seed (`npm run prisma:seed`) only creates the administrator,');
      console.error('    the exam types and the settings. Question content is deliberately NOT');
      console.error('    part of that chain: the only bundled question seeders write unlicensed');
      console.error('    synthetic fixtures and refuse to run against a production database');
      console.error('    (see prisma/seed-sample-guard.mjs).');
      console.error('    For a disposable CI/test database, run:');
      console.error('      ALLOW_SYNTHETIC_SAMPLE_QUESTIONS=1 npm run db:seed:sample-bank');
      console.error('    For production, load reviewed, licensed content through the admin');
      console.error('    content workflow.');
      process.exitCode = 1;
    } else if (ungradeable > 0 || unsupportedTypes > 0) {
      console.error('\n  CONTENT TYPE/ANSWER-KEY ERRORS:');
      errors.slice(0, 20).forEach((e) => console.error(e));
      process.exitCode = 1;
    } else {
      console.log(`  ✓ All selectable objective questions are gradeable.`);
    }
    if (listeningWithoutAudio > 0) {
      console.log(`  ℹ ${listeningWithoutAudio} listening questions lack audio — run npm run audio:generate on a host with internet to synthesise them.`);
    }
  } catch (err) {
    console.error(`  ✗ Database content validation failed: ${err.message}. Run npm run content:validate after prisma generate and verify database connectivity.`);
    process.exitCode = 1;
  } finally {
    if (prisma) await prisma.$disconnect().catch((err) => {
      console.error(`  ✗ Prisma disconnect failed: ${err.message}`);
      process.exitCode = 1;
    });
  }
}

validateDb();
