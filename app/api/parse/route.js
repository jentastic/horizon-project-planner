import { NextResponse } from "next/server";

export const maxDuration = 60;

const GRANT_SYSTEM = (today) => `You extract structured project plans from funding call documents (grant calls, journal submission guidelines, or similar). Today's date is ${today}.

Respond with ONLY a JSON object, no markdown fences, no commentary:
{
  "name": "short project name",
  "deadline": "YYYY-MM-DD",
  "notes": "1-3 sentences: call identifier, eligibility notes, required documents, anything worth remembering",
  "steps": [ { "text": "step description", "target": "YYYY-MM-DD" } ]
}

Rules:
- Extract the true submission deadline. If multiple deadlines exist (letter of intent, full proposal), the final one is "deadline" and earlier ones become steps.
- Propose 5-12 ordered steps covering the full arc of preparing a submission (drafting, budget with grants office, required attachments like CV/data management plan/letters, internal review, final formatting, submission buffer).
- Backdate step targets sensibly from the deadline: budgets and administrative items need weeks of lead time; leave a safety buffer of at least 2 days before the deadline for the final submission step.
- If a step's timing cannot be inferred, distribute steps evenly between today and the deadline.
- If no deadline can be found, set "deadline" to null and leave step targets null.`;

const MEETING_SYSTEM = `You extract action items from a meeting transcript or meeting notes, to prepare for the NEXT occurrence of this recurring meeting.

Respond with ONLY a JSON object, no markdown fences, no commentary:
{ "steps": [ { "text": "action item" } ] }

Rules:
- Include only items the meeting owner needs to do or check before the next meeting (follow-ups promised, data to review, decisions to prepare, agenda points raised for next time).
- Phrase each item as a concrete imperative ("Review Charlotte's cycling stability data", not "data was discussed").
- 3-10 items. Merge duplicates.`;

export async function POST(request) {
  try {
    const { mode, text, pdfBase64 } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }
    if (!text && !pdfBase64) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const system = mode === "meeting" ? MEETING_SYSTEM : GRANT_SYSTEM(today);

    const content = [];
    if (pdfBase64) {
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
      });
    }
    content.push({
      type: "text",
      text: text || "Extract from the attached document.",
    });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system,
        messages: [{ role: "user", content }],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: `Claude API error (${res.status}): ${t}` }, { status: 502 });
    }

    const data = await res.json();
    const raw = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const clean = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json(
        { error: "Could not parse the model response as JSON", raw: clean },
        { status: 502 }
      );
    }
    return NextResponse.json({ result: parsed });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
