"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { PriceSheetModal } from "@/app/components/PriceSheetModal";
import { PRODUCT_LEVELS, PRODUCT_MODELS, PRODUCT_STYLES, formatCurrency } from "@/lib/products";
import type { ProductLevel } from "@/lib/products";

type Step = "level" | "model" | "style" | "payment" | "done";
type Drawer = { showId: string; show: { id: string; name: string; location: string }; openingFloat: number };

const PRESET_DISCOUNTS = [
  { amount: 100, label: "$100 off" },
  { amount: 150, label: "$150 off" },
];

function SaleInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlShowId = searchParams.get("showId");

  const [step, setStep] = useState<Step>("level");
  const [selectedLevel, setSelectedLevel] = useState<ProductLevel | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<"CASH" | "CARD" | null>(null);
  const [activeShowId, setActiveShowId] = useState<string | null>(null);
  const [activeShow, setActiveShow] = useState<any>(null);
  const [openDrawers, setOpenDrawers] = useState<Drawer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSale, setLastSale] = useState<any>(null);
  const [needsPick, setNeedsPick] = useState(false);

  // Discount state
  const [discount, setDiscount] = useState<number>(0); // 0 | 100 | 150 | custom
  const [customDiscount, setCustomDiscount] = useState<string>("");
  const [discountReason, setDiscountReason] = useState<string>("");
  const [showPriceSheet, setShowPriceSheet] = useState(false);

  // Load all open drawers
  const refreshDrawers = useCallback(async () => {
    try {
      const r = await fetch("/api/drawer/list");
      if (r.ok) {
        const data = await r.json();
        const drawers: Drawer[] = Array.isArray(data) ? data : [];
        setOpenDrawers(drawers);
        return drawers;
      }
    } catch {}
    setOpenDrawers([]);
    return [];
  }, []);

  useEffect(() => {
    (async () => {
      const drawers = await refreshDrawers();
      let chosen: Drawer | undefined;
      if (urlShowId) chosen = drawers.find((d) => d.showId === urlShowId);
      if (!chosen && drawers.length === 1) chosen = drawers[0];
      if (chosen) {
        setActiveShowId(chosen.showId);
        setActiveShow(chosen.show);
        setNeedsPick(false);
      } else if (drawers.length > 1) {
        setNeedsPick(true);
      } else {
        setActiveShowId(null);
        setActiveShow(null);
        setNeedsPick(false);
      }
      setIsOnline(navigator.onLine);
      try {
        const { getPendingCount } = await import("@/lib/offline");
        setPendingCount(await getPendingCount());
      } catch {}
    })();
    window.addEventListener("online", () => setIsOnline(true));
    window.addEventListener("offline", () => setIsOnline(false));
  }, [urlShowId, refreshDrawers]);

  const reset = () => {
    setStep("level");
    setSelectedLevel(null);
    setSelectedModel(null);
    setSelectedStyle(null);
    setPaymentType(null);
    setDiscount(0);
    setCustomDiscount("");
    setDiscountReason("");
  };

  // Effective discount amount + final price computation
  const effectiveDiscount = discount === -1 ? (Number(customDiscount) || 0) : discount;
  const level = selectedLevel ? PRODUCT_LEVELS[selectedLevel] : null;
  const finalPrice = level ? Math.max(0, level.retail - effectiveDiscount) : 0;
  // Commission on final price (per user choice)
  const commissionAt30 = finalPrice * 0.30;

  const handleSale = async () => {
    if (!activeShowId || !selectedLevel || !selectedModel || !selectedStyle || !paymentType) return;
    setIsSubmitting(true);
    const payload = {
      showId: activeShowId,
      productLevel: selectedLevel,
      productModel: selectedModel,
      productStyle: selectedStyle,
      salePrice: level!.retail, // server applies the discount
      paymentType,
      discount: effectiveDiscount > 0 ? effectiveDiscount : undefined,
      discountReason: effectiveDiscount > 0 ? (discount === -1 ? (discountReason || "Custom discount") : `Preset $${effectiveDiscount} off`) : undefined,
    };
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const sale = await res.json();
      setLastSale(sale);
      setStep("done");
      setTimeout(() => reset(), 4500);
    } catch (e) {
      alert("Could not save sale. Try again or use offline mode.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeShowId && !needsPick) {
    return (
      <ClientAuthShell pageTitle="Record a sale">
        <GlassCard padding="lg">
          <div className="empty-state">
            <div className="empty-state-icon">💵</div>
            <p style={{ marginBottom: 8 }}>No active cash drawer</p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: 16 }}>
              You need to open a cash drawer for a show before recording sales.
            </p>
            <Link href="/shows" className="btn btn-primary">
              <Icon name="plus" size={16} /><span>Open a show</span>
            </Link>
          </div>
        </GlassCard>
      </ClientAuthShell>
    );
  }

  if (needsPick) {
    return (
      <ClientAuthShell pageTitle="Pick a show">
        <div style={{ marginBottom: 12 }}>
          <h1 className="text-gradient" style={{ fontSize: "1.5rem", fontWeight: 800 }}>Which show?</h1>
          <p className="section-title-sub" style={{ marginTop: 4 }}>{openDrawers.length} cash drawers open — pick one to record sales against.</p>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {openDrawers.map((d) => (
            <GlassCard key={d.showId} interactive padding="md" onClick={() => { setActiveShowId(d.showId); setActiveShow(d.show); setNeedsPick(false); }}>
              <p style={{ fontWeight: 700 }}>{d.show.name}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{d.show.location}</p>
            </GlassCard>
          ))}
        </div>
      </ClientAuthShell>
    );
  }

  const steps: Step[] = ["level", "model", "style", "payment"];
  const currentIdx = steps.indexOf(step);

  return (
    <>
      {showPriceSheet && (
        <PriceSheetModal onClose={() => setShowPriceSheet(false)} showName={activeShow?.name} />
      )}

      <ClientAuthShell pageTitle="Record a sale" pageSubtitle={activeShow?.name}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: "1rem" }}>
          <div>
            <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
              Record a sale
            </h1>
            <p className="section-title-sub" style={{ marginTop: 4 }}>{activeShow?.name}</p>
          </div>
          <button onClick={() => setShowPriceSheet(true)} className="btn btn-secondary" style={{ minHeight: 40 }}>
            <Icon name="search" size={16} /><span>Price sheet</span>
          </button>
        </div>

        <GlassCard padding="md" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={`status-dot ${isOnline ? "status-success" : "status-warning"}`} />
              <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{isOnline ? "Online" : "Offline"}</span>
            </div>
            {pendingCount > 0 && <span className="badge" style={{ background: "rgba(255, 255, 255, 0.18)", color: "white", borderColor: "rgba(255, 255, 255, 0.20)" }}>{pendingCount} queued</span>}
          </div>
        </GlassCard>

        {step !== "done" && (
          <div className="step-indicator" style={{ marginBottom: "1rem" }}>
            {steps.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div className={`step-bubble ${i === currentIdx ? "step-bubble-active" : i < currentIdx ? "step-bubble-done" : ""}`}>
                  {i < currentIdx ? <Icon name="check" size={14} /> : i + 1}
                </div>
                {i < steps.length - 1 && <div className={`step-line ${i < currentIdx ? "step-line-done" : ""}`} />}
              </div>
            ))}
          </div>
        )}

        {step === "level" && (
          <div style={{ display: "grid", gap: 12 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, textAlign: "center", marginBottom: 4 }}>Select bracelet level</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(Object.entries(PRODUCT_LEVELS) as [ProductLevel, typeof PRODUCT_LEVELS[ProductLevel]][]).map(([key, val]) => (
                <GlassCard key={key} interactive padding="md" onClick={() => { setSelectedLevel(key); setStep("model"); }} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.6875rem", fontWeight: 800, color: "var(--color-primary)", marginBottom: 4, letterSpacing: "0.06em" }}>LEVEL {val.label}</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{formatCurrency(val.retail)}</div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: 4 }}>You earn {formatCurrency(val.commission)}</div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {step === "model" && selectedLevel && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={() => setStep("level")} className="btn btn-ghost" style={{ minHeight: 36, padding: "0.375rem 0.625rem" }}>
                <Icon name="arrow-left" size={16} /><span>Back</span>
              </button>
              <span className="badge badge-primary">Level {PRODUCT_LEVELS[selectedLevel].label}</span>
            </div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, textAlign: "center", marginBottom: 4 }}>Select model</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {PRODUCT_MODELS[selectedLevel].map((model) => (
                <GlassCard key={model} interactive padding="md" onClick={() => { setSelectedModel(model); setStep("style"); }}>
                  <p style={{ fontWeight: 600 }}>{model}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {step === "style" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={() => setStep("model")} className="btn btn-ghost" style={{ minHeight: 36, padding: "0.375rem 0.625rem" }}>
                <Icon name="arrow-left" size={16} /><span>Back</span>
              </button>
              <span className="badge badge-primary">{selectedModel}</span>
            </div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, textAlign: "center", marginBottom: 4 }}>Select style</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {PRODUCT_STYLES.map((style) => (
                <GlassCard key={style} interactive padding="md" onClick={() => { setSelectedStyle(style); setStep("payment"); }} style={{ textAlign: "center" }}>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{style}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {step === "payment" && (
          <div style={{ display: "grid", gap: 12 }}>
            <button onClick={() => setStep("style")} className="btn btn-ghost" style={{ alignSelf: "flex-start", minHeight: 36, padding: "0.375rem 0.625rem" }}>
              <Icon name="arrow-left" size={16} /><span>Back</span>
            </button>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, textAlign: "center", marginBottom: 4 }}>Confirm + payment</h2>

            <GlassCard padding="md" variant="soft">
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Show</span><span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{activeShow?.name}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Level</span><span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{PRODUCT_LEVELS[selectedLevel!].label}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Model</span><span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{selectedModel}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Style</span><span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{selectedStyle}</span></div>
              </div>
            </GlassCard>

            {/* Discount picker */}
            <GlassCard padding="md">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Discount</p>
                {effectiveDiscount > 0 && (
                  <button onClick={() => { setDiscount(0); setCustomDiscount(""); setDiscountReason(""); }} className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", minHeight: 28, fontSize: "0.75rem" }}>
                    <Icon name="x" size={12} /><span>Clear</span>
                  </button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                <button onClick={() => setDiscount(0)} className={`pill ${discount === 0 ? "pill-active" : ""}`} style={{ padding: "0.5rem" }}>None</button>
                {PRESET_DISCOUNTS.map((d) => (
                  <button key={d.amount} onClick={() => setDiscount(d.amount)} className={`pill ${discount === d.amount ? "pill-active" : ""}`} style={{ padding: "0.5rem" }}>{d.label}</button>
                ))}
              </div>
              <button onClick={() => setDiscount(-1)} className={`pill ${discount === -1 ? "pill-active" : ""}`} style={{ width: "100%", padding: "0.5rem", marginBottom: discount === -1 ? 8 : 0 }}>
                Custom discount…
              </button>
              {discount === -1 && (
                <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Discount amount"
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(e.target.value)}
                    className="input"
                    min="0"
                    step="0.01"
                  />
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className="input"
                  />
                </div>
              )}
            </GlassCard>

            {/* Price summary */}
            <GlassCard padding="md" variant="strong" style={{ background: effectiveDiscount > 0 ? "linear-gradient(135deg, rgba(45, 138, 78, 0.10) 0%, rgba(45, 138, 78, 0.04) 100%)" : undefined }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Retail</span><span style={{ fontWeight: 700 }}>{formatCurrency(level!.retail)}</span></div>
                {effectiveDiscount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-success)", fontWeight: 600 }}>Discount</span>
                    <span style={{ fontWeight: 700, color: "var(--color-success)" }}>−{formatCurrency(effectiveDiscount)}</span>
                  </div>
                )}
                <div className="divider" style={{ margin: "0.25rem 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.875rem", fontWeight: 700 }}>Customer pays</span><span style={{ fontWeight: 800, fontSize: "1.125rem" }}>{formatCurrency(finalPrice)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Your commission (30%)</span><span style={{ fontWeight: 700, color: "var(--color-secondary-dark)" }}>+{formatCurrency(commissionAt30)}</span></div>
              </div>
            </GlassCard>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(["CASH", "CARD"] as const).map((type) => (
                <GlassCard key={type} interactive padding="lg" onClick={() => { setPaymentType(type); handleSale(); }} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", marginBottom: 6 }}>{type === "CASH" ? "💵" : "💳"}</div>
                  <p style={{ fontWeight: 700 }}>{type === "CASH" ? "Cash" : "Card"}</p>
                </GlassCard>
              ))}
            </div>
            {isSubmitting && <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Saving…</p>}
          </div>
        )}

        {step === "done" && lastSale && (
          <GlassCard padding="lg" variant="strong" style={{ textAlign: "center", background: "linear-gradient(135deg, rgba(45, 138, 78, 0.18) 0%, rgba(45, 138, 78, 0.06) 100%)", borderColor: "rgba(45, 138, 78, 0.40)" }}>
            <div style={{ fontSize: "3rem", marginBottom: 6 }}>✓</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Sale recorded!</h2>
            <p className="section-title-sub" style={{ marginTop: 6 }}>
              {formatCurrency(lastSale.salePrice)} · +{formatCurrency(lastSale.commission)} commission
            </p>
            {lastSale.discount ? (
              <p style={{ fontSize: "0.8125rem", color: "var(--color-success)", marginTop: 4, fontWeight: 600 }}>
                Discount applied: −{formatCurrency(lastSale.discount)} ({lastSale.discountReason})
              </p>
            ) : null}
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 12 }}>Resetting in a few seconds…</p>
          </GlassCard>
        )}
      </ClientAuthShell>
    </>
  );
}

export default function SalePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>Loading…</div>}>
      <SaleInner />
    </Suspense>
  );
}
