"use client";

import { useState, useMemo } from "react";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { format } from "date-fns";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  city: string | null;
  homeAirportCode: string | null;
  createdAt: string;
  manager: { id: string; name: string } | null;
  _count: { sales: number; ownedCustomers: number; managedShows: number };
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "#C9A84C",
  MANAGER: "#2D5A3D",
  EMPLOYEE: "#6B7280",
};

const AIRPORT_TO_STATE: Record<string, string> = {
  MCO: "FL", LAX: "CA", DFW: "TX", IAH: "TX", AUS: "TX", SAT: "TX",
  ATL: "GA", ORD: "IL", MDW: "IL", DEN: "CO",
  JFK: "NY", LGA: "NY", EWR: "NJ", LAS: "NV", PHX: "AZ", SAN: "CA", SFO: "CA",
  SEA: "WA", PDX: "OR", SLC: "UT", MIA: "FL", TPA: "FL", MSY: "LA",
  CLT: "NC", RDU: "NC", BNA: "TN", IND: "IN", CVG: "OH", CMH: "OH",
  DTW: "MI", MSP: "MN", MCI: "MO", STL: "MO", OMA: "NE", OKC: "OK",
  ABQ: "NM", BOI: "ID", BIL: "MT", FAR: "ND", RAP: "SD",
  MYR: "SC", JAX: "FL", PBI: "FL", RSW: "FL", PNS: "FL",
};

export default function DirectoryClient({ users }: { users: User[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [managerFilter, setManagerFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");

  const states = useMemo(() => {
    const set = new Set<string>();
    for (const u of users) {
      if (u.homeAirportCode && AIRPORT_TO_STATE[u.homeAirportCode]) {
        set.add(AIRPORT_TO_STATE[u.homeAirportCode]);
      }
    }
    return Array.from(set).sort();
  }, [users]);

  const managers = useMemo(() => {
    return users.filter((u) => u.role === "MANAGER" || u.role === "ADMIN").map((u) => ({ id: u.id, name: u.name }));
  }, [users]);

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== "all") list = list.filter((u) => u.role === roleFilter);
    if (managerFilter !== "all") {
      list = list.filter((u) => {
        if (u.id === managerFilter) return true;
        if (u.manager?.id === managerFilter) return true;
        return false;
      });
    }
    if (stateFilter !== "all") {
      list = list.filter((u) => u.homeAirportCode && AIRPORT_TO_STATE[u.homeAirportCode] === stateFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.city || "").toLowerCase().includes(q) ||
        (u.homeAirportCode || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, search, roleFilter, managerFilter, stateFilter]);

  const exportCsv = () => {
    const header = "Name,Email,Role,Manager,City,Home Airport,Created\n";
    const rows = filtered.map((u) =>
      [u.name, u.email, u.role, u.manager?.name || "", u.city || "", u.homeAirportCode || "", u.createdAt]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hw888-directory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ClientAuthShell pageTitle="Directory" pageSubtitle="Every employee + manager">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Directory</h1>
          <p className="section-title-sub" style={{ marginTop: 4 }}>{filtered.length} of {users.length} {users.length === 1 ? "person" : "people"}</p>
        </div>
        <button onClick={exportCsv} className="btn btn-secondary">
          <Icon name="package" size={16} /><span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <GlassCard padding="md" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }} className="form-grid-2">
          <div>
            <label className="label">Search</label>
            <input className="input" placeholder="Name, email, city, airport…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>
          <div>
            <label className="label">Manager / Team</label>
            <select className="input" value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)}>
              <option value="all">Everyone</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">State (via home airport)</label>
            <select className="input" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
              <option value="all">All states</option>
              {states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Cards grid */}
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {filtered.map((u) => (
          <UserCard key={u.id} user={u} />
        ))}
      </div>

      {filtered.length === 0 && (
        <GlassCard padding="lg">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>No one matches your filters</p>
          </div>
        </GlassCard>
      )}
    </ClientAuthShell>
  );
}

function UserCard({ user }: { user: User }) {
  const state = user.homeAirportCode && AIRPORT_TO_STATE[user.homeAirportCode];
  return (
    <GlassCard padding="md">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="avatar avatar-sm" style={{
          background: `${ROLE_COLORS[user.role]}20`,
          color: ROLE_COLORS[user.role],
          border: `1px solid ${ROLE_COLORS[user.role]}30`,
        }}>
          {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{user.name}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</p>
        </div>
        <span className="badge" style={{ background: `${ROLE_COLORS[user.role]}20`, color: ROLE_COLORS[user.role], fontWeight: 700, fontSize: "0.6875rem" }}>
          {user.role}
        </span>
      </div>
      <div style={{ marginTop: 10, fontSize: "0.75rem", color: "var(--color-text-muted)", display: "grid", gap: 4 }}>
        {user.manager && <p><strong style={{ color: "var(--color-text)" }}>Manager:</strong> {user.manager.name}</p>}
        {user.city && <p><strong style={{ color: "var(--color-text)" }}>City:</strong> {user.city}</p>}
        {user.homeAirportCode && (
          <p><strong style={{ color: "var(--color-text)" }}>Airport:</strong> {user.homeAirportCode}{state ? ` · ${state}` : ""}</p>
        )}
        <p style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <span>{user._count.sales} sales</span>
          <span>{user._count.ownedCustomers} customers</span>
          <span>{user._count.managedShows} shows</span>
        </p>
        <p style={{ fontSize: "0.6875rem", opacity: 0.7 }}>Joined {format(new Date(user.createdAt), "MMM yyyy")}</p>
      </div>
    </GlassCard>
  );
}
