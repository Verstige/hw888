"use client";

import { useState, useEffect } from "react";
import { PRODUCT_LEVELS, PRODUCT_MODELS, PRODUCT_STYLES } from "@/lib/products";
import type { ProductLevel } from "@/lib/products";

export default function AdminInventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterManager, setFilterManager] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ managerId: "", productLevel: "LEVEL_1X", productModel: "", productStyle: "", quantity: 0 });
  const [managers, setManagers] = useState<any[]>([]);

  const load = () => {
    const url = filterManager ? `/api/inventory?managerId=${filterManager}` : "/api/inventory";
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setItems(d); setLoading(false); });
    fetch("/api/users?role=MANAGER")
      .then((r) => r.json())
      .then((d) => setManagers(d));
  };

  useEffect(() => { load(); }, [filterManager]);

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    load();
  };

  const adjustQty = async (id: string, delta: number) => {
    await fetch("/api/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, delta }),
    });
    load();
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="bg-[var(--color-primary)] text-white px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Inventory Tracker</h1>
            <p className="text-sm opacity-80 mt-0.5">All managers&apos; stock levels</p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-white text-[var(--color-primary)] font-semibold rounded-lg">
            + Add Stock
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* Filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[var(--color-text-muted)]">Manager:</label>
          <select
            value={filterManager}
            onChange={(e) => setFilterManager(e.target.value)}
            className="px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-sm"
          >
            <option value="">All Managers</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">Loading...</div>
        ) : items.length === 0 ? (
          <div className="card text-center py-12 text-[var(--color-text-muted)]">
            No inventory items yet. Add stock to get started.
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-sm text-[var(--color-text-muted)]">
                  <th className="px-4 py-3 font-medium">Manager</th>
                  <th className="px-4 py-3 font-medium">Level</th>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Style</th>
                  <th className="px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-center">Adjust</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]">
                    <td className="px-4 py-3 text-sm">{item.manager.name}</td>
                    <td className="px-4 py-3 text-sm">{item.productLevel.replace("LEVEL_", "")}</td>
                    <td className="px-4 py-3 text-sm">{item.productModel}</td>
                    <td className="px-4 py-3 text-sm">{item.productStyle}</td>
                    <td className={`px-4 py-3 text-right font-bold ${item.quantity <= item.lowStockThreshold ? "text-[var(--color-danger)]" : ""}`}>
                      {item.quantity}
                      {item.quantity <= item.lowStockThreshold && <span className="text-xs ml-1">⚠️</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => adjustQty(item.id, -1)} className="w-7 h-7 rounded border border-[var(--color-border)] text-sm font-bold hover:bg-[var(--color-bg-dark)]">−</button>
                        <button onClick={() => adjustQty(item.id, 1)} className="w-7 h-7 rounded border border-[var(--color-border)] text-sm font-bold hover:bg-[var(--color-bg-dark)]">+</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-[var(--color-surface)] rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">Add / Update Stock</h2>
            <form onSubmit={saveItem} className="space-y-3">
              <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg">
                <option value="">Select Manager</option>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select value={form.productLevel} onChange={(e) => setForm({ ...form, productLevel: e.target.value, productModel: "" })} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg">
                {(Object.keys(PRODUCT_LEVELS) as ProductLevel[]).map((l) => (
                  <option key={l} value={l}>Level {PRODUCT_LEVELS[l].label}</option>
                ))}
              </select>
              <select value={form.productModel} onChange={(e) => setForm({ ...form, productModel: e.target.value })} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg">
                <option value="">Select Model</option>
                {PRODUCT_MODELS[form.productLevel as ProductLevel].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select value={form.productStyle} onChange={(e) => setForm({ ...form, productStyle: e.target.value })} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg">
                <option value="">Select Style</option>
                {PRODUCT_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-[var(--color-border)] rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-[var(--color-primary)] text-white font-semibold rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
