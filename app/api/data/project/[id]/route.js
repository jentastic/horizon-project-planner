import { NextResponse } from "next/server";
import { getFile, putFile, deleteFile, listDirRaw } from "../../../../../lib/github";

function safeId(id) {
  return /^[a-z0-9-]+$/.test(id);
}

export async function GET(_req, { params }) {
  if (!safeId(params.id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  try {
    const f = await getFile(`projects/${params.id}.json`);
    if (!f) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ project: f.json });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  if (!safeId(params.id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  try {
    const body = await request.json();
    const path = `projects/${params.id}.json`;
    const existing = await getFile(path);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const project = { ...existing.json, ...body, id: params.id };
    await putFile(path, project, `Update: ${project.name}`, existing.sha);
    return NextResponse.json({ project });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!safeId(params.id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const archive = new URL(request.url).searchParams.get("archive") === "1";
  try {
    const path = `projects/${params.id}.json`;
    const existing = await getFile(path);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (archive) {
      const archived = {
        ...existing.json,
        archivedOn: new Date().toISOString().slice(0, 10),
      };
      await putFile(
        `archive/${params.id}.json`,
        archived,
        `Archive: ${existing.json.name}`
      );
    }
    await deleteFile(
      path,
      archive ? `Move to archive: ${existing.json.name}` : `Delete: ${existing.json.name}`,
      existing.sha
    );
    if (!archive) {
      // Permanent delete also removes attachments; archived projects keep theirs.
      const attachments = await listDirRaw(`files/${params.id}`).catch(() => []);
      for (const f of attachments) {
        await deleteFile(`files/${params.id}/${f.name}`, `Delete attachment ${f.name}`, f.sha).catch(() => {});
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
