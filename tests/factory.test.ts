import { describe, expect, test } from "bun:test";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FACTORY_BACKUP_FORMAT, verifyFactoryBackupImage } from "../src/lib/factory/backup-image";
import {
  assertNoInlineSecrets,
  assertTransition,
  canTransition,
  companyDefinitionSchema,
  templateSchema,
} from "../src/lib/factory/validation";

const branding = {
  primaryColor: "#123B5D",
  accentColor: "#19A974",
  logoUrl: "",
  navigation: ["Contacts"],
};

function definition(overrides: Record<string, unknown> = {}) {
  return {
    companyName: "Example Client Ltd",
    slug: "example-client",
    relationship: "CLIENT",
    industry: "Education",
    applicationName: "Example Client Portal",
    templateVersionId: "template-version-1",
    deploymentModel: "SHARED_TENANT",
    domain: "",
    enabledModuleVersionIds: [],
    departments: ["Admissions"],
    integrations: [],
    retentionDays: 365,
    backupRetentionDays: 90,
    initialAdminUserId: null,
    branding,
    ...overrides,
  };
}

describe("BDTECH360 factory definition validation", () => {
  test("accepts a configuration-only shared company definition", () => {
    const parsed = companyDefinitionSchema.safeParse(definition());
    expect(parsed.success).toBe(true);
  });

  test("rejects cross-protocol domains, unsafe colors and invalid retention", () => {
    expect(companyDefinitionSchema.safeParse(definition({ domain: "https://client.example" })).success).toBe(false);
    expect(companyDefinitionSchema.safeParse(definition({ branding: { ...branding, primaryColor: "javascript:alert(1)" } })).success).toBe(false);
    expect(companyDefinitionSchema.safeParse(definition({ retentionDays: 1 })).success).toBe(false);
  });

  test("rejects inline secrets recursively, including nested arrays", () => {
    expect(() => assertNoInlineSecrets({ integration: { apiToken: "not-allowed" } })).toThrow(/secret reference/);
    expect(() => assertNoInlineSecrets({ entries: [{ privateKey: "not-allowed" }] })).toThrow(/secret reference/);
    expect(() => assertNoInlineSecrets({ integration: { credentialRef: "host:vault/reference" } })).not.toThrow();
  });

  test("requires real acceptance criteria and semantic template versions", () => {
    const base = {
      slug: "client-operations",
      name: "Client Operations",
      category: "CRM",
      description: "A reviewed client operations template definition.",
      version: "1.0.0",
      configurationSchema: {},
      navigation: [],
      workflows: [],
      acceptanceTests: ["Scoped contact query returns only the selected company"],
      releaseNotes: "Initial reviewed definition",
      moduleVersionIds: [],
      approve: false,
    };
    expect(templateSchema.safeParse(base).success).toBe(true);
    expect(templateSchema.safeParse({ ...base, version: "latest" }).success).toBe(false);
    expect(templateSchema.safeParse({ ...base, acceptanceTests: [] }).success).toBe(false);
  });
});

describe("BDTECH360 lifecycle gates", () => {
  test("draft cannot skip validation, provisioning or approval", () => {
    expect(canTransition("DRAFT", "LIVE")).toBe(false);
    expect(canTransition("VALIDATED", "LIVE")).toBe(false);
    expect(() => assertTransition("DRAFT", "LIVE")).toThrow(/Invalid factory lifecycle/);
  });

  test("known-good rollback and retirement follow explicit states", () => {
    expect(canTransition("LIVE", "ROLLED_BACK")).toBe(true);
    expect(canTransition("ROLLED_BACK", "LIVE")).toBe(false);
    expect(canTransition("RETIRED", "DRAFT")).toBe(false);
  });
});

describe("BDTECH360 fail-closed implementation boundaries", () => {
  test("tenant API enforces membership and company predicates in reads and writes", async () => {
    const route = await Bun.file("src/app/api/factory/tenant/contacts/route.ts").text();
    const detail = await Bun.file("src/app/api/factory/tenant/contacts/[id]/route.ts").text();
    const access = await Bun.file("src/lib/factory/access.ts").text();
    expect(access).toContain('requireRole("ADMIN", "SUPER_ADMIN")');
    expect(access).not.toMatch(/requireTenantAccess[\s\S]*role === "SUPER_ADMIN"/);
    expect(route).toContain("requireTenantAccess(companyIdFrom(req))");
    expect(route).toContain("requireTenantAccess(parsed.data.companyId, true)");
    expect(route).toContain("tenantScope(access.companyId");
    expect(detail).toContain("tenantScope(access.companyId, { id })");
  });

  test("dedicated provisioning and upgrades do not claim shared deployment", async () => {
    const lifecycle = await Bun.file("src/lib/factory/lifecycle.ts").text();
    const releases = await Bun.file("src/app/api/factory/applications/[id]/releases/route.ts").text();
    expect(lifecycle).toContain('status: "BLOCKED"');
    expect(lifecycle).toContain("No dedicated infrastructure adapter is configured");
    expect(releases).toContain('application.deploymentModel !== "SHARED_TENANT"');
  });

  test("factory route is private to crawlers and has no seed catalogue", async () => {
    const routes = await Bun.file("src/lib/public-routes.ts").text();
    const component = await Bun.file("src/components/factory/control-center.tsx").text();
    expect(routes).toContain("'/factory'");
    expect(component).not.toContain("Math.random");
    expect(component).toContain("/api/factory/overview");
    expect(component).toContain("Dedicated infrastructure remains blocked");
  });

  test("control-plane backup reopens, passes integrity and reads back its scoped definition", () => {
    const directory = mkdtempSync(join(tmpdir(), "factory-backup-test-"));
    const location = join(directory, "backup.db");
    const database = new DatabaseSync(location);
    try {
      database.exec("CREATE TABLE FactoryBackupObject (kind TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(kind,id)); CREATE TABLE FactoryApplication (id TEXT PRIMARY KEY, companyId TEXT NOT NULL, definition TEXT NOT NULL);");
      const objects = [
        { kind: "company", id: "company-1", payload: { id: "company-1" } },
        { kind: "application", id: "application-1", payload: { id: "application-1" } },
        { kind: "templateVersion", id: "template-1", payload: { id: "template-1" } },
      ];
      const insert = database.prepare("INSERT INTO FactoryBackupObject (kind,id,payload) VALUES (?,?,?)");
      for (const object of objects) insert.run(object.kind, object.id, JSON.stringify(object.payload));
      database.prepare("INSERT INTO FactoryApplication (id,companyId,definition) VALUES (?,?,?)").run(
        "application-1",
        "company-1",
        JSON.stringify({ format: FACTORY_BACKUP_FORMAT, objects }),
      );
    } finally {
      database.close();
    }
    try {
      expect(verifyFactoryBackupImage(location, "application-1", "company-1")).toEqual({ integrity: "ok", objectCount: 3 });
      expect(() => verifyFactoryBackupImage(location, "application-1", "another-company")).toThrow(/requested company/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
