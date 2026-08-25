"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

// Confetti burst on sale confirmation
export function SaleConfetti() {
  useEffect(() => {
    // Listen for custom event from /sale page
    const handler = () => {
      launchConfetti();
    };
    window.addEventListener("sale-confirmed", handler);
    return () => window.removeEventListener("sale-confirmed", handler);
  }, []);
  return null;
}

function launchConfetti() {
  if (typeof window === "undefined") return;
  const colors = ["#2D8A4E", "#C9A84C", "#3B82F6", "#8B5CF6", "#EC4899"];
  const count = 80;
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;";
  document.body.appendChild(container);
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const size = 6 + Math.random() * 8;
    const duration = 1500 + Math.random() * 1500;
    const delay = Math.random() * 200;
    const xDrift = (Math.random() - 0.5) * 300;
    piece.style.cssText = `
      position: absolute;
      top: -10px;
      left: ${left}%;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
      transform: rotate(${Math.random() * 360}deg);
      animation: confetti-fall ${duration}ms ease-out ${delay}ms forwards;
    `;
    // CSS keyframes injected once
    if (!document.getElementById("confetti-keyframes")) {
      const style = document.createElement("style");
      style.id = "confetti-keyframes";
      style.textContent = `
        @keyframes confetti-fall {
          to {
            transform: translate(${xDrift}px, 100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    container.appendChild(piece);
  }
  setTimeout(() => {
    if (container.parentNode) container.parentNode.removeChild(container);
  }, 3000);
}

// Helper to fire the confetti from anywhere
export function fireConfetti() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sale-confirmed"));
  }
}

// PWA install prompt
export function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferred, setDeferred] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (dismissed) return;
    if (localStorage.getItem("pwa-prompt-dismissed") === "1") return;

    const onBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      // Show after 30s of being on the app
      setTimeout(() => {
        if (localStorage.getItem("pwa-prompt-dismissed") !== "1") setShow(true);
      }, 30000);
    };

    const onInstalled = () => {
      setShow(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [dismissed]);

  if (!show || !deferred) return null;

  const install = async () => {
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferred(null);
  };

  const dismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("pwa-prompt-dismissed", "1");
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 84,
      left: 12,
      right: 12,
      zIndex: 80,
      maxWidth: 380,
      padding: 14,
      background: "var(--glass-bg-strong)",
      backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
      WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
      border: "1px solid var(--glass-border)",
      borderRadius: 16,
      boxShadow: "0 8px 24px rgba(0,0,0,0.20)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
          color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon name="package" size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 700 }}>Install HW888</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 2 }}>
            Add to your home screen for offline sales, faster load, and full-screen mode.
          </p>
        </div>
        <button onClick={dismiss} className="btn btn-ghost" style={{ padding: "0.25rem", minHeight: 28 }} aria-label="Dismiss">
          <Icon name="x" size={14} />
        </button>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <button onClick={dismiss} className="btn btn-ghost" style={{ flex: 1, fontSize: "0.8125rem", padding: "0.4rem" }}>Not now</button>
        <button onClick={install} className="btn btn-primary" style={{ flex: 1, fontSize: "0.8125rem", padding: "0.4rem" }}>Install</button>
      </div>
    </div>
  );
}
