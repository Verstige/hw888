"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

export function OfflineSyncIndicator() {
  const [count, setCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const refresh = async () => {
    try {
      const { getPendingCount, getPendingSales } = await import("@/lib/offline");
      const c = await getPendingCount();
      setCount(c);
      if (c > 0) {
        const ps = await getPendingSales();
        setPending(ps);
      } else {
        setPending([]);
      }
    } catch {}
  };

  useEffect(() => {
    refresh();
    setIsOnline(navigator.onLine);
    const interval = setInterval(refresh, 5000);
    window.addEventListener("online", () => { setIsOnline(true); refresh(); });
    window.addEventListener("offline", () => setIsOnline(false));
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && count > 0 && !syncing) {
      syncNow();
    }
  }, [isOnline]);

  const syncNow = async () => {
    if (syncing || !isOnline) return;
    setSyncing(true);
    try {
      const { getPendingSales, markSaleSynced, clearSyncedSales } = await import("@/lib/offline");
      const ps = await getPendingSales();
      let syncedCount = 0;
      for (const sale of ps) {
        try {
          const res = await fetch("/api/sales", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...sale, isOffline: true }),
          });
          if (res.ok) {
            await markSaleSynced(sale.id);
            syncedCount++;
          }
        } catch {}
      }
      if (syncedCount > 0) {
        await clearSyncedSales();
        // Dispatch custom event so other parts of the app can refresh
        window.dispatchEvent(new CustomEvent("offline-sync-complete", { detail: { count: syncedCount } }));
      }
      await refresh();
    } finally {
      setSyncing(false);
    }
  };

  if (count === 0 && isOnline) return null;

  return (
    <div style={{ position: "fixed", bottom: 80, right: 12, zIndex: 100, maxWidth: 340 }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="btn btn-secondary"
        style={{
          minHeight: 40,
          padding: "0.5rem 0.75rem",
          fontSize: "0.8125rem",
          background: isOnline ? "rgba(45, 138, 78, 0.95)" : "rgba(201, 168, 76, 0.95)",
          color: "white",
          border: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        {syncing ? (
          <span className="status-dot status-warning" style={{ background: "white" }} />
        ) : isOnline ? (
          <span className="status-dot" style={{ background: "white" }} />
        ) : (
          <Icon name="x" size={14} />
        )}
        <span style={{ fontWeight: 700 }}>{count} queued</span>
        {isOnline && !syncing && count > 0 && (
          <Icon name="search" size={12} />
        )}
      </button>

      {expanded && count > 0 && (
        <div className="modal-panel" style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          right: 0,
          width: 320,
          maxHeight: 400,
          overflow: "auto",
          padding: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 700 }}>Queued offline sales</p>
              <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                {isOnline ? "Online — ready to sync" : "Offline — waiting for connection"}
              </p>
            </div>
            {isOnline && (
              <button onClick={syncNow} disabled={syncing} className="btn btn-primary" style={{ minHeight: 32, padding: "0.25rem 0.625rem", fontSize: "0.75rem" }}>
                {syncing ? "Syncing…" : "Sync now"}
              </button>
            )}
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {pending.slice(0, 10).map((s) => (
              <div key={s.id} style={{
                padding: "0.5rem 0.625rem",
                background: "var(--glass-bg-soft)",
                borderRadius: 8,
                fontSize: "0.75rem",
              }}>
                <p style={{ fontWeight: 700 }}>{s.productLevel.replace("LEVEL_", "")} · {s.productModel} · {s.productStyle}</p>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.6875rem" }}>
                  ${s.salePrice.toFixed(2)} · {s.paymentType} · {new Date(s.createdAt).toLocaleTimeString()}
                </p>
              </div>
            ))}
            {pending.length > 10 && (
              <p style={{ fontSize: "0.6875rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                +{pending.length - 10} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
