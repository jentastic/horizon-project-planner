"use client";
import { useEffect, useState } from "react";
import { TopBar, useLogout, fmtDate } from "../../lib/ui";

export default function ArchivePage() {
  const logout = useLogout();
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);

  useEffect(() => {
    fetch("/api/data/archive")
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setProjects(d.projects)))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="container"><TopBar onLogout={logout} /><div className="error-box">{error}</div></div>;
  if (!projects) return <div className="container"><TopBar onLogout={logout} /><div className="empty">Loading…</div></div>;

  return (
    <div className="container">
      <TopBar onLogout={logout} />
      <div className="page-head"><h2>Archive</h2></div>
      {projects.length === 0 && <div className="empty">Nothing archived yet.</div>}
      {projects.map((p) => (
        <div key={p.id}>
          <div className="archive-row">
            <span className="name">{p.name}</span>
            <span className="mono" style={{ color: "var(--muted)" }}>
              {p.deadline ? `deadline ${fmtDate(p.deadline)}` : ""}
            </span>
            <span className="mono" style={{ color: "var(--muted)" }}>
              archived {fmtDate(p.archivedOn)}
            </span>
            <button className="btn small" onClick={() => setOpen(open === p.id ? null : p.id)}>
              {open === p.id ? "Hide" : "Steps"}
            </button>
          </div>
          {open === p.id && (
            <div style={{ padding: "8px 4px 14px", color: "var(--muted)", fontSize: 13.5 }}>
              {p.notes && <p style={{ marginTop: 0 }}>{p.notes}</p>}
              {(p.steps || []).map((s) => (
                <div key={s.id}>
                  {s.done ? "✓" : "◦"} {s.text}
                  {s.completedOn && <span className="mono"> — {fmtDate(s.completedOn)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
