"use client";

import { useEffect, useState } from "react";
import { SiteShell } from "@/app/components/SiteShell";
import { GlassCard } from "@/app/components/GlassCard";
import { KpiTile } from "@/app/components/KpiTile";
import { Icon } from "@/app/components/Icon";
import { RevenueTrendChart, CategoryDonut, TopPerformersChart } from "@/app/components/Charts";
import { formatCurrency } from "@/lib/products";
import { format } from "date-fns";

const RANGES = [
  { key: "7d", label: "Last 7d" },
  { key: "30d", label: "Last 30d" },
  { key: "60d", label: "Last 60d" },
];

type AnalyticsData = {
  range: string;
  days: number;
  kpis: {
    totalSales: number;
    totalCommission: number;
    saleCount: number;
    avgTicket: number;
    activeEmployees: number;
    activeShows: number;
    deltaSalesPct: number;
    deltaCommissionPct: number;
    deltaCountPct: number;
    deltaAvgTicketPct: number;
  };
  revenueByDay: Array<{ date: string; sales: number; commission: number; label: string }>;
  byShow: Array<{ showId: string; name: string; location: string; startDate: string | null; sales: number; commission: number; count: number }>;
  byLevel: Array<{ name: string; value: number; count: number }>;
  byPayment: Array<{ name: string; value: number; count: number }>;
  topPerformers: Array<{ userId: string; name: string; sales: number; commission: number; count: number; rank: number }>;
};

