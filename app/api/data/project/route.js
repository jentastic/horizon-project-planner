import { NextResponse } from "next/server";
import { putFile } from "../../../../lib/github";
import { slugify, newStepId } from "../../../../lib/data";

export async function POST(request) {
  try {
    const body = await request.json();
    const id = slugify(body.name || "project");
    const project = {
      id,
      name: body.name || "Untitled project",
      domain: body.domain || "grants",
      deadline: body.deadline || null,
      created: new Date().toISOString().slice(0, 10),
      notes: body.notes || "",
      steps: (body.steps || []).map((s) => ({
        id: s.id || newStepId(),
        text: s.text || "",
        target: s.target || null,
        done: !!s.done,
        completedOn: s.completedOn || null,
      })),
    };
    await putFile(`projects/${id}.json`, project, `Create project: ${project.name}`);
    return NextResponse.json({ project });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
