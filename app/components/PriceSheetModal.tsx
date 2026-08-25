"use client";

import { useState } from "react";
import { GlassCard } from "./GlassCard";
import { Icon } from "./Icon";
import { PRODUCT_LEVELS } from "@/lib/products";

type Props = {
  onClose: () => void;
  showName?: string;
};

export function PriceSheetModal({ onClose, showName }: Props) {
  const levels = Object.entries(PRODUCT_LEVELS) as [keyof typeof PRODUCT_LEVELS, typeof PRODUCT_LEVELS[keyof typeof PRODUCT_LEVELS]][];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Customer price sheet</h2>
            <p className="section-title-sub" style={{ marginTop: 4 }}>
              {showName ? `${showName} · ` : ""}Show pricing for your customer
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ minHeight: 32, padding: "0.375rem" }} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Pricing table */}
        <div className="table-shell" style={{ marginBottom: "1rem" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Level</th>
                <th style={{ textAlign: "right" }}>Retail</th>
                <th style={{ textAlign: "right" }}>Your comm.</th>
                <th style={{ textAlign: "right" }}>Buy 2</th>
                <th style={{ textAlign: "right" }}>Save 2-pt</th>
                <th style={{ textAlign: "right" }}>Buy 3 (-10%)</th>
                <th style={{ textAlign: "right" }}>Save 3-pt</th>
              </tr>
            </thead>
            <tbody>
              {levels.map(([key, val]) => {
                const bundlePrice = Math.round(val.retail * 2 * 100) / 100;
                const bundleSave = Math.round((val.retail * 2 - bundlePrice) * 100) / 100;
                const triplePrice = Math.round(val.retail * 3 * 0.9 * 100) / 100;
                const tripleSave = Math.round((val.retail * 3 - triplePrice) * 100) / 100;
                const comm = Math.round(val.retail * 0.3 * 100) / 100;
                return (
                  <tr key={key}>
                    <td>
                      <span style={{ fontWeight: 700 }}>{val.label}X</span>
                      <span style={{ display: "block", fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Level {key.replace("LEVEL_", "")}</span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontSize: "1rem" }}>${val.retail}</td>
                    <td style={{ textAlign: "right", color: "var(--color-secondary-dark)", fontSize: "0.8125rem" }}>+${comm}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>${bundlePrice}</td>
                    <td style={{ textAlign: "right", color: "var(--color-success)", fontWeight: 600 }}>${bundleSave.toFixed(0)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>${triplePrice}</td>
                    <td style={{ textAlign: "right", color: "var(--color-success)", fontWeight: 600 }}>${tripleSave.toFixed(0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <GlassCard padding="sm" variant="soft" style={{ marginBottom: 10 }}>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, textAlign: "center" }}>
            <strong>Buy 2</strong> = save the cost of the level upgrade. &nbsp; <strong>Buy 3</strong> = an additional 10% off the home show price.
          </p>
        </GlassCard>

        {/* Custom pricing box */}
        <GlassCard padding="sm" variant="soft" style={{ borderStyle: "dashed", borderColor: "var(--glass-border-soft)", marginBottom: 12 }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Home show / event pricing (3+ units, 10% off)
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {levels.map(([key, val]) => {
              const triplePrice = Math.round(val.retail * 3 * 0.9 * 100) / 100;
              return (
                <div key={key} style={{
                  flex: "1 1 calc(50% - 3px)",
                  padding: "0.5rem 0.625rem",
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border-soft)",
                  borderRadius: 8,
                  fontSize: "0.8125rem",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontWeight: 700 }}>{val.label}X × 3</span>
                  <span style={{ fontWeight: 700, color: "var(--color-success)" }}>${triplePrice}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <button onClick={onClose} className="btn btn-primary btn-block">
          Close
        </button>
      </div>
    </div>
  );
}
