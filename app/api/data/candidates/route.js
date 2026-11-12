import { NextResponse } from "next/server";
import { getFile, putFile, listDir } from "../../../../lib/github";
import { DEFAULT_CONFIG } from "../../../../lib/data";
import { cleanEntry, cleanCard, safeCandidateFile } from "../../../../lib/candidates";

// Candidate cards proposed by the scheduled funding scan live in
// candidates/<scan-date>.json in the data repo. Nothing in that folder
// reaches projects/ until it is accepted here, behind the normal login.

async function domainIds() {
  const cfg = await getFile("config.json");
  return ((cfg ? cfg.json : DEFAULT_CONFIG).domains || []).map((d) => d.id);
}

export async function GET() {
  try {
    const ids = await domainIds();
    const entries = await listDir("candidates");
    const files = await Promise.all(
      entries
        .filter((e) => safeCandidateFile(e.name))
        .map(async (e) => {
          const f = await getFile(`candidates/${e.name}`).catch(() => null);
          if (!f) return null;
          const list = Array.isArray(f.json.candidates) ? f.json.candidates : [];
          const items = list
            .map((c) => cleanEntry(c, ids))
            .filter((c) => c.key && c.status === "new");
          return {
            file: e.name,
            scanDate: typeof f.json.scanDate === "string" ? f.json.scanDate.slice(0, 10) : e.name.replace(/\.json$/, ""),
            items,
          };
        })
    );
    const scans = files
      .filter((f) => f && f.items.length)
      .sort((a, b) => (a.scanDate < b.scanDate ? 1 : -1));
    return NextResponse.json({ scans });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Body: { action: "add" | "dismiss", file: "2026-11-15.json", keys: ["..."] }
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, file } = body || {};
    const keys = Array.isArray(body?.keys) ? body.keys.filter((k) => typeof k === "string").slice(0, 50) : [];
    if (!["add", "dismiss"].includes(action) || !safeCandidateFile(file) || !keys.length) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const path = `candidates/${file}`;
    const f = await getFile(path);
    if (!f) return NextResponse.json({ error: "Candidate file not found" }, { status: 404 });
    const list = Array.isArray(f.json.candidates) ? f.json.candidates : [];
    const ids = await domainIds();
    const today = new Date().toISOString().slice(0, 10);
    const added = [];

    for (const key of keys) {
      const entry = list.find((c) => c && c.key === key && (c.status || "new") === "new");
      if (!entry) continue;

      if (action === "add") {
        const project = cleanCard(entry.card, ids);
        // Never overwrite an existing card: pick a free id.
        let id = project.id;
        for (let n = 2; (await getFile(`projects/${id}.json`)) || (await getFile(`archive/${id}.json`)); n++) {
          id = `${project.id}-${n}`.slice(0, 60);
          if (n > 20) throw new Error(`No free id for ${project.id}`);
        }
        project.id = id;
        await putFile(`projects/${id}.json`, project, `Add candidate: ${project.name}`);
        entry.status = "added";
        entry.projectId = id;
        added.push(id);
      } else {
        entry.status = "dismissed";
      }
      entry.decidedOn = today;
    }

    // Re-read the sha in case a project write raced; then record decisions.
    const latest = await getFile(path);
    await putFile(
      path,
      { ...f.json, candidates: list },
      `${action === "add" ? "Accept" : "Dismiss"} candidates (${keys.length})`,
      latest ? latest.sha : f.sha
    );
    return NextResponse.json({ ok: true, added });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
