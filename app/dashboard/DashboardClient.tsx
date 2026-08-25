"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteShell } from "@/app/components/SiteShell";
import { GlassCard } from "@/app/components/GlassCard";
import { KpiTile } from "@/app/components/KpiTile";
import { Icon } from "@/app/components/Icon";
import { formatCurrency } from "@/lib/products";
import { format, formatDistanceToNow } from "date-fns";

// ─── Types ──────────────────────────────────────────────────────────────────
type User = { id: string; name: string; role: "ADMIN" | "MANAGER" | "EMPLOYEE" };
type Show = {
  id: string; name: string; location: string;
  startDate: string; endDate: string;
  manager?: { name: string } | null;
  _count?: { sales: number; assignments: number };
};
type InventoryItem = {
  id: string; productLevel: string; productModel: string; productStyle: string;
  quantity: number; lowStockThreshold: number; status: string;
  manager?: { name: string } | null;
};
type RecentSale = {
  id: string; productLevel: string; productModel: string; productStyle: string;
  salePrice: number; commission: number; showName: string; sellerName: string; createdAt: string;
};
type ClockIn = { id: string; clockIn: string; user: { id: string; name: string }; show: { name: string } | null };

type Props = {
  user: User;
  city: string | null;
  homeAirport: string | null;
  todaySales: { total: number; commission: number; count: number };
  lifetimeSales: { total: number; commission: number; count: number };
  activeShows: Show[];
  activeShow: Show | null;
  upcomingShows: Show[];
  lowInventory: InventoryItem[];
  pendingShipping: number;
  pendingRefunds: number;
  teamSize: number;
  activeClockIns: ClockIn[];
  unsyncedSales: number;
  hourlyBuckets: number[];
  recentSales: RecentSale[];
};

// ─── Animation helpers ────────────────────────────────────────────────────────
const fadeIn = (delay: number = 0) => ({
  animation: `zora-fade-in 0.5s ease-out ${delay}ms both`,
});
const slideUp = (delay: number = 0) => ({
  animation: `zora-slide-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`,
});

