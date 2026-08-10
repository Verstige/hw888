"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PRODUCT_LEVELS, PRODUCT_MODELS, PRODUCT_STYLES, calculateCommission, formatCurrency } from "@/lib/products";
import type { ProductLevel } from "@/lib/products";

export default function SalePage() {
  const router = useRouter();
  const [step, setStep] = useState<"level" | "model" | "style" | "payment" | "done">("level");
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

  // Check active show and online status
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

  const handleSale = async () => {
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
        // Queue offline
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
        setPendingCount((c: number) => c + 1);
        setLastSale({ ...pendingSale, _offline: true });
      }
      setStep("done");
    } catch (err) {
      // Queue as fallback
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
        setPendingCount((c: number) => c + 1);
        setLastSale({ ...pendingSale, _offline: true });
        setStep("done");
      } catch {}
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-4">
        <div className="card max-w-sm w-full text-center">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="text-lg font-bold mb-2">No Active Cash Drawer</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            You need to open a cash drawer for a show before recording sales.
          </p>
          <button
            onClick={() => router.push("/shows")}
            className="w-full py-2.5 bg-[var(--color-primary)] text-white font-semibold rounded-lg"
          >
            Go to Shows
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="offline-badge bg-[var(--color-warning)]">
          Offline — Sale Queued
        </div>
      )}

      {/* Header */}
      <header className="bg-[var(--color-primary)] text-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">Recording for</p>
            <h1 className="font-bold">{activeShow?.name || "Active Show"}</h1>
          </div>
          {pendingCount > 0 && (
            <div className="text-right">
              <p className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {pendingCount} queued
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Step indicator */}
      <div className="flex items-center gap-1 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        {(["level", "model", "style", "payment", "done"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? "bg-[var(--color-primary)] text-white" : i < ["level", "model", "style", "payment", "done"].indexOf(step) ? "bg-[var(--color-success)] text-white" : "bg-[var(--color-border)] text-[var(--color-text-muted)]"}`}>
              {i + 1}
            </div>
            {i < 4 && <div className={`w-6 h-0.5 ${i < ["level", "model", "style", "payment", "done"].indexOf(step) ? "bg-[var(--color-success)]" : "bg-[var(--color-border)]"}`} />}
          </div>
        ))}
      </div>

      <div className="flex-1 px-4 py-6 space-y-6 max-w-lg mx-auto w-full">
        {/* STEP 1: Level */}
        {step === "level" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-center">Select Bracelet Level</h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(PRODUCT_LEVELS) as [ProductLevel, typeof PRODUCT_LEVELS[ProductLevel]][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => { setSelectedLevel(key); setStep("model"); }}
                  className="card text-center hover:border-[var(--color-primary)] hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="text-xs font-bold text-[var(--color-primary)] mb-1">LEVEL {val.label}</div>
                  <div className="text-xl font-bold">{formatCurrency(val.retail)}</div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1">You earn {formatCurrency(val.commission)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Model */}
        {step === "model" && selectedLevel && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setStep("level")} className="text-sm text-[var(--color-primary)]">← Back</button>
              <p className="text-sm text-[var(--color-text-muted)]">Level {PRODUCT_LEVELS[selectedLevel].label}</p>
            </div>
            <h2 className="text-lg font-bold text-center">Select Model</h2>
            <div className="space-y-2">
              {PRODUCT_MODELS[selectedLevel].map((model) => (
                <button
                  key={model}
                  onClick={() => { setSelectedModel(model); setStep("style"); }}
                  className="card w-full text-left hover:border-[var(--color-primary)] hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="font-semibold">{model}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Style */}
        {step === "style" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setStep("model")} className="text-sm text-[var(--color-primary)]">← Back</button>
              <p className="text-sm text-[var(--color-text-muted)]">{selectedModel}</p>
            </div>
            <h2 className="text-lg font-bold text-center">Select Style</h2>
            <div className="grid grid-cols-2 gap-2">
              {PRODUCT_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => { setSelectedStyle(style); setStep("payment"); }}
                  className="card text-center hover:border-[var(--color-primary)] hover:shadow-md transition-all cursor-pointer py-3"
                >
                  <div className="text-sm font-medium">{style}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Payment */}
        {step === "payment" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setStep("style")} className="text-sm text-[var(--color-primary)]">← Back</button>
            </div>
            <h2 className="text-lg font-bold text-center">Payment Method</h2>

            {/* Order summary */}
            <div className="card bg-[var(--color-bg-dark)]">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-[var(--color-text-muted)]">Level</span>
                <span className="text-sm font-bold">{PRODUCT_LEVELS[selectedLevel!].label}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-[var(--color-text-muted)]">Model</span>
                <span className="text-sm font-medium">{selectedModel}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-[var(--color-text-muted)]">Style</span>
                <span className="text-sm font-medium">{selectedStyle}</span>
              </div>
              <hr className="my-2 border-[var(--color-border)]" />
              <div className="flex justify-between mb-1">
                <span className="text-sm text-[var(--color-text-muted)]">Sale Price</span>
                <span className="font-bold">{formatCurrency(level!.retail)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--color-text-muted)]">Your Commission (30%)</span>
                <span className="text-sm font-bold text-[var(--color-secondary)]">{formatCurrency(level!.commission)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(["CASH", "CARD"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => { setPaymentType(type); handleSale(); }}
                  disabled={isSubmitting}
                  className="card text-center hover:border-[var(--color-primary)] hover:shadow-md transition-all cursor-pointer py-6"
                >
                  <div className="text-3xl mb-2">{type === "CASH" ? "💵" : "💳"}</div>
                  <div className="font-bold">{type === "CASH" ? "Cash" : "Card"}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Done */}
        {step === "done" && lastSale && (
          <div className="space-y-4 text-center">
            <div className="text-6xl mb-4">✅</div>
            {lastSale._offline && (
              <div className="bg-[var(--color-warning)]/10 text-[var(--color-warning)] text-sm px-3 py-2 rounded-lg">
                Offline — sale queued and will sync when back online
              </div>
            )}
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Sale recorded</p>
              <h2 className="text-2xl font-bold">{PRODUCT_LEVELS[selectedLevel!].label} — {selectedModel}</h2>
              <p className="text-[var(--color-text-muted)]">{selectedStyle}</p>
            </div>
            <div className="card bg-[var(--color-bg-dark)]">
              <div className="flex justify-between mb-2">
                <span className="text-[var(--color-text-muted)]">Sale Price</span>
                <span className="font-bold">{formatCurrency(level!.retail)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Your Commission</span>
                <span className="font-bold text-[var(--color-secondary)]">+{formatCurrency(level!.commission)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetSale}
                className="flex-1 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg"
              >
                New Sale
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 py-3 border border-[var(--color-border)] text-[var(--color-text)] font-semibold rounded-lg"
              >
                Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
