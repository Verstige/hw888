"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Icon } from "./Icon";

type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

export type AppLink = {
  href: string;
  label: string;
  icon: any;
  shortLabel?: string;
};

const COMMON_LINKS: AppLink[] = [
  { href: "/dashboard", label: "Home", icon: "home", shortLabel: "Home" },
  { href: "/sale", label: "Sale", icon: "sale", shortLabel: "Sale" },
  { href: "/shows", label: "Shows", icon: "calendar", shortLabel: "Shows" },
  { href: "/shows/calendar", label: "Calendar", icon: "calendar-grid", shortLabel: "Cal" },
  { href: "/customers", label: "Customers", icon: "users", shortLabel: "CRM" },
  { href: "/leaderboard", label: "Leaderboard", icon: "trophy", shortLabel: "Ldrbd" },
];

const MANAGER_LINKS: AppLink[] = [
  { href: "/analytics", label: "Analytics", icon: "analytics", shortLabel: "Stats" },
  { href: "/reports", label: "Reports", icon: "search", shortLabel: "Reports" },
  { href: "/travel", label: "Travel", icon: "plane", shortLabel: "Travel" },
  { href: "/profile", label: "Profile", icon: "users", shortLabel: "Me" },
];

const ADMIN_LINKS: AppLink[] = [
  { href: "/admin/drawers", label: "Drawers", icon: "package", shortLabel: "Drawer" },
  { href: "/admin/users", label: "Users", icon: "users", shortLabel: "Users" },
  { href: "/admin/shows", label: "Manage Shows", icon: "calendar", shortLabel: "Shows" },
  { href: "/admin/sales", label: "All Sales", icon: "sale", shortLabel: "Sales" },
  { href: "/admin/shipping", label: "Shipping", icon: "plane", shortLabel: "Ship" },
  { href: "/admin/inventory", label: "Inventory", icon: "package", shortLabel: "Inv" },
  { href: "/admin/equipment", label: "Equipment", icon: "package", shortLabel: "Equip" },
  { href: "/admin/grocery", label: "Grocery", icon: "package", shortLabel: "Groc" },
  { href: "/admin/import/sales", label: "Import Sales", icon: "package", shortLabel: "Import" },
  { href: "/admin/travel", label: "Manage Travel", icon: "plane", shortLabel: "Flights" },
  { href: "/admin/directory", label: "Directory", icon: "search", shortLabel: "Dir" },
  { href: "/admin/map", label: "Show map", icon: "circle", shortLabel: "Map" },
];

const EMPLOYEE_LINKS: AppLink[] = [
  { href: "/travel", label: "Travel", icon: "plane", shortLabel: "Travel" },
  { href: "/profile", label: "Profile", icon: "users", shortLabel: "Me" },
];

export function getLinksForRole(role: Role): AppLink[] {
  if (role === "ADMIN") {
    return [...COMMON_LINKS, ...MANAGER_LINKS, ...ADMIN_LINKS];
  }
  if (role === "MANAGER") {
    return [...COMMON_LINKS, ...MANAGER_LINKS];
  }
  return [...COMMON_LINKS.filter((l) => !["/leaderboard", "/customers"].includes(l.href)), ...EMPLOYEE_LINKS];
}

// ═══════════════════════════════════════════════════════════════════
// DESKTOP: iMac Launchpad (floating icon grid)
// ═══════════════════════════════════════════════════════════════════

