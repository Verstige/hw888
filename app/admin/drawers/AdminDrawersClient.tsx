"use client";

import { useState, useEffect } from "react";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { formatCurrency } from "@/lib/products";
import { format } from "date-fns";

type Drawer = {
  id: string;
  showId: string;
  show: { id: string; name: string; location: string };
  openedBy: { id: string; name: string };
  closedBy?: { id: string; name: string } | null;
  openingFloat: number;
  totalCash: number;
  totalCard: number;
  countedCash?: number | null;
  countedCard?: number | null;
  discrepancyCash?: number | null;
  discrepancyCard?: number | null;
  closeNotes?: string | null;
  openedAt: string;
  closedAt?: string | null;
  isActive: boolean;
};

export default function AdminDrawersClient({ drawers: initialDrawers }: { drawers: Drawer[] }) {
  const [drawers, setDrawers] = useState(initialDrawers);
  const [closingId, setClosingId] = useState<string | null>(null);

  const active = drawers.filter((d) => d.isActive);
  const closed = drawers.filter((d) => !d.isActive);
  const discrepancies = closed.filter((d) => (d.discrepancyCash ?? 0) !== 0 || (d.discrepancyCard ?? 0) !== 0);

  return (
    <ClientAuthShell pageTitle="Admin · Cash drawers" pageSubtitle="Open + close-out reconciliation">
      <div style={{ marginBottom: "1rem" }}>
        <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Cash drawers</h1>
        <p className="section-title-sub" style={{ marginTop: 4 }}>{active.length} open · {closed.length} closed · {discrepancies.length} with discrepancies</p>
      </div>

      {/* Active drawers */}
      {active.length > 0 && (
        <GlassCard padding="md" style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12 }}>Open drawers</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {active.map((d) => (
              <ActiveDrawerCard key={d.id} drawer={d} onCloseStart={() => setClosingId(d.id)} />
            ))}
          </div>
        </GlassCard>
      )}

      {/* Discrepancies */}
      {discrepancies.length > 0 && (
        <GlassCard padding="md" style={{ marginBottom: "1rem", borderColor: "rgba(196, 68, 68, 0.4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Icon name="x" size={18} />
            <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Discrepancies ({discrepancies.length})</h2>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {discrepancies.map((d) => (
              <ClosedDrawerCard key={d.id} drawer={d} highlight />
            ))}
          </div>
        </GlassCard>
      )}

      {/* Closed (recent) */}
      {closed.length > 0 && (
        <GlassCard padding="md">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12 }}>Recent closures</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {closed.slice(0, 20).map((d) => (
              <ClosedDrawerCard key={d.id} drawer={d} />
            ))}
          </div>
        </GlassCard>
      )}

      {/* Close drawer modal */}
      {closingId && (
        <CloseDrawerModal
          drawer={drawers.find((d) => d.id === closingId)!}
          onClose={() => setClosingId(null)}
          onClosed={(updated) => {
            setDrawers((ds) => ds.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
            setClosingId(null);
          }}
        />
      )}
    </ClientAuthShell>
  );
}

function ActiveDrawerCard({ drawer, onCloseStart }: { drawer: Drawer; onCloseStart: () => void }) {
  const expectedCash = drawer.openingFloat + drawer.totalCash;
  return (
    <div style={{ padding: "0.875rem 1rem", background: "var(--glass-bg-soft)", borderRadius: 12, border: "1px solid rgba(45, 138, 78, 0.30)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{drawer.show.name}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            Opened by {drawer.openedBy.name} · {format(new Date(drawer.openedAt), "MMM d, h:mm a")}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            Float {formatCurrency(drawer.openingFloat)} · Sales {formatCurrency(drawer.totalCash + drawer.totalCard)} ({formatCurrency(drawer.totalCash)} cash + {formatCurrency(drawer.totalCard)} card)
          </p>
        </div>
        <button onClick={onCloseStart} className="btn btn-primary" style={{ minHeight: 36, padding: "0.5rem 1rem" }}>
          Close drawer
        </button>
      </div>
    </div>
  );
}

function ClosedDrawerCard({ drawer, highlight = false }: { drawer: Drawer; highlight?: boolean }) {
  const disc = (drawer.discrepancyCash ?? 0) + (drawer.discrepancyCard ?? 0);
  return (
    <div style={{
      padding: "0.875rem 1rem",
      background: "var(--glass-bg-soft)",
      borderRadius: 12,
      border: highlight ? "1px solid rgba(196, 68, 68, 0.35)" : "1px solid var(--glass-border-soft)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{drawer.show.name}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {drawer.openedBy.name} opened · {drawer.closedBy?.name || "?"} closed · {drawer.closedAt ? format(new Date(drawer.closedAt), "MMM d, h:mm a") : ""}
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: "0.8125rem" }}>
          <p>Counted {formatCurrency((drawer.countedCash ?? 0) + (drawer.countedCard ?? 0))}</p>
          {Math.abs(disc) > 0.01 && (
            <p style={{ fontWeight: 700, color: disc > 0 ? "var(--color-success)" : "var(--color-danger)" }}>
              {disc > 0 ? "+" : ""}{formatCurrency(disc)} {disc > 0 ? "over" : "short"}
            </p>
          )}
        </div>
      </div>
      {drawer.closeNotes && (
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 6, fontStyle: "italic" }}>"{drawer.closeNotes}"</p>
      )}
    </div>
  );
}

