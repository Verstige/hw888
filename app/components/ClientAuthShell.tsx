"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "./SiteShell";

type Props = {
  children: React.ReactNode | ((user: { id: string; name: string; role: "ADMIN" | "MANAGER" | "EMPLOYEE" }) => React.ReactNode);
  requireAdmin?: boolean;
  requireManagerOrAdmin?: boolean;
  pageTitle?: string;
  pageSubtitle?: string;
};

export function ClientAuthShell({ children, requireAdmin, requireManagerOrAdmin, pageTitle, pageSubtitle }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; role: "ADMIN" | "MANAGER" | "EMPLOYEE" } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((r) => r.json())
      .then((s) => {
        if (!s?.user) {
          router.replace("/login");
          return;
        }
        const role = (s.user as any).role;
        if (requireAdmin && role !== "ADMIN") {
          router.replace("/dashboard");
          return;
        }
        if (requireManagerOrAdmin && role === "EMPLOYEE") {
          router.replace("/dashboard");
          return;
        }
        setUser({ id: (s.user as any).id, name: s.user.name, role });
        setLoading(false);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  if (loading || !user) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <SiteShell user={user} pageTitle={pageTitle} pageSubtitle={pageSubtitle}>
      {typeof children === "function" ? children(user) : children}
    </SiteShell>
  );
}
