import { NextResponse } from "next/server";
import { getFile, readAllInDir } from "../../../../lib/github";
import { DEFAULT_CONFIG, DEFAULT_RECURRING } from "../../../../lib/data";

export async function GET() {
  try {
    const [configFile, recurringFile, projects] = await Promise.all([
      getFile("config.json"),
      getFile("recurring.json"),
      readAllInDir("projects"),
    ]);
    return NextResponse.json({
      config: configFile ? configFile.json : DEFAULT_CONFIG,
      recurring: recurringFile ? recurringFile.json : DEFAULT_RECURRING,
      projects: projects.sort((a, b) => (a.deadline || "9999") < (b.deadline || "9999") ? -1 : 1),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
