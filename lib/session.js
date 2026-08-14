// Signed session tokens: base64url(payload).base64url(hmac-sha256)
// Edge-safe: uses Web Crypto only.

const enc = new TextEncoder();

function b64url(bytes) {
  let s = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecodeToString(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return atob(s);
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createToken(secret, days = 30) {
  const payload = JSON.stringify({ exp: Date.now() + days * 86400000 });
  const p64 = b64url(enc.encode(payload));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(p64));
  return `${p64}.${b64url(sig)}`;
}

export async function verifyToken(secret, token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [p64, s64] = token.split(".");
  try {
    const key = await hmacKey(secret);
    const sigStr = b64urlDecodeToString(s64);
    const sig = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) sig[i] = sigStr.charCodeAt(i);
    const ok = await crypto.subtle.verify("HMAC", key, sig, enc.encode(p64));
    if (!ok) return false;
    const payload = JSON.parse(b64urlDecodeToString(p64));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}
