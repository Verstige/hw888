"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { PRODUCT_LEVELS, PRODUCT_MODELS, PRODUCT_STYLES, calculateCommission, formatCurrency } from "@/lib/products";
import type { ProductLevel } from "@/lib/products";

type Step = "level" | "model" | "style" | "payment" | "done";

function SaleInner() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("level");
  const [selectedLevel, setSelectedLevel] = useState<ProductLevel | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<"CASH" | "CARD" | null>(null);
  const [activeShowId, setActiveShowId] = useState<string | null>(null);
  const [activeShow, setActiveShow] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSale, setLastSale] = useState<any>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/drawer?showId=active");
        if (res.ok) {
          const data = await res.json();
          setActiveShowId(data?.showId || null);
          setActiveShow(data?.show || null);
        }
      } catch {}
      setIsOnline(navigator.onLine);
      try {
        const { getPendingCount } = await import("@/lib/offline");
        setPendingCount(await getPendingCount());
      } catch {}
    };
    checkStatus();
    window.addEventListener("online", () => setIsOnline(true));
    window.addEventListener("offline", () => setIsOnline(false));
    return () => {
      window.removeEventListener("online", () => setIsOnline(true));
      window.removeEventListener("offline", () => setIsOnline(false));
    };
  }, []);

  const level = selectedLevel ? PRODUCT_LEVELS[selectedLevel] : null;

  const handleSale = useCallback(async () => {
    if (!selectedLevel || !selectedModel || !selectedStyle || !paymentType) return;
    if (!activeShowId) {
      alert("No active show selected. Please open a cash drawer first.");
      return;
    }
    setIsSubmitting(true);
    const saleData = {
      showId: activeShowId,
      productLevel: selectedLevel,
      productModel: selectedModel,
      productStyle: selectedStyle,
      salePrice: level!.retail,
      paymentType,
      isOffline: !isOnline,
    };
    try {
      if (isOnline) {
        const res = await fetch("/api/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saleData),
        });
        if (!res.ok) throw new Error("Failed to record sale");
        const sale = await res.json();
        setLastSale(sale);
      } else {
        const { queueSale } = await import("@/lib/offline");
        const pendingSale = {
          id: crypto.randomUUID(),
          ...saleData,
          userId: "offline-user",
          commission: calculateCommission(level!.retail),
          createdAt: new Date().toISOString(),
          synced: false,
        };
        await queueSale(pendingSale);
        setPendingCount((c) => c + 1);
        setLastSale({ ...pendingSale, _offline: true });
      }
      setStep("done");
    } catch (err) {
      try {
        const { queueSale } = await import("@/lib/offline");
        const pendingSale = {
          id: crypto.randomUUID(),
          ...saleData,
          userId: "offline-user",
          commission: calculateCommission(level!.retail),
          createdAt: new Date().toISOString(),
          synced: false,
        };
        await queueSale(pendingSale);
        setPendingCount((c) => c + 1);
        setLastSale({ ...pendingSale, _offline: true });
        setStep("done");
      } catch {}
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedLevel, selectedModel, selectedStyle, paymentType, activeShowId, level, isOnline]);

  const resetSale = () => {
    setStep("level");
    setSelectedLevel(null);
    setSelectedModel(null);
    setSelectedStyle(null);
    setPaymentType(null);
    setLastSale(null);
  };

  if (!activeShowId) {
    return (
      <GlassCard padding="lg" style={{ maxWidth: 360, margin: "4rem auto", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>📋</div>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: 4 }}>No active cash drawer</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
          You need to open a cash drawer for a show before recording sales.
        </p>
        <Link href="/shows" className="btn btn-primary btn-block">
          <Icon name="calendar" size={18} />
          <span>Go to shows</span>
        </Link>
      </GlassCard>
    );
  }

  const steps: Step[] = ["level", "model", "style", "payment", "done"];
  const currentIdx = steps.indexOf(step);

  return (
    <>
      {!isOnline && (
        <div className="offline-badge">
          <span>Offline · sale queued</span>
        </div>
      )}

      <GlassCard padding="md" variant="strong" style={{ marginBottom: "0.875rem", background: "linear-gradient(135deg, rgba(45, 90, 61, 0.95) 0%, rgba(31, 63, 42, 0.95) 100%)", color: "white", border: "1px solid rgba(255, 255, 255, 0.10)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.7 }}>Recording for</p>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginTop: 2 }}>{activeShow?.name || "Active Show"}</h2>
          </div>
          {pendingCount > 0 && (
            <span className="badge" style={{ background: "rgba(255, 255, 255, 0.18)", color: "white", borderColor: "rgba(255, 255, 255, 0.20)" }}>{pendingCount} queued</span>
          )}
        </div>
      </GlassCard>

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
          <h2 style={{ fontSize: "1rem", fontWeight: 700, textAlign: "center", marginBottom: 4 }}>Payment method</h2>

          <GlassCard padding="md" variant="soft">
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Level</span><span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{PRODUCT_LEVELS[selectedLevel!].label}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Model</span><span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{selectedModel}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Style</span><span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{selectedStyle}</span></div>
              <div className="divider" style={{ margin: "0.5rem 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Sale price</span><span style={{ fontWeight: 700 }}>{formatCurrency(level!.retail)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Your commission (30%)</span><span style={{ fontWeight: 700, color: "var(--color-secondary-dark)" }}>+{formatCurrency(level!.commission)}</span></div>
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
        <div style={{ display: "grid", gap: 12, textAlign: "center" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-success) 0%, #3FA562 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "1rem auto",
            boxShadow: "0 12px 32px rgba(45, 138, 78, 0.40)",
            color: "white",
          }}>
            <Icon name="check" size={40} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Sale recorded!</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{PRODUCT_LEVELS[selectedLevel!].label} — {selectedModel} · {selectedStyle}</p>

          {lastSale._offline && (
            <GlassCard padding="sm" style={{ background: "rgba(212, 146, 42, 0.10)", borderColor: "rgba(212, 146, 42, 0.30)" }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-warning)", fontWeight: 600 }}>Offline — sale queued and will sync when back online</p>
            </GlassCard>
          )}

          <GlassCard padding="md" variant="strong">
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--color-text-muted)" }}>Sale price</span><span style={{ fontWeight: 700, fontSize: "1.125rem" }}>{formatCurrency(level!.retail)}</span></div>
              <div className="divider" style={{ margin: 0 }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--color-text-muted)" }}>Your commission</span><span style={{ fontWeight: 700, color: "var(--color-secondary-dark)", fontSize: "1.125rem" }}>+{formatCurrency(level!.commission)}</span></div>
            </div>
          </GlassCard>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
            <button onClick={resetSale} className="btn btn-primary"><Icon name="plus" size={18} /><span>New sale</span></button>
            <button onClick={() => router.push("/dashboard")} className="btn btn-secondary"><Icon name="home" size={18} /><span>Dashboard</span></button>
          </div>
        </div>
      )}
    </>
  );
}

export default function SalePage() {
  return (
    <ClientAuthShell pageTitle="Sale" pageSubtitle="Record a sale">
      <SaleInner />
    </ClientAuthShell>
  );
}
