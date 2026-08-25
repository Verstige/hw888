"use client";

import React from "react";
import { Icon } from "./Icon";

type MobileHeaderProps = {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  onBack?: () => void;
};

export function MobileHeader({ title, subtitle, rightSlot, onBack }: MobileHeaderProps) {
  return (
    <header className="mobile-header">
      <div className="flex items-center gap-1.5">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="btn btn-ghost"
            style={{ minHeight: 36, padding: "0.375rem 0.625rem" }}
            aria-label="Back"
          >
            <Icon name="arrow-left" size={20} />
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div className="avatar avatar-sm avatar-gold">HW</div>
          </div>
        )}
        <div>
          <h1>{title}</h1>
          {subtitle && (
            <p className="section-title-sub" style={{ marginTop: 2 }}>{subtitle}</p>
          )}
        </div>
      </div>
      {rightSlot && <div>{rightSlot}</div>}
    </header>
  );
}