export default function AnalyticsClient({ user }: { user: { id: string; name: string; role: "ADMIN" | "MANAGER" | "EMPLOYEE" } }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?range=${range}`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: "Failed" }));
          throw new Error(err.error || "Failed to load analytics");
        }
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [range]);

  if (loading && !data) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Loading analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <GlassCard padding="lg" style={{ maxWidth: 360, textAlign: "center" }}>
          <Icon name="shield-check" size={32} />
          <h3 style={{ marginTop: 8 }}>Analytics unavailable</h3>
          <p style={{ color: "var(--color-text-muted)", marginTop: 4, fontSize: "0.875rem" }}>{error}</p>
        </GlassCard>
      </div>
    );
  }

  if (!data) return null;

  return (
    <SiteShell
      user={{ name: user.name, role: user.role }}
      pageTitle="Analytics"
      pageSubtitle={`${data.days}-day performance`}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
            Analytics
          </h1>
          <p className="section-title-sub" style={{ marginTop: 4 }}>
            Performance overview
          </p>
        </div>
        <div className="pill-group">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`pill ${range === r.key ? "pill-active" : ""}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI tiles */}
      <div style={{ display: "grid", gap: "0.875rem", gridTemplateColumns: "repeat(2, 1fr)", marginBottom: "1.25rem" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <KpiTile
            label="Total Sales"
            value={formatCurrency(data.kpis.totalSales)}
            delta={data.kpis.deltaSalesPct}
            icon="trending-up"
            accent="primary"
          />
        </div>
        <KpiTile
          label="Commission"
          value={formatCurrency(data.kpis.totalCommission)}
          delta={data.kpis.deltaCommissionPct}
          icon="sparkle"
          accent="secondary"
        />
        <KpiTile
          label="Sales Count"
          value={data.kpis.saleCount.toLocaleString()}
          delta={data.kpis.deltaCountPct}
          icon="package"
        />
        <KpiTile
          label="Avg Ticket"
          value={formatCurrency(data.kpis.avgTicket)}
          delta={data.kpis.deltaAvgTicketPct}
          icon="circle"
        />
        <KpiTile
          label="Active Employees"
          value={data.kpis.activeEmployees.toLocaleString()}
          icon="users"
        />
      </div>

      {/* Revenue trend */}
      <GlassCard padding="lg" style={{ marginBottom: "1.25rem" }}>
        <div className="section-title">
          <div>
            <h2>Revenue trend</h2>
            <p className="section-title-sub" style={{ marginTop: 2 }}>Sales and commission over time</p>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", fontSize: "0.75rem", fontWeight: 600 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--color-primary)" }} />
              Sales
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--color-secondary)" }} />
              Commission
            </span>
          </div>
        </div>
        <RevenueTrendChart data={data.revenueByDay} />
      </GlassCard>

      {/* Donuts: by level + by payment */}
      <div style={{ display: "grid", gap: "0.875rem", gridTemplateColumns: "1fr", marginBottom: "1.25rem" }}>
        <GlassCard padding="lg">
          <div className="section-title">
            <div>
              <h2>By product level</h2>
              <p className="section-title-sub" style={{ marginTop: 2 }}>Which bracelet levels sell</p>
            </div>
          </div>
          {data.byLevel.length > 0 ? (
            <div style={{ position: "relative" }}>
              <CategoryDonut data={data.byLevel} label="Revenue" />
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-icon">📊</div>No data yet</div>
          )}
        </GlassCard>
        <GlassCard padding="lg">
          <div className="section-title">
            <div>
              <h2>By payment type</h2>
              <p className="section-title-sub" style={{ marginTop: 2 }}>Cash vs card mix</p>
            </div>
          </div>
          {data.byPayment.length > 0 ? (
            <div style={{ position: "relative" }}>
              <CategoryDonut data={data.byPayment} label="Revenue" />
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-icon">💳</div>No data yet</div>
          )}
        </GlassCard>
      </div>

      {/* By show table */}
      <GlassCard padding="lg" style={{ marginBottom: "1.25rem" }}>
        <div className="section-title">
          <div>
            <h2>By show</h2>
            <p className="section-title-sub" style={{ marginTop: 2 }}>Revenue per show this period</p>
          </div>
        </div>
        {data.byShow.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📅</div>No sales this period</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {data.byShow.slice(0, 10).map((row) => {
              const max = data.byShow[0]?.sales || 1;
              const pct = Math.round((row.sales / max) * 100);
              return (
                <div key={row.showId} style={{
                  padding: "0.75rem 0.875rem",
                  background: "var(--glass-bg-soft)",
                  border: "1px solid var(--glass-border-soft)",
                  borderRadius: 14,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.9375rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {row.location}
                        {row.startDate && ` · ${format(new Date(row.startDate), "MMM d")}`}
                        {` · ${row.count} sale${row.count !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                      <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{formatCurrency(row.sales)}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-secondary-dark)" }}>
                        +{formatCurrency(row.commission)}
                      </p>
                    </div>
                  </div>
                  <div style={{ height: 6, background: "var(--color-bg-dark)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: "linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
                      borderRadius: 999,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Top performers */}
      <GlassCard padding="lg" style={{ marginBottom: "1.25rem" }}>
        <div className="section-title">
          <div>
            <h2>Top performers</h2>
            <p className="section-title-sub" style={{ marginTop: 2 }}>Leading the team</p>
          </div>
        </div>
        {data.topPerformers.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🏆</div>No sales this period</div>
        ) : (
          <>
            <TopPerformersChart data={data.topPerformers.slice(0, 5)} />
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {data.topPerformers.slice(0, 5).map((p) => {
                const rankClass = p.rank === 1 ? "rank-1" : p.rank === 2 ? "rank-2" : p.rank === 3 ? "rank-3" : "";
                return (
                  <div key={p.userId} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "0.625rem 0.875rem",
                    background: "var(--glass-bg-soft)",
                    border: "1px solid var(--glass-border-soft)",
                    borderRadius: 14,
                  }}>
                    <div className={`avatar avatar-sm ${rankClass}`} style={{ flexShrink: 0 }}>
                      {p.rank}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.9375rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {p.count} sale{p.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{formatCurrency(p.sales)}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-secondary-dark)" }}>
                        +{formatCurrency(p.commission)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </GlassCard>
    </SiteShell>
  );
}
