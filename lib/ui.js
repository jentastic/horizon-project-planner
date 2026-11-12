"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";

export function AutoGrowText({ value, onChange, placeholder, ariaLabel }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      className="grow-text"
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={onChange}
    />
  );
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function daysUntil(iso) {
  if (!iso) return null;
  const a = new Date(todayISO() + "T00:00:00Z");
  const b = new Date(iso + "T00:00:00Z");
  return Math.round((b - a) / 86400000);
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function domainOf(config, id) {
  return config.domains.find((d) => d.id === id) || { id, name: id, color: "#8a8f98" };
}

export function DomainChips({ config, value, onChange }) {
  return (
    <div className="domain-chips" role="radiogroup" aria-label="Domain">
      {config.domains.map((d) => {
        const active = value === d.id;
        return (
          <button
            key={d.id}
            type="button"
            role="radio"
            aria-checked={active}
            className={`domain-chip ${active ? "active" : ""}`}
            style={active ? { background: d.color, borderColor: d.color } : undefined}
            onClick={() => onChange(d.id)}
          >
            {!active && <span className="dot" style={{ background: d.color }} />}
            {d.name}
          </button>
        );
      })}
    </div>
  );
}

export function TopBar({ onLogout }) {
  return (
    <header className="topbar">
      <h1><Link href="/">Horizon</Link></h1>
      <nav>
        <Link href="/new">New project</Link>
        <Link href="/archive">Archive</Link>
        <Link href="/settings">Settings</Link>
        <button onClick={onLogout}>Sign out</button>
      </nav>
    </header>
  );
}

export function useLogout() {
  return async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };
}
