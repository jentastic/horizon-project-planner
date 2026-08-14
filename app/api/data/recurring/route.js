import { NextResponse } from "next/server";
import { getFile, putFile } from "../../../../lib/github";

export async function PUT(request) {
  try {
    const body = await request.json();
    const existing = await getFile("recurring.json");
    await putFile("recurring.json", body, "Update recurring templates", existing?.sha);
    return NextResponse.json({ recurring: body });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
