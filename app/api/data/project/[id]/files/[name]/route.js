import { NextResponse } from "next/server";
import { listDirRaw, getBlobRaw, deleteFile } from "../../../../../../../lib/github";

export const maxDuration = 60;

function safeId(id) {
  return /^[a-z0-9-]+$/.test(id);
}

async function findEntry(projectId, name) {
  const entries = await listDirRaw(`files/${projectId}`);
  return entries.find((e) => e.name === name) || null;
}

export async function GET(_req, { params }) {
  if (!safeId(params.id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const name = decodeURIComponent(params.name);
  try {
    const entry = await findEntry(params.id, name);
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const buf = await getBlobRaw(entry.sha);
    return new Response(buf, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${entry.name.replace(/"/g, "")}"`,
        "Content-Length": String(buf.length),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  if (!safeId(params.id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const name = decodeURIComponent(params.name);
  try {
    const entry = await findEntry(params.id, name);
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await deleteFile(`files/${params.id}/${entry.name}`, `Remove attachment ${entry.name}`, entry.sha);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
