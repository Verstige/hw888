import React from "react";
import Link from "next/link";
import { BottomDock } from "./BottomDock";
import { TopNav } from "./TopNav";
import { Icon } from "./Icon";
import { ThemeToggle } from "./ThemeToggle";
import { OfflineSyncIndicator } from "./OfflineSyncIndicator";
import { AppLaunchpad, AppDrawer } from "./AppLauncher";
import { SaleConfetti, PWAInstallPrompt } from "./SaleConfetti";
import { logoutAction } from "@/app/login/actions";

type SiteShellProps = {
  children: React.ReactNode;
  user: {
    name: string;
    role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  };
  pageTitle?: string;
  pageSubtitle?: string;
  showDock?: boolean;
  rightSlot?: React.ReactNode;
};

export function SiteShell({
  children,
  user,
  pageTitle,
  pageSubtitle,
  showDock = true,
  rightSlot,
}: SiteShellProps) {
  return (
    <div className="shell">
      {/* Desktop top bar */}
      <div className="hidden md:flex" style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        padding: "0.75rem 1.5rem",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--glass-bg-strong)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        borderBottom: "1px solid var(--glass-border-soft)",
      }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", color: "var(--color-text)" }}>
          <div className="avatar avatar-sm avatar-gold">HW</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9375rem", letterSpacing: "-0.01em" }}>HW888</div>
            <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Holistic World</div>
          </div>
        </Link>
        <TopNav role={user.role} />
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{user.role}</div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-ghost" aria-label="Sign out" style={{ minHeight: 36, padding: "0.5rem 0.625rem" }}>
              <Icon name="logout" size={18} />
            </button>
          </form>
          <ThemeToggle compact />
        </div>
      </div>

      {/* Mobile top header */}
      {pageTitle && (
        <div className="md:hidden">
          <div className="mobile-header">
            <Link href="/dashboard" className="avatar avatar-sm avatar-gold" style={{ textDecoration: "none" }}>HW</Link>
            <div style={{ flex: 1, textAlign: "center" }}>
              <h1>{pageTitle}</h1>
              {pageSubtitle && <p className="section-title-sub" style={{ marginTop: 2 }}>{pageSubtitle}</p>}
            </div>
            {rightSlot ? <div style={{ display: "flex", alignItems: "center", gap: 4 }}>{rightSlot}<ThemeToggle compact /></div> : <ThemeToggle compact />}
          </div>
        </div>
      )}

      <main className="shell-main">{children}</main>

      {showDock && <BottomDock role={user.role} />}
      <OfflineSyncIndicator />
      <AppLaunchpad role={user.role} />
      <AppDrawer role={user.role} />
      <SaleConfetti />
      <PWAInstallPrompt />
    </div>
  );
}
