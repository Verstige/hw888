"use client";

import { useState, useEffect } from "react";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { formatCurrency } from "@/lib/products";

const RANGES = ["today", "3d", "7d", "14d", "30d", "60d"] as const;
type Range = (typeof RANGES)[number];

function LeaderboardInner() {
  const [range, setRange] = useState<Range>("7d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?range=${range}`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, [range]);

  return (
    <>
      <div style={{ marginBottom: "1rem" }}>
        <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Leaderboard</h1>
        <p className="section-title-sub" style={{ marginTop: 4 }}>See where you stand</p>
      </div>

      <div className="pill-group" style={{ marginBottom: "1.25rem", width: "100%", justifyContent: "space-between" }}>
        {RANGES.map((r) => (
          <button key={r} onClick={() => setRange(r)} className={`pill ${range === r ? "pill-active" : ""}`} style={{ flex: 1 }}>
            {r === "today" ? "Today" : r === "3d" ? "3D" : r === "7d" ? "7D" : r === "14d" ? "14D" : r === "30d" ? "30D" : "60D"}
          </button>
        ))}
      </div>

      {data?.myRank && (
        <GlassCard padding="lg" style={{ marginBottom: "1.25rem", textAlign: "center", background: "linear-gradient(135deg, rgba(201, 168, 76, 0.18) 0%, rgba(201, 168, 76, 0.08) 100%)", borderColor: "rgba(201, 168, 76, 0.35)" }}>
          <p className="section-title-sub">Your rank</p>
          <p style={{ fontSize: "2.5rem", fontWeight: 800, background: "linear-gradient(135deg, var(--color-secondary-dark) 0%, var(--color-secondary) 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em", marginTop: 4 }}>
            #{data.myRank}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 2 }}>of {data.totalEmployees} employees</p>
        </GlassCard>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>Loading…</div>
      ) : data?.leaderboard?.length === 0 ? (
        <GlassCard padding="lg">
          <div className="empty-state"><div className="empty-state-icon">🏆</div><p>No sales in this period yet. Get out there and sell!</p></div>
        </GlassCard>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {data?.leaderboard?.map((entry: any) => {
            const rankClass = entry.rank === 1 ? "rank-1" : entry.rank === 2 ? "rank-2" : entry.rank === 3 ? "rank-3" : "";
            return (
              <GlassCard key={entry.userId} padding="md">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className={`avatar avatar-sm ${rankClass}`}>{entry.rank}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{entry.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{entry.saleCount} sale{entry.saleCount !== 1 ? "s" : ""}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{formatCurrency(entry.totalSales)}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-secondary-dark)", fontWeight: 600 }}>+{formatCurrency(entry.totalCommission)}</p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function LeaderboardPage() {
  return <ClientAuthShell pageTitle="Leaderboard"><LeaderboardInner /></ClientAuthShell>;
}
