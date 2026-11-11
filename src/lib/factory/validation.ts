import { z } from "zod";

export const slugSchema = z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");
export const versionSchema = z.string().trim().regex(/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i, "Use semantic versioning, for example 1.0.0");
export const deploymentModelSchema = z.enum(["SHARED_TENANT", "DEDICATED"]);
export const companyRelationshipSchema = z.enum(["PARENT", "SISTER", "CLIENT", "INTERNAL"]);

export const brandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#123B5D"),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#19A974"),
  logoUrl: z.string().max(500).refine((value) => !value || value.startsWith("/") || value.startsWith("https://"), "Logo must be a local path or HTTPS URL").default(""),
  navigation: z.array(z.string().trim().min(1).max(60)).max(40).default([]),
});

export const companyDefinitionSchema = z.object({
  companyName: z.string().trim().min(2).max(160),
  slug: slugSchema,
  relationship: companyRelationshipSchema,
  industry: z.string().trim().min(2).max(100),
  applicationName: z.string().trim().min(2).max(160),
  templateVersionId: z.string().min(1).max(128),
  deploymentModel: deploymentModelSchema,
  domain: z.union([z.literal(""), z.string().trim().max(253).regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Enter a hostname without protocol or path")]).default(""),
  enabledModuleVersionIds: z.array(z.string().min(1).max(128)).max(100).default([]),
  departments: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
  integrations: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  retentionDays: z.number().int().min(30).max(3650).default(365),
  backupRetentionDays: z.number().int().min(7).max(3650).default(90),
  initialAdminUserId: z.string().max(128).optional().nullable(),
  branding: brandingSchema,
});

export const templateSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(5000),
  version: versionSchema,
  configurationSchema: z.record(z.string(), z.unknown()).default({}),
  navigation: z.array(z.unknown()).default([]),
  workflows: z.array(z.unknown()).default([]),
  acceptanceTests: z.array(z.string().trim().min(3).max(500)).min(1).max(100),
  releaseNotes: z.string().trim().min(3).max(10000),
  moduleVersionIds: z.array(z.string().min(1).max(128)).max(100).default([]),
  approve: z.boolean().default(false),
});

export const moduleSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(5000),
  version: versionSchema,
  capabilities: z.array(z.string().trim().min(2).max(200)).min(1).max(100),
  dependencies: z.array(z.string().trim().min(1).max(200)).max(100).default([]),
  compatibility: z.string().trim().min(1).max(500),
  acceptanceTests: z.array(z.string().trim().min(3).max(500)).min(1).max(100),
  releaseNotes: z.string().trim().min(3).max(10000),
});

export const configRevisionSchema = z.object({
  configuration: z.record(z.string(), z.unknown()),
  branding: brandingSchema,
  reason: z.string().trim().min(3).max(1000),
});

export const changeRequestSchema = z.object({
  templateId: z.string().max(128).optional().nullable(),
  kind: z.enum(["BUG", "FEATURE", "SECURITY", "CUSTOMIZATION"]),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(10000),
  disposition: z.enum(["SHARED_CORE", "REUSABLE_MODULE", "CONFIGURATION", "CLIENT_EXTENSION", "UNDECIDED"]),
});

export type CompanyDefinition = z.infer<typeof companyDefinitionSchema>;

export const LIFECYCLE_TRANSITIONS: Record<string, readonly string[]> = {
  DRAFT: ["VALIDATED", "RETIRED"],
  VALIDATED: ["PROVISIONING", "DRAFT", "RETIRED"],
  PROVISIONING: ["STAGING", "TEST_FAILED", "VALIDATED"],
  TEST_FAILED: ["VALIDATED", "DRAFT", "RETIRED"],
  STAGING: ["AWAITING_APPROVAL", "TEST_FAILED", "VALIDATED"],
  AWAITING_APPROVAL: ["LIVE", "STAGING", "TEST_FAILED"],
  LIVE: ["DEGRADED", "STAGING", "ROLLED_BACK", "RETIRED"],
  DEGRADED: ["LIVE", "STAGING", "ROLLED_BACK", "RETIRED"],
  ROLLED_BACK: ["STAGING", "AWAITING_APPROVAL", "RETIRED"],
  RETIRED: [],
};

export function canTransition(from: string, to: string): boolean {
  return LIFECYCLE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: string, to: string): void {
  if (!canTransition(from, to)) throw new Error(`Invalid factory lifecycle transition: ${from} → ${to}`);
}

/** Company configuration is data only. Secrets and credential values are rejected. */
export function assertNoInlineSecrets(value: unknown, path = "configuration"): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoInlineSecrets(entry, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, entry] of Object.entries(value)) {
    if (/(password|secret|token|privateKey|credentialValue)/i.test(key)) {
      throw new Error(`${path}.${key} must be a secret reference configured on the host, not an inline credential`);
    }
    assertNoInlineSecrets(entry, `${path}.${key}`);
  }
}
