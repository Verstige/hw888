"use client";

import { useState, useEffect } from "react";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";

function UsersInner() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE", managerId: "" });
  const load = () => { fetch("/api/users").then((r) => r.json()).then((d) => { setUsers(d); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setShowModal(false); setForm({ name: "", email: "", password: "", role: "EMPLOYEE", managerId: "" }); load(); }
    else { const err = await res.json(); alert(err.error || "Failed to create user"); }
  };

  const deactivateUser = async (id: string) => {
    if (!confirm("Deactivate this user?")) return;
    await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: false }) });
    load();
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Users</h1>
          <p className="section-title-sub" style={{ marginTop: 4 }}>{users.length} total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary"><Icon name="plus" size={18} /><span>Add user</span></button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>Loading…</div>
      ) : users.length === 0 ? (
        <GlassCard padding="lg"><div className="empty-state"><div className="empty-state-icon">👤</div>No users yet</div></GlassCard>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {users.map((u: any) => (
            <GlassCard key={u.id} padding="md">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="avatar avatar-sm">{u.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "?"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{u.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{u.email}</p>
                </div>
                <span className={`badge ${u.role === "ADMIN" ? "badge-primary" : u.role === "MANAGER" ? "badge-secondary" : ""}`}>{u.role}</span>
                {u.role === "EMPLOYEE" && u.manager?.name && <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>↳ {u.manager.name}</span>}
                <button onClick={() => deactivateUser(u.id)} className="btn btn-ghost" style={{ color: "var(--color-danger)", minHeight: 36, padding: "0.5rem 0.625rem", fontSize: "0.8125rem" }}>Deactivate</button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Add new user</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ minHeight: 32, padding: "0.375rem" }} aria-label="Close"><Icon name="x" size={18} /></button>
            </div>
            <form onSubmit={createUser} style={{ display: "grid", gap: 12 }}>
              <div><label className="label">Full name</label><input type="text" required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></div>
              <div><label className="label">Email</label><input type="email" required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" /></div>
              <div><label className="label">Password</label><input type="password" required placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" /></div>
              <div>
                <label className="label">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
                  <option value="EMPLOYEE">Employee</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option>
                </select>
              </div>
              {form.role === "EMPLOYEE" && (
                <div>
                  <label className="label">Manager</label>
                  <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })} className="input">
                    <option value="">No manager</option>
                    {users.filter((u: any) => u.role === "MANAGER").map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminUsersPage() {
  return <ClientAuthShell requireAdmin pageTitle="Users"><UsersInner /></ClientAuthShell>;
}
