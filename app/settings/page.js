"use client";
import { useEffect, useState } from "react";
import { TopBar, useLogout } from "../../lib/ui";
import { PALETTE } from "../../lib/palette";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SettingsPage() {
  const logout = useLogout();
  const [config, setConfig] = useState(null);
  const [recurring, setRecurring] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/data/bootstrap")
      .then((r) => r.json())
      .then((b) => {
        if (b.error) throw new Error(b.error);
        setConfig(b.config);
        setRecurring(b.recurring);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function save() {
    setStatus("Saving…");
    const [r1, r2] = await Promise.all([
      fetch("/api/data/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      }),
      fetch("/api/data/recurring", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recurring),
      }),
    ]);
    setStatus(r1.ok && r2.ok ? "Saved" : "Save failed");
  }

  function setDomain(i, patch) {
    setConfig((c) => ({ ...c, domains: c.domains.map((d, j) => (j === i ? { ...d, ...patch } : d)) }));
  }

  function setTemplate(i, patch) {
    setRecurring((r) => ({ ...r, templates: r.templates.map((t, j) => (j === i ? { ...t, ...patch } : t)) }));
  }

  if (error) return <div className="container"><TopBar onLogout={logout} /><div className="error-box">{error}</div></div>;
  if (!config || !recurring) return <div className="container"><TopBar onLogout={logout} /><div className="empty">Loading…</div></div>;

  return (
    <div className="container">
      <TopBar onLogout={logout} />
      <div className="page-head">
        <h2>Settings</h2>
        <span className="save-status mono">{status}</span>
      </div>

      <div className="section-label">Domains (task classes)</div>
      <div className="panel">
        <table className="mini">
          <tbody>
            {config.domains.map((d, i) => (
              <tr key={i}>
                <td><input type="text" value={d.name} onChange={(e) => setDomain(i, { name: e.target.value })} /></td>
                <td style={{ width: 210 }}>
                  <div className="swatches">
                    {PALETTE.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        title={c.name}
                        aria-label={c.name}
                        aria-pressed={d.color.toLowerCase() === c.hex}
                        className={`swatch ${d.color.toLowerCase() === c.hex ? "active" : ""}`}
                        style={{ background: c.hex }}
                        onClick={() => setDomain(i, { color: c.hex })}
                      />
                    ))}
                  </div>
                </td>
                <td style={{ width: 40 }}>
                  <button
                    className="icon-btn"
                    aria-label="Remove domain"
                    onClick={() => setConfig((c) => ({ ...c, domains: c.domains.filter((_, j) => j !== i) }))}
                  >✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="btn small"
          style={{ marginTop: 8 }}
          onClick={() =>
            setConfig((c) => ({
              ...c,
              domains: [...c.domains, { id: "domain-" + Date.now().toString(36), name: "New domain", color: PALETTE[0].hex }],
            }))
          }
        >
          + Add domain
        </button>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 0 }}>
          Removing a domain does not delete its projects; they keep their tag and can be re-assigned.
        </p>
      </div>

      <div className="section-label">Recurring meetings</div>
      <div className="panel">
        {recurring.templates.map((t, i) => (
          <div key={t.id} style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 12 }}>
            <div className="row" style={{ flexWrap: "wrap" }}>
              <input
                type="text"
                value={t.name}
                style={{ flex: 1, minWidth: 180 }}
                onChange={(e) => setTemplate(i, { name: e.target.value })}
                aria-label="Meeting name"
              />
              <select value={t.weekday ?? 1} onChange={(e) => setTemplate(i, { weekday: Number(e.target.value) })} style={{ width: "auto" }}>
                {WEEKDAYS.map((w, wi) => <option key={wi} value={wi}>{w}</option>)}
              </select>
              <select value={t.domain || "supervision"} onChange={(e) => setTemplate(i, { domain: e.target.value })} style={{ width: "auto" }}>
                {config.domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button
                className="icon-btn"
                aria-label="Remove template"
                onClick={() => setRecurring((r) => ({ ...r, templates: r.templates.filter((_, j) => j !== i) }))}
              >✕</button>
            </div>
            <div className="field" style={{ marginTop: 8, marginBottom: 0 }}>
              <label>Standard checklist (one item per line; transcript action items are added on top)</label>
              <textarea
                rows={3}
                value={(t.checklist || []).join("\n")}
                onChange={(e) => setTemplate(i, { checklist: e.target.value.split("\n").filter((x) => x.trim()) })}
              />
            </div>
          </div>
        ))}
        <button
          className="btn small"
          onClick={() =>
            setRecurring((r) => ({
              ...r,
              templates: [
                ...r.templates,
                { id: "t" + Date.now().toString(36), name: "New meeting", weekday: 1, domain: "supervision", checklist: [] },
              ],
            }))
          }
        >
          + Add meeting
        </button>
      </div>

      <button className="btn primary" style={{ marginTop: 18 }} onClick={save}>Save settings</button>
    </div>
  );
}
