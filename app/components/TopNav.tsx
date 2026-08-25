"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

type TopLink = {
  href: string;
  label: string;
  match?: (path: string) => boolean;
};

export function TopNav({ role }: { role: "ADMIN" | "MANAGER" | "EMPLOYEE" }) {
  const pathname = usePathname();

  const links: TopLink[] = [
    { href: "/dashboard", label: "Home", match: (p) => p === "/dashboard" },
    { href: "/sale", label: "Sale" },
    { href: "/shows", label: "Shows", match: (p) => p.startsWith("/shows") && p !== "/shows/calendar" },
    { href: "/shows/calendar", label: "Calendar", match: (p) => p === "/shows/calendar" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/travel", label: "Travel" },
  ];

  if (role === "ADMIN" || role === "MANAGER") {
    links.push({ href: "/reports", label: "Reports", match: (p) => p === "/reports" });
    links.push({ href: "/analytics", label: "Analytics", match: (p) => p === "/analytics" });
  }

  links.push({ href: "/profile", label: "Profile", match: (p) => p === "/profile" });

  if (role === "ADMIN") {
    links.push({ href: "/admin/users", label: "Admin", match: (p) => p.startsWith("/admin") });
  }

  return (
    <nav className="top-nav" aria-label="Primary navigation">
      {links.map((link) => {
        const isActive = link.match ? link.match(pathname) : pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`top-nav-link ${isActive ? "top-nav-link-active" : ""}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
