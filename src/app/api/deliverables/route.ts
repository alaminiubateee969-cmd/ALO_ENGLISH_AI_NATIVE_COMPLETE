import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import { join, relative } from "path";
import { requireRole } from "@/lib/rbac";
import { getAppRoot } from "@/lib/paths";
import { withErrorHandler } from "@/lib/responses";

// Resolved through src/lib/paths.ts: the generated standalone server chdir's
// into .next/standalone, so process.cwd() is not the repository root at runtime.
const ROOT = join(getAppRoot(), "cpanel-production");

type Entry = {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  children?: Entry[];
};

async function walk(dir: string): Promise<Entry[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const result: Entry[] = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    const rel = relative(ROOT, full);
    if (e.isDirectory()) {
      // skip dist, logs, storage internals
      if (["dist", "logs"].includes(e.name)) continue;
      if (e.name === "storage" || e.name === "public") {
        result.push({ name: e.name, path: rel, type: "dir" });
        continue;
      }
      const children = await walk(full);
      result.push({ name: e.name, path: rel, type: "dir", children });
    } else {
      const s = await stat(full);
      result.push({ name: e.name, path: rel, type: "file", size: s.size });
    }
  }
  return result.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function GET() {
  return withErrorHandler(async () => {
    // Phase 1: Lock down — only SUPER_ADMIN can enumerate production files
    await requireRole("SUPER_ADMIN");
    try {
      const tree = await walk(ROOT);
      const flat = await collectFiles(ROOT, "");
      return NextResponse.json({
        ok: true,
        total_files: flat.length,
        tree,
        files: flat,
      });
    } catch {
      // `cpanel-production/` is a separate legacy PHP project. It is excluded
      // from the deployment artifact (see .github/workflows/ci.yml and
      // scripts/install.sh), so on a production host this folder is expected to
      // be absent. Report that honestly instead of a 500, which reads as a
      // server fault rather than a missing optional bundle.
      return NextResponse.json(
        {
          ok: false,
          total_files: 0,
          tree: [],
          files: [],
          error:
            "The cpanel-production deliverable archive is not bundled with this deployment.",
          expected_path: ROOT,
        },
        { status: 404 },
      );
    }
  });
}

async function collectFiles(dir: string, prefix: string): Promise<{ path: string; size: number; ext: string }[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: { path: string; size: number; ext: string }[] = [];
  for (const e of entries) {
    if (["dist", "logs"].includes(e.name)) continue;
    const full = join(dir, e.name);
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (e.name === "storage" || e.name === "public") continue;
      const sub = await collectFiles(full, rel);
      out.push(...sub);
    } else {
      const s = await stat(full);
      out.push({ path: rel, size: s.size, ext: e.name.split(".").pop() || "" });
    }
  }
  return out;
}
