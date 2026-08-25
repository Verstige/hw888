"use client";

import React from "react";
import { Icon } from "./Icon";

type KpiTileProps = {
  label: string;
  value: string;
  delta?: number; // percent
  icon?: React.ComponentProps<typeof Icon>["name"];
  accent?: "primary" | "secondary" | "accent";
};

export function KpiTile({ label, value, delta, icon, accent = "primary" }: KpiTileProps) {
  const accentColor =
    accent === "primary"
      ? "var(--color-primary)"
      : accent === "secondary"
        ? "var(--color-secondary)"
        : "var(--color-accent)";

  return (
    <div className="kpi">
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accentColor} 0%, var(--color-secondary) 100%)`, opacity: 0.7 }} />
      <div className="flex items-start justify-between mb-2">
        <p className="kpi-label">{label}</p>
        {icon && (
          <div style={{ color: accentColor, opacity: 0.55 }} className="flex-shrink-0">
            <Icon name={icon} size={16} />
          </div>
        )}
      </div>
      <p className="kpi-value">{value}</p>
      {delta !== undefined && delta !== null && (
        <div className={`kpi-delta ${delta > 0 ? "kpi-delta-up" : delta < 0 ? "kpi-delta-down" : "kpi-delta-flat"}`}>
          <Icon name={delta > 0 ? "trending-up" : delta < 0 ? "trending-down" : "circle"} size={12} />
          <span>{delta > 0 ? "+" : ""}{delta.toFixed(1)}% vs prior</span>
        </div>
      )}
    </div>
  );
}
