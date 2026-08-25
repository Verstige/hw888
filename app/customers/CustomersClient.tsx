"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { hw, useAnimations } from "@/app/components/Animations";
import { formatCurrency } from "@/lib/products";
import { format } from "date-fns";

type Customer = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
  tags?: string | null;
  totalSpent: number;
  visitCount: number;
  owner: { id: string; name: string; email: string };
  _count: { sales: number; shippingOrders: number };
  createdAt: string;
  updatedAt: string;
};

type Owner = { id: string; name: string; role: string };

const STATES = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

export default function CustomersClient({
  userRole,
  currentUserId,
  customers: initial,
  owners,
}: {
  userRole: "ADMIN" | "MANAGER" | "EMPLOYEE";
  currentUserId: string;
  customers: Customer[];
  owners: Owner[];
}) {
  useAnimations();
  const router = useRouter();
  const [customers, setCustomers] = useState(initial);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"list" | "create" | "view">("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q)
      || (c.email || "").toLowerCase().includes(q)
      || (c.phone || "").includes(q)
      || (c.city || "").toLowerCase().includes(q)
      || (c.tags || "").toLowerCase().includes(q);
  });

  return (
    <ClientAuthShell pageTitle="Customers" pageSubtitle="CRM — your book of business">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Customers</h1>
          <p className="section-title-sub" style={{ marginTop: 4 }}>{customers.length} in your book{userRole !== "ADMIN" && " · scoped to your team"}</p>
        </div>
        <button onClick={() => setTab("create")} className="btn btn-primary">
          <Icon name="plus" size={16} /><span>Add customer</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="pill-group" style={{ marginBottom: "1rem", width: "100%" }}>
        <button onClick={() => setTab("list")} className={`pill ${tab === "list" ? "pill-active" : ""}`} style={{ flex: 1 }}>
          <Icon name="search" size={14} /><span>All ({customers.length})</span>
        </button>
        <button onClick={() => setTab("create")} className={`pill ${tab === "create" ? "pill-active" : ""}`} style={{ flex: 1 }}>
          <Icon name="plus" size={14} /><span>Add new</span>
        </button>
      </div>

      {tab === "list" && (
        <>
          <GlassCard padding="md" style={{ ...hw.slideUp(0), marginBottom: "1rem" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }}><Icon name="search" size={16} /></span>
              <input
                className="input"
                style={{ paddingLeft: 36 }}
                placeholder="Search by name, email, phone, city, tags…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </GlassCard>

          {filtered.length === 0 ? (
            <GlassCard padding="lg" style={hw.scaleIn(50)}>
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <p style={{ marginBottom: 4 }}>{search ? "No customers match your search" : "No customers yet"}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Add your first customer to start building your book of business</p>
              </div>
            </GlassCard>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {filtered.map((c, i) => (
                <div key={c.id} style={hw.slideUp(i * 40)}>
                  <CustomerCard customer={c} onClick={() => { setEditingId(c.id); setTab("view"); }} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "create" && (
        <CustomerForm
          owners={owners}
          currentUserId={currentUserId}
          isAdmin={userRole === "ADMIN"}
          onClose={() => setTab("list")}
          onSaved={(c) => {
            setCustomers((cs) => [c, ...cs]);
            setTab("list");
            router.refresh();
          }}
        />
      )}

      {tab === "view" && editingId && (
        <CustomerDetail
          customerId={editingId}
          initial={customers.find((c) => c.id === editingId)!}
          onClose={() => { setTab("list"); setEditingId(null); }}
          onSaved={(updated) => {
            setCustomers((cs) => cs.map((c) => c.id === updated.id ? { ...c, ...updated } : c));
          }}
          canDelete={userRole === "ADMIN"}
        />
      )}
    </ClientAuthShell>
  );
}

function CustomerCard({ customer, onClick }: { customer: Customer; onClick: () => void }) {
  const tags = (customer.tags || "").split(",").filter(Boolean);
  return (
    <GlassCard padding="md" interactive onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="avatar avatar-sm" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", color: "white" }}>
          {customer.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{customer.name}</p>
            {tags.length > 0 && tags.map((t) => (
              <span key={t} style={{ fontSize: "0.6875rem", padding: "0.125rem 0.5rem", background: "var(--glass-bg-soft)", borderRadius: 6, fontWeight: 600 }}>
                {t.trim()}
              </span>
            ))}
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {customer.email && customer.phone
              ? `${customer.email} · ${customer.phone}`
              : customer.email || customer.phone || "no contact info"}
            {customer.city && ` · ${customer.city}${customer.state ? `, ${customer.state}` : ""}`}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 700 }}>{formatCurrency(customer.totalSpent)}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{customer.visitCount} visit{customer.visitCount !== 1 ? "s" : ""}</p>
        </div>
      </div>
    </GlassCard>
  );
}

function CustomerForm({
  owners, currentUserId, isAdmin, onClose, onSaved,
}: {
  owners: Owner[];
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
  onSaved: (c: any) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [ownerId, setOwnerId] = useState(currentUserId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      setError("Name required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          city: city.trim() || null,
          state: state || null,
          notes: notes.trim() || null,
          tags: tags.trim() || null,
          ownerId,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed");
      }
      onSaved(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard padding="lg">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>New customer</h2>
        <button onClick={onClose} className="btn btn-ghost" style={{ padding: "0.375rem", minHeight: 32 }} aria-label="Close">
          <Icon name="x" size={18} />
        </button>
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }} className="form-grid-2">
        <div>
          <label className="label">Name *</label>
          <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {isAdmin && (
          <div>
            <label className="label">Assign to owner</label>
            <select className="input" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.role})</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" type="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="label">City</label>
          <input className="input" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <label className="label">State</label>
          <select className="input" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">—</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="label">Tags (comma-separated)</label>
          <input className="input" placeholder="vip, repeat-buyer, follow-up" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="label">Notes</label>
          <textarea className="input" rows={3} placeholder="Anything you want to remember…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      {error && <div style={{ padding: "0.625rem 0.875rem", background: "rgba(196, 68, 68, 0.10)", color: "var(--color-danger)", borderRadius: 10, fontSize: "0.8125rem", fontWeight: 600, marginTop: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
        <button onClick={onClose} className="btn btn-secondary">Cancel</button>
        <button onClick={submit} disabled={saving} className="btn btn-primary">{saving ? "Saving…" : "Save"}</button>
      </div>
    </GlassCard>
  );
}

function CustomerDetail({ customerId, initial, onClose, onSaved, canDelete }: {
  customerId: string;
  initial: Customer;
  onClose: () => void;
  onSaved: (c: any) => void;
  canDelete: boolean;
}) {
  const [customer, setCustomer] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tags = (customer.tags || "").split(",").filter(Boolean);

  const handleDelete = async () => {
    if (!confirm(`Delete ${customer.name}? This can't be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
      if (res.ok) onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <GlassCard padding="lg">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="avatar avatar-lg" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", color: "white", width: 56, height: 56, fontSize: "1.25rem" }}>
            {customer.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{customer.name}</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Added {format(new Date(customer.createdAt), "MMM d, yyyy")} · Owner: {customer.owner.name}</p>
            {tags.length > 0 && (
              <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                {tags.map((t) => (
                  <span key={t} style={{ fontSize: "0.6875rem", padding: "0.125rem 0.5rem", background: "var(--glass-bg-soft)", borderRadius: 6, fontWeight: 600 }}>
                    {t.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <button onClick={onClose} className="btn btn-ghost" style={{ padding: "0.375rem", minHeight: 32 }} aria-label="Close">
          <Icon name="x" size={18} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }} className="form-grid-2">
        <KpiBlock label="Total spent" value={formatCurrency(customer.totalSpent)} />
        <KpiBlock label="Visits" value={customer.visitCount.toString()} />
        <KpiBlock label="Sales" value={customer._count.sales.toString()} />
        <KpiBlock label="Shipments" value={customer._count.shippingOrders.toString()} />
      </div>

      <div style={{ display: "grid", gap: 8, padding: 16, background: "var(--glass-bg-soft)", borderRadius: 12, marginBottom: 16 }}>
        <ContactRow icon="search" label="Email" value={customer.email} />
        <ContactRow icon="package" label="Phone" value={customer.phone} />
        <ContactRow icon="package" label="Location" value={customer.city && customer.state ? `${customer.city}, ${customer.state}` : customer.city} />
      </div>

      {customer.notes && (
        <GlassCard padding="md" variant="soft" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Notes</p>
          <p style={{ fontSize: "0.875rem", whiteSpace: "pre-wrap", margin: 0 }}>{customer.notes}</p>
        </GlassCard>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
        <button onClick={() => setEditing(true)} className="btn btn-secondary">
          <Icon name="search" size={16} /><span>Edit</span>
        </button>
        {canDelete && (
          <button onClick={handleDelete} disabled={deleting} className="btn btn-ghost" style={{ color: "var(--color-danger)" }}>
            <Icon name="x" size={16} /><span>{deleting ? "Deleting…" : "Delete"}</span>
          </button>
        )}
      </div>

      {editing && (
        <CustomerForm
          owners={[]}
          currentUserId={customer.owner.id}
          isAdmin={false}
          onClose={() => setEditing(false)}
          onSaved={(c) => {
            setCustomer({ ...customer, ...c });
            onSaved(c);
            setEditing(false);
          }}
        />
      )}
    </GlassCard>
  );
}

function KpiBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "0.75rem 1rem", background: "var(--glass-bg-soft)", borderRadius: 10, textAlign: "center" }}>
      <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{label}</p>
      <p style={{ fontSize: "1.125rem", fontWeight: 800, margin: "4px 0 0" }}>{value}</p>
    </div>
  );
}

function ContactRow({ icon, label, value }: { icon: any; label: string; value?: string | null }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Icon name={icon} size={14} />
      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", width: 80 }}>{label}</span>
      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{value || "—"}</span>
    </div>
  );
}
