"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TopBar, useLogout, fmtDate } from "../../lib/ui";

// Review page for cards proposed by the scheduled funding scan.
// All candidate text is rendered as plain text (React escapes it);
// source links are limited to http(s) on the server.

export default function CandidatesPage() {
  const logout = useLogout();
  const [scans, setScans] = useState(null);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState({}); // "file|key" -> true
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setError("");
    try {
      const r = await fetch("/api/data/candidates");
      const d = await r.json();
      if (d.error) setError(d.error);
      else setScans(d.scans);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => { load(); }, []);

  function toggle(file, key) {
    const k = `${file}|${key}`;
    setPicked((p) => ({ ...p, [k]: !p[k] }));
  }

  async function act(action) {
    const byFile = {};
    for (const [k, v] of Object.entries(picked)) {
      if (!v) continue;
      const [file, key] = k.split("|");
      (byFile[file] = byFile[file] || []).push(key);
    }
    const files = Object.keys(byFile);
    if (!files.length) return;
    setBusy(true);
    setMessage("");
    try {
      let count = 0;
      for (const file of files) {
        const r = await fetch("/api/data/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, file, keys: byFile[file] }),
        });
        const d = await r.json();
        if (d.error) throw new Error(d.error);
        count += action === "add" ? d.added.length : byFile[file].length;
      }
      setMessage(action === "add" ? `Added ${count} card${count === 1 ? "" : "s"} to the planner.` : `Dismissed ${count}.`);
      setPicked({});
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const nPicked = Object.values(picked).filter(Boolean).length;

  if (error && !scans) return <div className="container"><TopBar onLogout={logout} /><div className="error-box">{error}</div></div>;
  if (!scans) return <div className="container"><TopBar onLogout={logout} /><div className="empty">Loading…</div></div>;

  return (
    <div className="container">
      <TopBar onLogout={logout} />
      <div className="page-head">
        <h2>Candidates</h2>
        <button className="btn primary small" disabled={busy || !nPicked} onClick={() => act("add")}>
          Add selected{nPicked ? ` (${nPicked})` : ""}
        </button>
        <button className="btn small" disabled={busy || !nPicked} onClick={() => act("dismiss")}>
          Dismiss selected
        </button>
        {message && <span className="save-status">{message} <Link href="/" style={{ textDecoration: "underline" }}>Dashboard</Link></span>}
      </div>
      {error && <div className="error-box">{error}</div>}
      {scans.length === 0 && <div className="empty">No open candidates. New ones appear after each funding scan.</div>}

      {scans.map((scan) => (
        <section key={scan.file} style={{ marginBottom: 22 }}>
          <div className="section-label" style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: 11, letterSpacing: "0.06em", margin: "14px 0 6px" }}>
            Scan {fmtDate(scan.scanDate)}
          </div>
          {scan.items.map((c) => {
            const k = `${scan.file}|${c.key}`;
            const isOpen = open === k;
            return (
              <div key={k}>
                <div className="archive-row">
                  <input
                    type="checkbox"
                    checked={!!picked[k]}
                    onChange={() => toggle(scan.file, c.key)}
                    aria-label={`Select ${c.card.name}`}
                  />
                  <span className="name">{c.card.name}</span>
                  {c.fit && <span className="mono" style={{ color: "var(--muted)" }}>{c.fit}</span>}
                  <span className="mono" style={{ color: "var(--muted)" }}>
                    {c.card.deadline ? `deadline ${fmtDate(c.card.deadline)}` : "no deadline"}
                  </span>
                  <button className="btn small" onClick={() => setOpen(isOpen ? null : k)}>
                    {isOpen ? "Hide" : "Details"}
                  </button>
                </div>
                {isOpen && (
                  <div style={{ padding: "8px 4px 14px 28px", color: "var(--muted)", fontSize: 13.5, whiteSpace: "pre-wrap" }}>
                    {(c.funder || c.track) && <div style={{ marginBottom: 6 }}>{[c.funder, c.track].filter(Boolean).join(" · ")}</div>}
                    {c.summary && <p style={{ marginTop: 0 }}>{c.summary}</p>}
                    {c.source && (
                      <p><a href={c.source} target="_blank" rel="noopener noreferrer nofollow" style={{ textDecoration: "underline" }}>Call page</a></p>
                    )}
                    {c.card.notes && <p>{c.card.notes}</p>}
                    {c.card.steps.map((s) => (
                      <div key={s.id}>◦ {s.text}{s.target && <span className="mono"> — {fmtDate(s.target)}</span>}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
