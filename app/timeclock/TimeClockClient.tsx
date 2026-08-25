"use client";

import { useState, useEffect } from "react";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { SalesHistoryTimeline } from "@/app/components/SalesHistoryTimeline";
import { format } from "date-fns";

type Entry = {
  id: string;
  userId: string;
  showId: string | null;
  clockIn: string;
  clockOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  notes: string | null;
  user: { id: string; name: string };
  show: { id: string; name: string; location: string } | null;
};

type Show = { id: string; name: string; location: string; startDate: string; endDate: string };

type Props = {
  userRole: "ADMIN" | "MANAGER" | "EMPLOYEE";
  active: Entry | null;
  recent: Entry[];
  shows: Show[];
};

function calcDuration(start: string, end: string | null): number {
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  return Math.max(0, e - s);
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TimeClockClient({ userRole, active: initialActive, recent: initialRecent, shows }: Props) {
  const [active, setActive] = useState<Entry | null>(initialActive);
  const [recent, setRecent] = useState<Entry[]>(initialRecent);
  const [showId, setShowId] = useState("");
  const [notes, setNotes] = useState("");
  const [working, setWorking] = useState(false);
  const [tick, setTick] = useState(0);

  // Force re-render every 30s so the live duration updates
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, [active]);

  const clockIn = async () => {
    setWorking(true);
    try {
      const res = await fetch("/api/timeclock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId: showId || null, notes: notes || null }),
      });
      if (res.ok) {
        const entry = await res.json();
        setActive(entry);
        setRecent((rs) => [entry, ...rs]);
      } else {
        const e = await res.json();
        alert(e.error || "Failed");
      }
    } finally {
      setWorking(false);
    }
  };

  const action = async (entryId: string, act: "clock_out" | "break_start" | "break_end") => {
    setWorking(true);
    try {
      const res = await fetch(`/api/timeclock/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: act }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (active?.id === entryId) setActive(updated);
        setRecent((rs) => rs.map((r) => (r.id === entryId ? updated : r)));
      } else {
        const e = await res.json();
        alert(e.error || "Failed");
      }
    } finally {
      setWorking(false);
    }
  };

  const totalHours = recent.reduce((sum, r) => {
    if (!r.clockOut) return sum;
    const total = calcDuration(r.clockIn, r.clockOut);
    let breakMs = 0;
    if (r.breakStart && r.breakEnd) breakMs = calcDuration(r.breakStart, r.breakEnd);
    return sum + (total - breakMs);
  }, 0);

  return (
    <ClientAuthShell pageTitle="Time clock" pageSubtitle="Track your hours + breaks">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Time clock</h1>
          <p className="section-title-sub" style={{ marginTop: 4 }}>
            {userRole === "EMPLOYEE" ? "Your hours" : "Team hours"} · last 30 entries shown
          </p>
        </div>
      </div>

      {/* Active clock card */}
      {active ? (
        <GlassCard padding="lg" variant="strong" style={{
          marginBottom: "1.25rem",
          background: "linear-gradient(135deg, rgba(45, 138, 78, 0.20) 0%, rgba(45, 138, 78, 0.06) 100%)",
          borderColor: "rgba(45, 138, 78, 0.40)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span className="status-dot status-success" style={{ width: 12, height: 12 }} />
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-success)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {active.breakStart && !active.breakEnd ? "On break" : "Clocked in"}
                </p>
              </div>
              <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-success)", letterSpacing: "-0.02em" }}>
                {formatDuration(calcDuration(active.clockIn, null) - (active.breakStart && !active.breakEnd ? 0 : active.breakStart && active.breakEnd ? calcDuration(active.breakStart, active.breakEnd) : 0))}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 4 }}>
                Started {format(new Date(active.clockIn), "h:mm a")} · {active.show?.name || "Not assigned to show"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {!active.breakStart || active.breakEnd ? (
                <button onClick={() => action(active.id, "break_start")} disabled={working} className="btn btn-secondary">
                  <Icon name="package" size={14} /><span>Start break</span>
                </button>
              ) : (
                <button onClick={() => action(active.id, "break_end")} disabled={working} className="btn btn-secondary">
                  <Icon name="check" size={14} /><span>End break</span>
                </button>
              )}
              <button onClick={() => action(active.id, "clock_out")} disabled={working} className="btn btn-primary">
                <Icon name="x" size={14} /><span>Clock out</span>
              </button>
            </div>
          </div>
        </GlassCard>
      ) : (
        <GlassCard padding="lg" style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12 }}>Clock in to start your shift</p>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }} className="form-grid-2">
            <div>
              <label className="label">Which show?</label>
              <select className="input" value={showId} onChange={(e) => setShowId(e.target.value)}>
                <option value="">— No specific show —</option>
                {shows.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.location})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <input className="input" placeholder="e.g. morning shift, setup crew" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <button onClick={clockIn} disabled={working} className="btn btn-primary" style={{ width: "100%", marginTop: 12, fontSize: "1rem", padding: "0.875rem" }}>
            <Icon name="check" size={18} /><span>{working ? "Clocking in…" : "Clock in"}</span>
          </button>
        </GlassCard>
      )}

      {/* Total hours this period */}
      {totalHours > 0 && (
        <GlassCard padding="md" style={{ marginBottom: "1.25rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Total logged (last {recent.length} entries, including breaks subtracted)
          </p>
          <p style={{ fontSize: "1.5rem", fontWeight: 800 }}>{formatDuration(totalHours)}</p>
        </GlassCard>
      )}

      {/* Sales timeline */}
      <SalesHistoryTimeline />

      {/* Recent entries */}
      <GlassCard padding="md">
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12 }}>Recent entries</h2>
        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏰</div>
            <p>No time entries yet</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {recent.map((r) => {
              const total = calcDuration(r.clockIn, r.clockOut);
              const breakMs = r.breakStart && r.breakEnd ? calcDuration(r.breakStart, r.breakEnd) : 0;
              const worked = total - breakMs;
              const status = !r.clockOut ? "active" : "closed";
              return (
                <div key={r.id} style={{
                  padding: "0.75rem 0.875rem",
                  background: "var(--glass-bg-soft)",
                  borderRadius: 10,
                  border: status === "active" ? "1px solid rgba(45, 138, 78, 0.30)" : "1px solid var(--glass-border-soft)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                        {format(new Date(r.clockIn), "EEE MMM d, yyyy")}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {format(new Date(r.clockIn), "h:mm a")} – {r.clockOut ? format(new Date(r.clockOut), "h:mm a") : "ongoing"}
                        {r.show?.name && ` · ${r.show.name}`}
                        {userRole !== "EMPLOYEE" && ` · ${r.user.name}`}
                      </p>
                      {r.notes && <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic", marginTop: 2 }}>{r.notes}</p>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "1rem", fontWeight: 700, color: status === "active" ? "var(--color-success)" : "var(--color-text)" }}>
                        {formatDuration(worked)}
                      </p>
                      {breakMs > 0 && <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{formatDuration(breakMs)} break</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </ClientAuthShell>
  );
}
