#!/usr/bin/env node
/**
 * prisma/seed.mjs — Node-compatible seed entry point.
 *
 * Creates the admin user, exam types, and core settings. Idempotent.
 * ADMIN_SEED_PASSWORD must be supplied through a secret manager and is never logged.
 * Run with: DATABASE_URL=file:./db/production.db ADMIN_SEED_PASSWORD=... node prisma/seed.mjs
 */
import { PrismaClient } from '@prisma/client';
// bcryptjs is CommonJS and does not expose its functions as detectable ESM
// named exports, so `import { hashSync }` throws under plain Node. Take the
// default export and destructure it.
import bcrypt from 'bcryptjs';

const { hashSync } = bcrypt;

const prisma = new PrismaClient();

const EXAM_TYPES = [
  { code: 'IELTS-A', name: 'IELTS Academic', category: 'English Proficiency' },
  { code: 'IELTS-G', name: 'IELTS General Training', category: 'English Proficiency' },
  { code: 'IELTS-UKVI', name: 'IELTS UKVI', category: 'English Proficiency' },
  { code: 'PTE-A', name: 'PTE Academic', category: 'English Proficiency' },
  { code: 'TOEFL-iBT', name: 'TOEFL iBT', category: 'English Proficiency' },
  { code: 'DUOLINGO', name: 'Duolingo English Test', category: 'English Proficiency' },
  { code: 'OET', name: 'OET (Healthcare)', category: 'Professional' },
  { code: 'LANGUAGECERT', name: 'LanguageCert', category: 'English Proficiency' },
  { code: 'LINGUASKILL', name: 'Cambridge Linguaskill', category: 'English Proficiency' },
  { code: 'OIETC', name: 'OIETC — product identity pending verification', category: 'English Proficiency' },
  { code: 'TOEIC', name: 'TOEIC', category: 'English Proficiency' },
  { code: 'CAMBRIDGE', name: 'Cambridge English', category: 'English Proficiency' },
  { code: 'SAT', name: 'Digital SAT', category: 'Academic' },
  { code: 'ACT', name: 'ACT', category: 'Academic' },
  { code: 'GRE', name: 'GRE General Test', category: 'Academic' },
  { code: 'GMAT', name: 'GMAT Exam', category: 'Academic' },
  { code: 'LSAT', name: 'LSAT', category: 'Academic' },
  { code: 'MCAT', name: 'MCAT', category: 'Academic' },
  { code: 'VISA-INTERVIEW', name: 'Visa Interview Practice', category: 'Visa & Interview' },
  { code: 'ALO-PLACEMENT', name: 'ALO English Placement Test', category: 'ALO Internal' },
];

async function main() {
  console.log('Seeding database...');

  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@aloeducation.com';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error('Set ADMIN_SEED_PASSWORD (at least 12 characters) through the secret manager before seeding.');
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Platform Administrator',
      passwordHash: hashSync(adminPassword, 12),
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });


  for (const et of EXAM_TYPES) {
    await prisma.examType.upsert({
      where: { code: et.code },
      update: { name: et.name, category: et.category },
      create: { ...et, isActive: true },
    });
  }
  console.log(`  ${EXAM_TYPES.length} exam types seeded`);

  const settings = [
    { key: 'platform_name', value: 'ALO English Test Platform' },
    { key: 'practice_only', value: 'true' },
    { key: 'no_human_exam_mode', value: 'enabled' },
    { key: 'evaluation_provider', value: 'local_rule_engine' },
    { key: 'free_quota_alo', value: '3' },
    { key: 'free_quota_public', value: '1' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }
  console.log(`  ${settings.length} settings seeded`);

  console.log('Seed complete.');
}

main().catch((e) => { console.error('Seed failed:', e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
