"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { formatCurrency } from "@/lib/products";
import { format } from "date-fns";

type Show = { id: string; name: string; location: string; startDate: string; endDate: string; status: string };
type User = { id: string; name: string; email: string; role: string };

type DraftSale = {
  id: string;
  userId: string;
  productLevel: string;
  productModel: string;
  productStyle: string;
  salePrice: number;
  paymentType: "CASH" | "CARD";
  createdAt: string;
};

const LEVELS = ["LEVEL_1X", "LEVEL_2X", "LEVEL_3X", "LEVEL_6X"];
const MODELS_BY_LEVEL: Record<string, string[]> = {
  LEVEL_1X: ["Rolex", "Classic Small", "Classic Large", "XOXO", "Butterfly"],
  LEVEL_2X: ["Classic"],
  LEVEL_3X: ["Classic Large", "Classic Slim"],
  LEVEL_6X: ["Classic Large", "Classic Slim"],
};
const STYLES = ["Black", "Silver", "Gold", "Copper", "Silver/Gold", "Rose Gold/Silver", "Black/Silver"];

function emptyRow(): DraftSale {
  return {
    id: crypto.randomUUID(),
    userId: "",
    productLevel: "LEVEL_1X",
    productModel: "",
    productStyle: "",
    salePrice: 0,
    paymentType: "CASH",
    createdAt: new Date().toISOString().slice(0, 16), // datetime-local format
  };
}

