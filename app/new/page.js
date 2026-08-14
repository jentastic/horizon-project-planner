"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar, useLogout, DomainChips, AutoGrowText } from "../../lib/ui";

export default function NewProject() {
  const router = useRouter();
  const logout = useLogout();
  const [config, setConfig] = useState(null);
  const [tab, setTab] = useState("blank");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Draft (shared by both tabs; the generator fills it)
  const [draft, setDraft] = useState({ name: "", domain: "grants", deadline: "", notes: "", steps: [] });

  // Generator inputs
  const [callText, setCallText] = useState("");
  const [pdfBase64, setPdfBase64] = useState(null);
  const [pdfName, setPdfName] = useState("");

  useEffect(() => {
    fetch("/api/data/bootstrap")
      .then((r) => r.json())
      .then((b) => setConfig(b.config))
      .catch(() => setError("Could not load settings"));
  }, []);

  function onPdf(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPdfBase64(String(reader.result).split(",")[1]);
      setPdfName(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "grant", text: callText, pdfBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      const r = data.result;
      setDraft({
        name: r.name || "",
        domain: "grants",
        deadline: r.deadline || "",
        notes: r.notes || "",
        steps: (r.steps || []).map((s) => ({ text: s.text || "", target: s.target || "" })),
      });
      setTab("blank"); // switch to the editable form, now pre-filled
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function setStep(i, patch) {
    setDraft((d) => ({
      ...d,
      steps: d.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    }));
  }

  async function create() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/data/project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        deadline: draft.deadline || null,
        steps: draft.steps
          .filter((s) => s.text.trim())
          .map((s) => ({ text: s.text, target: s.target || null })),
      }),
    });
    const data = await res.json();
    if (res.ok) router.push(`/project/${data.project.id}`);
    else {
      setError(data.error || "Create failed");
      setBusy(false);
    }
  }

  if (!config) return <div className="container"><TopBar onLogout={logout} /><div className="empty">Loading…</div></div>;

  return (
    <div className="container">
      <TopBar onLogout={logout} />
      <div className="page-head"><h2>New project</h2></div>

      <div className="chips">
        <button className={`chip ${tab === "blank" ? "active" : ""}`} onClick={() => setTab("blank")}>
          {draft.steps.length ? "Edit draft" : "Blank"}
        </button>
        <button className={`chip ${tab === "generate" ? "active" : ""}`} onClick={() => setTab("generate")}>
          Generate from grant call
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {tab === "generate" && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="field">
            <label htmlFor="calltext">Paste the call text (or journal submission guidelines)</label>
            <textarea
              id="calltext"
              rows={10}
              value={callText}
              onChange={(e) => setCallText(e.target.value)}
              placeholder="Paste the full call for proposals here…"
            />
          </div>
          <div className="field">
            <label htmlFor="pdf">…or upload the call as a PDF {pdfName && `(${pdfName})`}</label>
            <input id="pdf" type="file" accept="application/pdf" onChange={onPdf} />
          </div>
          <button className="btn primary" disabled={busy || (!callText.trim() && !pdfBase64)} onClick={generate}>
            {busy ? "Reading the call…" : "Generate plan"}
          </button>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 0 }}>
            Nothing is saved until you review and press Create.
          </p>
        </div>
      )}

      {tab === "blank" && (
        <div className="panel">
          <div className="field">
            <label htmlFor="name">Project name</label>
            <input id="name" type="text" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Domain</label>
            <DomainChips config={config} value={draft.domain} onChange={(v) => setDraft({ ...draft, domain: v })} />
          </div>
          <div className="field" style={{ maxWidth: 220 }}>
            <label htmlFor="deadline">Deadline</label>
            <input id="deadline" type="date" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" rows={3} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </div>

          <div className="section-label">Steps</div>
          {draft.steps.map((s, i) => (
            <div key={i} className="step">
              <span className="step-text">
                <AutoGrowText value={s.text} placeholder="Describe the step" ariaLabel="Step description" onChange={(e) => setStep(i, { text: e.target.value })} />
              </span>
              <span className="step-meta">
                <input type="date" value={s.target || ""} onChange={(e) => setStep(i, { target: e.target.value })} aria-label="Target date" />
                <span className="step-actions">
                  <button className="icon-btn" onClick={() => setDraft((d) => ({ ...d, steps: d.steps.filter((_, j) => j !== i) }))} aria-label="Remove">✕</button>
                </span>
              </span>
            </div>
          ))}
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn small" onClick={() => setDraft((d) => ({ ...d, steps: [...d.steps, { text: "", target: "" }] }))}>
              + Add step
            </button>
            <button className="btn primary" style={{ marginLeft: "auto" }} disabled={busy || !draft.name.trim()} onClick={create}>
              {busy ? "Creating…" : "Create project"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
