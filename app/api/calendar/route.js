import { readAllInDir } from "../../../lib/github";

function icsDate(iso) {
  return iso.replace(/-/g, "");
}

function nextDay(iso) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function esc(s) {
  return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!process.env.CALENDAR_FEED_KEY || key !== process.env.CALENDAR_FEED_KEY) {
    return new Response("Not found", { status: 404 });
  }

  let projects = [];
  try {
    projects = await readAllInDir("projects");
  } catch {
    return new Response("Error", { status: 500 });
  }

  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//horizon-planner//EN",
    "X-WR-CALNAME:Planning deadlines",
    "CALSCALE:GREGORIAN",
  ];

  for (const p of projects) {
    if (p.deadline) {
      lines.push(
        "BEGIN:VEVENT",
        `UID:deadline-${p.id}@horizon-planner`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${icsDate(p.deadline)}`,
        `DTEND;VALUE=DATE:${icsDate(nextDay(p.deadline))}`,
        `SUMMARY:${esc("DUE: " + p.name)}`,
        "END:VEVENT"
      );
    }
    for (const s of p.steps || []) {
      if (s.target && !s.done) {
        lines.push(
          "BEGIN:VEVENT",
          `UID:step-${p.id}-${s.id}@horizon-planner`,
          `DTSTAMP:${now}`,
          `DTSTART;VALUE=DATE:${icsDate(s.target)}`,
          `DTEND;VALUE=DATE:${icsDate(nextDay(s.target))}`,
          `SUMMARY:${esc(p.name + " — " + s.text)}`,
          "END:VEVENT"
        );
      }
    }
  }
  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="planning.ics"',
    },
  });
}