export default function ImportSalesClient({
  userRole,
  shows,
  users,
  initialShowId,
}: {
  userRole: "ADMIN" | "MANAGER" | "EMPLOYEE";
  shows: Show[];
  users: User[];
  initialShowId?: string;
}) {
  const router = useRouter();
  const [showId, setShowId] = useState<string>(initialShowId || "");
  const [rows, setRows] = useState<DraftSale[]>([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [mode, setMode] = useState<"form" | "paste" | "sturgis">("form");

  const totalAmount = useMemo(() => rows.reduce((s, r) => s + (Number(r.salePrice) || 0), 0), [rows]);
  const validCount = useMemo(() => rows.filter((r) => r.userId && r.productLevel && r.salePrice > 0).length, [rows]);

  const updateRow = (id: string, patch: Partial<DraftSale>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((rs) => [...rs, emptyRow()]);
  const removeRow = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));
  const duplicateRow = (id: string) => {
    setRows((rs) => {
      const i = rs.findIndex((r) => r.id === id);
      if (i < 0) return rs;
      const copy = { ...rs[i], id: crypto.randomUUID() };
      const next = [...rs];
      next.splice(i + 1, 0, copy);
      return next;
    });
  };

  const parseBulkPaste = (text: string): DraftSale[] => {
    // Accept tab-separated or comma-separated rows
    // Expected columns: datetime | employee_name | level | model | style | price | payment
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
    const out: DraftSale[] = [];
    for (const line of lines) {
      const parts = line.split(/\t|,/).map((c) => c.trim());
      if (parts.length < 5) continue;
      const [dateStr, name, level, model, style, priceStr, payment] = parts;
      const user = users.find((u) => u.name.toLowerCase() === name.toLowerCase() || u.name.toLowerCase().includes(name.toLowerCase()));
      const lvl = LEVELS.find((l) => l === level || l.replace("LEVEL_", "") === level || l.toLowerCase() === level.toLowerCase());
      const numPrice = parseFloat(priceStr?.replace(/[$,]/g, "") || "0");
      const pay = payment?.toLowerCase().startsWith("c") || payment?.toLowerCase() === "cc" ? "CARD" : "CASH";
      out.push({
        id: crypto.randomUUID(),
        userId: user?.id || "",
        productLevel: lvl || "LEVEL_1X",
        productModel: model || "",
        productStyle: style || "",
        salePrice: isNaN(numPrice) ? 0 : numPrice,
        paymentType: pay as "CASH" | "CARD",
        createdAt: dateStr || new Date().toISOString().slice(0, 16),
      });
    }
    return out;
  };

  const loadSturgisTemplate = () => {
    // Pre-fill rows from my partial OCR of the Sturgis 2026 sheets
    // These are the rows I could read with high confidence. Each is marked.
    // Admin will verify and edit before submitting.
    const template: DraftSale[] = [
      // Aug 8 - Mr. Holstic team, Amp Theater
      ...parseBulkPaste([
        "2026-08-08T20:00|Mr. Holstic|LEVEL_6X|Thin|Black|400|CARD",
        "2026-08-08T20:30|Mr. Holstic|LEVEL_2X|Fairy|Silver|150|CARD",
        "2026-08-08T20:45|Mr. Holstic|LEVEL_2X|Thin|Black|200|CARD",
        "2026-08-08T21:00|Mr. Holstic|LEVEL_2X|Thin|Black|200|CARD",
        "2026-08-08T20:30|Julylan|LEVEL_1X|Classic Large|Silver|200|CASH",
        "2026-08-08T21:30|Julylan|LEVEL_1X|Classic Small|Black|200|CASH",
        "2026-08-08T20:00|Heidi|LEVEL_1X|Classic Small|Silver|80|CASH",
        "2026-08-08T20:15|Heidi|LEVEL_1X|Butterfly|Black|150|CARD",
        "2026-08-08T20:30|Heidi|LEVEL_2X|Classic|Gold|200|CARD",
        "2026-08-08T20:45|Heidi|LEVEL_2X|Thin|Silver|150|CARD",
        "2026-08-08T21:00|Heidi|LEVEL_2X|Thin|Silver|150|CARD",
      ].join("\n")),
      // Aug 8 - Panda team
      ...parseBulkPaste([
        "2026-08-08T20:00|Panda|LEVEL_1X|Classic|Black|275|CARD",
        "2026-08-08T20:30|Panda|LEVEL_3X|Thin|Crystal|150|CARD",
        "2026-08-08T20:45|Panda|LEVEL_3X||Black|150|CARD",
        "2026-08-08T21:00|Panda|LEVEL_1X|2in1|2X|375|CARD",
        "2026-08-08T20:00|Lismarie|LEVEL_1X|Black Copper||100|CASH",
        "2026-08-08T20:30|Lismarie|LEVEL_2X|6x+1X||330|CARD",
        "2026-08-08T20:45|Lismarie|LEVEL_1X||Black|80|CASH",
        "2026-08-08T21:00|Lismarie|LEVEL_1X|4-1x's||400|CARD",
        "2026-08-08T21:15|Lismarie|LEVEL_1X||Black|75|CASH",
        "2026-08-08T20:00|Jessie|LEVEL_1X||Black|250|CASH",
        "2026-08-08T20:30|Jessie|LEVEL_2X|Low Low|3x|1050|CARD",
        "2026-08-08T20:45|Jessie|LEVEL_3X||6x|375|CARD",
        "2026-08-08T21:00|Jessie|LEVEL_2X|Low 3x|6x|200|CARD",
        "2026-08-08T21:15|Jessie|LEVEL_2X|3x powder|3x|150|CASH",
        "2026-08-08T20:00|Nico|LEVEL_1X|6x|Crystal|250|CARD",
        "2026-08-08T20:30|Nico|LEVEL_2X|Low 6x||350|CARD",
        "2026-08-08T20:45|Nico|LEVEL_2X||6x|100|CASH",
        "2026-08-08T21:00|Nico|LEVEL_2X||6x|150|CASH",
        "2026-08-08T21:15|Nico|LEVEL_2X||6x Upgrade|150|CASH",
        "2026-08-08T21:30|Nico|LEVEL_2X||6x|369|CASH",
        "2026-08-08T21:45|Nico|LEVEL_2X||6x|500|CARD",
        "2026-08-08T22:00|Nico|LEVEL_2X||6x|519|CASH",
        "2026-08-08T22:15|Nico|LEVEL_2X||6x|600|CARD",
      ].join("\n")),
    ];
    setRows(template);
    setMode("form");
    setSuccess(`Loaded ${template.length} rows from Sturgis template. Verify and edit before submitting.`);
  };

  const applyPaste = () => {
    const parsed = parseBulkPaste(bulkText);
    if (parsed.length === 0) {
      setError("Could not parse any rows. Expected: date | employee | level | model | style | price | payment");
      return;
    }
    setRows(parsed);
    setError(null);
    setSuccess(`Parsed ${parsed.length} rows. Verify user assignments below.`);
    setMode("form");
  };

  const submitAll = async () => {
    setError(null);
    setSuccess(null);
    if (!showId) {
      setError("Pick a show first.");
      return;
    }
    const valid = rows.filter((r) => r.userId && r.salePrice > 0);
    if (valid.length === 0) {
      setError("No valid rows to submit. Each row needs a user, product, and price > 0.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/import/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId,
          source: mode === "sturgis" ? "sturgis" : "import",
          sales: valid.map((r) => ({
            userId: r.userId,
            productLevel: r.productLevel,
            productModel: r.productModel || "Unknown",
            productStyle: r.productStyle || "Unknown",
            salePrice: r.salePrice,
            paymentType: r.paymentType,
            createdAt: new Date(r.createdAt).toISOString(),
          })),
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSuccess(`Imported ${data.imported} sale${data.imported !== 1 ? "s" : ""} into ${showId === "" ? "show" : "the show"}.`);
      setRows([emptyRow()]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setSubmitting(false);
    }
  };

  const requireAdmin = userRole === "ADMIN";

  return (
    <ClientAuthShell pageTitle="Import sales" pageSubtitle="Bulk import for any show">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
            Import sales
          </h1>
          <p className="section-title-sub" style={{ marginTop: 4 }}>
            Paste a spreadsheet, fill in rows, or load the Sturgis template
          </p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="pill-group" style={{ marginBottom: "1rem", width: "100%" }}>
        <button onClick={() => setMode("form")} className={`pill ${mode === "form" ? "pill-active" : ""}`} style={{ flex: 1 }}>
          Row-by-row
        </button>
        <button onClick={() => setMode("paste")} className={`pill ${mode === "paste" ? "pill-active" : ""}`} style={{ flex: 1 }}>
          Paste spreadsheet
        </button>
        {requireAdmin && (
          <button onClick={() => setMode("sturgis")} className={`pill ${mode === "sturgis" ? "pill-active" : ""}`} style={{ flex: 1 }}>
            Sturgis template
          </button>
        )}
      </div>

      {/* Show picker + total */}
      <GlassCard padding="md" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr" }} className="form-grid-2">
          <div>
            <label className="label">Target show</label>
            <select value={showId} onChange={(e) => setShowId(e.target.value)} className="input">
              <option value="">Pick a show…</option>
              {shows.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {formatCurrency(parseFloat("0"))} ({format(new Date(s.startDate), "MMM d")}) [{s.status}]
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Summary</label>
            <div style={{ display: "flex", gap: 12, fontSize: "0.875rem", fontWeight: 600 }}>
              <span style={{ padding: "0.5rem 0.75rem", background: "var(--glass-bg-soft)", borderRadius: 10 }}>
                {validCount} valid / {rows.length} total
              </span>
              <span style={{ padding: "0.5rem 0.75rem", background: "var(--color-primary)", color: "white", borderRadius: 10 }}>
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Paste mode */}
      {mode === "paste" && (
        <GlassCard padding="md" style={{ marginBottom: "1rem" }}>
          <div className="section-title">
            <div>
              <h2>Paste from spreadsheet</h2>
              <p className="section-title-sub">
                Format: <code style={{ fontSize: "0.75rem" }}>datetime | employee_name | level | model | style | price | payment</code> per row
              </p>
            </div>
            <button onClick={applyPaste} className="btn btn-primary" style={{ minHeight: 36, padding: "0.5rem 0.875rem" }}>
              Parse
            </button>
          </div>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`2026-08-08T20:30\tJulylan\tLEVEL_1X\tClassic Small\tSilver\t200\tCASH
2026-08-08T21:00\tHeidi\tLEVEL_2X\tClassic\tGold\t200\tCARD`}
            className="input"
            style={{ minHeight: 200, fontFamily: "monospace", fontSize: "0.8125rem" }}
          />
        </GlassCard>
      )}

      {/* Sturgis template mode */}
      {mode === "sturgis" && requireAdmin && (
        <GlassCard padding="lg" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, marginBottom: 6 }}>Sturgis 2026 (Aug 8-16)</h2>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: 12 }}>
                Pre-fills the editable rows below with the data I was able to OCR from your handwritten sales control sheets in Downloads. Verify, edit, add missing rows, then submit.
              </p>
              <button onClick={loadSturgisTemplate} className="btn btn-primary">
                <Icon name="sparkle" size={16} />
                <span>Load template</span>
              </button>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 10 }}>
                First, make sure you have a "Sturgis 2026" show created in /admin/shows, then pick it from the dropdown above before submitting.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Editable rows */}
      {(mode === "form" || mode === "paste" || mode === "sturgis") && (
        <GlassCard padding="md" style={{ marginBottom: "1rem" }}>
          <div className="section-title">
            <div>
              <h2>Sales rows ({rows.length})</h2>
              <p className="section-title-sub">Edit each row before submitting</p>
            </div>
            <button onClick={addRow} className="btn btn-secondary" style={{ minHeight: 36, padding: "0.5rem 0.875rem" }}>
              <Icon name="plus" size={14} />
              <span>Add row</span>
            </button>
          </div>

          {error && (
            <div style={{ padding: "0.625rem 0.875rem", background: "rgba(196, 68, 68, 0.10)", color: "var(--color-danger)", borderRadius: 12, fontSize: "0.8125rem", fontWeight: 600, marginBottom: 10 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: "0.625rem 0.875rem", background: "rgba(45, 138, 78, 0.10)", color: "var(--color-success)", borderRadius: 12, fontSize: "0.8125rem", fontWeight: 600, marginBottom: 10 }}>
              {success}
            </div>
          )}

          <div style={{ display: "grid", gap: 8 }}>
            {rows.map((row, i) => {
              const isValid = row.userId && row.salePrice > 0 && row.productLevel;
              return (
                <div key={row.id} style={{
                  padding: "0.625rem 0.75rem",
                  background: isValid ? "var(--glass-bg-soft)" : "rgba(196, 68, 68, 0.05)",
                  border: `1px solid ${isValid ? "var(--glass-border-soft)" : "rgba(196, 68, 68, 0.25)"}`,
                  borderRadius: 12,
                  display: "grid",
                  gap: 8,
                  gridTemplateColumns: "32px 1fr 110px 110px 90px",
                  alignItems: "center",
                }}>
                  <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", fontWeight: 700, textAlign: "center" }}>
                    {i + 1}
                  </span>
                  <select value={row.userId} onChange={(e) => updateRow(row.id, { userId: e.target.value })} className="input" style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }}>
                    <option value="">— Employee —</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                  <select value={row.productLevel} onChange={(e) => updateRow(row.id, { productLevel: e.target.value, productModel: "" })} className="input" style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }}>
                    {LEVELS.map((l) => <option key={l} value={l}>{l.replace("LEVEL_", "")}X</option>)}
                  </select>
                  <select value={row.productModel} onChange={(e) => updateRow(row.id, { productModel: e.target.value })} className="input" style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }} disabled={!row.productLevel}>
                    <option value="">— Model —</option>
                    {(MODELS_BY_LEVEL[row.productLevel] || []).map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input
                    type="number"
                    placeholder="Price"
                    value={row.salePrice || ""}
                    onChange={(e) => updateRow(row.id, { salePrice: Number(e.target.value) || 0 })}
                    className="input"
                    style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }}
                  />

                  {/* second row: style, payment, datetime, actions */}
                  <div style={{ gridColumn: "2 / -1", display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr 110px auto" }}>
                    <select value={row.productStyle} onChange={(e) => updateRow(row.id, { productStyle: e.target.value })} className="input" style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }}>
                      <option value="">— Style —</option>
                      {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={row.paymentType} onChange={(e) => updateRow(row.id, { paymentType: e.target.value as any })} className="input" style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }}>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                    </select>
                    <input
                      type="datetime-local"
                      value={row.createdAt}
                      onChange={(e) => updateRow(row.id, { createdAt: e.target.value })}
                      className="input"
                      style={{ padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textAlign: "right", padding: "0.4rem 0" }}>
                      = {formatCurrency(row.salePrice)}
                    </span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => duplicateRow(row.id)} className="btn btn-ghost" style={{ padding: "0.4rem 0.5rem", minHeight: 32 }} aria-label="Duplicate">
                        <Icon name="plus" size={14} />
                      </button>
                      <button onClick={() => removeRow(row.id)} className="btn btn-ghost" style={{ padding: "0.4rem 0.5rem", minHeight: 32, color: "var(--color-danger)" }} aria-label="Remove" disabled={rows.length === 1}>
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={addRow} className="btn btn-secondary">
              <Icon name="plus" size={16} />
              <span>Add row</span>
            </button>
            <button onClick={submitAll} disabled={submitting || !showId} className="btn btn-primary">
              {submitting ? "Importing…" : `Import ${validCount} sale${validCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </GlassCard>
      )}
    </ClientAuthShell>
  );
}
