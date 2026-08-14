import { NextResponse } from "next/server";
import { readAllInDir } from "../../../../lib/github";

export async function GET() {
  try {
    const projects = await readAllInDir("archive");
    projects.sort((a, b) => ((a.archivedOn || "") < (b.archivedOn || "") ? 1 : -1));
    return NextResponse.json({ projects });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
