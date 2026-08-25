"use client";

import { useState, useTransition } from "react";
import { SiteShell } from "@/app/components/SiteShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { format } from "date-fns";

type Show = {
  id: string;
  name: string;
  location: string;
  address: string | null;
  startDate: string;
  endDate: string;
  isOutdoor: boolean;
  status: string;
  notes: string | null;
  manager?: { id: string; name: string } | null;
  assignments?: Array<{ id: string; user: { id: string; name: string; role: string } }>;
  _count?: { sales: number };
};

type User = { id: string; name: string; email: string; role?: string };

export default function AdminShowsClient({
  user,
  initialShows,
  managers,
  employees,
}: {
  user: { name: string; role: "ADMIN" | "MANAGER" | "EMPLOYEE" };
  initialShows: Show[];
  managers: User[];
  employees: User[];
}) {
  const [shows, setShows] = useState<Show[]>(initialShows);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isOutdoor, setIsOutdoor] = useState(false);
  const [notes, setNotes] = useState("");
  const [managerId, setManagerId] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const resetForm = () => {
    setName("");
    setLocation("");
    setAddress("");
    setStartDate("");
    setEndDate("");
    setIsOutdoor(false);
    setNotes("");
    setManagerId("");
    setSelectedEmployees([]);
    setError(null);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !location || !startDate || !endDate) {
      setError("Name, location, and dates are required.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError("End date must be after start date.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        location,
        address: address || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        isOutdoor,
        notes: notes || undefined,
        managerId: managerId || null,
        employeeIds: selectedEmployees,
      };

      const url = editingId ? `/api/shows/${editingId}` : "/api/shows";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed to save show");
      }

      const saved = await res.json();
      // Refresh list from server to get relations populated
      const refresh = await fetch("/api/shows", { credentials: "include" });
      const all = await refresh.json();
      setShows(all);
      resetForm();
      setCreating(false);
      startTransition(() => {
        // visual hint — could scroll to top
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save show");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEmployee = (id: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const statusBadge = (status: string) => {
    const cls =
      status === "ACTIVE"
        ? "badge-success"
        : status === "UPCOMING"
          ? "badge-primary"
          : status === "COMPLETED"
            ? "badge-secondary"
            : "badge";
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  return (
    <SiteShell user={user} pageTitle="Manage shows" pageSubtitle={`${shows.length} total`}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
            Shows
          </h1>
          <p className="section-title-sub" style={{ marginTop: 4 }}>
            Create and manage trade shows
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setCreating((c) => !c);
          }}
        >
          <Icon name={creating ? "x" : "plus"} size={18} />
          <span>{creating ? "Cancel" : "New show"}</span>
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <GlassCard padding="lg" style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            {editingId ? "Edit show" : "New show"}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.875rem" }}>
            <div>
              <label className="label" htmlFor="show-name">Show name *</label>
              <input
                id="show-name"
                className="input"
                placeholder="e.g. Austin Trade Show"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gap: "0.875rem", gridTemplateColumns: "1fr" }} className="form-grid-2">
              <div>
                <label className="label" htmlFor="show-location">Location *</label>
                <input
                  id="show-location"
                  className="input"
                  placeholder="e.g. Austin Convention Center, TX"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="show-address">Address</label>
                <input
                  id="show-address"
                  className="input"
                  placeholder="Street address (optional)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gap: "0.875rem", gridTemplateColumns: "1fr" }} className="form-grid-2">
              <div>
                <label className="label" htmlFor="show-start">Start date *</label>
                <input
                  id="show-start"
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="show-end">End date *</label>
                <input
                  id="show-end"
                  type="date"
                  className="input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="show-manager">Manager</label>
              <select
                id="show-manager"
                className="input"
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
              >
                <option value="">— No manager —</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <label style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0.875rem 1rem",
              background: isOutdoor ? "rgba(212, 146, 42, 0.10)" : "var(--glass-bg-soft)",
              border: `1px solid ${isOutdoor ? "rgba(212, 146, 42, 0.30)" : "var(--glass-border-soft)"}`,
              borderRadius: 14,
              cursor: "pointer",
              transition: "all 0.18s ease",
            }}>
              <input
                type="checkbox"
                checked={isOutdoor}
                onChange={(e) => setIsOutdoor(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: "var(--color-warning)" }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Outdoor show</p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  Auto-generates tent + weights equipment tasks
                </p>
              </div>
            </label>

            <div>
              <label className="label">Assign employees ({selectedEmployees.length})</label>
              <div style={{
                maxHeight: 220,
                overflowY: "auto",
                padding: "0.5rem",
                background: "var(--glass-bg-soft)",
                border: "1px solid var(--glass-border-soft)",
                borderRadius: 14,
                display: "grid",
                gap: 4,
              }}>
                {employees.map((e) => {
                  const checked = selectedEmployees.includes(e.id);
                  return (
                    <label
                      key={e.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "0.5rem 0.625rem",
                        background: checked ? "rgba(45, 90, 61, 0.10)" : "transparent",
                        borderRadius: 10,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEmployee(e.id)}
                        style={{ accentColor: "var(--color-primary)" }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{e.name}</p>
                        <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{e.email}</p>
                      </div>
                      <span className={`badge ${e.role === "MANAGER" ? "badge-secondary" : e.role === "ADMIN" ? "badge-primary" : ""}`}>
                        {e.role}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="show-notes">Notes</label>
              <textarea
                id="show-notes"
                className="input"
                placeholder="Anything special about this show…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {error && (
              <div style={{
                padding: "0.625rem 0.875rem",
                background: "rgba(196, 68, 68, 0.10)",
                color: "var(--color-danger)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                borderRadius: 12,
                border: "1px solid rgba(196, 68, 68, 0.20)",
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Saving…" : editingId ? "Save changes" : "Create show"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  resetForm();
                  setCreating(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Shows list */}
      {shows.length === 0 ? (
        <GlassCard padding="lg">
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <p>No shows yet. Create your first one above.</p>
          </div>
        </GlassCard>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {shows.map((show) => (
            <GlassCard key={show.id} padding="md">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>{show.name}</h3>
                    {statusBadge(show.status)}
                    {show.isOutdoor && <span className="badge badge-warning">Outdoor</span>}
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                    {show.location}
                    {show.address && ` · ${show.address}`}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                    {format(new Date(show.startDate), "MMM d, yyyy")} — {format(new Date(show.endDate), "MMM d, yyyy")}
                    {show.manager && ` · Manager: ${show.manager.name}`}
                    {show._count?.sales !== undefined && ` · ${show._count.sales} sale${show._count.sales !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost"
                    style={{ minHeight: 36, padding: "0.5rem 0.625rem" }}
                    aria-label="Edit"
                    onClick={() => {
                      setEditingId(show.id);
                      setName(show.name);
                      setLocation(show.location);
                      setAddress(show.address || "");
                      setStartDate(format(new Date(show.startDate), "yyyy-MM-dd"));
                      setEndDate(format(new Date(show.endDate), "yyyy-MM-dd"));
                      setIsOutdoor(show.isOutdoor);
                      setNotes(show.notes || "");
                      setManagerId(show.manager?.id || "");
                      setSelectedEmployees(show.assignments?.map((a) => a.user.id) || []);
                      setCreating(true);
                    }}
                  >
                    <Icon name="search" size={16} />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
              {show.assignments && show.assignments.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--glass-border-soft)" }}>
                  {show.assignments.map((a) => (
                    <span key={a.id} className="badge">
                      {a.user.name}
                    </span>
                  ))}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </SiteShell>
  );
}
