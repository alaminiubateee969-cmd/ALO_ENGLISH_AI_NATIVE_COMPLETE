#!/usr/bin/env node
/**
 * scripts/validate-question-provenance.mjs
 *
 * Release gate for question-bank provenance.
 *
 * WHY THIS EXISTS
 * ───────────────
 * `scripts/validate-content.mjs` answers "is every selectable question
 * gradeable?" — it cannot answer "is this content lawful to publish?". A bank
 * of perfectly gradeable questions can still be an unlicensed copy of someone
 * else's exam. This gate covers the second question:
 *
 *   - which exam each bank belongs to, and how many questions it declares
 *   - who authored it, and under which licence
 *   - the evidence that permission exists (contract or written grant reference)
 *   - the official source used to confirm the format, and when it was checked
 *   - where the answer keys came from
 *   - whether audio rights were cleared, when listening items claim audio
 *
 * FAIL-CLOSED CONTRACT
 * ────────────────────
 *   - No manifest            → exit 1 (BLOCKED, not "passes vacuously")
 *   - Manifest with placeholders (TBD, N/A, sample) → exit 1
 *   - Manifest valid         → exit 0
 *   - `--database` requested but no DATABASE_URL or no generated Prisma client
 *     → exit 2 (BLOCKED: the check could not run, which is not a pass)
 *
 * The example at prisma/question-provenance.example.json intentionally fails:
 * it is a shape reference with placeholder values, and placeholders are exactly
 * what this gate refuses. `tests/question-provenance.test.ts` asserts that.
 *
 * Usage:
 *   node scripts/validate-question-provenance.mjs
 *   node scripts/validate-question-provenance.mjs --file=path/to/manifest.json
 *   node scripts/validate-question-provenance.mjs --database
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DEFAULT_MANIFEST = join(ROOT, 'prisma', 'question-provenance.json');

/** Values that look like fields but carry no evidence. */
const PLACEHOLDER = /^(|tbd|tba|todo|unknown|unsure|n\/?a|none|nil|null|xxx+|placeholder|sample|dummy|lorem ipsum|change ?me|-+)$/i;

/** Hosts accepted as official sources for exam formats. */
const OFFICIAL_SOURCE_HOSTS = [
  'ielts.org',
  'britishcouncil.org',
  'britishcouncil.com',
  'idp.com',
  'ieltsessentials.com',
  'ets.org',
  'pearsonpte.com',
  'pearson.com',
  'englishtest.duolingo.com',
  'duolingo.com',
  'cambridgeenglish.org',
  'gov.uk',
];

const DAY_MS = 24 * 60 * 60 * 1000;

