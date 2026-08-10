"use client";

import { useState, useEffect } from "react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE", managerId: "" });

  const load = () => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => { setUsers(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ name: "", email: "", password: "", role: "EMPLOYEE", managerId: "" });
      load();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to create user");
    }
  };

  const deactivateUser = async (id: string) => {
    if (!confirm("Deactivate this user?")) return;
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    load();
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="bg-[var(--color-primary)] text-white px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Admin — Users</h1>
            <p className="text-sm opacity-80 mt-0.5">{users.length} users</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-white text-[var(--color-primary)] font-semibold rounded-lg"
          >
            + Add User
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">Loading...</div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-sm text-[var(--color-text-muted)]">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Manager</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "ADMIN" ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : u.role === "MANAGER" ? "bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]" : "bg-[var(--color-border)] text-[var(--color-text-muted)]"}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">{u.manager?.name || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deactivateUser(u.id)}
                        className="text-xs text-[var(--color-danger)] hover:underline"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-[var(--color-surface)] rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">Add New User</h2>
            <form onSubmit={createUser} className="space-y-3">
              <input
                type="text"
                placeholder="Full name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg"
              />
              <input
                type="email"
                placeholder="Email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg"
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg"
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
              {form.role === "EMPLOYEE" && (
                <select
                  value={form.managerId}
                  onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg"
                >
                  <option value="">No Manager</option>
                  {users.filter((u: any) => u.role === "MANAGER").map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-[var(--color-border)] rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-[var(--color-primary)] text-white font-semibold rounded-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
