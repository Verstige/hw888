"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Stats {
  todaySales: number;
  todayCommission: number;
  weekSales: number;
  weekCommission: number;
  todayTransactions: number;
  pendingSync: number;
}

interface Show {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface RecentSale {
  id: string;
  total: number;
  commission: number;
  createdAt: string;
  items: { productName: string; quantity: number; price: number }[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/dashboard/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data); });
    fetch("/api/shows")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setShows(data.slice(0, 3)); });
    fetch("/api/sales?limit=5")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.sales) setRecentSales(data.sales); setLoading(false); });
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="animate-spin-slow" style={{ fontSize: "2rem", marginBottom: "1rem" }}>⟳</div>
          <p style={{ color: "#8A9E8C" }}>Loading HW888...</p>
        </div>
      </div>
    );
  }

  const name = (session?.user as any)?.name || "Team Member";
  const firstName = name.split(" ")[0];

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto", paddingBottom: "6rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#F0EFE8" }}>
              Welcome back, <span className="gradient-text">{firstName}</span>
            </h1>
            <p style={{ color: "#8A9E8C", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {role === "ADMIN" && (
              <Link href="/admin/users" className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}>
                ⚙️ Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Commission Hero */}
      {stats && (
        <div className="glass glow-gold" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p style={{ color: "#8A9E8C", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: "0.25rem" }}>
                Today&apos;s Commission
              </p>
              <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#C9A84C", textShadow: "0 0 30px rgba(201,168,76,0.4)" }}>
                ${stats.todayCommission.toFixed(2)}
              </div>
              <p style={{ color: "#5A6E5C", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                on ${stats.todaySales.toFixed(2)} in sales · {stats.todayTransactions} transaction{stats.todayTransactions !== 1 ? "s" : ""}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "#8A9E8C", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: "0.25rem" }}>
                This Week
              </p>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#F0EFE8" }}>
                ${stats.weekCommission.toFixed(2)}
              </div>
              <p style={{ color: "#5A6E5C", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                on ${stats.weekSales.toFixed(2)} in sales
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <Link href="/sale" className="glass pressable" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1.5rem", textDecoration: "none" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💰</div>
          <div style={{ fontWeight: 700, color: "#F0EFE8", fontSize: "1rem" }}>New Sale</div>
          <div style={{ color: "#5A6E5C", fontSize: "0.75rem", marginTop: "0.25rem" }}>Record a transaction</div>
        </Link>
        <Link href="/leaderboard" className="glass pressable" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1.5rem", textDecoration: "none" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏆</div>
          <div style={{ fontWeight: 700, color: "#F0EFE8", fontSize: "1rem" }}>Leaderboard</div>
          <div style={{ color: "#5A6E5C", fontSize: "0.75rem", marginTop: "0.25rem" }}>See rankings</div>
        </Link>
        <Link href="/shows" className="glass pressable" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1.5rem", textDecoration: "none" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📅</div>
          <div style={{ fontWeight: 700, color: "#F0EFE8", fontSize: "1rem" }}>Shows</div>
          <div style={{ color: "#5A6E5C", fontSize: "0.75rem", marginTop: "0.25rem" }}>Check in/out</div>
        </Link>
        <Link href="/travel" className="glass pressable" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1.5rem", textDecoration: "none" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✈️</div>
          <div style={{ fontWeight: 700, color: "#F0EFE8", fontSize: "1rem" }}>Travel</div>
          <div style={{ color: "#5A6E5C", fontSize: "0.75rem", marginTop: "0.25rem" }}>Trips & flights</div>
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        {/* Upcoming Shows */}
        <div className="glass">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#C9A84C", textTransform: "uppercase", letterSpacing: "0.05em" }}>Upcoming Shows</h2>
            <Link href="/shows" style={{ color: "#5A6E5C", fontSize: "0.8rem", textDecoration: "none" }}>View all →</Link>
          </div>
          {shows.length === 0 ? (
            <p style={{ color: "#5A6E5C", fontSize: "0.875rem", textAlign: "center", padding: "1rem" }}>No upcoming shows assigned.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {shows.map((show) => (
                <div key={show.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem", background: "rgba(21,37,24,0.6)", borderRadius: "10px", border: "1px solid rgba(45,90,61,0.2)" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#F0EFE8", fontSize: "0.9rem" }}>{show.name}</div>
                    <div style={{ color: "#8A9E8C", fontSize: "0.8rem" }}>{show.location}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className={`badge-${show.status === "ACTIVE" ? "green" : "secondary"}`} style={{ fontSize: "0.7rem" }}>
                      {new Date(show.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales */}
        {recentSales.length > 0 && (
          <div className="glass">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#C9A84C", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent Sales</h2>
              <Link href="/sale" style={{ color: "#5A6E5C", fontSize: "0.8rem", textDecoration: "none" }}>New sale →</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {recentSales.map((sale) => (
                <div key={sale.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "rgba(21,37,24,0.6)", borderRadius: "10px" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "#F0EFE8", fontWeight: 600 }}>
                      {sale.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#5A6E5C", marginTop: "0.2rem" }}>
                      {new Date(sale.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "#3DA85C", fontSize: "0.9rem" }}>+${sale.commission.toFixed(2)}</div>
                    <div style={{ fontSize: "0.75rem", color: "#8A9E8C" }}>${sale.total.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
