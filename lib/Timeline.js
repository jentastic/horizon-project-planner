"use client";
import Link from "next/link";
import { domainOf, todayISO } from "./ui";
import { UI } from "./palette";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const GUTTER = 118;
const MONTH_W = 92;
const ROW_H = 58;
const TOP = 34;

function monthIndex(iso) {
  const d = new Date(iso + "T00:00:00Z");
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
}

function dayFraction(iso) {
  const d = new Date(iso + "T00:00:00Z");
  const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  return (d.getUTCDate() - 1) / daysInMonth;
}

export default function Timeline({ projects, config, filter }) {
  const today = todayISO();
  const dated = projects.filter(
    (p) => p.deadline && (filter === "all" || p.domain === filter)
  );
  if (dated.length === 0) return null;

  const startM = monthIndex(today);
  const endM = Math.max(...dated.map((p) => monthIndex(p.deadline)), startM + 5) + 1;
  const nMonths = endM - startM + 1;

  const rows = config.domains.filter((d) => dated.some((p) => p.domain === d.id));

  const xFor = (iso) => {
    const m = monthIndex(iso);
    const clamped = Math.max(m, startM);
    return GUTTER + (clamped - startM + (m < startM ? 0 : dayFraction(iso))) * MONTH_W;
  };

  const width = GUTTER + nMonths * MONTH_W + 20;
  const height = TOP + rows.length * ROW_H + 16;
  const todayX = xFor(today);

  return (
    <div className="horizon" style={{ overflowX: "auto", padding: "12px 6px" }}>
      <svg width={width} height={height} style={{ display: "block", minWidth: "100%" }}>
        {Array.from({ length: nMonths }, (_, i) => {
          const m = startM + i;
          const x = GUTTER + i * MONTH_W;
          const label = `${MONTHS[m % 12]}${m % 12 === 0 || i === 0 ? " " + Math.floor(m / 12) : ""}`;
          return (
            <g key={i}>
              <text x={x} y={16} fontSize="11" fontFamily="var(--font-mono, monospace)" fill={UI.muted}>{label}</text>
              <line x1={x} y1={24} x2={x} y2={height - 14} stroke={UI.line} strokeWidth="0.5" />
            </g>
          );
        })}

        <line x1={todayX} y1={24} x2={todayX} y2={height - 14} stroke={UI.overdue} strokeWidth="1" strokeDasharray="3 3" />

        {rows.map((dom, ri) => {
          const y = TOP + ri * ROW_H + 14;
          const items = dated
            .filter((p) => p.domain === dom.id)
            .sort((a, b) => (a.deadline < b.deadline ? -1 : 1));
          let lastLabelEnd = -Infinity;
          let flip = false;
          return (
            <g key={dom.id}>
              <text x={GUTTER - 10} y={y + 4} textAnchor="end" fontSize="12" fill={UI.ink} fontWeight="500">
                {dom.name}
              </text>
              <line x1={GUTTER} y1={y} x2={width - 14} y2={y} stroke={UI.line} strokeWidth="0.5" />
              {items.map((p) => {
                const x = xFor(p.deadline);
                const short = p.name.length > 16 ? p.name.slice(0, 15) + "…" : p.name;
                const approxW = short.length * 6.4;
                if (x - approxW / 2 < lastLabelEnd + 8) flip = !flip;
                else flip = false;
                lastLabelEnd = x + approxW / 2;
                const labelY = flip ? y - 12 : y + 22;
                const overdue = p.deadline < today;
                return (
                  <Link key={p.id} href={`/project/${p.id}`}>
                    <g style={{ cursor: "pointer" }}>
                      <title>{`${p.name} — due ${p.deadline}`}</title>
                      <rect
                        x={x - 6}
                        y={y - 6}
                        width={12}
                        height={12}
                        rx={2}
                        transform={`rotate(45 ${x} ${y})`}
                        fill={dom.color}
                        stroke={overdue ? UI.overdue : "none"}
                        strokeWidth={overdue ? 2 : 0}
                      />
                      <text x={x} y={labelY} textAnchor="middle" fontSize="11" fill={UI.muted}>
                        {short}
                      </text>
                    </g>
                  </Link>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
