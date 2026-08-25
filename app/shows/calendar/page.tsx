"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";

type Show = {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  isOutdoor: boolean;
  status: string;
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseLocalDate(d: string): Date {
  // d is "YYYY-MM-DD" or ISO. For grid logic, strip time and parse as local.
  const s = d.length > 10 ? d.slice(0, 10) : d;
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function CalendarInner() {
  const router = useRouter();
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    fetch("/api/shows").then((r) => r.json()).then((d) => { setShows(d); setLoading(false); });
  }, []);

  const goPrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const goNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const goToday = () => setCurrentMonth(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  const monthStart = currentMonth;
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay()); // back to Sunday
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay())); // forward to Saturday

  // Build day cells (6 weeks × 7 = 42 max)
  const days: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  // Map shows by date — only UPCOMING + ACTIVE show on each day they cover
  const showsByDate = useMemo(() => {
    const map = new Map<string, Show[]>();
    for (const s of shows) {
      if (s.status === "COMPLETED" || s.status === "CANCELLED") continue;
      const start = parseLocalDate(s.startDate);
      const end = parseLocalDate(s.endDate);
      const cur = new Date(start);
      while (cur <= end) {
        const key = formatDate(cur);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(s);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [shows]);

  // Compute "lanes" for overlapping shows within each week
  // For each week (Mon-Sun or Sun-Sat), assign shows to lanes so they don't overlap visually
  type Lane = { show: Show; startCol: number; endCol: number; lane: number };

  const weeks: Array<{ days: Date[]; lanes: Lane[] }> = useMemo(() => {
    const weeksArr: Array<{ days: Date[]; lanes: Lane[] }> = [];
    for (let i = 0; i < days.length; i += 7) {
      const weekDays = days.slice(i, i + 7);
      const weekStart = weekDays[0];
      const weekEnd = weekDays[6];

      // Get all shows that overlap this week
      const weekShows = shows.filter((s) => {
        if (s.status === "COMPLETED" || s.status === "CANCELLED") return false;
        const start = parseLocalDate(s.startDate);
        const end = parseLocalDate(s.endDate);
        return start <= weekEnd && end >= weekStart;
      });

      // Sort by duration desc, then start
      weekShows.sort((a, b) => {
        const aDur = (parseLocalDate(a.endDate).getTime() - parseLocalDate(a.startDate).getTime());
        const bDur = (parseLocalDate(b.endDate).getTime() - parseLocalDate(b.startDate).getTime());
        if (bDur !== aDur) return bDur - aDur;
        return parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime();
      });

      const lanes: Lane[] = [];
      // Greedy lane assignment
      weekShows.forEach((s) => {
        const start = parseLocalDate(s.startDate);
        const end = parseLocalDate(s.endDate);
        const visStart = start < weekStart ? weekStart : start;
        const visEnd = end > weekEnd ? weekEnd : end;
        const startCol = Math.round((visStart.getTime() - weekStart.getTime()) / 86400000);
        const endCol = Math.round((visEnd.getTime() - weekStart.getTime()) / 86400000);

        // Find first lane where no conflict
        let lane = 0;
        while (lanes.some((l) => l.lane === lane && !(l.endCol < startCol || l.startCol > endCol))) {
          lane++;
        }
        lanes.push({ show: s, startCol, endCol, lane });
      });

      weeksArr.push({ days: weekDays, lanes });
    }
    return weeksArr;
  }, [days, shows]);

  const todayStr = formatDate(new Date());
  const isCurrentMonth = (d: Date) => d.getMonth() === currentMonth.getMonth();

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>Loading…</div>;
  }

  const upcomingShows = shows.filter((s) => s.status !== "COMPLETED" && s.status !== "CANCELLED");
  const completedShows = shows.filter((s) => s.status === "COMPLETED");

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Calendar</h1>
          <p className="section-title-sub" style={{ marginTop: 4 }}>{upcomingShows.length} upcoming · {completedShows.length} completed</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => router.push("/shows")} className="btn btn-secondary">
            <Icon name="calendar" size={16} />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Month nav */}
      <GlassCard padding="md" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={goPrevMonth} className="btn btn-ghost" style={{ minHeight: 36, minWidth: 36, padding: 0 }} aria-label="Previous month">
              <Icon name="chevron-left" size={18} />
            </button>
            <button onClick={goToday} className="btn btn-secondary" style={{ minHeight: 36, padding: "0.5rem 0.875rem", fontSize: "0.8125rem" }}>Today</button>
            <button onClick={goNextMonth} className="btn btn-ghost" style={{ minHeight: 36, minWidth: 36, padding: 0 }} aria-label="Next month">
              <Icon name="chevron-right" size={18} />
            </button>
          </div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)" }} /> Indoor
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: "linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-light) 100%)" }} /> Outdoor
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Calendar grid */}
      <GlassCard padding="sm" style={{ marginBottom: "1.25rem", overflow: "hidden" }}>
        {/* Day-of-week header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          marginBottom: 4,
        }}>
          {DAYS.map((d) => (
            <div key={d} style={{
              padding: "0.5rem 0.25rem",
              fontSize: "0.6875rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-text-muted)",
              textAlign: "center",
            }}>
              <span style={{ display: "inline-block" }}>{d.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div style={{ display: "grid", gap: 4 }}>
          {weeks.map((week, wi) => {
            const maxLane = week.lanes.reduce((m, l) => Math.max(m, l.lane + 1), 0);
            const rowHeight = 32 + maxLane * 22 + 8;
            return (
              <div key={wi} style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
                minHeight: rowHeight,
              }}>
                {/* Day cells (background) */}
                {week.days.map((d, di) => {
                  const dayStr = formatDate(d);
                  const isToday = dayStr === todayStr;
                  const inMonth = isCurrentMonth(d);
                  return (
                    <div key={di} style={{
                      background: inMonth ? "var(--glass-bg-soft)" : "transparent",
                      border: isToday ? "2px solid var(--color-primary)" : "1px solid var(--glass-border-soft)",
                      borderRadius: 10,
                      padding: "0.25rem 0.375rem",
                      minHeight: rowHeight,
                      position: "relative",
                    }}>
                      <div style={{
                        fontSize: "0.75rem",
                        fontWeight: isToday ? 800 : 600,
                        color: inMonth ? "var(--color-text)" : "var(--color-text-muted)",
                        opacity: inMonth ? 1 : 0.5,
                        marginBottom: 4,
                      }}>
                        {d.getDate()}
                      </div>
                    </div>
                  );
                })}

                {/* Show bars (overlay) */}
                {week.lanes.map((lane, li) => {
                  const show = lane.show;
                  const isOutdoor = show.isOutdoor;
                  const left = `${(lane.startCol / 7) * 100}%`;
                  const width = `${((lane.endCol - lane.startCol + 1) / 7) * 100}%`;
                  const top = 28 + lane.lane * 22;
                  return (
                    <div
                      key={`${show.id}-${wi}-${li}`}
                      style={{
                        position: "absolute",
                        left: `calc(${left} + 4px)`,
                        width: `calc(${width} - 8px)`,
                        top,
                        height: 20,
                        borderRadius: 6,
                        background: isOutdoor
                          ? "linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-light) 100%)"
                          : "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)",
                        color: isOutdoor ? "var(--color-primary-dark)" : "white",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 0.5rem",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        boxShadow: "0 2px 6px rgba(15, 23, 42, 0.16)",
                        cursor: "default",
                        zIndex: 1,
                      }}
                      title={`${show.name} — ${parseLocalDate(show.startDate).toLocaleDateString()} to ${parseLocalDate(show.endDate).toLocaleDateString()}`}
                    >
                      {show.name}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Upcoming list */}
      <div>
        <div className="section-title">
          <h2>Upcoming shows</h2>
          <span className="section-title-sub">{upcomingShows.length}</span>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {upcomingShows
            .sort((a, b) => parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime())
            .map((s) => (
              <GlassCard key={s.id} padding="sm">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="avatar avatar-sm" style={{
                    background: s.isOutdoor
                      ? "linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-light) 100%)"
                      : undefined,
                    color: s.isOutdoor ? "var(--color-primary-dark)" : undefined,
                  }}>
                    {parseLocalDate(s.startDate).getDate()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{s.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {parseLocalDate(s.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })} — {parseLocalDate(s.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      {s.isOutdoor && " · Outdoor"}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
        </div>
      </div>
    </>
  );
}

export default function ShowsCalendarPage() {
  return (
    <ClientAuthShell pageTitle="Calendar">
      <CalendarInner />
    </ClientAuthShell>
  );
}
