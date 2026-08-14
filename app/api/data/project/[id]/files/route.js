import { NextResponse } from "next/server";
import { listDirRaw, putBinaryFile } from "../../../../../../lib/github";

export const maxDuration = 60;

const MAX_BYTES = 3 * 1024 * 1024; // ~3 MB; Vercel caps request bodies at 4.5 MB

function safeId(id) {
  return /^[a-z0-9-]+$/.test(id);
}

function sanitizeName(name) {
  const clean = String(name || "")
    .replace(/[/\\]/g, "_")
    .replace(/[^a-zA-Z0-9._ ()\-]/g, "_")
    .replace(/^\.+/, "_")
    .trim()
    .slice(0, 120);
  return clean || "file";
}

export async function GET(_req, { params }) {
  if (!safeId(params.id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  try {
    const entries = await listDirRaw(`files/${params.id}`);
    return NextResponse.json({
      files: entries.map((e) => ({ name: e.name, size: e.size })),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  if (!safeId(params.id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  try {
    const { name, base64 } = await request.json();
    if (!base64) return NextResponse.json({ error: "No file content" }, { status: 400 });
    const bytes = Math.floor(base64.length * 0.75);
    if (bytes > MAX_BYTES) {
      return NextResponse.json(
        { error: "File is larger than 3 MB — add it as a link instead." },
        { status: 413 }
      );
    }
    const filename = sanitizeName(name);
    await putBinaryFile(`files/${params.id}/${filename}`, base64, `Attach ${filename} to ${params.id}`);
    return NextResponse.json({ ok: true, name: filename });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
