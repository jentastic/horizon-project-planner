import { NextResponse } from "next/server";
import { getFile, putFile } from "../../../../lib/github";

export async function PUT(request) {
  try {
    const body = await request.json();
    const existing = await getFile("config.json");
    await putFile("config.json", body, "Update config", existing?.sha);
    return NextResponse.json({ config: body });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
