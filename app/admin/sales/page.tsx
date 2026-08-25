"use client";

import { useState, useEffect, useMemo } from "react";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { formatCurrency } from "@/lib/products";
import { format } from "date-fns";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "all", label: "All" },
];

type Sale = {
  id: string;
  productLevel: string;
  productModel: string;
  productStyle: string;
  salePrice: number;
  commission: number;
  paymentType: string;
  createdAt: string;
  user: { id: string; name: string };
  show: { id: string; name: string };
};

type Totals = { totalSales: number; totalCommission: number; count: number };

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [totals, setTotals] = useState<Totals>({ totalSales: 0, totalCommission: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");
  const [showId, setShowId] = useState("");
  const [userId, setUserId] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [shows, setShows] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/shows").then((r) => r.json()).then(setShows);
    fetch("/api/users").then((r) => r.json()).then(setUsers);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ range, limit: "200" });
    if (showId) params.set("showId", showId);
    if (userId) params.set("userId", userId);
    if (paymentType) params.set("paymentType", paymentType);
    fetch(`/api/sales?${params}`).then((r) => r.json()).then((d) => {
      setSales(d.sales || []);
      setTotals(d.totals || { totalSales: 0, totalCommission: 0, count: 0 });
      setLoading(false);
    });
  }, [range, showId, userId, paymentType]);

  const avgTicket = totals.count > 0 ? totals.totalSales / totals.count : 0;

  const exportCSV = () => {
    const header = "Date,Employee,Show,Level,Model,Style,Amount,Commission,Payment\n";
    const rows = sales.map((s) => `${s.createdAt},${s.user.name},${s.show.name},${s.productLevel},${s.productModel},${s.productStyle},${s.salePrice},${s.commission},${s.paymentType}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hw888-sales-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ClientAuthShell requireAdmin pageTitle="Sales" pageSubtitle="All transactions">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Sales</h1>
          <p className="section-title-sub" style={{ marginTop: 4 }}>{totals.count} transaction{totals.count !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={exportCSV} className="btn btn-secondary" disabled={sales.length === 0}>
          <Icon name="search" size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Totals row — pinned to top for visibility */}
      <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(2, 1fr)", marginBottom: "1.25rem" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <KpiRow label="Total sales" value={formatCurrency(totals.totalSales)} icon="trending-up" />
        </div>
        <KpiRow label="Total commission" value={formatCurrency(totals.totalCommission)} icon="sparkle" />
        <KpiRow label="Transaction count" value={totals.count.toString()} icon="package" />
        <KpiRow label="Avg ticket" value={formatCurrency(avgTicket)} icon="circle" />
      </div>

      {/* Filters */}
      <GlassCard padding="md" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr" }} className="form-grid-2">
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
          <div>
            <label className="label">Show</label>
            <select value={showId} onChange={(e) => setShowId(e.target.value)} className="input">
              <option value="">All shows</option>
              {shows.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Employee</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className="input">
              <option value="">All employees</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Payment</label>
            <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className="input">
              <option value="">All</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard padding="none" style={{ overflow: "hidden" }}>
        <div className="table-shell">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Show</th>
                <th>Product</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th style={{ textAlign: "right" }}>Commission</th>
                <th>Pay</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>Loading…</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>No sales match these filters.</td></tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id}>
                    <td style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {format(new Date(s.createdAt), "MMM d, h:mm a")}
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.user.name}</td>
                    <td style={{ color: "var(--color-text-muted)" }}>{s.show.name}</td>
                    <td>
                      <div style={{ fontSize: "0.75rem" }}>
                        <span className="badge badge-primary" style={{ marginRight: 6 }}>{s.productLevel.replace("LEVEL_", "")}</span>
                        {s.productModel}
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: 2 }}>{s.productStyle}</div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{formatCurrency(s.salePrice)}</td>
                    <td style={{ textAlign: "right", color: "var(--color-secondary-dark)", fontWeight: 600 }}>+{formatCurrency(s.commission)}</td>
                    <td>
                      <span className={`badge ${s.paymentType === "CASH" ? "badge-success" : "badge-primary"}`}>{s.paymentType}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {sales.length > 0 && (
              <tfoot className="tbl-tfoot">
                <tr>
                  <td colSpan={4} style={{ paddingLeft: "0.875rem" }}>
                    TOTALS · {totals.count} sale{totals.count !== 1 ? "s" : ""}
                  </td>
                  <td style={{ textAlign: "right", paddingRight: "0.875rem" }}>{formatCurrency(totals.totalSales)}</td>
                  <td style={{ textAlign: "right", paddingRight: "0.875rem", color: "var(--color-secondary-dark)" }}>+{formatCurrency(totals.totalCommission)}</td>
                  <td style={{ textAlign: "right", paddingRight: "0.875rem" }}>{formatCurrency(avgTicket)} avg</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </GlassCard>
    </ClientAuthShell>
  );
}

function KpiRow({ label, value, icon }: { label: string; value: string; icon: React.ComponentProps<typeof Icon>["name"] }) {
  return (
    <div className="kpi">
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)", opacity: 0.7 }} />
      <div className="flex items-start justify-between mb-2" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <p className="kpi-label">{label}</p>
        <div style={{ color: "var(--color-primary)", opacity: 0.55 }}><Icon name={icon} size={16} /></div>
      </div>
      <p className="kpi-value">{value}</p>
    </div>
  );
}
