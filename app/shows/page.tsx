"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { formatCurrency } from "@/lib/products";
import { format } from "date-fns";

function ShowsInner() {
  const router = useRouter();
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerStatus, setDrawerStatus] = useState<Record<string, any>>({});
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.json()).then((s) => setUser(s.user));
    fetch("/api/shows").then((r) => r.json()).then((d) => { setShows(d); setLoading(false); });
  }, []);

  const openDrawer = async (showId: string) => {
    const float = prompt("Enter opening float amount ($):", "200");
    if (float === null) return;
    const res = await fetch("/api/drawer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showId, action: "open", openingFloat: parseFloat(float) || 0 }),
    });
    if (res.ok) {
      setDrawerStatus((s) => ({ ...s, [showId]: { isActive: true, openingFloat: parseFloat(float) } }));
    } else {
      const err = await res.json();
      alert(err.error || "Failed to open drawer");
    }
  };

  const closeDrawer = async (showId: string) => {
    const res = await fetch("/api/drawer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showId, action: "close" }),
    });
    if (res.ok) setDrawerStatus((s) => ({ ...s, [showId]: null }));
  };

  const grouped = {
    ACTIVE: shows.filter((s) => s.status === "ACTIVE"),
    UPCOMING: shows.filter((s) => s.status === "UPCOMING"),
    COMPLETED: shows.filter((s) => s.status === "COMPLETED"),
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>Loading…</div>;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Shows</h1>
          <p className="section-title-sub" style={{ marginTop: 4 }}>{shows.length} total · grouped by status</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/shows/calendar" className="btn btn-secondary">
            <Icon name="calendar" size={16} />
            <span>Calendar</span>
          </Link>
          {user?.role === "ADMIN" && (
            <Link href="/admin/shows" className="btn btn-primary">
              <Icon name="plus" size={18} />
              <span>Manage</span>
            </Link>
          )}
        </div>
      </div>

      {shows.length === 0 && (
        <GlassCard padding="lg">
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <p>No shows yet.</p>
            {user?.role === "ADMIN" && (
              <Link href="/admin/shows" className="btn btn-primary" style={{ marginTop: 12 }}>
                <Icon name="plus" size={18} /><span>Create first show</span>
              </Link>
            )}
          </div>
        </GlassCard>
      )}

      {Object.entries(grouped).map(([status, list]) =>
        list.length > 0 ? (
          <div key={status} style={{ marginBottom: "1.5rem" }}>
            <div className="section-title">
              <h2 style={{ fontSize: "0.9375rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{status.toLowerCase()}</h2>
              <span className="section-title-sub">{list.length}</span>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {list.map((show: any) => {
                const drawer = drawerStatus[show.id] ?? null;
                const statusBadgeCls = show.status === "ACTIVE" ? "badge-success" : show.status === "UPCOMING" ? "badge-primary" : "badge-secondary";
                return (
                  <GlassCard key={show.id} padding="md">
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: show.status === "ACTIVE" ? 12 : 0, flexWrap: "wrap" }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>{show.name}</h3>
                          <span className={`badge ${statusBadgeCls}`}>{show.status}</span>
                          {show.isOutdoor && <span className="badge badge-warning">Outdoor</span>}
                        </div>
                        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: 2 }}>{show.location}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                          {format(new Date(show.startDate), "MMM d")} — {format(new Date(show.endDate), "MMM d, yyyy")}
                          {show.assignments?.length > 0 && ` · ${show.assignments.length} assigned`}
                        </p>
                      </div>
                    </div>
                    {show.status === "ACTIVE" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        {drawer?.isActive ? (
                          <>
                            <div style={{ flex: 1, padding: "0.5rem 0.75rem", background: "rgba(45, 138, 78, 0.10)", borderRadius: 10, fontSize: "0.75rem", color: "var(--color-success)", fontWeight: 600, display: "flex", alignItems: "center" }}>
                              Drawer open · Float {formatCurrency(drawer.openingFloat)}
                            </div>
                            <button onClick={() => closeDrawer(show.id)} className="btn btn-secondary" style={{ minHeight: 36, padding: "0.5rem 0.875rem" }}>Close</button>
                            <button onClick={() => router.push("/sale")} className="btn btn-primary" style={{ minHeight: 36, padding: "0.5rem 0.875rem" }}>POS</button>
                          </>
                        ) : (
                          <button onClick={() => openDrawer(show.id)} className="btn btn-primary btn-block" style={{ minHeight: 40 }}>
                            <Icon name="sale" size={16} /><span>Open cash drawer</span>
                          </button>
                        )}
                      </div>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          </div>
        ) : null,
      )}
    </>
  );
}

export default function ShowsPage() {
  return <ClientAuthShell pageTitle="Shows"><ShowsInner /></ClientAuthShell>;
}
