import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createToken } from "../../../../lib/session";

// Best-effort rate limiting per lambda instance.
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function limited(ip) {
  const now = Date.now();
  const rec = attempts.get(ip) || { count: 0, start: now };
  if (now - rec.start > WINDOW_MS) {
    attempts.set(ip, { count: 1, start: now });
    return false;
  }
  rec.count += 1;
  attempts.set(ip, rec);
  return rec.count > MAX_ATTEMPTS;
}

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  const { password } = await request.json().catch(() => ({}));
  const hash = process.env.APP_PASSWORD_HASH;
  const secret = process.env.SESSION_SECRET;
  if (!hash || !secret) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const ok = password && (await bcrypt.compare(password, hash));
  if (!ok) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = await createToken(secret, 30);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
