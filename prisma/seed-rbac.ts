/**
 * prisma/seed-rbac.ts
 *
 * Seeds the RBAC tables with:
 *   - 1 default team ("ALO Education")
 *   - 9 system roles (SUPER_ADMIN, ADMIN, MANAGER, COUNSELLOR, etc.)
 *   - 40+ permissions across all CRM modules
 *   - Role-permission mappings
 *
 * Run: bun run prisma/seed-rbac.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ─── Permission Definitions ───────────────────────────────────────────────

type PermissionDef = {
  key: string;
  description: string;
  category: string;
};

const PERMISSIONS: PermissionDef[] = [
  // Dashboard
  { key: "dashboard.view", description: "View dashboard", category: "dashboard" },

  // Leads
  { key: "leads.view", description: "View leads", category: "leads" },
  { key: "leads.create", description: "Create leads", category: "leads" },
  { key: "leads.update", description: "Update leads", category: "leads" },
  { key: "leads.delete", description: "Delete leads", category: "leads" },

  // Students
  { key: "students.view", description: "View students", category: "students" },
  { key: "students.create", description: "Create students", category: "students" },
  { key: "students.update", description: "Update students", category: "students" },

  // Applications
  { key: "applications.view", description: "View applications", category: "applications" },
  { key: "applications.manage", description: "Manage applications", category: "applications" },

  // Marketing
  { key: "marketing.view", description: "View marketing", category: "marketing" },
  { key: "marketing.manage", description: "Manage marketing", category: "marketing" },

  // Meta (Facebook/Instagram/WhatsApp)
  { key: "meta.view", description: "View Meta connections", category: "meta" },
  { key: "meta.connect", description: "Connect Meta accounts", category: "meta" },
  { key: "meta.publish", description: "Publish to Meta", category: "meta" },
  { key: "meta.comment.reply", description: "Reply to comments", category: "meta" },
  { key: "meta.message.view", description: "View Meta messages", category: "meta" },
  { key: "meta.message.reply", description: "Reply to Meta messages", category: "meta" },
  { key: "meta.lead.view", description: "View Meta leads", category: "meta" },
  { key: "meta.lead.manage", description: "Manage Meta leads", category: "meta" },
  { key: "meta.insights.view", description: "View Meta insights", category: "meta" },

  // Users
  { key: "users.view", description: "View users", category: "users" },
  { key: "users.manage", description: "Manage users", category: "users" },

  // Teams
  { key: "teams.view", description: "View teams", category: "teams" },
  { key: "teams.manage", description: "Manage teams", category: "teams" },

  // Roles
  { key: "roles.view", description: "View roles", category: "roles" },
  { key: "roles.manage", description: "Manage roles", category: "roles" },

  // Billing
  { key: "billing.view", description: "View billing", category: "billing" },
  { key: "billing.manage", description: "Manage billing", category: "billing" },

  // Audit
  { key: "audit.view", description: "View audit logs", category: "audit" },

  // Settings
  { key: "settings.view", description: "View settings", category: "settings" },
  { key: "settings.manage", description: "Manage settings", category: "settings" },

  // Exam management
  { key: "exams.view", description: "View exams", category: "exams" },
  { key: "exams.manage", description: "Manage exams", category: "exams" },

  // Universities/Courses/Scholarships
  { key: "universities.view", description: "View universities", category: "universities" },
  { key: "universities.manage", description: "Manage universities", category: "universities" },
  { key: "courses.view", description: "View courses", category: "courses" },
  { key: "courses.manage", description: "Manage courses", category: "courses" },
  { key: "scholarships.view", description: "View scholarships", category: "scholarships" },
  { key: "scholarships.manage", description: "Manage scholarships", category: "scholarships" },

  // Partners
  { key: "partners.view", description: "View partners", category: "partners" },
  { key: "partners.manage", description: "Manage partners", category: "partners" },

  // Branches/Departments
  { key: "branches.view", description: "View branches", category: "branches" },
  { key: "branches.manage", description: "Manage branches", category: "branches" },
];

// ─── Role Definitions ─────────────────────────────────────────────────────

type RoleDef = {
  slug: string;
  name: string;
  description: string;
  permissions: string[]; // Permission keys
};

// SUPER_ADMIN gets ALL permissions
const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

const ROLES: RoleDef[] = [
  {
    slug: "SUPER_ADMIN",
    name: "Super Administrator",
    description: "Full system access. Can do everything.",
    permissions: ALL_PERMISSION_KEYS,
    isSystem: true,
  } as RoleDef,
  {
    slug: "ADMIN",
    name: "Administrator",
    description: "System administration. Manage users, teams, settings.",
    permissions: ALL_PERMISSION_KEYS.filter((k) => !k.startsWith("meta.")),
  },
  {
    slug: "MANAGER",
    name: "Manager",
    description: "Team management. View all team data, manage counselors.",
    permissions: [
      "dashboard.view",
      "leads.view", "leads.create", "leads.update",
      "students.view", "students.create", "students.update",
      "applications.view", "applications.manage",
      "marketing.view",
      "users.view",
      "teams.view",
      "billing.view",
      "audit.view",
      "exams.view", "exams.manage",
      "universities.view", "courses.view", "scholarships.view",
      "partners.view",
      "branches.view",
    ],
  },
  {
    slug: "TEACHER",
    name: "Teacher",
    description: "ALO teaching staff. Views students and their exam results, and guides practice — no CRM write access.",
    permissions: [
      "dashboard.view",
      "students.view",
      "exams.view",
    ],
  },
  {
    slug: "COUNSELLOR",
    name: "Counselor",
    description: "Student counseling. Manage own leads, students, applications.",
    permissions: [
      "dashboard.view",
      "leads.view", "leads.create", "leads.update",
      "students.view", "students.create", "students.update",
      "applications.view", "applications.manage",
      "universities.view", "courses.view", "scholarships.view",
      "partners.view",
    ],
  },
  {
    slug: "MARKETING",
    name: "Marketing Manager",
    description: "Marketing campaigns + Meta integration.",
    permissions: [
      "dashboard.view",
      "marketing.view", "marketing.manage",
      "meta.view", "meta.connect", "meta.publish",
      "meta.comment.reply", "meta.message.view", "meta.message.reply",
      "meta.lead.view", "meta.lead.manage", "meta.insights.view",
      "leads.view", "leads.create",
    ],
  },
  {
    slug: "CONTENT_MANAGER",
    name: "Content Manager",
    description: "Manage university, course, and scholarship content.",
    permissions: [
      "dashboard.view",
      "universities.view", "universities.manage",
      "courses.view", "courses.manage",
      "scholarships.view", "scholarships.manage",
      "exams.view", "exams.manage",
    ],
  },
  {
    slug: "FINANCE",
    name: "Finance Officer",
    description: "Billing, commissions, payments.",
    permissions: [
      "dashboard.view",
      "billing.view", "billing.manage",
      "partners.view",
      "applications.view",
    ],
  },
  {
    slug: "SUPPORT",
    name: "Support Agent",
    description: "View-only access to assist students.",
    permissions: [
      "dashboard.view",
      "students.view",
      "applications.view",
      "leads.view",
    ],
  },
  {
    slug: "VIEWER",
    name: "Viewer (Read-Only)",
    description: "Read-only access to dashboard and basic data.",
    permissions: [
      "dashboard.view",
      "leads.view",
      "students.view",
      "applications.view",
    ],
  },
];

// ─── Seed Function ────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding RBAC...\n");

  // 1. Create default team
  const team = await db.team.upsert({
    where: { slug: "alo-education" },
    update: {},
    create: {
      name: "ALO Education",
      slug: "alo-education",
      description: "Default team for ALO Education staff",
      status: "ACTIVE",
    },
  });
  console.log(`✅ Team: ${team.name} (${team.id})`);

  // 2. Create permissions
  for (const perm of PERMISSIONS) {
    await db.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description, category: perm.category },
      create: perm,
    });
  }
  console.log(`✅ Permissions: ${PERMISSIONS.length} created`);

  // 3. Create roles + assign permissions
  for (const roleDef of ROLES) {
    const role = await db.role.upsert({
      where: { slug: roleDef.slug },
      update: { name: roleDef.name, description: roleDef.description, isSystem: true },
      create: {
        name: roleDef.name,
        slug: roleDef.slug,
        description: roleDef.description,
        isSystem: true,
        teamId: null, // Global roles
      },
    });

    // Assign permissions to role
    for (const permKey of roleDef.permissions) {
      const permission = await db.permission.findUnique({ where: { key: permKey } });
      if (permission) {
        await db.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: role.id, permissionId: permission.id },
          },
          update: {},
          create: { roleId: role.id, permissionId: permission.id },
        });
      }
    }

    console.log(`✅ Role: ${roleDef.slug} (${roleDef.permissions.length} permissions)`);
  }

  // 4. Summary
  const teamCount = await db.team.count();
  const roleCount = await db.role.count();
  const permCount = await db.permission.count();
  const rpCount = await db.rolePermission.count();

  console.log(`\n📊 RBAC Seed Complete:`);
  console.log(`   Teams: ${teamCount}`);
  console.log(`   Roles: ${roleCount}`);
  console.log(`   Permissions: ${permCount}`);
  console.log(`   Role-Permission mappings: ${rpCount}`);
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error("RBAC seed failed:", e);
    db.$disconnect();
    process.exit(1);
  });
