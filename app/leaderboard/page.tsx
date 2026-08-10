"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/products";

const RANGES = ["today", "3d", "7d", "14d", "30d", "60d"] as const;
type Range = (typeof RANGES)[number];

export default function LeaderboardPage() {
  const [range, setRange] = useState<Range>("7d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?range=${range}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [range]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="bg-[var(--color-primary)] text-white px-6 py-5">
        <h1 className="text-xl font-bold">🏆 Leaderboard</h1>
        <p className="text-sm opacity-80 mt-0.5">See where you stand</p>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Range selector */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${range === r ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]"}`}
            >
              {r === "today" ? "Today" : r === "3d" ? "3 Days" : r === "7d" ? "7 Days" : r === "14d" ? "14 Days" : r === "30d" ? "30 Days" : "60 Days"}
            </button>
          ))}
        </div>

        {/* My rank */}
        {data?.myRank && (
          <div className="card text-center bg-[var(--color-secondary)]/10 border-[var(--color-secondary)]">
            <p className="text-sm text-[var(--color-text-muted)]">Your Rank</p>
            <p className="text-3xl font-bold text-[var(--color-secondary)]">#{data.myRank}</p>
            <p className="text-xs text-[var(--color-text-muted)]">of {data.totalEmployees} employees</p>
          </div>
        )}

        {/* Leaderboard list */}
        {loading ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">Loading...</div>
        ) : data?.leaderboard?.length === 0 ? (
          <div className="card text-center py-12 text-[var(--color-text-muted)]">
            No sales in this period yet. Get out there and sell!
          </div>
        ) : (
          <div className="space-y-2">
            {data?.leaderboard?.map((entry: any) => (
              <div
                key={entry.userId}
                className={`card flex items-center gap-3 ${entry.rank <= 3 ? "border-[var(--color-secondary)]" : ""}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${entry.rank === 1 ? "bg-[var(--color-secondary)] text-white" : entry.rank === 2 ? "bg-gray-300 text-white" : entry.rank === 3 ? "bg-amber-600 text-white" : "bg-[var(--color-bg-dark)] text-[var(--color-text-muted)]"}`}>
                  {entry.rank}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{entry.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{entry.saleCount} sale{entry.saleCount !== 1 ? "s" : ""}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[var(--color-primary)]">{formatCurrency(entry.totalSales)}</p>
                  <p className="text-xs text-[var(--color-secondary)]">{formatCurrency(entry.totalCommission)} earned</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
