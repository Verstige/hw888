"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/products";
import { format } from "date-fns";

export default function ShowsPage() {
  const router = useRouter();
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerStatus, setDrawerStatus] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch("/api/shows")
      .then((r) => r.json())
      .then((d) => { setShows(d); setLoading(false); });
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
    if (res.ok) {
      setDrawerStatus((s) => ({ ...s, [showId]: null }));
    }
  };

  const grouped = {
    ACTIVE: shows.filter((s) => s.status === "ACTIVE"),
    UPCOMING: shows.filter((s) => s.status === "UPCOMING"),
    COMPLETED: shows.filter((s) => s.status === "COMPLETED"),
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="bg-[var(--color-primary)] text-white px-6 py-5">
        <h1 className="text-xl font-bold">📅 Shows</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {Object.entries(grouped).map(([status, list]) => (
          list.length > 0 && (
            <div key={status}>
              <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">{status}</h2>
              <div className="space-y-2">
                {list.map((show: any) => {
                  const drawer = drawerStatus[show.id] ?? null;
                  return (
                    <div key={show.id} className="card">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold">{show.name}</h3>
                          <p className="text-sm text-[var(--color-text-muted)]">{show.location}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {format(new Date(show.startDate), "MMM d")} — {format(new Date(show.endDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        {show.isOutdoor && (
                          <span className="text-xs bg-[var(--color-warning)]/10 text-[var(--color-warning)] px-2 py-0.5 rounded-full font-medium">
                            Outdoor
                          </span>
                        )}
                      </div>
                      {show.assignments?.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {show.assignments.map((a: any) => a.user.name).join(", ")}
                          </p>
                        </div>
                      )}
                      {status === "ACTIVE" && (
                        <div className="flex gap-2 mt-2">
                          {drawer?.isActive ? (
                            <>
                              <div className="flex-1 text-xs text-[var(--color-success)] font-medium pt-2">
                                Drawer open · Float: {formatCurrency(drawer.openingFloat)}
                              </div>
                              <button
                                onClick={() => closeDrawer(show.id)}
                                className="px-3 py-1.5 text-xs border border-[var(--color-border)] rounded-lg"
                              >
                                Close Drawer
                              </button>
                              <button
                                onClick={() => router.push("/sale")}
                                className="px-3 py-1.5 text-xs bg-[var(--color-primary)] text-white rounded-lg font-medium"
                              >
                                Open POS
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => openDrawer(show.id)}
                              className="px-3 py-1.5 text-xs bg-[var(--color-primary)] text-white rounded-lg font-medium w-full"
                            >
                              Open Cash Drawer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ))}

        {shows.length === 0 && (
          <div className="text-center py-12 text-[var(--color-text-muted)]">
            No shows yet. Ask your admin to create one.
          </div>
        )}
      </div>
    </div>
  );
}
