import { PrismaClient } from '@prisma/client'
import { isStandaloneRuntime, resolveDatabaseUrl } from './paths'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In production, don't log queries (performance + avoid leaking PII).
const isProd = process.env.NODE_ENV === 'production'

// Resolve the datasource URL BEFORE the client is constructed. Prisma reads
// `env("DATABASE_URL")` once, at instantiation, and the generated standalone
// server has already chdir'ed into `.next/standalone` by the time this module
// is first imported — so a relative `file:./db/*.db` would otherwise point
// inside the build output and be replaced on every deploy. See src/lib/paths.ts.
const databaseUrl = resolveDatabaseUrl()

if (!databaseUrl) {
  console.error(
    '[db] DATABASE_URL is not set. Set it in the host environment panel ' +
      '(for example file:/absolute/path/to/db/production.db).',
  )
} else if (!isProd) {
  console.log(
    `[db] datasource: ${databaseUrl}${isStandaloneRuntime() ? ' (standalone runtime)' : ''}`,
  )
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['error', 'warn'] : ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
