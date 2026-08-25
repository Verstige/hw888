"use client";

import { useState, useEffect } from "react";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { formatCurrency } from "@/lib/products";

function GroceryInner() {
  const [items, setItems] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterShow, setFilterShow] = useState("");
  const [newItem, setNewItem] = useState("");

  const load = () => {
    const url = filterShow ? `/api/grocery?showId=${filterShow}` : "/api/grocery";
    fetch(url).then((r) => r.json()).then((d) => { setItems(d); setLoading(false); });
    fetch("/api/shows").then((r) => r.json()).then((d) => setShows(d));
  };
  useEffect(() => { load(); }, [filterShow]);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    await fetch("/api/grocery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ showId: filterShow, item: newItem }) });
    setNewItem(""); load();
  };

  const togglePurchased = async (id: string, currentStatus: string) => {
    await fetch(`/api/grocery/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: currentStatus === "PURCHASED" ? "PENDING" : "PURCHASED" }) });
    load();
  };

  const pending = items.filter((i) => i.status === "PENDING");
  const purchased = items.filter((i) => i.status === "PURCHASED");
  const totalEstCost = pending.reduce((sum: number, i: any) => sum + (i.estimatedCost || 0), 0);

  return (
    <>
      <div style={{ marginBottom: "1rem" }}>
        <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Grocery</h1>
        <p className="section-title-sub" style={{ marginTop: 4 }}>Show crew meals and supplies</p>
      </div>

      <GlassCard padding="sm" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label className="label" style={{ marginBottom: 0, flexShrink: 0 }}>Show</label>
          <select value={filterShow} onChange={(e) => setFilterShow(e.target.value)} className="input" style={{ flex: 1 }}>
            <option value="">All shows</option>
            {shows.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </GlassCard>

      <form onSubmit={addItem} style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
        <input type="text" placeholder="Add grocery item…" value={newItem} onChange={(e) => setNewItem(e.target.value)} className="input" style={{ flex: 1 }} />
        <button type="submit" className="btn btn-primary"><Icon name="plus" size={18} /><span>Add</span></button>
      </form>

      {totalEstCost > 0 && (
        <GlassCard padding="sm" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Estimated total</span>
            <span style={{ fontWeight: 700, color: "var(--color-secondary-dark)" }}>{formatCurrency(totalEstCost)}</span>
          </div>
        </GlassCard>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>Loading…</div>
      ) : items.length === 0 && !filterShow ? (
        <GlassCard padding="lg"><div className="empty-state"><div className="empty-state-icon">🥗</div>No grocery items yet</div></GlassCard>
      ) : (
        <>
          {pending.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div className="section-title"><h2>To buy ({pending.length})</h2></div>
              <div style={{ display: "grid", gap: 6 }}>
                {pending.map((item: any) => (
                  <GlassCard key={item.id} padding="sm">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button onClick={() => togglePurchased(item.id, item.status)} style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid var(--color-border)", background: "transparent", cursor: "pointer", flexShrink: 0 }} aria-label="Mark purchased" />
                      <span style={{ flex: 1, fontSize: "0.9375rem" }}>{item.item}</span>
                      {item.quantity && <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{item.quantity}</span>}
                      {item.estimatedCost && <span style={{ fontSize: "0.75rem", color: "var(--color-secondary-dark)", fontWeight: 600 }}>{formatCurrency(item.estimatedCost)}</span>}
                      {item.show && <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>· {item.show.name}</span>}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
          {purchased.length > 0 && (
            <div>
              <div className="section-title"><h2>Purchased ({purchased.length})</h2></div>
              <div style={{ display: "grid", gap: 6, opacity: 0.6 }}>
                {purchased.map((item: any) => (
                  <GlassCard key={item.id} padding="sm">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button onClick={() => togglePurchased(item.id, item.status)} style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg, var(--color-success) 0%, #3FA562 100%)", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} aria-label="Mark pending"><Icon name="check" size={14} /></button>
                      <span style={{ flex: 1, fontSize: "0.9375rem", textDecoration: "line-through" }}>{item.item}</span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function AdminGroceryPage() {
  return <ClientAuthShell pageTitle="Grocery"><GroceryInner /></ClientAuthShell>;
}
