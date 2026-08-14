"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TopBar, useLogout, daysUntil, fmtDate, domainOf, todayISO } from "../lib/ui";
import Timeline from "../lib/Timeline";

function upcomingFriday(fromISO) {
  const d = new Date(fromISO + "T00:00:00Z");
  const diff = (5 - d.getUTCDay() + 7) % 7; // 0 if today is Friday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function ProjectCard({ p, config }) {
  const domain = domainOf(config, p.domain);
  const total = p.steps.length;
  const done = p.steps.filter((s) => s.done).length;
  const next = p.steps.find((s) => !s.done);
  const dLeft = daysUntil(p.deadline);
  const hasOverdue = p.steps.some((s) => !s.done && s.target && s.target < todayISO());

  return (
    <Link href={`/project/${p.id}`}>
      <article className="card" style={{ borderLeftColor: domain.color }}>
        <div className="card-head">
          <h3 className="card-title">{p.name}</h3>
          {hasOverdue && (
            <span className="dot" title="Has overdue steps" style={{ background: "var(--overdue)" }} />
          )}
        </div>
        <div className="card-meta mono">
          <span className="badge" style={{ background: domain.color }}>{domain.name}</span>
          <span>{p.deadline ? `due ${fmtDate(p.deadline)}` : "no deadline"}</span>
          {dLeft !== null && (
            <span className={`days-left ${dLeft <= 14 ? "near" : ""}`}>
              {dLeft < 0 ? `${-dLeft}d over` : `${dLeft}d left`}
            </span>
          )}
        </div>
        <div className="progress">
          <div style={{ width: total ? `${(done / total) * 100}%` : 0, background: domain.color }} />
        </div>
        <div className="card-meta mono">
          <span>{done}/{total} steps</span>
        </div>
        {next && (
          <div className="next-step">
            <span className="label">Next: </span>{next.text}
            {next.target && <span className="mono" style={{ color: "var(--muted)" }}> · {fmtDate(next.target)}</span>}
          </div>
        )}
      </article>
    </Link>
  );
}

function SpawnMeetingPanel({ template, onClose, onCreated }) {
  const [transcript, setTranscript] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function nextWeekday(weekday) {
    const d = new Date();
    const diff = (weekday - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }

  async function create() {
    setBusy(true);
    setError("");
    try {
      let extraSteps = [];
      if (transcript.trim()) {
        const res = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "meeting", text: transcript }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Parsing failed");
        extraSteps = (data.result.steps || []).map((s) => ({ text: s.text }));
      }
      const deadline = nextWeekday(template.weekday ?? 1);
      const steps = [...(template.checklist || []).map((t) => ({ text: t })), ...extraSteps];
      const res2 = await fetch("/api/data/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} — ${fmtDate(deadline)}`,
          domain: template.domain || "supervision",
          deadline,
          steps,
        }),
      });
      const data2 = await res2.json();
      if (!res2.ok) throw new Error(data2.error || "Create failed");
      onCreated(data2.project);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="panel" style={{ marginBottom: 18 }}>
      <div className="row" style={{ marginBottom: 10 }}>
        <strong>New prep task: {template.name}</strong>
        <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="field">
        <label htmlFor="transcript">Transcript or notes from the last meeting (optional — action items become steps)</label>
        <textarea
          id="transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste the transcript here, or leave empty to use only the standard checklist"
        />
      </div>
      {error && <div className="error-box">{error}</div>}
      <button className="btn primary" disabled={busy} onClick={create}>
        {busy ? "Creating…" : "Create prep task"}
      </button>
    </div>
  );
}

