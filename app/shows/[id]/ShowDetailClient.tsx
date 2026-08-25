"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  address: string | null;
  startDate: string;
  endDate: string;
  isOutdoor: boolean;
  status: string;
  notes: string | null;
  manager: { id: string; name: string } | null;
  assignments: Array<{ id: string; userId: string; user: { id: string; name: string; role: string } }>;
  salesCount: number;
  equipmentTaskCount: number;
};

type ByEmployee = {
  userId: string;
  name: string;
  role: string;
  sales: number;
  commission: number;
  count: number;
};

type Sale = {
  id: string;
  productLevel: string;
  productModel: string;
  productStyle: string;
  salePrice: number;
  commission: number;
  paymentType: string;
  userName: string;
  createdAt: string;
};

type Drawer = {
  id: string;
  openingFloat: number;
  totalCash: number;
  totalCard: number;
  openedBy: string;
  openedAt: string;
} | null;

type Props = {
  user: { id: string; name: string; role: "ADMIN" | "MANAGER" | "EMPLOYEE" };
  show: Show;
  totalStats: { totalSales: number; totalCommission: number; saleCount: number };
  byEmployee: ByEmployee[];
  recentSales: Sale[];
  activeDrawer: Drawer;
};

export default function ShowDetailClient({ user, show, totalStats, byEmployee, recentSales, activeDrawer }: Props) {
  const router = useRouter();
  const avgTicket = totalStats.saleCount > 0 ? totalStats.totalSales / totalStats.saleCount : 0;

  const openDrawer = async () => {
    const float = prompt("Enter opening float amount ($):", "200");
    if (float === null) return;
    const res = await fetch("/api/drawer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showId: show.id, action: "open", openingFloat: parseFloat(float) || 0 }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to open drawer");
    }
  };

  const setStatus = async (newStatus: string) => {
    const res = await fetch(`/api/shows/${show.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) router.refresh();
  };

  const statusBadgeCls = show.status === "ACTIVE" ? "badge-success" : show.status === "UPCOMING" ? "badge-primary" : show.status === "CANCELLED" ? "badge-danger" : "badge-secondary";
  const canDraw = (show.status === "ACTIVE" || show.status === "UPCOMING") && !activeDrawer;
  const canManageShow = user.role === "ADMIN" || user.role === "MANAGER";

  return (
    <ClientAuthShell pageTitle={show.name} pageSubtitle={show.location}>
      {/* Hero */}
      <GlassCard padding="lg" variant="strong" style={{ marginBottom: "1.25rem", background: "linear-gradient(135deg, rgba(45, 90, 61, 0.92) 0%, rgba(31, 63, 42, 0.95) 100%)", color: "white", border: "1px solid rgba(255, 255, 255, 0.10)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{show.name}</h1>
              <span className={`badge ${statusBadgeCls}`} style={{ background: "rgba(255, 255, 255, 0.20)", color: "white", borderColor: "rgba(255, 255, 255, 0.30)" }}>{show.status}</span>
              {show.isOutdoor && <span className="badge badge-warning">Outdoor</span>}
            </div>
            <p style={{ fontSize: "0.9375rem", opacity: 0.85, marginTop: 6 }}>{show.location}</p>
            <p style={{ fontSize: "0.8125rem", opacity: 0.7, marginTop: 2 }}>
              {format(new Date(show.startDate), "MMM d, yyyy")} — {format(new Date(show.endDate), "MMM d, yyyy")}
              {show.manager && ` · ${show.manager.name}`}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {activeDrawer ? (
              <>
                <div style={{ padding: "0.625rem 0.875rem", background: "rgba(45, 138, 78, 0.30)", borderRadius: 12, fontSize: "0.8125rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  💵 Drawer open · {formatCurrency(activeDrawer.totalCash + activeDrawer.totalCard)} collected
                </div>
                <button onClick={() => router.push(`/sale?showId=${show.id}`)} className="btn btn-primary" style={{ background: "linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-light) 100%)", color: "var(--color-primary-dark)" }}>
                  Open POS
                </button>
              </>
            ) : canDraw ? (
              <button onClick={openDrawer} className="btn btn-primary" style={{ background: "linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-light) 100%)", color: "var(--color-primary-dark)" }}>
                <Icon name="sale" size={18} />
                <span>Open cash drawer</span>
              </button>
            ) : null}
            {canManageShow && show.status === "UPCOMING" && (
              <button onClick={() => setStatus("ACTIVE")} className="btn btn-secondary" style={{ background: "rgba(255, 255, 255, 0.18)", color: "white", borderColor: "rgba(255, 255, 255, 0.20)" }}>
                Mark Active
              </button>
            )}
            {canManageShow && show.status === "ACTIVE" && (
              <button onClick={() => setStatus("COMPLETED")} className="btn btn-secondary" style={{ background: "rgba(255, 255, 255, 0.18)", color: "white", borderColor: "rgba(255, 255, 255, 0.20)" }}>
                Mark Completed
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* KPI row */}
      <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(2, 1fr)", marginBottom: "1.25rem" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <KpiTile label="Total sales" value={formatCurrency(totalStats.totalSales)} icon="trending-up" />
        </div>
        <KpiTile label="Commission" value={formatCurrency(totalStats.totalCommission)} icon="sparkle" accent="secondary" />
        <KpiTile label="Sale count" value={totalStats.saleCount.toString()} icon="package" />
        <KpiTile label="Avg ticket" value={formatCurrency(avgTicket)} icon="circle" />
        <KpiTile label="Team size" value={`${show.assignments.length}`} icon="users" />
      </div>

      {/* Team performance */}
      <GlassCard padding="lg" style={{ marginBottom: "1.25rem" }}>
        <div className="section-title">
          <div>
            <h2>Team performance</h2>
            <p className="section-title-sub">{byEmployee.length} contributor{byEmployee.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {byEmployee.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">👥</div><p>No sales at this show yet.</p></div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {byEmployee.map((emp) => {
              const maxSales = byEmployee[0]?.sales || 1;
              const pct = Math.round((emp.sales / maxSales) * 100);
              const rankClass = emp === byEmployee[0] ? "rank-1" : emp === byEmployee[1] ? "rank-2" : emp === byEmployee[2] ? "rank-3" : "";
              return (
                <div key={emp.userId} style={{
                  padding: "0.75rem 0.875rem",
                  background: "var(--glass-bg-soft)",
                  border: "1px solid var(--glass-border-soft)",
                  borderRadius: 14,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className={`avatar avatar-sm ${rankClass}`}>
                        {byEmployee.indexOf(emp) + 1}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{emp.name}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          {emp.count} sale{emp.count !== 1 ? "s" : ""}
                          {emp.role !== "EMPLOYEE" && ` · ${emp.role}`}
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
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Roster */}
      <GlassCard padding="lg" style={{ marginBottom: "1.25rem" }}>
        <div className="section-title">
          <div>
            <h2>Roster</h2>
            <p className="section-title-sub">{show.assignments.length} assigned</p>
          </div>
        </div>
        {show.assignments.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">👥</div><p>No one assigned to this show yet.</p></div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {show.assignments.map((a) => (
              <div key={a.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0.5rem 0.75rem",
                background: "var(--glass-bg-soft)",
                border: "1px solid var(--glass-border-soft)",
                borderRadius: 999,
              }}>
                <div className="avatar avatar-sm" style={{ width: 24, height: 24, fontSize: "0.6875rem" }}>
                  {a.user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{a.user.name}</span>
                <span className={`badge ${a.user.role === "ADMIN" ? "badge-primary" : a.user.role === "MANAGER" ? "badge-secondary" : ""}`} style={{ fontSize: "0.625rem", padding: "0.125rem 0.5rem" }}>{a.user.role}</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Recent sales */}
      <GlassCard padding="lg">
        <div className="section-title">
          <div>
            <h2>Recent sales</h2>
            <p className="section-title-sub">Last {Math.min(recentSales.length, 100)}</p>
          </div>
        </div>
        {recentSales.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">💎</div><p>No sales recorded yet.</p></div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {recentSales.slice(0, 50).map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.5rem 0.75rem", background: "var(--glass-bg-soft)", borderRadius: 10 }}>
                <div className="avatar avatar-sm avatar-gold" style={{ width: 28, height: 28, fontSize: "0.6875rem" }}>{s.productLevel.replace("LEVEL_", "")}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{s.userName}</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                    {s.productModel} · {s.productStyle} · {format(new Date(s.createdAt), "MMM d, h:mm a")}
                  </p>
                </div>
                <span className={`badge ${s.paymentType === "CASH" ? "badge-success" : "badge-primary"}`} style={{ fontSize: "0.625rem" }}>{s.paymentType}</span>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{formatCurrency(s.salePrice)}</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-secondary-dark)" }}>+{formatCurrency(s.commission)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </ClientAuthShell>
  );
}
