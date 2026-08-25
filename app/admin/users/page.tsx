"use client";

import { useState, useEffect } from "react";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { formatCurrency } from "@/lib/products";

function UsersInner() {
  const [users, setUsers] = useState<any[]>([]);
  const [rates, setRates] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE", managerId: "" });
  const [editingRate, setEditingRate] = useState<{ userId: string; baseRate: number; managerBonus: number; name: string; role: string } | null>(null);

  const load = async () => {
    const [uRes, ...rateResults] = await Promise.all([
      fetch("/api/users").then((r) => r.json()),
    ]);
    const us = uRes as any[];
    setUsers(us);
    // Load all rates in parallel
    const ratePromises = us.map((u) => fetch(`/api/commission/rate/${u.id}`).then((r) => r.json()).catch(() => null));
    const rateData = await Promise.all(ratePromises);
    const rateMap: Record<string, any> = {};
    us.forEach((u, i) => {
      const r = rateData[i];
      if (r) rateMap[u.id] = r;
    });
    setRates(rateMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(createForm) });
    if (res.ok) {
      setShowCreateModal(false);
      setCreateForm({ name: "", email: "", password: "", role: "EMPLOYEE", managerId: "" });
      load();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to create user");
    }
  };

  const deactivateUser = async (id: string) => {
    if (!confirm("Deactivate this user?")) return;
    await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: false }) });
    load();
  };

  const saveRate = async () => {
    if (!editingRate) return;
    const res = await fetch(`/api/commission/rate/${editingRate.userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseRate: editingRate.baseRate, managerBonus: editingRate.managerBonus }),
    });
    if (res.ok) { setEditingRate(null); load(); }
    else { const err = await res.json(); alert(err.error || "Failed to save"); }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Users</h1>
          <p className="section-title-sub" style={{ marginTop: 4 }}>{users.length} total · {Object.values(rates).filter((r: any) => r.managerBonus > 0).length} with manager bonus</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary"><Icon name="plus" size={18} /><span>Add user</span></button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>Loading…</div>
      ) : users.length === 0 ? (
        <GlassCard padding="lg"><div className="empty-state"><div className="empty-state-icon">👤</div>No users yet</div></GlassCard>
      ) : (
        <GlassCard padding="none" style={{ overflow: "hidden" }}>
          <div className="table-shell">
            <table className="tbl">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Manager</th>
                  <th style={{ textAlign: "right" }}>Personal rate</th>
                  <th style={{ textAlign: "right" }}>Team bonus</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => {
                  const r = rates[u.id] || { baseRate: 0.30, managerBonus: 0, defaults: true };
                  const isManagerLike = u.role === "MANAGER" || u.role === "ADMIN";
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="avatar avatar-sm">{u.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "?"}</div>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>{u.name}</p>
                            <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge ${u.role === "ADMIN" ? "badge-primary" : u.role === "MANAGER" ? "badge-secondary" : ""}`}>{u.role}</span></td>
                      <td style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{u.manager?.name || "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>{Math.round(r.baseRate * 100)}%</span>
                        {r.defaults && <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}> · default</span>}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {isManagerLike ? (
                          <span style={{ fontWeight: 700, color: r.managerBonus > 0 ? "var(--color-secondary-dark)" : "var(--color-text-muted)" }}>
                            {Math.round((r.managerBonus || 0) * 100)}%
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>N/A</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => setEditingRate({
                            userId: u.id,
                            baseRate: r.baseRate,
                            managerBonus: r.managerBonus || 0,
                            name: u.name,
                            role: u.role,
                          })}
                          className="btn btn-ghost"
                          style={{ minHeight: 32, padding: "0.375rem 0.625rem", fontSize: "0.75rem" }}
                        >
                          <Icon name="search" size={14} />
                          <span>Edit</span>
                        </button>
                        <button onClick={() => deactivateUser(u.id)} className="btn btn-ghost" style={{ color: "var(--color-danger)", minHeight: 32, padding: "0.375rem 0.625rem", fontSize: "0.75rem" }}>
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Create user modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Add new user</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost" style={{ minHeight: 32, padding: "0.375rem" }} aria-label="Close"><Icon name="x" size={18} /></button>
            </div>
            <form onSubmit={createUser} style={{ display: "grid", gap: 12 }}>
              <div><label className="label">Full name</label><input type="text" required placeholder="Full name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="input" /></div>
              <div><label className="label">Email</label><input type="email" required placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="input" /></div>
              <div><label className="label">Password</label><input type="password" required placeholder="Password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="input" /></div>
              <div>
                <label className="label">Role</label>
                <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className="input">
                  <option value="EMPLOYEE">Employee</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option>
                </select>
              </div>
              {createForm.role === "EMPLOYEE" && (
                <div>
                  <label className="label">Manager</label>
                  <select value={createForm.managerId} onChange={(e) => setCreateForm({ ...createForm, managerId: e.target.value })} className="input">
                    <option value="">No manager</option>
                    {users.filter((u: any) => u.role === "MANAGER").map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit commission modal */}
      {editingRate && (
        <div className="modal-backdrop" onClick={() => setEditingRate(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Edit commission</h2>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: 2 }}>{editingRate.name} · {editingRate.role}</p>
              </div>
              <button onClick={() => setEditingRate(null)} className="btn btn-ghost" style={{ minHeight: 32, padding: "0.375rem" }} aria-label="Close"><Icon name="x" size={18} /></button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="label">Personal commission rate</label>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: 8 }}>
                  Rate applied to this user's own sales
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.01"
                    value={editingRate.baseRate}
                    onChange={(e) => setEditingRate({ ...editingRate, baseRate: parseFloat(e.target.value) })}
                    style={{ flex: 1, accentColor: "var(--color-primary)" }}
                  />
                  <div style={{
                    minWidth: 64, textAlign: "center", padding: "0.5rem 0.75rem",
                    background: "var(--glass-bg-soft)", borderRadius: 10,
                    fontWeight: 700, color: "var(--color-primary)",
                  }}>
                    {Math.round(editingRate.baseRate * 100)}%
                  </div>
                </div>
              </div>

              {(editingRate.role === "MANAGER" || editingRate.role === "ADMIN") && (
                <div>
                  <label className="label">Manager team bonus</label>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: 8 }}>
                    Bonus on TOTAL team sales at shows this manager attends
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="range"
                      min="0"
                      max="0.1"
                      step="0.005"
                      value={editingRate.managerBonus}
                      onChange={(e) => setEditingRate({ ...editingRate, managerBonus: parseFloat(e.target.value) })}
                      style={{ flex: 1, accentColor: "var(--color-secondary)" }}
                    />
                    <div style={{
                      minWidth: 64, textAlign: "center", padding: "0.5rem 0.75rem",
                      background: "var(--glass-bg-soft)", borderRadius: 10,
                      fontWeight: 700, color: "var(--color-secondary-dark)",
                    }}>
                      {Math.round(editingRate.managerBonus * 1000) / 10}%
                    </div>
                  </div>
                </div>
              )}

              <div style={{ padding: "0.75rem 0.875rem", background: "var(--glass-bg-soft)", borderRadius: 12, marginTop: 8 }}>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  On a $1,000 sale this user gets <strong>{formatCurrency(1000 * editingRate.baseRate)}</strong>
                  {editingRate.role === "MANAGER" || editingRate.role === "ADMIN" ? ` plus ${formatCurrency(1000 * editingRate.managerBonus)} per $1,000 of team total at each attended show` : ""}.
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setEditingRate(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button onClick={saveRate} className="btn btn-primary" style={{ flex: 1 }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminUsersPage() {
  return <ClientAuthShell requireAdmin pageTitle="Users"><UsersInner /></ClientAuthShell>;
}
