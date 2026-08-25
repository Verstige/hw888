"use client";

import { useEffect, type ReactNode, type CSSProperties } from "react";
import { Icon } from "./Icon";

// Inject all dashboard keyframes once on the client
export function useAnimations() {
  useEffect(() => {
    if (document.getElementById("hw888-keyframes")) return;
    const style = document.createElement("style");
    style.id = "hw888-keyframes";
    style.textContent = `
      @keyframes hw-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes hw-slide-up {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes hw-slide-down {
        from { opacity: 0; transform: translateY(-16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes hw-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.05); }
      }
      @keyframes hw-pulse-dot {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.4); opacity: 0.5; }
      }
      @keyframes hw-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes hw-orbit {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes hw-fade-up-stagger {
        0% { opacity: 0; transform: translateY(8px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes hw-scale-in {
        0% { opacity: 0; transform: scale(0.95); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes hw-count {
        from { transform: translateY(8px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);
}

// Style helpers — drop-in animations
export const hw: Record<string, (delay?: number) => CSSProperties> = {
  fadeIn: (delay: number = 0): CSSProperties => ({
    animation: `hw-fade-in 0.5s ease-out ${delay}ms both`,
  }),
  slideUp: (delay: number = 0): CSSProperties => ({
    animation: `hw-slide-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`,
  }),
  slideDown: (delay: number = 0): CSSProperties => ({
    animation: `hw-slide-down 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`,
  }),
  scaleIn: (delay: number = 0): CSSProperties => ({
    animation: `hw-scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`,
  }),
  pulse: (): CSSProperties => ({
    animation: `hw-pulse 2.5s ease-in-out infinite`,
  }),
  pulseDot: (): CSSProperties => ({
    animation: `hw-pulse-dot 2s ease-in-out infinite`,
  }),
};

// Section header (reusable)
export function SectionTitle({ title, subtitle, action, delay = 0 }: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  delay?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        flexWrap: "wrap",
        gap: 8,
        ...hw.slideUp(delay),
      }}
    >
      <div>
        <h2 style={{ fontSize: "1.0625rem", fontWeight: 800, letterSpacing: "-0.01em", margin: 0 }}>{title}</h2>
        {subtitle && <p className="section-title-sub" style={{ marginTop: 2 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// Empty state (consistent across pages)
export function EmptyState({ icon, message, cta }: {
  icon: ReactNode;
  message: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="empty-state" style={hw.scaleIn(50)}>
      <div className="empty-state-icon" style={hw.pulse()}>{icon}</div>
      <p>{message}</p>
      {cta && (
        <a href={cta.href} className="btn btn-primary" style={{ marginTop: 12, textDecoration: "none" }}>
          <span>{cta.label}</span>
        </a>
      )}
    </div>
  );
}
