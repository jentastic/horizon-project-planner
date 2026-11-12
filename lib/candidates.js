// Validation for scan-generated candidate cards.
// Candidate files are written by an automated web scan, so every field is
// treated as untrusted: types are checked, lengths capped, ids and dates
// pattern-matched, and the domain forced to one that exists in config.

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9-]{1,60}$/;
const FILE = /^[A-Za-z0-9_-]{1,60}\.json$/;

export const MAX_STEPS = 30;

export function safeCandidateFile(name) {
  return typeof name === "string" && FILE.test(name);
}

function str(v, max) {
  if (typeof v !== "string") return "";
  // Strip control characters except newlines and tabs.
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, max);
}

function date(v) {
  return typeof v === "string" && DATE.test(v) ? v : null;
}

export function safeUrl(v) {
  if (typeof v !== "string") return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString().slice(0, 500) : null;
  } catch {
    return null;
  }
}

export function slugFrom(text) {
  const s = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return s || "candidate";
}

// Turn an untrusted candidate.card into a clean project object.
export function cleanCard(card, domainIds, fallbackDomain = "grants") {
  const c = card && typeof card === "object" ? card : {};
  const name = str(c.name, 140).trim() || "Untitled candidate";
  const id = typeof c.id === "string" && ID.test(c.id) ? c.id : slugFrom(name);
  const domain = domainIds.includes(c.domain)
    ? c.domain
    : domainIds.includes(fallbackDomain)
    ? fallbackDomain
    : domainIds[0] || fallbackDomain;
  const steps = (Array.isArray(c.steps) ? c.steps : []).slice(0, MAX_STEPS).map((s, i) => ({
    id: `s${i + 1}`,
    text: str(s && s.text, 400).trim(),
    target: date(s && s.target),
    done: false,
    completedOn: null,
  })).filter((s) => s.text);
  return {
    id,
    name,
    domain,
    deadline: date(c.deadline),
    created: new Date().toISOString().slice(0, 10),
    notes: str(c.notes, 6000),
    steps,
  };
}

// Display-safe view of a candidate entry (for the review page).
export function cleanEntry(e, domainIds) {
  const x = e && typeof e === "object" ? e : {};
  return {
    key: typeof x.key === "string" && ID.test(x.key) ? x.key : null,
    status: ["new", "added", "dismissed"].includes(x.status) ? x.status : "new",
    fit: str(x.fit, 40),
    track: str(x.track, 60),
    funder: str(x.funder, 120),
    summary: str(x.summary, 1500),
    source: safeUrl(x.source),
    card: cleanCard(x.card, domainIds),
  };
}
