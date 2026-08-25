"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "./GlassCard";
import { formatCurrency } from "@/lib/products";
import { format, subDays } from "date-fns";

type Day = { date: string; sales: number; commission: number; count: number };

const RANGES = [
  { key: 30, label: "30D" },
  { key: 60, label: "60D" },
  { key: 90, label: "90D" },
  { key: 180, label: "6M" },
  { key: 365, label: "1Y" },
];

export function SalesHistoryTimeline() {
  const [range, setRange] = useState(90);
  const [data, setData] = useState<{ timeline: Day[]; summary: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/my-timeline?days=${range}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [range]);

  const timeline = data?.timeline || [];
  const max = Math.max(1, ...timeline.map((d) => d.sales));
  const W = 720, H = 200;
  const padX = 10, padY = 20;
  const innerW = W - padX * 2, innerH = H - padY * 2;
  const stepX = timeline.length > 1 ? innerW / (timeline.length - 1) : 0;

  const points = timeline.map((d, i) => {
    const x = padX + i * stepX;
    const y = padY + innerH - (d.sales / max) * innerH;
    return { x, y, ...d };
  });

  const pathD = points.length > 1
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")
    : "";
  const fillD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x} ${padY + innerH} L ${points[0].x} ${padY + innerH} Z`
    : "";

  // Show one label every Nth point
  const labelEvery = Math.max(1, Math.floor(timeline.length / 8));

  return (
    <GlassCard padding="lg" style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, margin: 0 }}>Sales timeline</h2>
          <p className="section-title-sub" style={{ marginTop: 2 }}>
            {data?.summary && (
              <>
                {formatCurrency(data.summary.totalSales)} across {data.summary.saleCount} sale{data.summary.saleCount !== 1 ? "s" : ""} · avg {formatCurrency(data.summary.avgPerDay)}/day
                {data.summary.bestDay?.sales > 0 && ` · best: ${format(data.summary.bestDay.date, "MMM d")} (${formatCurrency(data.summary.bestDay.sales)})`}
              </>
            )}
          </p>
        </div>
        <div className="pill-group" style={{ width: "auto", flexShrink: 0 }}>
          {RANGES.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)} className={`pill ${range === r.key ? "pill-active" : ""}`} style={{ minWidth: 48 }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
          Loading…
        </div>
      ) : timeline.length === 0 ? (
        <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
          No sales in this period
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 480, height: 220 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(45, 90, 61, 0.4)" />
                <stop offset="100%" stopColor="rgba(45, 90, 61, 0)" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <g stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3">
              <line x1={padX} y1={padY} x2={W - padX} y2={padY} />
              <line x1={padX} y1={padY + innerH / 2} x2={W - padX} y2={padY + innerH / 2} />
              <line x1={padX} y1={padY + innerH} x2={W - padX} y2={padY + innerH} />
            </g>

            {/* Fill */}
            {fillD && <path d={fillD} fill="url(#salesGrad)" />}
            {/* Line */}
            {pathD && <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}

            {/* Dots */}
            {points.map((p, i) => (
              <g key={p.date}>
                <circle cx={p.x} cy={p.y} r={p.count > 0 ? 3 : 2} fill="var(--color-primary)" stroke="white" strokeWidth="1" />
                {p.count > 0 && i % labelEvery === 0 && (
                  <text x={p.x} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--color-text-muted)">
                    {format(new Date(p.date), "MMM d")}
                  </text>
                )}
              </g>
            ))}

            {/* Y axis labels */}
            <g fill="var(--color-text-muted)" fontSize="10">
              <text x={padX} y={padY - 4}>{formatCurrency(max)}</text>
              <text x={padX} y={padY + innerH / 2 + 4}>{formatCurrency(max / 2)}</text>
              <text x={padX} y={padY + innerH + 4}>$0</text>
            </g>
          </svg>
        </div>
      )}

      {/* Best days strip */}
      {data && timeline.length > 0 && (() => {
        const sorted = [...timeline].sort((a, b) => b.sales - a.sales).slice(0, 5);
        return (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Top 5 days
            </p>
            <div style={{ display: "grid", gap: 6 }}>
              {sorted.map((d, i) => (
                <div key={d.date} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.5rem 0.625rem", background: "var(--glass-bg-soft)", borderRadius: 8 }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, width: 24, color: "var(--color-secondary)" }}>#{i + 1}</span>
                  <span style={{ flex: 1, fontSize: "0.8125rem", fontWeight: 600 }}>{format(new Date(d.date), "EEE MMM d")}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{d.count} sale{d.count !== 1 ? "s" : ""}</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-primary)", minWidth: 90, textAlign: "right" }}>{formatCurrency(d.sales)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </GlassCard>
  );
}
