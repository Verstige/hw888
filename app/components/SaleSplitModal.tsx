"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/app/components/Icon";

type Props = {
  saleId: string;
  onClose: () => void;
};

export function SaleSplitModal({ saleId, onClose }: Props) {
  const router = useRouter();
  const [splits, setSplits] = useState([
    { userId: "", fraction: 0.5 },
    { userId: "", fraction: 0.5 },
  ]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers).catch(() => {});
  }, []);

  const totalFraction = splits.reduce((s, x) => s + (Number(x.fraction) || 0), 0);
  const isValid = Math.abs(totalFraction - 1.0) < 0.01 && splits.every((s) => s.userId) && splits.length >= 2;

  const submit = async () => {
    setError(null);
    if (!isValid) {
      setError("Fractions must sum to 1.0 and each split needs an employee.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sales/${saleId}/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ splits, reason: reason || null }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Split failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Split sale between employees</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 2 }}>
              Fractions must sum to 1.0
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ minHeight: 32, padding: "0.375rem" }} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {splits.map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 36px", gap: 8, alignItems: "center" }}>
              <select value={s.userId} onChange={(e) => setSplits((arr) => arr.map((x, j) => j === i ? { ...x, userId: e.target.value } : x))} className="input">
                <option value="">— Employee —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={s.fraction}
                onChange={(e) => setSplits((arr) => arr.map((x, j) => j === i ? { ...x, fraction: parseFloat(e.target.value) || 0 } : x))}
                className="input"
                placeholder="0.5"
              />
              <button
                onClick={() => setSplits((arr) => arr.filter((_, j) => j !== i))}
                className="btn btn-ghost"
                style={{ padding: "0.4rem", minHeight: 36, color: splits.length <= 2 ? "var(--color-text-muted)" : "var(--color-danger)" }}
                disabled={splits.length <= 2}
                aria-label="Remove split"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
          <button onClick={() => setSplits((arr) => [...arr, { userId: "", fraction: 0 }])} className="btn btn-secondary" style={{ minHeight: 36, padding: "0.5rem 0.875rem" }}>
            <Icon name="plus" size={14} />
            <span>Add split</span>
          </button>

          <div style={{ padding: "0.625rem 0.875rem", background: Math.abs(totalFraction - 1.0) < 0.01 ? "rgba(45, 138, 78, 0.10)" : "rgba(196, 68, 68, 0.10)", borderRadius: 10, fontSize: "0.8125rem", color: Math.abs(totalFraction - 1.0) < 0.01 ? "var(--color-success)" : "var(--color-danger)", fontWeight: 600, textAlign: "center" }}>
            Total fraction: {totalFraction.toFixed(3)} {Math.abs(totalFraction - 1.0) < 0.01 ? "✓" : "(needs to equal 1.0)"}
          </div>

          <div>
            <label className="label">Reason (optional)</label>
            <input type="text" className="input" placeholder="e.g. Both helped close the sale" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          {error && (
            <div style={{ padding: "0.625rem 0.875rem", background: "rgba(196, 68, 68, 0.10)", color: "var(--color-danger)", borderRadius: 10, fontSize: "0.8125rem", fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button onClick={submit} disabled={submitting || !isValid} className="btn btn-primary" style={{ flex: 1 }}>
              {submitting ? "Splitting…" : "Split sale"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
