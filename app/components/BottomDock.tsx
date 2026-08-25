"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

type DockTab = {
  href: string;
  label: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  match?: (path: string) => boolean;
};

function buildTabsForRole(role: "ADMIN" | "MANAGER" | "EMPLOYEE"): DockTab[] {
  const common: DockTab[] = [
    { href: "/dashboard", label: "Home", icon: "home", match: (p) => p === "/dashboard" },
    { href: "/sale", label: "Sale", icon: "sale" },
    { href: "/shows", label: "Shows", icon: "calendar", match: (p) => p.startsWith("/shows") && !p.startsWith("/shows/") },
  ];

  if (role === "EMPLOYEE") {
    return [
      ...common,
      { href: "/shows/calendar", label: "Calendar", icon: "calendar-grid", match: (p) => p === "/shows/calendar" },
      { href: "/profile", label: "Profile", icon: "users", match: (p) => p === "/profile" },
    ];
  }

  if (role === "MANAGER") {
    return [
      ...common,
      { href: "/reports", label: "Reports", icon: "analytics", match: (p) => p === "/reports" },
      { href: "/profile", label: "Profile", icon: "users", match: (p) => p === "/profile" },
    ];
  }

  // ADMIN
  return [
    ...common,
    { href: "/reports", label: "Reports", icon: "analytics", match: (p) => p === "/reports" },
    { href: "/profile", label: "Profile", icon: "users", match: (p) => p === "/profile" },
  ];
}

export function BottomDock({ role }: { role: "ADMIN" | "MANAGER" | "EMPLOYEE" }) {
  const pathname = usePathname();
  const tabs = buildTabsForRole(role);

  return (
    <nav className="dock" aria-label="Primary navigation">
      {tabs.map((tab) => {
        const isActive = tab.match ? tab.match(pathname) : pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`dock-tab ${isActive ? "dock-tab-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            aria-label={tab.label}
          >
            <Icon name={tab.icon} className="dock-icon" size={22} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
