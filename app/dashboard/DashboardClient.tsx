"use client";

import Link from "next/link";
import { SiteShell } from "@/app/components/SiteShell";
import { GlassCard } from "@/app/components/GlassCard";
import { KpiTile } from "@/app/components/KpiTile";
import { Icon } from "@/app/components/Icon";
import { formatCurrency } from "@/lib/products";
import { formatDistanceToNow } from "date-fns";

type Props = {
  user: { id: string; name: string; role: "ADMIN" | "MANAGER" | "EMPLOYEE" };
  todaySales: { total: number; commission: number; count: number };
  lifetimeSales: { total: number; commission: number; count: number };
  activeShow: { id: string; name: string; location: string; manager?: { name: string } | null } | null;
  recentSales: Array<{
    id: string;
    productLevel: string;
    productModel: string;
    productStyle: string;
    salePrice: number;
    commission: number;
    showName: string;
    createdAt: string;
  }>;
};

export default function DashboardClient({ user, todaySales, lifetimeSales, activeShow, recentSales }: Props) {
  const roleLabel = user.role === "ADMIN" ? "Admin" : user.role === "MANAGER" ? "Manager" : "Employee";

  const quickActions = [
    { href: "/sale", label: "Record Sale", icon: "sale" as const, color: "var(--color-primary)" },
    { href: "/shows", label: "Shows", icon: "calendar" as const, color: "var(--color-secondary-dark)" },
    { href: "/leaderboard", label: "Leaderboard", icon: "trophy" as const, color: "var(--color-accent)" },
    { href: "/travel", label: "Travel", icon: "plane" as const, color: "#3B82F6" },
  ];

  return (
    <SiteShell user={{ name: user.name, role: user.role }} pageTitle="Dashboard">
      {/* Welcome hero */}
      <GlassCard padding="lg" variant="strong" style={{
        marginBottom: "1.25rem",
        background: "linear-gradient(135deg, rgba(45, 90, 61, 0.92) 0%, rgba(31, 63, 42, 0.95) 100%)",
        color: "white",
        border: "1px solid rgba(255, 255, 255, 0.10)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontSize: "0.8125rem", opacity: 0.7, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Welcome back
            </p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", marginTop: 4 }}>
              {user.name}
            </h1>
            <span className="badge" style={{ marginTop: 8, background: "rgba(255, 255, 255, 0.18)", color: "white", borderColor: "rgba(255, 255, 255, 0.20)" }}>
              {roleLabel}
            </span>
          </div>
          {activeShow ? (
            <Link href="/sale" className="btn btn-primary" style={{ background: "linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-light) 100%)", color: "var(--color-primary-dark)", boxShadow: "0 6px 20px rgba(201, 168, 76, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.30)" }}>
              <Icon name="sale" size={18} />
              <span>Open POS</span>
            </Link>
          ) : (
            <Link href="/shows" className="btn btn-secondary">
              <Icon name="calendar" size={18} />
              <span>View shows</span>
            </Link>
          )}
        </div>
      </GlassCard>

      {/* KPIs */}
      <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(2, 1fr)", marginBottom: "1.25rem" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <KpiTile label="Today's sales" value={formatCurrency(todaySales.total)} icon="trending-up" />
        </div>
        <KpiTile label="Commission today" value={formatCurrency(todaySales.commission)} icon="sparkle" accent="secondary" />
        <KpiTile label="Sales today" value={todaySales.count.toLocaleString()} icon="package" />
        <KpiTile label="Lifetime sales" value={formatCurrency(lifetimeSales.total)} icon="circle" />
        <KpiTile label="Lifetime commission" value={formatCurrency(lifetimeSales.commission)} icon="sparkle" accent="secondary" />
      </div>

      {/* Active show banner */}
      {activeShow ? (
        <GlassCard padding="md" style={{ marginBottom: "1.25rem", borderLeft: "4px solid var(--color-primary)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Active Show
              </p>
              <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, marginTop: 2 }}>{activeShow.name}</h2>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{activeShow.location}</p>
            </div>
            <Link href="/sale" className="btn btn-primary">
              <Icon name="chevron-right" size={18} />
              <span>Record sale</span>
            </Link>
          </div>
        </GlassCard>
      ) : (
        <GlassCard padding="md" style={{ marginBottom: "1.25rem", borderLeft: "4px solid var(--color-warning)" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            No active show assigned. Open a cash drawer from the shows page to start recording sales.
          </p>
          <Link href="/shows" className="btn btn-ghost" style={{ padding: "0.5rem 0", marginTop: 4 }}>
            View shows
            <Icon name="chevron-right" size={16} />
          </Link>
        </GlassCard>
      )}

      {/* Quick actions */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div className="section-title"><h2>Quick actions</h2></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href} style={{ textDecoration: "none" }}>
              <GlassCard interactive padding="md" style={{ textAlign: "center" }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${a.color} 0%, ${a.color}cc 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  margin: "0 auto 0.5rem",
                  boxShadow: `0 4px 12px ${a.color}40`,
                }}>
                  <Icon name={a.icon} size={22} />
                </div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>{a.label}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>

      {/* Admin / Manager extras */}
      {(user.role === "ADMIN" || user.role === "MANAGER") && (
        <div style={{ marginBottom: "1.25rem" }}>
          <div className="section-title"><h2>{user.role === "ADMIN" ? "Admin" : "Manager"}</h2></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
            <Link href="/analytics" style={{ textDecoration: "none" }}>
              <GlassCard interactive padding="md" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="analytics" size={18} />
                </div>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>Analytics</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Full dashboard</p>
                </div>
              </GlassCard>
            </Link>
            {user.role === "ADMIN" && (
              <>
                <Link href="/admin/shows" style={{ textDecoration: "none" }}>
                  <GlassCard interactive padding="md" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-light) 100%)", color: "var(--color-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="calendar" size={18} />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>Manage shows</p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Create & assign</p>
                    </div>
                  </GlassCard>
                </Link>
                <Link href="/admin/users" style={{ textDecoration: "none" }}>
                  <GlassCard interactive padding="md" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, var(--color-accent) 0%, #D88560 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="users" size={18} />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>Users</p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Team management</p>
                    </div>
                  </GlassCard>
                </Link>
                <Link href="/admin/inventory" style={{ textDecoration: "none" }}>
                  <GlassCard interactive padding="md" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="package" size={18} />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>Inventory</p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Stock levels</p>
                    </div>
                  </GlassCard>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recent sales */}
      <div>
        <div className="section-title">
          <h2>Recent sales</h2>
          <Link href="/leaderboard" className="section-title-sub" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            View leaderboard →
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <GlassCard padding="lg">
            <div className="empty-state">
              <div className="empty-state-icon">💎</div>
              <p>No sales recorded yet. Head to the POS to get started.</p>
              <Link href="/sale" className="btn btn-primary" style={{ marginTop: 12 }}>
                Open POS
              </Link>
            </div>
          </GlassCard>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {recentSales.map((sale) => (
              <GlassCard key={sale.id} padding="sm">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="avatar avatar-sm avatar-gold">
                    {sale.productLevel.replace("LEVEL_", "")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {sale.productModel} · {sale.productStyle}
                    </p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                      {sale.showName} · {formatDistanceToNow(new Date(sale.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{formatCurrency(sale.salePrice)}</p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--color-secondary-dark)", fontWeight: 600 }}>
                      +{formatCurrency(sale.commission)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