export function AppLaunchpad({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const links = useMemo(() => getLinksForRole(role), [role]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === " ") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Group by category for visual organization
  const groups = {
    "Daily": links.filter((l) => ["/dashboard", "/sale", "/shows", "/shows/calendar", "/customers"].includes(l.href)),
    "Insights": links.filter((l) => ["/analytics", "/reports", "/leaderboard"].includes(l.href)),
    "Admin": links.filter((l) => l.href.startsWith("/admin") || ["/travel", "/profile"].includes(l.href)),
  };
  // Sort within groups: main first, secondary next
  const ordered: Array<{ title: string; items: AppLink[] }> = [];
  if (groups.Daily.length) ordered.push({ title: "Daily", items: groups.Daily });
  if (groups.Insights.length) ordered.push({ title: "Insights", items: groups.Insights });
  if (groups.Admin.length) ordered.push({ title: "Admin", items: groups.Admin });

  return (
    <>
      {/* Floating Launch button (desktop only) */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 90,
          width: 56,
          height: 56,
          borderRadius: 999,
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
          border: "none",
          color: "white",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          transition: "transform 0.2s",
        }}
        title="Open app launcher (⌘/Ctrl + Space)"
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <Icon name="circle" size={24} />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 32px",
            overflow: "auto",
            animation: "fadeIn 0.18s ease-out",
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 980, animation: "scaleIn 0.22s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, padding: "0 12px" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", fontWeight: 600 }}>
                ⌘/Ctrl + Space · or press Esc to close
              </p>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 40, height: 40, borderRadius: 999,
                  background: "rgba(255,255,255,0.15)",
                  color: "white", border: "none", cursor: "pointer",
                }}
                aria-label="Close"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            {ordered.map(({ title, items }) => (
              <div key={title} style={{ marginBottom: 24 }}>
                <h3 style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, paddingLeft: 8 }}>{title}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 16 }}>
                  {items.map((l) => {
                    const isActive = pathname === l.href || pathname.startsWith(l.href + "/");
                    return (
                      <button
                        key={l.href}
                        onClick={() => { setOpen(false); router.push(l.href); }}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 10,
                          padding: "16px 8px",
                          borderRadius: 18,
                          background: isActive ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.08)",
                          border: "none",
                          color: "white",
                          cursor: "pointer",
                          transition: "transform 0.15s, background 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <div style={{
                          width: 56, height: 56, borderRadius: 16,
                          background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.12) 100%)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          backdropFilter: "blur(8px)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                        }}>
                          <Icon name={l.icon} size={28} />
                        </div>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>
                          {l.shortLabel || l.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// �══════════════════════════════════════════════════════════════════
// MOBILE: App drawer (hamburger → full-screen sheet)
// ═══════════════════════════════════════════════════════════════════

import { useMemo } from "react";

export function AppDrawer({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const links = useMemo(() => getLinksForRole(role), [role]);

  // Group links into sections
  const sections = [
    { title: "Daily", items: links.filter((l) => ["/dashboard", "/sale", "/shows", "/shows/calendar", "/customers"].includes(l.href)) },
    { title: "Insights", items: links.filter((l) => ["/analytics", "/reports", "/leaderboard"].includes(l.href)) },
    { title: "Admin & Tools", items: links.filter((l) => l.href.startsWith("/admin") || ["/travel", "/profile"].includes(l.href)) },
  ].filter((s) => s.items.length > 0);

  return (
    <>
      {/* Hamburger button (mobile only) */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden"
        style={{
          position: "fixed",
          bottom: 84,
          right: 12,
          zIndex: 90,
          width: 48, height: 48,
          borderRadius: 999,
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
          border: "none",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
        }}
        title="Open app drawer"
        aria-label="Open app drawer"
      >
        <Icon name="search" size={22} />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            display: "flex",
            justifyContent: "flex-end",
            animation: "fadeIn 0.18s ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 380,
              height: "100%",
              background: "var(--glass-bg-strong)",
              backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
              WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
              overflow: "auto",
              padding: "16px 16px 80px",
              animation: "slideInRight 0.22s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Apps</h2>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 36, height: 36, borderRadius: 999,
                  background: "var(--glass-bg-soft)",
                  color: "var(--color-text)",
                  border: "1px solid var(--glass-border-soft)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                aria-label="Close"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {sections.map(({ title, items }) => (
              <div key={title} style={{ marginBottom: 16 }}>
                <p style={{
                  fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  padding: "4px 8px", marginBottom: 6,
                }}>
                  {title}
                </p>
                <div style={{ display: "grid", gap: 6 }}>
                  {items.map((l) => {
                    const isActive = pathname === l.href || pathname.startsWith(l.href + "/");
                    return (
                      <button
                        key={l.href}
                        onClick={() => { setOpen(false); router.push(l.href); }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 14px",
                          borderRadius: 14,
                          background: isActive ? "var(--color-primary)" : "var(--glass-bg-soft)",
                          border: isActive ? "none" : "1px solid var(--glass-border-soft)",
                          color: isActive ? "white" : "var(--color-text)",
                          cursor: "pointer",
                          textAlign: "left",
                          width: "100%",
                        }}
                      >
                        <div style={{
                          width: 38, height: 38, borderRadius: 10,
                          background: isActive ? "rgba(255,255,255,0.25)" : "var(--color-primary)",
                          color: "white",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <Icon name={l.icon} size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "0.9375rem", fontWeight: 700, margin: 0 }}>{l.label}</p>
                          <p style={{ fontSize: "0.6875rem", opacity: 0.75, margin: 0 }}>
                            {l.href}
                          </p>
                        </div>
                        <span style={{ opacity: 0.5 }}><Icon name="search" size={14} /></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
