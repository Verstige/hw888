"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { formatCurrency } from "@/lib/products";
import { format } from "date-fns";

type Status = "NEW" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";

type Order = {
  id: string;
  trackingNumber: string | null;
  carrier: string;
  status: Status;
  customerId: string | null;
  recipientName: string;
  recipientEmail: string | null;
  recipientPhone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  items: string;
  notes: string | null;
  shippingCost: number;
  createdById: string;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  customer: { id: string; name: string; email: string | null } | null;
  createdBy: { id: string; name: string };
  events: Array<{ id: string; status: string; location: string | null; description: string; createdAt: string }>;
};

type Customer = { id: string; name: string; email: string | null };

const STATUSES: Status[] = ["NEW", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

const STATUS_COLORS: Record<Status, string> = {
  NEW: "#3B82F6",
  PROCESSING: "#C9A84C",
  SHIPPED: "#8B5CF6",
  DELIVERED: "#2D8A4E",
  CANCELLED: "#6B7280",
  RETURNED: "#DC2626",
};

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "Local"];

export default function ShippingClient({
  userRole,
  orders: initial,
  customers,
}: {
  userRole: "ADMIN" | "MANAGER" | "EMPLOYEE";
  orders: any[];
  customers: Customer[];
}) {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>(initial);
  const [tab, setTab] = useState<"new" | "active" | "delivered" | "all">("new");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const counts = useMemo(() => ({
    new: orders.filter((o) => o.status === "NEW").length,
    active: orders.filter((o) => ["NEW", "PROCESSING", "SHIPPED"].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    all: orders.length,
  }), [orders]);

  const filtered = useMemo(() => {
    let list = orders;
    if (tab === "new") list = list.filter((o) => o.status === "NEW");
    else if (tab === "active") list = list.filter((o) => ["NEW", "PROCESSING", "SHIPPED"].includes(o.status));
    else if (tab === "delivered") list = list.filter((o) => o.status === "DELIVERED");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        o.recipientName.toLowerCase().includes(q) ||
        (o.trackingNumber || "").toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q) ||
        o.state.toLowerCase().includes(q) ||
        (o.customer?.name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, tab, search]);

  const onCreate = (order: Order) => {
    setOrders((os) => [order, ...os]);
    setCreating(false);
    router.refresh();
  };

  const onUpdate = (order: Order) => {
    setOrders((os) => os.map((o) => o.id === order.id ? order : o));
    setEditingId(null);
    router.refresh();
  };

  return (
    <ClientAuthShell pageTitle="Shipping" pageSubtitle="Track + manage deliveries">
      <div style={{ marginBottom: "1rem" }}>
        <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Shipping</h1>
        <p className="section-title-sub" style={{ marginTop: 4 }}>
          {counts.new} new · {counts.active} active · {counts.delivered} delivered
        </p>
      </div>

      {/* Tabs */}
      <div className="pill-group" style={{ marginBottom: "1rem", width: "100%" }}>
        {(["new", "active", "delivered", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pill ${tab === t ? "pill-active" : ""}`} style={{ flex: 1 }}>
            {t === "new" ? "New" : t === "active" ? "Active" : t === "delivered" ? "Delivered" : "All"} ({counts[t]})
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
        <button onClick={() => setCreating(true)} className="btn btn-primary" style={{ flex: 1 }}>
          <Icon name="plus" size={16} /><span>New shipment</span>
        </button>
      </div>

      <GlassCard padding="md" style={{ marginBottom: "1rem" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }}>
            <Icon name="search" size={16} />
          </span>
          <input
            className="input"
            style={{ paddingLeft: 36 }}
            placeholder="Search tracking #, recipient, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </GlassCard>

      {filtered.length === 0 ? (
        <GlassCard padding="lg">
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p>{tab === "new" ? "No new shipments — click 'New shipment' above" : "No shipments here yet"}</p>
          </div>
        </GlassCard>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} onClick={() => setEditingId(o.id)} />
          ))}
        </div>
      )}

      {creating && (
        <NewOrderModal customers={customers} onClose={() => setCreating(false)} onCreated={onCreate} />
      )}
      {editingId && (
        <OrderDetailModal order={orders.find((o) => o.id === editingId)!} onClose={() => setEditingId(null)} onUpdated={onUpdate} canDelete={userRole === "ADMIN"} />
      )}
    </ClientAuthShell>
  );
}

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const statusColor = STATUS_COLORS[order.status];
  const items = (() => {
    try { return JSON.parse(order.items); } catch { return []; }
  })();
  return (
    <GlassCard padding="md" interactive onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: `${statusColor}15`,
          border: `1px solid ${statusColor}30`,
          color: statusColor,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="package" size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{order.recipientName}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {order.city}, {order.state} {order.postalCode} · {order.carrier}
            {order.trackingNumber && ` · ${order.trackingNumber}`}
          </p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: statusColor, padding: "0.25rem 0.625rem", background: `${statusColor}15`, borderRadius: 6 }}>
            {order.status}
          </span>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 4 }}>{format(new Date(order.createdAt), "MMM d")}</p>
        </div>
      </div>
      {items.length > 0 && (
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 6 }}>
          {items.length} item{items.length !== 1 ? "s" : ""} · {formatCurrency(order.shippingCost)} shipping
        </p>
      )}
    </GlassCard>
  );
}

function NewOrderModal({ customers, onClose, onCreated }: { customers: Customer[]; onClose: () => void; onCreated: (o: any) => void }) {
  const [customerId, setCustomerId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");
  const [carrier, setCarrier] = useState("USPS");
  const [shippingCost, setShippingCost] = useState("");
  const [items, setItems] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!recipientName || !addressLine1 || !city || !state || !postalCode || !items) {
      setError("Recipient, address, city, state, postal, and items are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const itemsArr = items.split("\n").filter((l) => l.trim()).map((line) => {
        const [model, style, qty = "1"] = line.split(/[|,]/).map((s) => s.trim());
        return { model, style, qty: Number(qty) || 1 };
      });
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId || null,
          recipientName, recipientEmail: recipientEmail || null, recipientPhone: recipientPhone || null,
          addressLine1, addressLine2: addressLine2 || null,
          city, state, postalCode, country,
          carrier, shippingCost: Number(shippingCost) || 0,
          items: itemsArr, notes: notes || null,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed");
      }
      onCreated(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>New shipment</h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: "0.375rem", minHeight: 32 }} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }} className="form-grid-2">
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label">Link to customer (optional)</label>
            <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">— No CRM customer —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email || "no email"})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Recipient name *</label>
            <input className="input" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
          </div>
          <div>
            <label className="label">Email (for confirmation)</label>
            <input className="input" type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} />
          </div>
          <div>
            <label className="label">Carrier</label>
            <select className="input" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
              {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label">Address line 1 *</label>
            <input className="input" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label">Address line 2</label>
            <input className="input" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
          </div>
          <div>
            <label className="label">City *</label>
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="label">State *</label>
            <input className="input" value={state} onChange={(e) => setState(e.target.value.toUpperCase())} maxLength={2} />
          </div>
          <div>
            <label className="label">Postal code *</label>
            <input className="input" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          </div>
          <div>
            <label className="label">Shipping cost</label>
            <input className="input" type="number" inputMode="decimal" step="0.01" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label">Items (one per line: model | style | qty)</label>
            <textarea className="input" rows={3} placeholder={`Thick Design 6X | Black | 1\nClassic Large | Gold | 2`} value={items} onChange={(e) => setItems(e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label">Notes</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {error && <div style={{ padding: "0.625rem 0.875rem", background: "rgba(196, 68, 68, 0.10)", color: "var(--color-danger)", borderRadius: 10, fontSize: "0.8125rem", fontWeight: 600, marginTop: 10 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn btn-primary">{saving ? "Creating…" : "Create shipment"}</button>
        </div>
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose, onUpdated, canDelete }: {
  order: Order;
  onClose: () => void;
  onUpdated: (o: any) => void;
  canDelete: boolean;
}) {
  const [current, setCurrent] = useState(order);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [eventDesc, setEventDesc] = useState("");
  const [eventLoc, setEventLoc] = useState("");
  const statusColor = STATUS_COLORS[current.status];
  const items = (() => {
    try { return JSON.parse(current.items); } catch { return []; }
  })();

  const updateStatus = async (newStatus: Status) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/shipping/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, eventDescription: eventDesc || `Marked as ${newStatus}`, eventLocation: eventLoc || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        // Reload to get fresh events
        const fresh = await fetch(`/api/shipping/${current.id}`).then((r) => r.json());
        setCurrent({ ...fresh, createdAt: fresh.createdAt, updatedAt: fresh.updatedAt, shippedAt: fresh.shippedAt, deliveredAt: fresh.deliveredAt });
        onUpdated(fresh);
        setEventDesc("");
        setEventLoc("");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete this shipment to ${current.recipientName}?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/shipping/${current.id}`, { method: "DELETE" });
      if (res.ok) onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>{current.recipientName}</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              {current.trackingNumber && `Tracking: ${current.trackingNumber} · `}
              Created {format(new Date(current.createdAt), "MMM d, yyyy")}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: "0.375rem", minHeight: 32 }} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Status pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={updating || current.status === s}
              style={{
                padding: "0.375rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                borderRadius: 999,
                background: current.status === s ? STATUS_COLORS[s] : `${STATUS_COLORS[s]}15`,
                color: current.status === s ? "white" : STATUS_COLORS[s],
                border: `1px solid ${STATUS_COLORS[s]}40`,
                cursor: current.status === s ? "default" : "pointer",
                opacity: current.status === s ? 1 : 0.85,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Add event note */}
        <GlassCard padding="sm" variant="soft" style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gap: 6, gridTemplateColumns: "1fr 1fr" }} className="form-grid-2">
            <input className="input" placeholder="Event description (optional)" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} />
            <input className="input" placeholder="Location (optional)" value={eventLoc} onChange={(e) => setEventLoc(e.target.value)} />
          </div>
          <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: 6 }}>
            Tip: type a note above, then click a status pill to record the event.
          </p>
        </GlassCard>

        {/* Address */}
        <GlassCard padding="md" variant="soft" style={{ marginBottom: 12 }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Ship to</p>
          <p style={{ fontSize: "0.875rem" }}>{current.recipientName}</p>
          <p style={{ fontSize: "0.875rem" }}>{current.addressLine1}</p>
          {current.addressLine2 && <p style={{ fontSize: "0.875rem" }}>{current.addressLine2}</p>}
          <p style={{ fontSize: "0.875rem" }}>{current.city}, {current.state} {current.postalCode} ({current.country})</p>
        </GlassCard>

        {/* Items */}
        {items.length > 0 && (
          <GlassCard padding="md" variant="soft" style={{ marginBottom: 12 }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Items</p>
            {items.map((it: any, i: number) => (
              <p key={i} style={{ fontSize: "0.875rem" }}>
                {it.qty || 1}× {it.model} · {it.style}
              </p>
            ))}
          </GlassCard>
        )}

        {/* Timeline */}
        <GlassCard padding="md" variant="soft" style={{ marginBottom: 12 }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Timeline</p>
          <div style={{ display: "grid", gap: 8 }}>
            {current.events.map((e) => (
              <div key={e.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 999, marginTop: 6, flexShrink: 0,
                  background: STATUS_COLORS[e.status as Status] || "#999",
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{e.description}</p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                    {format(new Date(e.createdAt), "MMM d, h:mm a")} {e.location && `· ${e.location}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {canDelete && (
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8 }}>
            <button onClick={handleDelete} disabled={deleting} className="btn btn-ghost" style={{ color: "var(--color-danger)" }}>
              <Icon name="x" size={16} /><span>{deleting ? "Deleting…" : "Delete shipment"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