export default function Dashboard() {
  const logout = useLogout();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [spawning, setSpawning] = useState(null);
  const [peek, setPeek] = useState(false);

  useEffect(() => {
    fetch("/api/data/bootstrap")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || "Load failed");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const { thisWeek, nextWeek } = useMemo(() => {
    if (!data) return { thisWeek: [], nextWeek: [] };
    const today = todayISO();
    const friday = upcomingFriday(today);
    const nextFriday = addDays(friday, 7);
    const all = [];
    for (const p of data.projects) {
      if (p.deadline && p.deadline <= nextFriday) {
        all.push({ date: p.deadline, label: `DUE: ${p.name}`, domain: p.domain, id: p.id, hard: true });
      }
      for (const s of p.steps) {
        if (!s.done && s.target && s.target <= nextFriday) {
          all.push({ date: s.target, label: `${p.name} — ${s.text}`, domain: p.domain, id: p.id });
        }
      }
    }
    all.sort((a, b) => (a.date < b.date ? -1 : 1));
    return {
      thisWeek: all.filter((x) => x.date <= friday),
      nextWeek: all.filter((x) => x.date > friday),
    };
  }, [data]);

  if (error) return <div className="container"><TopBar onLogout={logout} /><div className="error-box">{error}</div></div>;
  if (!data) return <div className="container"><TopBar onLogout={logout} /><div className="empty">Loading…</div></div>;

  const projects = data.projects.filter((p) => filter === "all" || p.domain === filter);
  const today = todayISO();

  function WeekItem({ item }) {
    const overdue = item.date < today;
    return (
      <Link href={`/project/${item.id}`} className={`week-item ${overdue ? "overdue-item" : ""}`}>
        <span className="dot" style={{ background: domainOf(data.config, item.domain).color }} />
        <span className="date mono">{overdue ? "overdue" : fmtDate(item.date)}</span>
        <span style={{ fontWeight: item.hard ? 600 : 400 }}>{item.label}</span>
      </Link>
    );
  }

  return (
    <div className="container">
      <TopBar onLogout={logout} />

      <div className="chips">
        <button className={`chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          All ({data.projects.length})
        </button>
        {data.config.domains.map((d) => {
          const n = data.projects.filter((p) => p.domain === d.id).length;
          return (
            <button
              key={d.id}
              className={`chip ${filter === d.id ? "active" : ""}`}
              onClick={() => setFilter(d.id)}
            >
              {d.name} ({n})
            </button>
          );
        })}
      </div>

      {projects.length === 0 ? (
        <div className="empty">
          No projects here yet. <Link href="/new" style={{ textDecoration: "underline" }}>Create one</Link>.
        </div>
      ) : (
        <div className="grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} p={p} config={data.config} />
          ))}
        </div>
      )}

      {data.projects.some((p) => p.deadline) && (
        <>
          <div className="section-label">Timeline</div>
          <Timeline projects={data.projects} config={data.config} filter={filter} />
        </>
      )}

      {(data.recurring.templates || []).length > 0 && (
        <>
          <div className="section-label">Recurring meetings</div>
          <div className="recurring">
            {data.recurring.templates.map((t) => (
              <div key={t.id} className="recurring-item">
                <span><strong>{t.name}</strong> · {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][t.weekday ?? 1]}</span>
                <button className="btn small" onClick={() => setSpawning(t)}>New prep task</button>
              </div>
            ))}
          </div>
        </>
      )}

      {spawning && (
        <SpawnMeetingPanel
          template={spawning}
          onClose={() => setSpawning(null)}
          onCreated={(p) => {
            setSpawning(null);
            setData((d) => ({ ...d, projects: [...d.projects, p] }));
          }}
        />
      )}

      <div className="section-label">This week</div>
      <section className="horizon">
        {thisWeek.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>Nothing due before Friday.</div>
        ) : (
          thisWeek.map((item, i) => <WeekItem key={i} item={item} />)
        )}
        {nextWeek.length > 0 && (
          <>
            <button className="peek-btn" onClick={() => setPeek(!peek)}>
              {peek ? "Hide next week" : `Peek at next week (${nextWeek.length})`}
            </button>
            {peek && (
              <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid var(--line)" }}>
                {nextWeek.map((item, i) => <WeekItem key={i} item={item} />)}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
