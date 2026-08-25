"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Icon } from "./Icon";

export type Theme = "auto" | "light" | "dark";
const STORAGE_KEY = "hw888-theme";

type ThemeContext = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const Ctx = createContext<ThemeContext>({ theme: "auto", setTheme: () => {} });

export function useTheme() {
  return useContext(Ctx);
}

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  if (t === "auto") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", t);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("auto");

  useEffect(() => {
    try {
      const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) || "auto";
      setThemeState(stored);
      applyTheme(stored);
      // Sync theme-color meta tag for OS chrome (status bar, address bar tint)
      const isDark = stored === "dark" || (stored === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      syncMetaThemeColor(isDark);
    } catch {}
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
    applyTheme(t);
    const isDark = t === "dark" || (t === "auto" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    syncMetaThemeColor(isDark);
  };

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

function syncMetaThemeColor(isDark: boolean) {
  if (typeof document === "undefined") return;
  const value = isDark ? "#0F1A14" : "#FAFAF7";
  document.querySelectorAll('meta[name="theme-color"]').forEach((el) => el.setAttribute("content", value));
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => {
          const next: Theme = theme === "dark" ? "light" : theme === "light" ? "auto" : "dark";
          setTheme(next);
        }}
        className="btn btn-ghost"
        aria-label="Toggle theme"
        style={{ minHeight: 36, padding: "0.5rem 0.625rem" }}
      >
        <Icon name={theme === "dark" ? "moon" : "sun"} size={18} />
      </button>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost"
        aria-label="Theme"
        style={{ minHeight: 36, padding: "0.5rem 0.625rem" }}
      >
        <Icon name={theme === "dark" ? "moon" : "sun"} size={18} />
        <span style={{ fontSize: "0.8125rem" }}>{theme === "auto" ? "Auto" : theme === "dark" ? "Dark" : "Light"}</span>
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 90 }}
          />
          <GlassMenu alignRight>
            {(["auto", "light", "dark"] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTheme(t); setOpen(false); }}
                className="theme-menu-item"
              >
                <Icon name={t === "dark" ? "moon" : t === "light" ? "sun" : "circle"} size={16} />
                <span style={{ flex: 1, textAlign: "left", textTransform: "capitalize" }}>{t}</span>
                {theme === t && <Icon name="check" size={14} />}
              </button>
            ))}
          </GlassMenu>
        </>
      )}
      <style jsx>{`
        .theme-menu-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--color-text);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .theme-menu-item:hover {
          background: var(--glass-bg-soft);
        }
      `}</style>
    </div>
  );
}

function GlassMenu({ children, alignRight }: { children: React.ReactNode; alignRight?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        [alignRight ? "right" : "left"]: 0,
        zIndex: 100,
        minWidth: 160,
        background: "var(--glass-bg-strong)",
        backdropFilter: "blur(var(--glass-blur-strong)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur-strong)) saturate(180%)",
        border: "1px solid var(--glass-border)",
        borderRadius: 14,
        boxShadow: "var(--glass-shadow)",
        padding: 6,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
