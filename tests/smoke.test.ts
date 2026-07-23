/**
 * tests/smoke.test.ts — Minimum smoke-test suite.
 *
 * Verifies the project structure, package consistency, and key source files
 * exist. Does NOT test runtime behavior (that's the health endpoint's job).
 *
 * Run:  bun test tests/smoke.test.ts
 */

import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync, statSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");

// ─── Helpers ───────────────────────────────────────────────────────────
function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function fileExists(path: string): boolean {
  return existsSync(join(ROOT, path));
}

// ─── Tests ─────────────────────────────────────────────────────────────

describe("Project structure", () => {
  test("package.json exists and is valid JSON", () => {
    expect(fileExists("package.json")).toBe(true);
    const pkg = readJson("package.json");
    expect(pkg["name"]).toBe("alo-english-test-platform");
    expect(pkg["version"]).toBeTruthy();
  });

  test("bun.lock exists", () => {
    expect(fileExists("bun.lock")).toBe(true);
  });

  test("tsconfig.json exists", () => {
    expect(fileExists("tsconfig.json")).toBe(true);
  });

  test("next.config.ts exists", () => {
    expect(fileExists("next.config.ts")).toBe(true);
  });

  test(".env.example exists", () => {
    expect(fileExists(".env.example")).toBe(true);
  });

  test(".gitignore exists", () => {
    expect(fileExists(".gitignore")).toBe(true);
  });
});

describe("Package consistency", () => {
  test("package.json has required scripts", () => {
    const pkg = readJson("package.json") as { scripts: Record<string, string> };
    const required = [
      "dev", "build", "start", "lint", "typecheck",
      "test", "db:generate", "db:migrate", "db:seed", "verify",
    ];
    for (const script of required) {
      expect(pkg.scripts[script], `missing script: ${script}`).toBeTruthy();
    }
  });

  test("package.json declares engines.node", () => {
    const pkg = readJson("package.json") as { engines?: { node?: string } };
    expect(pkg.engines?.node).toBeTruthy();
  });

  test("package.json name matches lockfile project", () => {
    const pkg = readJson("package.json") as { name: string };
    expect(pkg.name).toBe("alo-english-test-platform");
  });
});

describe("Database schema", () => {
  test("prisma/schema.prisma exists", () => {
    expect(fileExists("prisma/schema.prisma")).toBe(true);
  });

  test("schema defines expected models", () => {
    const schema = readFileSync(join(ROOT, "prisma/schema.prisma"), "utf-8");
    const models = ["User", "ExamType", "PracticeSet", "Attempt", "Score", "AuditLog", "Setting"];
    for (const model of models) {
      expect(schema, `missing model: ${model}`).toContain(`model ${model}`);
    }
  });

  test("prisma/seed.ts exists", () => {
    expect(fileExists("prisma/seed.ts")).toBe(true);
  });
});

describe("Server configuration", () => {
  test("systemd service file exists", () => {
    expect(fileExists("server-config/alo-english.service")).toBe(true);
  });

  test("Caddy production config exists", () => {
    expect(fileExists("server-config/Caddyfile.production")).toBe(true);
  });

  test("sudo policy exists", () => {
    expect(fileExists("server-config/sudo-policy")).toBe(true);
  });
});

describe("Helper scripts", () => {
  const scripts = [
    "scripts/install.sh",
    "scripts/update.sh",
    "scripts/rollback.sh",
    "scripts/backup.sh",
    "scripts/restore.sh",
    "scripts/healthcheck.sh",
    "scripts/verify.sh",
  ];

  for (const script of scripts) {
    test(`${script} exists`, () => {
      expect(fileExists(script)).toBe(true);
    });
  }
});

describe("Documentation", () => {
  const docs = [
    "README.md",
    "DEPLOYMENT.md",
    "OPERATIONS.md",
    "TROUBLESHOOTING.md",
    "SECURITY.md",
    "CHANGELOG.md",
  ];

  for (const doc of docs) {
    test(`${doc} exists and is non-empty`, () => {
      expect(fileExists(doc)).toBe(true);
      const stat = statSync(join(ROOT, doc));
      expect(stat.size, `${doc} is empty`).toBeGreaterThan(100);
    });
  }
});

describe("Source code", () => {
  test("src/app/layout.tsx exists", () => {
    expect(fileExists("src/app/layout.tsx")).toBe(true);
  });

  test("src/app/page.tsx exists", () => {
    expect(fileExists("src/app/page.tsx")).toBe(true);
  });

  test("src/app/api/health/route.ts exists", () => {
    expect(fileExists("src/app/api/health/route.ts")).toBe(true);
  });

  test("src/lib/db.ts exists", () => {
    expect(fileExists("src/lib/db.ts")).toBe(true);
  });
});

describe("Environment template", () => {
  test(".env.example contains required variables", () => {
    const env = readFileSync(join(ROOT, ".env.example"), "utf-8");
    const required = [
      "NODE_ENV",
      "APP_URL",
      "APP_PORT",
      "DATABASE_URL",
      "AUTH_SECRET",
      "GROQ_API_KEY",
      "BACKUP_DIR",
    ];
    for (const key of required) {
      expect(env, `missing env var: ${key}`).toContain(key);
    }
  });

  test(".env.example does not contain real secrets", () => {
    const env = readFileSync(join(ROOT, ".env.example"), "utf-8");
    // Should not contain actual secret values (only placeholders).
    expect(env).not.toMatch(/gsk_[a-zA-Z0-9]{20,}/);
    expect(env).not.toMatch(/-----BEGIN.*PRIVATE KEY-----/);
  });
});
