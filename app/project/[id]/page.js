"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopBar, useLogout, fmtDate, daysUntil, todayISO, DomainChips, AutoGrowText } from "../../../lib/ui";

export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const logout = useLogout();

  const [project, setProject] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Saved");
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const saveTimer = useRef(null);
  const latest = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/data/project/${id}`).then((r) => r.json()),
      fetch("/api/data/bootstrap").then((r) => r.json()),
      fetch(`/api/data/project/${id}/files`).then((r) => r.json()),
    ])
      .then(([p, b, f]) => {
        if (p.error) throw new Error(p.error);
        setProject(p.project);
        latest.current = p.project;
        setConfig(b.config);
        setFiles(f.files || []);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function uploadFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileError("");
    if (file.size > 3 * 1024 * 1024) {
      setFileError("That file is over 3 MB — paste a link to it instead (cloud storage, shared drive, etc.).");
      return;
    }
    setUploading(true);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(",")[1]);
        r.onerror = () => rej(new Error("Could not read the file"));
        r.readAsDataURL(file);
      });
      const resp = await fetch(`/api/data/project/${id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, base64 }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Upload failed");
      setFiles((f) => [...f.filter((x) => x.name !== data.name), { name: data.name, size: file.size }]);
    } catch (err) {
      setFileError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function removeFile(name) {
    if (!confirm(`Remove attachment "${name}"?`)) return;
    const resp = await fetch(`/api/data/project/${id}/files/${encodeURIComponent(name)}`, { method: "DELETE" });
    if (resp.ok) setFiles((f) => f.filter((x) => x.name !== name));
    else setFileError("Could not remove the file");
  }

  function addLink() {
    if (!linkUrl.trim()) return;
    const url = /^https?:\/\//i.test(linkUrl) ? linkUrl.trim() : "https://" + linkUrl.trim();
    update({ links: [...(project.links || []), { label: linkLabel.trim() || url, url }] });
    setLinkLabel("");
    setLinkUrl("");
  }

  function removeLink(i) {
    update({ links: (project.links || []).filter((_, j) => j !== i) });
  }

  function update(patch) {
    setProject((prev) => {
      const next = { ...prev, ...patch };
      latest.current = next;
      return next;
    });
    setStatus("Saving…");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/data/project/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latest.current),
      });
      setStatus(res.ok ? "Saved" : "Save failed — retrying may help");
    }, 900);
  }

  function updateStep(sid, patch) {
    update({
      steps: project.steps.map((s) => (s.id === sid ? { ...s, ...patch } : s)),
    });
  }

  function toggleStep(s) {
    updateStep(s.id, {
      done: !s.done,
      completedOn: !s.done ? todayISO() : null,
    });
  }

  function addStep() {
    update({
      steps: [
        ...project.steps,
        { id: "s" + Math.random().toString(36).slice(2, 8), text: "", target: null, done: false, completedOn: null },
      ],
    });
  }

  function removeStep(sid) {
    update({ steps: project.steps.filter((s) => s.id !== sid) });
  }

  function moveStep(index, dir) {
    const steps = [...project.steps];
    const j = index + dir;
    if (j < 0 || j >= steps.length) return;
    [steps[index], steps[j]] = [steps[j], steps[index]];
    update({ steps });
  }

  async function archive() {
    if (!confirm("Move this project to the archive?")) return;
    const res = await fetch(`/api/data/project/${id}?archive=1`, { method: "DELETE" });
    if (res.ok) router.push("/");
    else setError("Archiving failed");
  }

  async function remove() {
    if (!confirm("Permanently delete this project? (Archive is usually better.)")) return;
    const res = await fetch(`/api/data/project/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/");
    else setError("Delete failed");
  }

  if (error) return <div className="container"><TopBar onLogout={logout} /><div className="error-box">{error}</div></div>;
  if (!project || !config) return <div className="container"><TopBar onLogout={logout} /><div className="empty">Loading…</div></div>;

  const dLeft = daysUntil(project.deadline);
  const today = todayISO();

  return (
    <div className="container">
      <TopBar onLogout={logout} />

      <div className="page-head">
        <input
          type="text"
          aria-label="Project name"
          value={project.name}
          onChange={(e) => update({ name: e.target.value })}
          style={{ fontSize: 20, fontWeight: 600, border: "none", background: "transparent", flex: 1, minWidth: 220, padding: 0 }}
        />
        <span className="save-status mono">{status}</span>
      </div>

      <div className="row" style={{ flexWrap: "wrap", marginBottom: 16 }}>
        <DomainChips config={config} value={project.domain} onChange={(v) => update({ domain: v })} />
        <label className="mono" style={{ color: "var(--muted)" }}>Deadline</label>
        <input
          type="date"
          value={project.deadline || ""}
          onChange={(e) => update({ deadline: e.target.value || null })}
          style={{ width: "auto" }}
        />
        {dLeft !== null && (
          <span className={`mono ${dLeft <= 14 ? "days-left near" : ""}`} style={{ color: "var(--muted)" }}>
            {dLeft < 0 ? `${-dLeft} days over` : `${dLeft} days left`}
          </span>
        )}
        <span style={{ marginLeft: "auto" }} className="row">
          <button className="btn small" onClick={archive}>Archive</button>
          <button className="btn small danger" onClick={remove}>Delete</button>
        </span>
      </div>

      <div className="field">
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" value={project.notes || ""} onChange={(e) => update({ notes: e.target.value })} />
      </div>

      <div className="section-label">Steps</div>
      <div className="steps">
        {project.steps.map((s, i) => (
          <div
            key={s.id}
            className={`step ${s.done ? "done" : ""} ${!s.done && s.target && s.target < today ? "overdue" : ""}`}
          >
            <input type="checkbox" checked={s.done} onChange={() => toggleStep(s)} aria-label="Done" />
            <span className="step-text">
              <AutoGrowText
                value={s.text}
                placeholder="Describe the step"
                ariaLabel="Step description"
                onChange={(e) => updateStep(s.id, { text: e.target.value })}
              />
            </span>
            <span className="step-meta">
              <input
                type="date"
                value={s.target || ""}
                onChange={(e) => updateStep(s.id, { target: e.target.value || null })}
                aria-label="Target date"
              />
              <span className="step-actions">
                <button className="icon-btn" onClick={() => moveStep(i, -1)} aria-label="Move up">↑</button>
                <button className="icon-btn" onClick={() => moveStep(i, 1)} aria-label="Move down">↓</button>
                <button className="icon-btn" onClick={() => removeStep(s.id)} aria-label="Remove">✕</button>
              </span>
            </span>
          </div>
        ))}
      </div>
      <button className="btn small" style={{ marginTop: 10 }} onClick={addStep}>+ Add step</button>

      <div className="section-label">Files &amp; links</div>
      <div className="panel">
        {files.map((f) => (
          <div key={f.name} className="row" style={{ padding: "4px 0" }}>
            <a
              href={`/api/data/project/${id}/files/${encodeURIComponent(f.name)}`}
              style={{ textDecoration: "underline" }}
            >
              {f.name}
            </a>
            <span className="mono" style={{ color: "var(--muted)" }}>
              {f.size >= 1024 * 1024 ? (f.size / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(f.size / 1024)) + " kB"}
            </span>
            <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={() => removeFile(f.name)} aria-label={`Remove ${f.name}`}>✕</button>
          </div>
        ))}
        {(project.links || []).map((l, i) => (
          <div key={i} className="row" style={{ padding: "4px 0" }}>
            <a href={l.url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
              {l.label} ↗
            </a>
            <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={() => removeLink(i)} aria-label={`Remove link ${l.label}`}>✕</button>
          </div>
        ))}
        {files.length === 0 && (project.links || []).length === 0 && (
          <div style={{ color: "var(--muted)", fontSize: 13.5, paddingBottom: 6 }}>
            No files or links yet.
          </div>
        )}
        {fileError && <div className="error-box">{fileError}</div>}
        <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
          <label className="btn small" style={{ cursor: "pointer" }}>
            {uploading ? "Uploading…" : "Upload file (max 3 MB)"}
            <input type="file" onChange={uploadFile} disabled={uploading} style={{ display: "none" }} />
          </label>
        </div>
        <div className="row" style={{ marginTop: 8, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Link label (e.g. Draft in cloud storage)"
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            style={{ flex: 1, minWidth: 160 }}
          />
          <input
            type="text"
            placeholder="https://…"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLink()}
            style={{ flex: 2, minWidth: 200 }}
          />
          <button className="btn small" onClick={addLink} disabled={!linkUrl.trim()}>+ Add link</button>
        </div>
      </div>
    </div>
  );
}
