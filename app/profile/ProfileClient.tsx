"use client";

import { useEffect, useState } from "react";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { KpiTile } from "@/app/components/KpiTile";
import { Icon } from "@/app/components/Icon";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { formatCurrency } from "@/lib/products";
import { format, formatDistanceToNow } from "date-fns";

type Props = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "MANAGER" | "EMPLOYEE";
    manager: { id: string; name: string; email: string } | null;
    employees: Array<{ id: string; name: string; email: string; role: string }>;
    city?: string | null;
    homeAirportCode?: string | null;
  };
  airports: Array<{ code: string; name: string; city: string; state: string }>;
  states: Array<{ code: string; name: string }>;
  recentSales: Array<{
    id: string;
    productLevel: string;
    productModel: string;
    productStyle: string;
    salePrice: number;
    commission: number;
    commissionRateSnapshot: number;
    paymentType: string;
    showName: string;
    createdAt: string;
  }>;
  attendedShows: Array<{
    id: string;
    name: string;
    location: string;
    startDate: string;
    endDate: string;
    status: string;
    asManager: boolean;
  }>;
};

type Breakdown = {
  personalSales: number;
  personalCommission: number;
  managerBonus: number;
  teamSales: number;
  showBonuses: Array<{ showId: string; showName: string; teamTotal: number; bonus: number; bonusRate: number }>;
  total: number;
  baseRate: number;
  managerBonusRate: number;
  salesCount: number;
};

