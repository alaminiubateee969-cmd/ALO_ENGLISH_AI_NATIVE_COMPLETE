import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, resolve, sep } from "path";

const ROOT = join(process.cwd(), "cpanel-production");

const SAFE_EXT = new Set(["md", "sql", "php", "htaccess", "env", "example", "txt", "json"]);
const MAX_SIZE = 2 * 1024 * 1024; // 2MB cap for inline serving

export async function GET(req: Request) {
  const url = new URL(req.url);
  const file = url.searchParams.get("file");
  const download = url.searchParams.get("download") === "1";
  if (!file) {
    return NextResponse.json({ ok: false, error: "Missing ?file=" }, { status: 400 });
  }
  // path traversal protection
  const resolved = resolve(ROOT, file);
  if (!resolved.startsWith(ROOT + sep) && resolved !== ROOT) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  const ext = file.split(".").pop() || "";
  if (!SAFE_EXT.has(ext)) {
    return NextResponse.json({ ok: false, error: "File type not servable" }, { status: 403 });
  }
  try {
    const data = await readFile(resolved);
    if (data.length > MAX_SIZE) {
      return NextResponse.json({ ok: false, error: "File too large to preview. See dist/ zip." }, { status: 413 });
    }
    const text = data.toString("utf-8");
    const filename = file.split("/").pop() || "file";
    return new NextResponse(text, {
      status: 200,
      headers: download
        ? {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename="${filename}"`,
          }
        : {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
          },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "File not found" }, { status: 404 });
  }
}
