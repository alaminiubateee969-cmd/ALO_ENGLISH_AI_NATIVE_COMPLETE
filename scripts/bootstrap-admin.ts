/**
 * scripts/bootstrap-admin.ts
 *
 * Creates the first SUPER_ADMIN user.
 *
 * Usage:
 *   bun run scripts/bootstrap-admin.ts --email=admin@aloeducation.com --password=SecurePass123! --name="Admin"
 *
 * Security: This script should only be run on the server, never in the browser.
 * The password is hashed with bcrypt before storage.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};
  for (const arg of args) {
    const [key, value] = arg.split("=");
    if (key.startsWith("--")) {
      params[key.slice(2)] = value;
    }
  }
  return params;
}

async function main() {
  const params = parseArgs();

  const email = params.email;
  const password = params.password;
  const name = params.name || "Super Admin";

  if (!email || !password) {
    console.error("Usage: bun run scripts/bootstrap-admin.ts --email=admin@example.com --password=YourPassword123! --name='Admin'");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("Error: Password must be at least 12 characters");
    process.exit(1);
  }

  // Check if user already exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Promote to SUPER_ADMIN if not already
    if (existing.role !== "SUPER_ADMIN") {
      await db.user.update({
        where: { id: existing.id },
        data: { role: "SUPER_ADMIN", status: "ACTIVE" },
      });
      console.log(`✅ Promoted existing user ${email} to SUPER_ADMIN`);
    } else {
      console.log(`ℹ️  User ${email} is already a SUPER_ADMIN`);
    }
    return;
  }

  // Create the admin user
  const passwordHash = bcrypt.hashSync(password, 12);
  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
    select: { id: true, email: true, name: true, role: true },
  });

  console.log(`✅ Created SUPER_ADMIN user:`);
  console.log(`   ID:    ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Name:  ${user.name}`);
  console.log(`   Role:  ${user.role}`);
  console.log(`\n⚠️  Keep this password secure. You can now log in at /login`);
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error("Bootstrap failed:", e);
    db.$disconnect();
    process.exit(1);
  });
