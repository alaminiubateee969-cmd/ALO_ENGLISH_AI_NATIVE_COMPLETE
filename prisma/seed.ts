/**
 * prisma/seed.ts — Database seed script.
 *
 * Creates:
 *   - 1 admin user (password from ADMIN_SEED_PASSWORD env, or a random one printed to stdout)
 *   - Core settings
 *   - 32 exam types (exam-aligned practice, not official content)
 *
 * Usage:  bun run prisma/seed.ts
 * Idempotent: safe to re-run (upserts by unique key).
 */

import { PrismaClient } from '@prisma/client'
import { hashSync } from 'bcryptjs'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

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
  { code: 'OIETC', name: 'OIETC / Oxford ELLT', category: 'English Proficiency' },
  { code: 'TOEIC', name: 'TOEIC', category: 'English Proficiency' },
  { code: 'CAMBRIDGE', name: 'Cambridge English', category: 'English Proficiency' },
  { code: 'SAT', name: 'Digital SAT', category: 'Academic' },
  { code: 'ACT', name: 'ACT', category: 'Academic' },
  { code: 'GRE', name: 'GRE General Test', category: 'Academic' },
  { code: 'GMAT', name: 'GMAT Focus', category: 'Academic' },
  { code: 'LSAT', name: 'LSAT', category: 'Academic' },
  { code: 'MCAT', name: 'MCAT', category: 'Academic' },
  { code: 'VISA-INTERVIEW', name: 'Visa Interview Practice', category: 'Visa & Interview' },
  { code: 'ALO-PLACEMENT', name: 'ALO English Placement Test', category: 'ALO Internal' },
]

async function main() {
  console.log('🌱 Seeding database…')

  // --- Admin user ---
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@aloeducation.com'
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || randomBytes(16).toString('hex')

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
  })

  if (!process.env.ADMIN_SEED_PASSWORD) {
    console.log('')
    console.log('══════════════════════════════════════════════════════')
    console.log('  ADMIN CREDENTIALS (save immediately, shown once):')
    console.log(`  Email:    ${adminEmail}`)
    console.log(`  Password: ${adminPassword}`)
    console.log('══════════════════════════════════════════════════════')
    console.log('')
  }

  // --- Exam types ---
  for (const et of EXAM_TYPES) {
    await prisma.examType.upsert({
      where: { code: et.code },
      update: { name: et.name, category: et.category },
      create: { ...et, isActive: true },
    })
  }
  console.log(`  ✓ ${EXAM_TYPES.length} exam types seeded`)

  // --- Core settings ---
  const settings = [
    { key: 'platform_name', value: 'ALO English Test Platform' },
    { key: 'practice_only', value: 'true' },
    { key: 'no_human_exam_mode', value: 'enabled' },
    { key: 'evaluation_provider', value: 'local_rule_engine' },
    { key: 'free_quota_alo', value: '3' },
    { key: 'free_quota_public', value: '1' },
  ]
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }
  console.log(`  ✓ ${settings.length} settings seeded`)

  console.log('✅ Seed complete.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