function isPlaceholder(value) {
  return typeof value !== 'string' || PLACEHOLDER.test(value.trim());
}

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hostOf(url) {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function isOfficialHost(host) {
  if (!host) return false;
  return OFFICIAL_SOURCE_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

/**
 * Validate a manifest object. Pure: no filesystem, no database, no clock of its
 * own (the reference date is injected so tests are deterministic).
 *
 * @param {unknown} manifest Parsed manifest JSON.
 * @param {{ now?: Date }} [options]
 * @returns {{ errors: string[], warnings: string[], summary: object }}
 */
export function validateProvenance(manifest, options = {}) {
  const now = options.now ?? new Date();
  const errors = [];
  const warnings = [];
  const summary = {
    manifestVersion: null,
    examTypes: 0,
    declaredQuestions: 0,
    declaredListeningWithAudio: 0,
    licences: [],
  };

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return { errors: ['Manifest is not a JSON object.'], warnings, summary };
  }

  summary.manifestVersion = manifest.manifestVersion ?? null;
  if (manifest.manifestVersion !== 1) {
    errors.push(`manifestVersion must be 1 (found ${JSON.stringify(manifest.manifestVersion)}).`);
  }

  if (isPlaceholder(manifest.updatedAt) || !parseDate(manifest.updatedAt)) {
    errors.push('updatedAt must be an ISO date (YYYY-MM-DD).');
  }

  const examTypes = manifest.examTypes;
  if (!Array.isArray(examTypes) || examTypes.length === 0) {
    errors.push('examTypes must be a non-empty array: a manifest that declares nothing proves nothing.');
    return { errors, warnings, summary };
  }
  summary.examTypes = examTypes.length;

  const seenCodes = new Set();

  examTypes.forEach((entry, index) => {
    const where = `examTypes[${index}]`;
    if (!entry || typeof entry !== 'object') {
      errors.push(`${where} is not an object.`);
      return;
    }

    const code = typeof entry.code === 'string' ? entry.code.trim() : '';
    if (isPlaceholder(code)) {
      errors.push(`${where}.code is missing or a placeholder.`);
    } else if (seenCodes.has(code)) {
      errors.push(`${where}.code "${code}" is declared more than once.`);
    } else {
      seenCodes.add(code);
    }

    if (isPlaceholder(entry.name)) errors.push(`${where}.name is missing or a placeholder.`);
    if (isPlaceholder(entry.contentOwner)) errors.push(`${where}.contentOwner is missing (who authored this bank?).`);

    // ── Licence ──────────────────────────────────────────────────────────
    const licence = entry.licence ?? {};
    if (isPlaceholder(licence.id)) errors.push(`${where}.licence.id is missing or a placeholder.`);
    if (isPlaceholder(licence.name)) errors.push(`${where}.licence.name is missing or a placeholder.`);
    if (typeof licence.id === 'string' && !isPlaceholder(licence.id)) {
      summary.licences.push(licence.id);
    }
    if (licence.attributionRequired === true && isPlaceholder(licence.attributionText)) {
      errors.push(`${where}.licence.attributionText is required when attributionRequired is true.`);
    }

    // ── Permission evidence ──────────────────────────────────────────────
    const permission = entry.permission ?? {};
    const isOriginalWork = typeof licence.id === 'string' && /^ORIGINAL/i.test(licence.id.trim());
    if (isPlaceholder(permission.evidenceReference)) {
      errors.push(
        isOriginalWork
          ? `${where}.permission.evidenceReference is missing (record the authoring/review reference even for original work).`
          : `${where}.permission.evidenceReference is missing: licensed content needs a contract or written-grant reference.`,
      );
    }
    if (isPlaceholder(permission.grantedBy)) errors.push(`${where}.permission.grantedBy is missing.`);
    const grantedOn = parseDate(permission.grantedOn);
    if (!grantedOn) errors.push(`${where}.permission.grantedOn must be an ISO date (YYYY-MM-DD).`);
    else if (grantedOn.getTime() > now.getTime() + DAY_MS) errors.push(`${where}.permission.grantedOn is in the future.`);

    const expiresOn = permission.expiresOn === null ? null : parseDate(permission.expiresOn);
    if (permission.expiresOn !== null && !expiresOn) {
      errors.push(`${where}.permission.expiresOn must be null or an ISO date.`);
    } else if (expiresOn && expiresOn.getTime() < now.getTime()) {
      errors.push(`${where}.permission.expiresOn has passed: the licence must be renewed before this bank is published.`);
    }

    // ── Official format ──────────────────────────────────────────────────
    const format = entry.officialFormat ?? {};
    if (format.verified !== true) {
      errors.push(`${where}.officialFormat.verified must be true: unverified format cannot be published as exam-shaped.`);
    }
    if (isPlaceholder(format.sourceUrl)) {
      errors.push(`${where}.officialFormat.sourceUrl is missing.`);
    } else {
      const host = hostOf(format.sourceUrl);
      if (!host) errors.push(`${where}.officialFormat.sourceUrl is not a valid URL.`);
      else if (!isOfficialHost(host)) {
        warnings.push(
          `${where}.officialFormat.sourceUrl host "${host}" is not a known official provider host — confirm it is the provider's own domain.`,
        );
      }
    }
    const checkedOn = parseDate(format.checkedOn);
    if (!checkedOn) errors.push(`${where}.officialFormat.checkedOn must be an ISO date (YYYY-MM-DD).`);
    else if (checkedOn.getTime() > now.getTime() + DAY_MS) errors.push(`${where}.officialFormat.checkedOn is in the future.`);
    else if (now.getTime() - checkedOn.getTime() > 365 * DAY_MS) {
      warnings.push(`${where}.officialFormat.checkedOn is older than 12 months — re-check the provider format.`);
    }

    // ── Answer keys ──────────────────────────────────────────────────────
    if (isPlaceholder(entry.answerKeySource)) {
      errors.push(`${where}.answerKeySource is missing: say who verified the keys and when.`);
    }

    // ── Counts ───────────────────────────────────────────────────────────
    const counts = entry.declaredCounts ?? {};
    const questionCount = counts.questionCount;
    const listeningCount = counts.listeningWithVerifiedAudio ?? 0;

    if (!Number.isInteger(questionCount) || questionCount <= 0) {
      errors.push(`${where}.declaredCounts.questionCount must be a positive integer.`);
    } else {
      summary.declaredQuestions += questionCount;
    }
    if (!Number.isInteger(listeningCount) || listeningCount < 0) {
      errors.push(`${where}.declaredCounts.listeningWithVerifiedAudio must be an integer >= 0.`);
    } else {
      summary.declaredListeningWithAudio += listeningCount;
      if (Number.isInteger(questionCount) && listeningCount > questionCount) {
        errors.push(`${where}.declaredCounts.listeningWithVerifiedAudio cannot exceed questionCount.`);
      }
    }

    // ── Audio rights ─────────────────────────────────────────────────────
    if (listeningCount > 0) {
      const audio = entry.audioRights ?? {};
      if (audio.included !== true) {
        errors.push(
          `${where}.audioRights.included must be true when listening items claim verified audio (recording/TTS rights must be cleared).`,
        );
      }
      if (isPlaceholder(audio.licenceId)) {
        errors.push(`${where}.audioRights.licenceId is missing (e.g. the TTS or voice-talent licence reference).`);
      }
    }

    // ── Review ───────────────────────────────────────────────────────────
    if (isPlaceholder(entry.reviewedBy)) errors.push(`${where}.reviewedBy is missing (a named human reviewer).`);
    const reviewedOn = parseDate(entry.reviewedOn);
    if (!reviewedOn) errors.push(`${where}.reviewedOn must be an ISO date (YYYY-MM-DD).`);
    else if (now.getTime() - reviewedOn.getTime() > 365 * DAY_MS) {
      warnings.push(`${where}.reviewedOn is older than 12 months — re-review before publishing.`);
    }
  });

  if (summary.declaredQuestions === 0) {
    errors.push('declaredCounts.questionCount totals zero across every exam: an empty bank is a blocker, not a pass.');
  }

  return { errors, warnings, summary };
}

/** Read and parse a manifest file. Returns { manifest } or { error }. */
export function loadManifest(path) {
  if (!existsSync(path)) return { error: `No provenance manifest at ${path}` };
  try {
    return { manifest: JSON.parse(readFileSync(path, 'utf8')) };
  } catch (error) {
    return { error: `Manifest is not valid JSON: ${error.message}` };
  }
}

/**
 * Compare declared counts with the database. Requires a generated Prisma client
 * and a DATABASE_URL; returns a blocked result rather than a pass when either is
 * missing.
 */
export async function compareWithDatabase(manifest) {
  if (!process.env.DATABASE_URL) {
    return { blocked: 'DATABASE_URL is not set, so declared counts were not verified against the database.' };
  }

  let prisma;
  try {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();

    const rows = await prisma.question.findMany({
      select: { practiceSet: { select: { examType: { select: { code: true } } } } },
    });

    const actual = new Map();
    for (const row of rows) {
      const code = row.practiceSet?.examType?.code;
      if (!code) continue;
      actual.set(code, (actual.get(code) ?? 0) + 1);
    }

    const mismatches = [];
    for (const entry of manifest.examTypes ?? []) {
      const declared = entry?.declaredCounts?.questionCount ?? 0;
      const found = actual.get(entry?.code) ?? 0;
      if (declared !== found) {
        mismatches.push(`${entry?.code}: declared ${declared}, database has ${found}`);
      }
    }

    return { actual: Object.fromEntries(actual), mismatches };
  } catch (error) {
    return { blocked: `Could not read question counts: ${error.message}` };
  } finally {
    if (prisma) await prisma.$disconnect().catch(() => {});
  }
}

async function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find((arg) => arg.startsWith('--file='));
  const checkDatabase = args.includes('--database');
  const manifestPath = fileArg ? resolve(fileArg.slice('--file='.length)) : resolve(process.env.QUESTION_PROVENANCE_FILE || DEFAULT_MANIFEST);

  console.log('▸ Question-bank provenance gate');
  console.log(`  manifest: ${manifestPath}`);

  const loaded = loadManifest(manifestPath);
  if (loaded.error) {
    console.error('');
    console.error(`  ✗ BLOCKED: ${loaded.error}`);
    console.error('    This is release blocker #1: no licensed, provenance-recorded question bank exists.');
    console.error('    Record one with: cp prisma/question-provenance.example.json prisma/question-provenance.json');
    console.error('    then fill every field with real evidence. Placeholders are rejected by design.');
    console.error('    See docs/QUESTION_BANK_PROVENANCE.md.');
    process.exitCode = 1;
    return;
  }

  const { errors, warnings, summary } = validateProvenance(loaded.manifest);
  console.log(
    `  declared: ${summary.examTypes} exam type(s), ${summary.declaredQuestions} question(s), ` +
      `${summary.declaredListeningWithAudio} with verified listening audio; licences: ${summary.licences.join(', ') || 'none'}`,
  );

  for (const warning of warnings) console.warn(`  ⚠ ${warning}`);

  if (errors.length > 0) {
    console.error('');
    console.error(`  ✗ PROVENANCE INCOMPLETE — ${errors.length} error(s):`);
    errors.slice(0, 25).forEach((error) => console.error(`    - ${error}`));
    if (errors.length > 25) console.error(`    …and ${errors.length - 25} more.`);
    process.exitCode = 1;
    return;
  }

  console.log('  ✓ Manifest is complete and internally consistent.');

  if (checkDatabase) {
    const result = await compareWithDatabase(loaded.manifest);
    if (result.blocked) {
      console.error(`  ✗ BLOCKED: ${result.blocked}`);
      process.exitCode = 2;
      return;
    }
    if (result.mismatches.length > 0) {
      console.error('  ✗ Declared counts do not match the database:');
      result.mismatches.forEach((mismatch) => console.error(`    - ${mismatch}`));
      process.exitCode = 1;
      return;
    }
    console.log(`  ✓ Declared counts match the database (${Object.keys(result.actual).length} exam code(s) present).`);
  } else {
    console.log('  ℹ Run with --database to verify declared counts against the live database.');
  }
}

const isDirectRun =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main().catch((error) => {
    console.error(`  ✗ Provenance validation crashed: ${error.message}`);
    process.exitCode = 1;
  });
}