export default function DashboardClient(props: Props) {
  const { user, todaySales, lifetimeSales, activeShow, recentSales, activeShows, upcomingShows, lowInventory, pendingShipping, pendingRefunds, teamSize, activeClockIns, unsyncedSales, hourlyBuckets, city, homeAirport } = props;

  const roleLabel = user.role === "ADMIN" ? "Admin" : user.role === "MANAGER" ? "Manager" : "Team";
  const isAdmin = user.role === "ADMIN";
  const isManager = user.role === "MANAGER" || isAdmin;
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return "Working late";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  // Inject custom keyframes once
  useEffect(() => {
    if (document.getElementById("dashboard-keyframes")) return;
    const style = document.createElement("style");
    style.id = "dashboard-keyframes";
    style.textContent = `
      @keyframes zora-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes zora-slide-up {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes zora-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.05); }
      }
      @keyframes zora-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes zora-orbit {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Live-updating current time (every minute)
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  const maxHour = Math.max(1, ...hourlyBuckets);
  const maxActive = activeClockIns.length;

  return (
    <SiteShell user={{ name: user.name, role: user.role }} pageTitle="Dashboard">
      {/* ─── Hero: animated greeting + live stats ─── */}
      <div style={{
        position: "relative",
        marginBottom: "1.5rem",
        padding: "20px 22px 22px",
        borderRadius: 24,
        background: isAdmin
          ? "linear-gradient(135deg, rgba(45, 90, 61, 0.95) 0%, rgba(28, 60, 80, 0.95) 50%, rgba(45, 90, 61, 0.95) 100%)"
          : "linear-gradient(135deg, rgba(45, 90, 61, 0.92) 0%, rgba(31, 63, 42, 0.95) 100%)",
        color: "white",
        overflow: "hidden",
        ...slideUp(0),
      }}>
        {/* Animated background blobs */}
        <div aria-hidden style={{
          position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201, 168, 76, 0.30) 0%, rgba(201, 168, 76, 0) 70%)",
          animation: "zora-orbit 24s linear infinite",
          pointerEvents: "none",
        }} />
        <div aria-hidden style={{
          position: "absolute", bottom: -80, left: -40, width: 240, height: 240, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45, 138, 78, 0.25) 0%, rgba(45, 138, 78, 0) 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <p style={{ fontSize: "0.875rem", opacity: 0.7, fontWeight: 500, letterSpacing: "0.02em" }}>
                {greeting} · {format(now, "EEEE, MMMM d")}
              </p>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginTop: 6, lineHeight: 1.1 }}>
                {user.name.split(" ")[0]}, {roleLabel.toLowerCase()}
              </h1>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.6875rem", padding: "0.25rem 0.625rem", borderRadius: 999, background: "rgba(255,255,255,0.18)", fontWeight: 700, letterSpacing: "0.04em" }}>
                  {roleLabel.toUpperCase()}
                </span>
                {city && (
                  <span style={{ fontSize: "0.6875rem", padding: "0.25rem 0.625rem", borderRadius: 999, background: "rgba(255,255,255,0.12)", fontWeight: 600 }}>
                    📍 {city}{homeAirport ? ` · ${homeAirport}` : ""}
                  </span>
                )}
                {activeClockIns.some((c) => c.user.id === user.id) && (
                  <span style={{ fontSize: "0.6875rem", padding: "0.25rem 0.625rem", borderRadius: 999, background: "rgba(45, 200, 100, 0.25)", fontWeight: 700, animation: "zora-pulse 2.5s ease-in-out infinite" }}>
                    ⏰ Clocked in
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {activeShow ? (
                <Link href="/sale" className="btn btn-primary" style={{
                  background: "linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-light) 100%)",
                  color: "var(--color-primary-dark)",
                  boxShadow: "0 6px 24px rgba(201, 168, 76, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.30)",
                  minHeight: 48, padding: "0.75rem 1.25rem", fontSize: "0.9375rem", fontWeight: 700,
                }}>
                  <Icon name="sale" size={18} /><span>Open POS</span>
                </Link>
              ) : (
                <Link href="/shows" className="btn btn-secondary" style={{ minHeight: 48, padding: "0.75rem 1.25rem", background: "rgba(255,255,255,0.20)", color: "white", borderColor: "rgba(255,255,255,0.30)" }}>
                  <Icon name="calendar" size={18} /><span>Open a show</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Live KPI strip (4-up, animated) ─── */}
      <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(2, 1fr)", marginBottom: "1.5rem" }}>
        <div style={{ ...slideUp(80) }}>
          <KpiTile label="Today" value={formatCurrency(todaySales.total)} icon="trending-up" />
        </div>
        <div style={{ ...slideUp(120) }}>
          <KpiTile label="Today count" value={todaySales.count.toLocaleString()} icon="package" />
        </div>
        <div style={{ ...slideUp(160) }}>
          <KpiTile label="Commission today" value={formatCurrency(todaySales.commission)} icon="sparkle" accent="secondary" />
        </div>
        <div style={{ ...slideUp(200) }}>
          <KpiTile label="All time" value={formatCurrency(lifetimeSales.total)} icon="circle" />
        </div>
      </div>

      {/* ─── Quick-access: 2x4 grid of iMac-style tiles ─── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <SectionTitle title="Quick access" subtitle="One tap to where you need to be" />
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(4, 1fr)" }} className="qa-grid">
          <QuickTile href="/sale" icon="sale" label="Record Sale" gradient="linear-gradient(135deg, #2D8A4E 0%, #1F5F36 100%)" delay={240} />
          <QuickTile href="/shows" icon="calendar" label="Shows" gradient="linear-gradient(135deg, #C9A84C 0%, #A8862E 100%)" delay={280} />
          <QuickTile href="/customers" icon="users" label="Customers" gradient="linear-gradient(135deg, #3B82F6 0%, #1E5BB8 100%)" delay={320} />
          <QuickTile href="/travel" icon="plane" label="Travel" gradient="linear-gradient(135deg, #8B5CF6 0%, #5E3DA8 100%)" delay={360} />
        </div>
      </div>

      {/* ─── Admin / Manager control panel ─── */}
      {isManager && (
        <div style={{ marginBottom: "1.5rem" }}>
          <SectionTitle
            title={isAdmin ? "Admin control center" : "Team hub"}
            subtitle={isAdmin ? "Org-wide signals at a glance" : "Your team's status today"}
          />
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(3, 1fr)" }} className="admin-grid">
            <ControlCard
              href="/admin/shipping"
              icon="plane"
              label="Active shipments"
              value={pendingShipping}
              suffix="in flight"
              color="#8B5CF6"
              delay={400}
            />
            <ControlCard
              href="/admin/inventory"
              icon="package"
              label="Low stock items"
              value={lowInventory.length}
              suffix={lowInventory.length > 0 ? "need restock" : "all healthy"}
              color={lowInventory.length > 0 ? "#DC2626" : "#2D8A4E"}
              delay={440}
            />
            <ControlCard
              href="/admin/sales"
              icon="sale"
              label="Refunds this week"
              value={pendingRefunds}
              suffix="to review"
              color={pendingRefunds > 0 ? "#C9A84C" : "#2D8A4E"}
              delay={480}
            />
            <ControlCard
              href="/admin/users"
              icon="users"
              label="Active team"
              value={teamSize}
              suffix={teamSize === 1 ? "member" : "members"}
              color="#3B82F6"
              delay={520}
            />
            <ControlCard
              href="/admin/shows"
              icon="calendar"
              label="Active shows"
              value={activeShows.length}
              suffix="live now"
              color="#2D8A4E"
              delay={560}
            />
            <ControlCard
              href="/admin/drawers"
              icon="package"
              label="Unsynced offline sales"
              value={unsyncedSales}
              suffix={unsyncedSales > 0 ? "need sync" : "all synced"}
              color={unsyncedSales > 0 ? "#DC2626" : "#2D8A4E"}
              delay={600}
            />
          </div>
        </div>
      )}

      {/* ─── Two-column: Active shows (left) + Live signals (right) ─── */}
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr", marginBottom: "1.5rem" }} className="two-col">
        {/* Active shows */}
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: isManager ? "1.4fr 1fr" : "1fr" }} className="two-col-inner">
          <GlassCard padding="md" style={{ ...slideUp(640) }}>
            <SectionTitle title="Active shows" subtitle={`${activeShows.length} live now`} />
            {activeShows.length === 0 ? (
              <EmptyState icon="calendar" message="No active shows right now" />
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {activeShows.map((s, i) => (
                  <ShowCard key={s.id} show={s} delay={680 + i * 60} />
                ))}
              </div>
            )}
            <Link href="/admin/shows" className="btn btn-ghost" style={{ width: "100%", marginTop: 12, justifyContent: "center" }}>
              <Icon name="circle" size={14} /><span>Manage all shows</span>
            </Link>
          </GlassCard>

          {/* Live signals */}
          {isManager && (
            <GlassCard padding="md" style={{ ...slideUp(700) }}>
              <SectionTitle title="Live signals" subtitle="Real-time team activity" />
              {/* Clock-ins */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  ⏰ Clocked in ({activeClockIns.length})
                </p>
                {activeClockIns.length === 0 ? (
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>No one is clocked in</p>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    {activeClockIns.slice(0, 4).map((c) => (
                      <div key={c.id} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "0.5rem 0.625rem",
                        background: "rgba(45, 200, 100, 0.08)",
                        border: "1px solid rgba(45, 200, 100, 0.18)",
                        borderRadius: 8,
                      }}>
                        <span className="status-dot status-success" style={{ width: 8, height: 8 }} />
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, flex: 1 }}>{c.user.name}</span>
                        {c.show && <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{c.show.name}</span>}
                        <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                          {formatDistanceToNow(new Date(c.clockIn), { addSuffix: false })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Today's hourly sparkline */}
              <div>
                <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  📈 Today's sales by hour
                </p>
                <HourlySparkline buckets={hourlyBuckets} max={maxHour} />
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* ─── Admin: low inventory + recent sales ─── */}
      {isManager && lowInventory.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <GlassCard padding="md" style={{ ...slideUp(820) }}>
            <SectionTitle
              title="Low stock alerts"
              subtitle={`${lowInventory.length} item${lowInventory.length === 1 ? "" : "s"} need restock`}
              action={<Link href="/admin/inventory" className="btn btn-ghost">View all</Link>}
            />
            <div style={{ display: "grid", gap: 6 }}>
              {lowInventory.map((item, i) => (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "0.625rem 0.75rem",
                  background: item.status === "OUT" ? "rgba(220, 38, 38, 0.06)" : "rgba(201, 168, 76, 0.06)",
                  border: `1px solid ${item.status === "OUT" ? "rgba(220, 38, 38, 0.18)" : "rgba(201, 168, 76, 0.18)"}`,
                  borderRadius: 10,
                  ...slideUp(860 + i * 50),
                }}>
                  <span style={{
                    fontSize: "0.625rem", fontWeight: 700,
                    padding: "0.125rem 0.5rem",
                    borderRadius: 999,
                    background: item.status === "OUT" ? "rgba(220, 38, 38, 0.18)" : "rgba(201, 168, 76, 0.18)",
                    color: item.status === "OUT" ? "#DC2626" : "#A8862E",
                    letterSpacing: "0.04em",
                  }}>
                    {item.status}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{item.productLevel.replace("LEVEL_", "")} · {item.productModel} · {item.productStyle}</p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{item.manager?.name || "—"}</p>
                  </div>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 800, color: item.status === "OUT" ? "#DC2626" : "var(--color-secondary-dark)" }}>{item.quantity}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* ─── Upcoming shows (admin) ─── */}
      {isManager && upcomingShows.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <GlassCard padding="md" style={{ ...slideUp(900) }}>
            <SectionTitle title="Coming up" subtitle="Next 4 shows" />
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {upcomingShows.map((s, i) => (
                <Link key={s.id} href={`/admin/shows`} style={{ textDecoration: "none", color: "inherit" }}>
                  <GlassCard padding="md" style={{ ...slideUp(940 + i * 60), height: "100%" }}>
                    <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {format(new Date(s.startDate), "EEE MMM d")}
                    </p>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 700, marginTop: 4, lineHeight: 1.2 }}>{s.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{s.location}</p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: 6 }}>{s.manager?.name || "—"}</p>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* ─── Recent activity feed ─── */}
      <GlassCard padding="md" style={{ ...slideUp(1080) }}>
        <SectionTitle
          title="Recent activity"
          subtitle={`${recentSales.length} most recent`}
          action={<Link href="/admin/sales" className="section-title-sub" style={{ color: "var(--color-primary)", fontWeight: 600 }}>View all →</Link>}
        />
        {recentSales.length === 0 ? (
          <EmptyState icon="sale" message="No sales recorded yet" cta={{ href: "/sale", label: "Open POS" }} />
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {recentSales.map((s, i) => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "0.625rem 0.75rem",
                background: "var(--glass-bg-soft)",
                borderRadius: 10,
                ...slideUp(1120 + i * 40),
              }}>
                <div className="avatar avatar-sm avatar-gold">{s.productLevel.replace("LEVEL_", "")}X</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.productModel} · {s.productStyle}
                  </p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                    {s.sellerName} · {s.showName} · {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{formatCurrency(s.salePrice)}</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-secondary-dark)", fontWeight: 600 }}>+{formatCurrency(s.commission)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </SiteShell>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
      <div>
        <h2 style={{ fontSize: "1.0625rem", fontWeight: 800, letterSpacing: "-0.01em", margin: 0 }}>{title}</h2>
        {subtitle && <p className="section-title-sub" style={{ marginTop: 2 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function QuickTile({ href, icon, label, gradient, delay = 0 }: { href: string; icon: any; label: string; gradient: string; delay?: number }) {
  const [hover, setHover] = useState(false);
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position: "relative",
          padding: "16px 8px",
          borderRadius: 18,
          background: "var(--glass-bg)",
          backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
          WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
          border: "1px solid var(--glass-border)",
          textAlign: "center",
          cursor: "pointer",
          transform: hover ? "translateY(-4px) scale(1.03)" : "translateY(0) scale(1)",
          transition: "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s",
          boxShadow: hover ? "0 16px 32px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.08)" : "0 4px 12px rgba(0,0,0,0.06)",
          ...slideUp(delay),
        }}
      >
        <div style={{
          width: 48, height: 48,
          margin: "0 auto 10px",
          borderRadius: 14,
          background: gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white",
          boxShadow: hover ? "0 6px 18px rgba(0,0,0,0.25)" : "0 4px 12px rgba(0,0,0,0.15)",
          transition: "box-shadow 0.22s",
        }}>
          <Icon name={icon} size={22} />
        </div>
        <p style={{ fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "-0.01em" }}>{label}</p>
      </div>
    </Link>
  );
}

function ControlCard({ href, icon, label, value, suffix, color, delay = 0 }: { href: string; icon: any; label: string; value: number | string; suffix: string; color: string; delay?: number }) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <GlassCard padding="md" interactive style={{ ...slideUp(delay) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: 12,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            color: color,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon name={icon} size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
            <p style={{ fontSize: "1.375rem", fontWeight: 800, lineHeight: 1.1, marginTop: 2 }}>
              {value}
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-muted)", marginLeft: 4 }}>{suffix}</span>
            </p>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

function ShowCard({ show, delay = 0 }: { show: Show; delay?: number }) {
  const [hover, setHover] = useState(false);
  const start = new Date(show.startDate);
  return (
    <Link href={`/shows/${show.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "0.75rem 0.875rem",
          background: hover ? "var(--color-primary)" : "var(--glass-bg-soft)",
          color: hover ? "white" : "var(--color-text)",
          borderRadius: 12,
          border: `1px solid ${hover ? "var(--color-primary)" : "var(--glass-border-soft)"}`,
          transform: hover ? "translateX(4px)" : "translateX(0)",
          transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          ...slideUp(delay),
        }}
      >
        <div style={{
          width: 8, height: 8, borderRadius: 999,
          background: hover ? "white" : "#2D8A4E",
          animation: "zora-pulse 2s ease-in-out infinite",
          flexShrink: 0,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{show.name}</p>
          <p style={{ fontSize: "0.75rem", opacity: hover ? 0.85 : 0.65 }}>
            {show.location} · {format(start, "MMM d")}
            {show._count ? ` · ${show._count.sales} sales` : ""}
          </p>
        </div>
        <span style={{ opacity: 0.5 }}><Icon name="circle" size={14} /></span>
      </div>
    </Link>
  );
}

function HourlySparkline({ buckets, max }: { buckets: number[]; max: number }) {
  const W = 320, H = 80;
  const barW = (W - 4) / 24 - 1;
  const currentHour = new Date().getHours();
  return (
    <div style={{ display: "flex", alignItems: "flex-end", height: 80, gap: 1, padding: "0 4px" }}>
      {buckets.map((v, i) => {
        const h = Math.max(2, (v / max) * H);
        const isPast = i <= currentHour;
        const isCurrent = i === currentHour;
        return (
          <div
            key={i}
            title={`${i}:00 — ${formatCurrency(v)}`}
            style={{
              width: barW,
              height: h,
              borderRadius: 2,
              background: isCurrent
                ? "linear-gradient(180deg, #C9A84C 0%, #A8862E 100%)"
                : isPast
                  ? "linear-gradient(180deg, rgba(45, 138, 78, 0.85) 0%, rgba(45, 138, 78, 0.5) 100%)"
                  : "rgba(255,255,255,0.08)",
              transition: "all 0.3s",
              boxShadow: isCurrent ? "0 0 8px rgba(201, 168, 76, 0.5)" : "none",
            }}
          />
        );
      })}
    </div>
  );
}

function EmptyState({ icon, message, cta }: { icon: any; message: string; cta?: { href: string; label: string } }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><Icon name={icon} size={28} /></div>
      <p>{message}</p>
      {cta && (
        <Link href={cta.href} className="btn btn-primary" style={{ marginTop: 12 }}>
          <Icon name="circle" size={14} /><span>{cta.label}</span>
        </Link>
      )}
    </div>
  );
}
