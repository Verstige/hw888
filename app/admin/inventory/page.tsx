"use client";

import { useState, useEffect } from "react";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { PRODUCT_LEVELS, PRODUCT_MODELS, PRODUCT_STYLES } from "@/lib/products";
import type { ProductLevel } from "@/lib/products";

function InventoryInner() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterManager, setFilterManager] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ managerId: "", productLevel: "LEVEL_1X", productModel: "", productStyle: "", quantity: 0 });
  const [managers, setManagers] = useState<any[]>([]);

  const load = () => {
    const url = filterManager ? `/api/inventory?managerId=${filterManager}` : "/api/inventory";
    fetch(url).then((r) => r.json()).then((d) => { setItems(d); setLoading(false); });
    fetch("/api/users?role=MANAGER").then((r) => r.json()).then((d) => setManagers(d));
  };
  useEffect(() => { load(); }, [filterManager]);

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowModal(false); load();
  };

  const adjustQty = async (id: string, delta: number) => {
    await fetch("/api/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, delta }) });
    load();
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Inventory</h1>
          <p className="section-title-sub" style={{ marginTop: 4 }}>Stock levels across all managers</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary"><Icon name="plus" size={18} /><span>Add stock</span></button>
      </div>

      <GlassCard padding="sm" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label className="label" style={{ marginBottom: 0, flexShrink: 0 }}>Manager</label>
          <select value={filterManager} onChange={(e) => setFilterManager(e.target.value)} className="input" style={{ flex: 1 }}>
            <option value="">All managers</option>
            {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </GlassCard>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>Loading…</div>
      ) : items.length === 0 ? (
        <GlassCard padding="lg"><div className="empty-state"><div className="empty-state-icon">📦</div>No inventory yet</div></GlassCard>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((item: any) => (
            <GlassCard key={item.id} padding="md">
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div className="avatar avatar-sm">{item.productLevel.replace("LEVEL_", "")}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{item.productModel} · {item.productStyle}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{item.manager?.name}{item.quantity <= item.lowStockThreshold && " · Low stock"}</p>
                </div>
                <p style={{ fontSize: "1.125rem", fontWeight: 800, color: item.quantity <= item.lowStockThreshold ? "var(--color-danger)" : "var(--color-text)", minWidth: 40, textAlign: "right" }}>{item.quantity}</p>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => adjustQty(item.id, -1)} className="btn btn-ghost" style={{ minHeight: 32, minWidth: 32, padding: 0, fontSize: "1rem", fontWeight: 700 }} aria-label="Decrease">−</button>
                  <button onClick={() => adjustQty(item.id, 1)} className="btn btn-ghost" style={{ minHeight: 32, minWidth: 32, padding: 0, fontSize: "1rem", fontWeight: 700 }} aria-label="Increase">+</button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Add / update stock</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ minHeight: 32, padding: "0.375rem" }}><Icon name="x" size={18} /></button>
            </div>
            <form onSubmit={saveItem} style={{ display: "grid", gap: 12 }}>
              <div><label className="label">Manager</label>
                <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })} className="input">
                  <option value="">Select manager</option>
                  {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div><label className="label">Level</label>
                <select value={form.productLevel} onChange={(e) => setForm({ ...form, productLevel: e.target.value, productModel: "" })} className="input">
                  {(Object.keys(PRODUCT_LEVELS) as ProductLevel[]).map((l) => <option key={l} value={l}>Level {PRODUCT_LEVELS[l].label}</option>)}
                </select>
              </div>
              <div><label className="label">Model</label>
                <select value={form.productModel} onChange={(e) => setForm({ ...form, productModel: e.target.value })} className="input">
                  <option value="">Select model</option>
                  {PRODUCT_MODELS[form.productLevel as ProductLevel].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div><label className="label">Style</label>
                <select value={form.productStyle} onChange={(e) => setForm({ ...form, productStyle: e.target.value })} className="input">
                  <option value="">Select style</option>
                  {PRODUCT_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="label">Quantity</label>
                <input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} className="input" />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminInventoryPage() {
  return <ClientAuthShell requireAdmin pageTitle="Inventory"><InventoryInner /></ClientAuthShell>;
}
