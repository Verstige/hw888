"use client";

import { useState, useEffect, useMemo } from "react";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { KpiTile } from "@/app/components/KpiTile";
import { Icon } from "@/app/components/Icon";
import { formatCurrency } from "@/lib/products";
import { format } from "date-fns";

type Show = {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
};

type Props = {
  userRole: "ADMIN" | "MANAGER" | "EMPLOYEE";
  shows: Show[];
  initialShowId?: string;
};

type ReportData = {
  show: Show;
  totalSales: number;
  totalCommission: number;
  saleCount: number;
  cashTotal: number;
  cardTotal: number;
  byDay: Array<{ date: string; sales: number; commission: number; count: number; cash: number; card: number; perEmployee: Record<string, { sales: number; count: number }> }>;
  byEmployee: Array<{ userId: string; name: string; role: string; sales: number; commission: number; count: number; avg: number }>;
  byLevel: Array<{ level: string; sales: number; count: number }>;
  byPayment: { CASH: number; CARD: number };
};

const RANGES = [
  { key: "show", label: "Whole show" },
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
];

export default function ReportsClient({ userRole, shows, initialShowId }: Props) {
  const [showId, setShowId] = useState<string>(initialShowId || shows[0]?.id || "");
  const [range, setRange] = useState<string>("show");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!showId) return;
    setLoading(true);
    fetch(`/api/reports/show?showId=${showId}&range=${range}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [showId, range]);

  const exportCsv = () => {
    if (!data) return;
    const lines = [
      ["Date", "Cash", "Card", "Total", "Sales count", ...data.byEmployee.map((e) => e.name)].join(","),
      ...data.byDay.map((d) => [
        d.date,
        d.cash.toFixed(2),
        d.card.toFixed(2),
        d.sales.toFixed(2),
        d.count,
        ...data.byEmployee.map((e) => (d.perEmployee[e.userId]?.sales || 0).toFixed(2)),
      ].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${data.show.name.replace(/\s+/g, "-")}-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isManagerLike = userRole === "MANAGER" || userRole === "ADMIN";

  return (
    <ClientAuthShell pageTitle="Reports" pageSubtitle="Show-by-show breakdown">
      <div style={{ marginBottom: "1rem" }}>
        <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
          Reports
        </h1>
        <p className="section-title-sub" style={{ marginTop: 4 }}>
          Cash vs card, per employee, per day
        </p>
      </div>

      {/* Show picker */}
      <GlassCard padding="md" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr" }} className="form-grid-2">
          <div>
            <label className="label">Show</label>
            <select value={showId} onChange={(e) => setShowId(e.target.value)} className="input">
              {shows.length === 0 ? (
                <option value="">No shows available</option>
              ) : shows.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({format(new Date(s.startDate), "MMM d")})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Range</label>
            <div className="pill-group" style={{ width: "100%" }}>
              {RANGES.map((r) => (
                <button key={r.key} onClick={() => setRange(r.key)} className={`pill ${range === r.key ? "pill-active" : ""}`} style={{ flex: 1 }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {!showId ? (
        <GlassCard padding="lg">
          <div className="empty-state"><div className="empty-state-icon">📊</div><p>Pick a show to view the report.</p></div>
        </GlassCard>
      ) : loading || !data ? (
        <GlassCard padding="lg" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)" }}>Loading report…</p>
        </GlassCard>
      ) : (
        <>
          {/* Show header */}
          <GlassCard padding="lg" variant="strong" style={{ marginBottom: "1rem", background: "linear-gradient(135deg, rgba(45, 90, 61, 0.92) 0%, rgba(31, 63, 42, 0.95) 100%)", color: "white", border: "1px solid rgba(255, 255, 255, 0.10)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{data.show.name}</h2>
                <p style={{ fontSize: "0.8125rem", opacity: 0.8, marginTop: 2 }}>
                  {format(new Date(data.show.startDate), "MMM d, yyyy")} — {format(new Date(data.show.endDate), "MMM d, yyyy")} · {data.show.location}
                </p>
              </div>
              <button onClick={exportCsv} className="btn btn-secondary" style={{ background: "rgba(255, 255, 255, 0.18)", color: "white", borderColor: "rgba(255, 255, 255, 0.20)" }}>
                <Icon name="search" size={16} />
                <span>Export CSV</span>
              </button>
            </div>
          </GlassCard>

          {/* KPI grid */}
          <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(2, 1fr)", marginBottom: "1.25rem" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <KpiTile label="Total sales" value={formatCurrency(data.totalSales)} icon="trending-up" />
            </div>
            <KpiTile label="Cash" value={formatCurrency(data.cashTotal)} icon="circle" />
            <KpiTile label="Credit card" value={formatCurrency(data.cardTotal)} icon="circle" />
            <KpiTile label="Commission" value={formatCurrency(data.totalCommission)} icon="sparkle" accent="secondary" />
            <KpiTile label="Sales count" value={data.saleCount.toLocaleString()} icon="package" />
          </div>

          {/* Cash vs card breakdown bar */}
          <GlassCard padding="md" style={{ marginBottom: "1.25rem" }}>
            <div className="section-title">
              <div>
                <h2>Cash vs credit card</h2>
                <p className="section-title-sub">POS-tendered split</p>
              </div>
            </div>
            <div style={{ display: "flex", height: 32, borderRadius: 12, overflow: "hidden", background: "var(--color-bg-dark)" }}>
              <div style={{
                width: `${(data.cashTotal / Math.max(data.totalSales, 1)) * 100}%`,
                background: "linear-gradient(135deg, var(--color-success) 0%, #3FA562 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 700, fontSize: "0.875rem",
                transition: "width 0.4s ease",
              }}>
                {((data.cashTotal / Math.max(data.totalSales, 1)) * 100).toFixed(0)}%
              </div>
              <div style={{
                width: `${(data.cardTotal / Math.max(data.totalSales, 1)) * 100}%`,
                background: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 700, fontSize: "0.875rem",
                transition: "width 0.4s ease",
              }}>
                {((data.cardTotal / Math.max(data.totalSales, 1)) * 100).toFixed(0)}%
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--color-success)", borderRadius: 2, marginRight: 6 }} />Cash {formatCurrency(data.cashTotal)}</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#3B82F6", borderRadius: 2, marginRight: 6 }} />Card {formatCurrency(data.cardTotal)}</span>
            </div>
          </GlassCard>

          {/* Day by day */}
          {data.byDay.length > 0 && (
            <GlassCard padding="lg" style={{ marginBottom: "1.25rem" }}>
              <div className="section-title">
                <div>
                  <h2>Day by day</h2>
                  <p className="section-title-sub">{data.byDay.length} day{data.byDay.length !== 1 ? "s" : ""} with sales</p>
                </div>
              </div>
              <div className="table-shell">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th style={{ textAlign: "right" }}>Cash</th>
                      <th style={{ textAlign: "right" }}>Card</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                      <th style={{ textAlign: "right" }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byDay.map((d) => (
                      <tr key={d.date}>
                        <td style={{ fontWeight: 600 }}>{format(new Date(d.date), "EEE MMM d")}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(d.cash)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(d.card)}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>{formatCurrency(d.sales)}</td>
                        <td style={{ textAlign: "right", color: "var(--color-text-muted)" }}>{d.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}

          {/* By employee */}
          {isManagerLike && data.byEmployee.length > 0 && (
            <GlassCard padding="lg" style={{ marginBottom: "1.25rem" }}>
              <div className="section-title">
                <div>
                  <h2>By employee</h2>
                  <p className="section-title-sub">{data.byEmployee.length} contributor{data.byEmployee.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {data.byEmployee.map((emp, i) => {
                  const max = data.byEmployee[0]?.sales || 1;
                  const pct = Math.round((emp.sales / max) * 100);
                  const rankClass = i === 0 ? "rank-1" : i === 1 ? "rank-2" : i === 2 ? "rank-3" : "";
                  return (
                    <div key={emp.userId} style={{
                      padding: "0.75rem 0.875rem",
                      background: "var(--glass-bg-soft)",
                      border: "1px solid var(--glass-border-soft)",
                      borderRadius: 14,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className={`avatar avatar-sm ${rankClass}`}>{i + 1}</div>
                          <div>
                            <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{emp.name}</p>
                            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                              {emp.count} sale{emp.count !== 1 ? "s" : ""} · avg {formatCurrency(emp.avg)} · {emp.role}
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{formatCurrency(emp.sales)}</p>
                          <p style={{ fontSize: "0.75rem", color: "var(--color-secondary-dark)", fontWeight: 600 }}>
                            +{formatCurrency(emp.commission)} commission
                          </p>
                        </div>
                      </div>
                      <div style={{ height: 5, background: "var(--color-bg-dark)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
                          borderRadius: 999,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* By level */}
          {data.byLevel.length > 0 && (
            <GlassCard padding="lg">
              <div className="section-title">
                <div>
                  <h2>By product level</h2>
                  <p className="section-title-sub">Which bracelet tiers sold</p>
                </div>
              </div>
              <div className="table-shell">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th style={{ textAlign: "right" }}>Sales</th>
                      <th style={{ textAlign: "right" }}>Count</th>
                      <th style={{ textAlign: "right" }}>Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byLevel.map((l) => (
                      <tr key={l.level}>
                        <td style={{ fontWeight: 700 }}>{l.level.replace("LEVEL_", "")}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(l.sales)}</td>
                        <td style={{ textAlign: "right", color: "var(--color-text-muted)" }}>{l.count}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(l.sales / Math.max(l.count, 1))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </>
      )}
    </ClientAuthShell>
  );
}