function CloseDrawerModal({ drawer, onClose, onClosed }: { drawer: Drawer; onClose: () => void; onClosed: (d: any) => void }) {
  const expectedCash = drawer.openingFloat + drawer.totalCash;
  const [countedCash, setCountedCash] = useState("");
  const [countedCard, setCountedCard] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numCash = parseFloat(countedCash || "0") || 0;
  const numCard = parseFloat(countedCard || "0") || 0;
  const discCash = numCash - expectedCash;
  const discCard = numCard - drawer.totalCard;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/drawer/${drawer.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countedCash: numCash, countedCard: numCard, notes: notes || null }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed");
      }
      const data = await res.json();
      onClosed(data.drawer);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Close drawer · {drawer.show.name}</h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: "0.375rem", minHeight: 32 }} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Expected vs counted */}
        <GlassCard padding="md" variant="soft" style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Cash expected: <strong>{formatCurrency(expectedCash)}</strong> (float {formatCurrency(drawer.openingFloat)} + sales {formatCurrency(drawer.totalCash)})</p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Card expected: <strong>{formatCurrency(drawer.totalCard)}</strong></p>
          </div>
        </GlassCard>

        <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
          <div>
            <label className="label">Counted cash (actual bills in drawer)</label>
            <input className="input" type="number" inputMode="decimal" step="0.01" placeholder="0.00" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} />
            {countedCash && (
              <p style={{ fontSize: "0.75rem", marginTop: 4, color: discCash === 0 ? "var(--color-text-muted)" : (discCash > 0 ? "var(--color-success)" : "var(--color-danger)"), fontWeight: 600 }}>
                {discCash === 0 ? "Exact match" : `${discCash > 0 ? "+" : ""}${formatCurrency(discCash)} ${discCash > 0 ? "over" : "short"}`}
              </p>
            )}
          </div>
          <div>
            <label className="label">Counted card (total card receipts)</label>
            <input className="input" type="number" inputMode="decimal" step="0.01" placeholder="0.00" value={countedCard} onChange={(e) => setCountedCard(e.target.value)} />
            {countedCard && (
              <p style={{ fontSize: "0.75rem", marginTop: 4, color: discCard === 0 ? "var(--color-text-muted)" : (discCard > 0 ? "var(--color-success)" : "var(--color-danger)"), fontWeight: 600 }}>
                {discCard === 0 ? "Exact match" : `${discCard > 0 ? "+" : ""}${formatCurrency(discCard)} ${discCard > 0 ? "over" : "short"}`}
              </p>
            )}
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input className="input" type="text" placeholder="e.g. Lost $10 in quarters" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {error && <div style={{ padding: "0.625rem 0.875rem", background: "rgba(196, 68, 68, 0.10)", color: "var(--color-danger)", borderRadius: 10, fontSize: "0.8125rem", fontWeight: 600, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button onClick={submit} disabled={submitting || !countedCash || !countedCard} className="btn btn-primary" style={{ flex: 1 }}>
            {submitting ? "Closing…" : "Close drawer"}
          </button>
        </div>
      </div>
    </div>
  );
}