export default function ProfileClient({ user, airports, states, recentSales, attendedShows }: Props) {
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(user.city || "");
  const [homeAirportCode, setHomeAirportCode] = useState(user.homeAirportCode || "");
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);
  const [emailDigest, setEmailDigest] = useState(true);
  const [savingEmailDigest, setSavingEmailDigest] = useState(false);
  const [emailDigestSaved, setEmailDigestSaved] = useState(false);

  useEffect(() => {
    fetch("/api/commission/me").then((r) => r.json()).then((d) => { setBreakdown(d); setLoading(false); }).catch(() => setLoading(false));
    fetch(`/api/users/${user.id}`).then((r) => r.json()).then((u) => { if (typeof u.emailDigest === "boolean") setEmailDigest(u.emailDigest); }).catch(() => {});
  }, []);

  const saveLocation = async () => {
    setSavingLocation(true);
    setLocationSaved(false);
    try {
      await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city.trim() || null, homeAirportCode: homeAirportCode.trim() || null }),
      });
      setLocationSaved(true);
      setTimeout(() => setLocationSaved(false), 3000);
    } finally {
      setSavingLocation(false);
    }
  };

  const saveEmailDigest = async () => {
    setSavingEmailDigest(true);
    setEmailDigestSaved(false);
    try {
      await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailDigest }),
      });
      setEmailDigestSaved(true);
      setTimeout(() => setEmailDigestSaved(false), 3000);
    } finally {
      setSavingEmailDigest(false);
    }
  };

  const initials = user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const isManager = user.role === "MANAGER" || user.role === "ADMIN";

  return (
    <ClientAuthShell pageTitle="Profile" pageSubtitle="Your stats & settings">
      {/* Profile hero */}
      <GlassCard padding="lg" variant="strong" style={{ marginBottom: "1.25rem", background: "linear-gradient(135deg, rgba(45, 90, 61, 0.92) 0%, rgba(31, 63, 42, 0.95) 100%)", color: "white", border: "1px solid rgba(255, 255, 255, 0.10)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="avatar avatar-lg" style={{ background: "linear-gradient(135deg, var(--color-secondary) 0%, #F0D584 100%)", color: "var(--color-primary-dark)" }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{user.name}</h1>
            <p style={{ fontSize: "0.875rem", opacity: 0.75 }}>{user.email}</p>
            <span className="badge" style={{ marginTop: 8, background: "rgba(255, 255, 255, 0.18)", color: "white", borderColor: "rgba(255, 255, 255, 0.20)" }}>{user.role}</span>
          </div>
        </div>
      </GlassCard>

      {/* Theme picker */}
      <GlassCard padding="md" style={{ marginBottom: "1.25rem" }}>
        <div className="section-title">
          <div>
            <h2>Appearance</h2>
            <p className="section-title-sub">Light or dark — your call</p>
          </div>
        </div>
        <ThemeToggle />
      </GlassCard>

      {/* Location */}
      <GlassCard padding="md" style={{ marginBottom: "1.25rem" }}>
        <div className="section-title">
          <div>
            <h2>Location</h2>
            <p className="section-title-sub">Where you live — used for flight search</p>
          </div>
        </div>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }} className="form-grid-2">
          <div>
            <label className="label">City</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Orlando"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Home airport (IATA code)</label>
            <select
              className="input"
              value={homeAirportCode}
              onChange={(e) => setHomeAirportCode(e.target.value)}
            >
              <option value="">— Pick your airport —</option>
              {airports.map((a) => (
                <option key={a.code} value={a.code}>{a.city} ({a.code}) · {a.state}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
          {locationSaved && <span style={{ fontSize: "0.75rem", color: "var(--color-success)", fontWeight: 600 }}>✓ Saved</span>}
          <button onClick={saveLocation} disabled={savingLocation} className="btn btn-primary">
            {savingLocation ? "Saving…" : "Save location"}
          </button>
        </div>
      </GlassCard>

      {/* Email preferences */}
      <GlassCard padding="md" style={{ marginBottom: "1.25rem" }}>
        <div className="section-title">
          <div>
            <h2>Email preferences</h2>
            <p className="section-title-sub">Daily digest goes out at 9pm ET</p>
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={emailDigest}
            onChange={(e) => setEmailDigest(e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
          <span style={{ fontSize: "0.9375rem" }}>Receive daily sales digest</span>
        </label>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
          {emailDigestSaved && <span style={{ fontSize: "0.75rem", color: "var(--color-success)", fontWeight: 600 }}>✓ Saved</span>}
          <button onClick={saveEmailDigest} disabled={savingEmailDigest} className="btn btn-secondary">
            {savingEmailDigest ? "Saving…" : "Save"}
          </button>
        </div>
      </GlassCard>

      {/* Commission card */}
      {loading ? (
        <GlassCard padding="lg" style={{ marginBottom: "1.25rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)" }}>Calculating commission…</p>
        </GlassCard>
      ) : breakdown ? (
        <>
          <GlassCard padding="lg" variant="strong" style={{ marginBottom: "1.25rem", textAlign: "center", background: "linear-gradient(135deg, rgba(201, 168, 76, 0.25) 0%, rgba(201, 168, 76, 0.08) 100%)", borderColor: "rgba(201, 168, 76, 0.35)" }}>
            <p className="section-title-sub" style={{ fontWeight: 700, letterSpacing: "0.05em" }}>Total commission earned (pre-tax)</p>
            <p style={{ fontSize: "3rem", fontWeight: 800, background: "linear-gradient(135deg, var(--color-secondary-dark) 0%, var(--color-secondary) 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em", marginTop: 4 }}>
              {formatCurrency(breakdown.total)}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 4 }}>
              Base {Math.round(breakdown.baseRate * 100)}%{isManager && breakdown.managerBonusRate > 0 && ` · Manager bonus ${Math.round(breakdown.managerBonusRate * 100)}% of team total`}
            </p>
          </GlassCard>

          {/* Breakdown */}
          <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "1fr 1fr", marginBottom: "1.25rem" }}>
            <KpiTile label="Personal sales" value={formatCurrency(breakdown.personalSales)} icon="sale" accent="primary" />
            <KpiTile label="Personal commission" value={formatCurrency(breakdown.personalCommission)} icon="sparkle" accent="secondary" />
            <KpiTile label="Sales count" value={breakdown.salesCount.toString()} icon="package" />
            {isManager ? (
              <KpiTile label="Manager bonus" value={formatCurrency(breakdown.managerBonus)} icon="trending-up" accent="accent" />
            ) : (
              <KpiTile label="Avg ticket" value={breakdown.salesCount > 0 ? formatCurrency(Math.round(breakdown.personalSales / breakdown.salesCount)) : "$0"} icon="circle" />
            )}
          </div>

          {/* Per-show bonuses (managers only) */}
          {isManager && breakdown.showBonuses.length > 0 && (
            <GlassCard padding="md" style={{ marginBottom: "1.25rem" }}>
              <div className="section-title">
                <div>
                  <h2>Manager team bonuses</h2>
                  <p className="section-title-sub">3% of team total sales per attended show</p>
                </div>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {breakdown.showBonuses.map((b) => (
                  <div key={b.showId} style={{
                    padding: "0.75rem 0.875rem",
                    background: "var(--glass-bg-soft)",
                    border: "1px solid var(--glass-border-soft)",
                    borderRadius: 14,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{b.showName}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          Team total {formatCurrency(b.teamTotal)} · {Math.round(b.bonusRate * 100)}%
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--color-secondary-dark)" }}>+{formatCurrency(b.bonus)}</p>
                      </div>
                    </div>
                    <div style={{ height: 4, background: "var(--color-bg-dark)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${breakdown.teamSales > 0 ? Math.round((b.teamTotal / breakdown.teamSales) * 100) : 0}%`,
                        background: "linear-gradient(90deg, var(--color-secondary) 0%, var(--color-secondary-light) 100%)",
                        borderRadius: 999,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </>
      ) : null}

      {/* Personal info */}
      <GlassCard padding="md" style={{ marginBottom: "1.25rem" }}>
        <div className="section-title">
          <div>
            <h2>Personal info</h2>
            <p className="section-title-sub">Account details</p>
          </div>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0.875rem", background: "var(--glass-bg-soft)", borderRadius: 12 }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Email</span>
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{user.email}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0.875rem", background: "var(--glass-bg-soft)", borderRadius: 12 }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Role</span>
            <span className={`badge ${user.role === "ADMIN" ? "badge-primary" : user.role === "MANAGER" ? "badge-secondary" : ""}`}>{user.role}</span>
          </div>
          {user.manager && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0.875rem", background: "var(--glass-bg-soft)", borderRadius: 12 }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Reports to</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{user.manager.name}</span>
            </div>
          )}
          {user.employees.length > 0 && (
            <div style={{ padding: "0.625rem 0.875rem", background: "var(--glass-bg-soft)", borderRadius: 12 }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: 6 }}>Team ({user.employees.length})</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {user.employees.map((e) => (
                  <span key={e.id} className="badge">{e.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Attendance */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div className="section-title">
          <div>
            <h2>My attendance</h2>
            <p className="section-title-sub">{attendedShows.length} show{attendedShows.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {attendedShows.length === 0 ? (
          <GlassCard padding="lg">
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <p>No shows assigned to you yet.</p>
            </div>
          </GlassCard>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {attendedShows.map((s) => (
              <GlassCard key={s.id} padding="sm">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="avatar avatar-sm">{format(new Date(s.startDate), "MMM").slice(0, 3).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{s.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {format(new Date(s.startDate), "MMM d")} — {format(new Date(s.endDate), "MMM d, yyyy")} · {s.location}
                    </p>
                  </div>
                  <span className={`badge ${s.status === "ACTIVE" ? "badge-success" : s.status === "UPCOMING" ? "badge-primary" : "badge-secondary"}`}>{s.status}</span>
                  {s.asManager && <span className="badge badge-secondary">Manager</span>}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Recent sales */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div className="section-title">
          <div>
            <h2>Recent sales</h2>
            <p className="section-title-sub">Last {recentSales.length}</p>
          </div>
        </div>
        {recentSales.length === 0 ? (
          <GlassCard padding="lg">
            <div className="empty-state">
              <div className="empty-state-icon">💎</div>
              <p>No sales yet.</p>
            </div>
          </GlassCard>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {recentSales.map((s) => (
              <GlassCard key={s.id} padding="sm">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="avatar avatar-sm avatar-gold">{s.productLevel.replace("LEVEL_", "")}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.productModel} · {s.productStyle}
                    </p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                      {s.showName} · {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{formatCurrency(s.salePrice)}</p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--color-secondary-dark)", fontWeight: 600 }}>+{formatCurrency(s.commission)}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </ClientAuthShell>
  );
}
