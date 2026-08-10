"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/products";

export default function AdminGroceryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterShow, setFilterShow] = useState("");
  const [newItem, setNewItem] = useState("");

  const load = () => {
    const url = filterShow ? `/api/grocery?showId=${filterShow}` : "/api/grocery";
    fetch(url).then((r) => r.json()).then((d) => { setItems(d); setLoading(false); });
    fetch("/api/shows?status=ACTIVE").then((r) => r.json()).then((d) => setShows(d));
  };

  useEffect(() => { load(); }, [filterShow]);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    await fetch("/api/grocery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showId: filterShow, item: newItem }),
    });
    setNewItem("");
    load();
  };

  const togglePurchased = async (id: string, currentStatus: string) => {
    await fetch(`/api/grocery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: currentStatus === "PURCHASED" ? "PENDING" : "PURCHASED" }),
    });
    load();
  };

  const pending = items.filter((i) => i.status === "PENDING");
  const purchased = items.filter((i) => i.status === "PURCHASED");
  const totalEstCost = pending.reduce((sum: number, i: any) => sum + (i.estimatedCost || 0), 0);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="bg-[var(--color-primary)] text-white px-6 py-5">
        <h1 className="text-xl font-bold">🥗 Grocery List</h1>
        <p className="text-sm opacity-80 mt-0.5">Cost-effective meals for show crew</p>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[var(--color-text-muted)]">Show:</label>
          <select value={filterShow} onChange={(e) => setFilterShow(e.target.value)} className="px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-sm">
            <option value="">All Shows</option>
            {shows.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Add item */}
        <form onSubmit={addItem} className="flex gap-2">
          <input
            type="text"
            placeholder="Add grocery item..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-lg"
          />
          <button type="submit" className="px-4 py-2 bg-[var(--color-primary)] text-white font-semibold rounded-lg">Add</button>
        </form>

        {/* Estimated cost */}
        {totalEstCost > 0 && (
          <div className="text-right text-sm text-[var(--color-text-muted)]">
            Estimated total: <span className="font-medium text-[var(--color-text)]">{formatCurrency(totalEstCost)}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">Loading...</div>
        ) : items.length === 0 && !filterShow ? (
          <div className="card text-center py-12 text-[var(--color-text-muted)]">No grocery items yet. Add items above.</div>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
                  To Buy ({pending.length})
                </h2>
                <div className="space-y-1">
                  {pending.map((item: any) => (
                    <div key={item.id} className="card flex items-center gap-3 py-2">
                      <button
                        onClick={() => togglePurchased(item.id, item.status)}
                        className="w-5 h-5 rounded border border-[var(--color-border)] flex-shrink-0"
                      />
                      <span className="flex-1 text-sm">{item.item}</span>
                      {item.quantity && <span className="text-xs text-[var(--color-text-muted)]">{item.quantity}</span>}
                      {item.estimatedCost && <span className="text-xs text-[var(--color-secondary)]">{formatCurrency(item.estimatedCost)}</span>}
                      {item.show && <span className="text-xs text-[var(--color-text-muted)]">{item.show.name}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Purchased */}
            {purchased.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
                  Purchased ({purchased.length})
                </h2>
                <div className="space-y-1">
                  {purchased.map((item: any) => (
                    <div key={item.id} className="card flex items-center gap-3 py-2 opacity-60">
                      <button
                        onClick={() => togglePurchased(item.id, item.status)}
                        className="w-5 h-5 rounded bg-[var(--color-success)] border border-[var(--color-success)] flex-shrink-0 flex items-center justify-center text-white text-xs"
                      >
                        ✓
                      </button>
                      <span className="flex-1 text-sm line-through">{item.item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
