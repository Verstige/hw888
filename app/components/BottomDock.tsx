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
    { href: "/shows", label: "Shows", icon: "calendar", match: (p) => p.startsWith("/shows") || p === "/admin/shows" },
  ];

  if (role === "EMPLOYEE") {
    return [
      ...common,
      { href: "/leaderboard", label: "Stats", icon: "trophy" },
      { href: "/travel", label: "More", icon: "more", match: (p) => p === "/travel" || p === "/profile" },
    ];
  }

  if (role === "MANAGER") {
    return [
      ...common,
      { href: "/analytics", label: "Analytics", icon: "analytics", match: (p) => p === "/analytics" },
      { href: "/leaderboard", label: "More", icon: "more", match: (p) => p === "/leaderboard" || p === "/travel" },
    ];
  }

  // ADMIN
  return [
    ...common,
    { href: "/analytics", label: "Analytics", icon: "analytics", match: (p) => p === "/analytics" },
    { href: "/admin/users", label: "Admin", icon: "shield", match: (p) => p.startsWith("/admin") },
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
