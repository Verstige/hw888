"use client";

import React from "react";

type GlassCardProps = {
  children?: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "strong" | "soft";
  style?: React.CSSProperties;
  key?: React.Key;
};

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export function GlassCard({
  children,
  className = "",
  interactive = false,
  onClick,
  padding = "md",
  variant = "default",
  style,
}: GlassCardProps) {
  const variantClass =
    variant === "strong" ? "glass-strong" : variant === "soft" ? "glass-soft" : "glass";
  return (
    <div
      className={`${variantClass} ${paddingMap[padding]} ${interactive ? "glass-interactive" : ""} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={style}
    >
      {children}
    </div>
  );
}
