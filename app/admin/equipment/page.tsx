"use client";

import { useState, useEffect } from "react";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { format } from "date-fns";

function EquipmentInner() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterShow, setFilterShow] = useState("");

  const load = () => {
    const url = filterShow ? `/api/equipment?showId=${filterShow}` : "/api/equipment";
    fetch(url).then((r) => r.json()).then((d) => { setTasks(d); setLoading(false); });
    fetch("/api/shows").then((r) => r.json()).then((d) => setShows(d));
  };
  useEffect(() => { load(); }, [filterShow]);

  const toggleTask = async (id: string, currentStatus: string) => {
    await fetch(`/api/equipment/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED" }) });
    load();
  };

  const taskLabels: Record<string, string> = {
    TABLES: "Tables", CHAIRS: "Chairs", TENT: "Tent", TENT_WEIGHTS: "Tent Weights", EXTENSION_CORD: "Extension Cord", DISPLAY: "Display Materials",
  };

  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <>
      <div style={{ marginBottom: "1rem" }}>
        <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Equipment</h1>
        <p className="section-title-sub" style={{ marginTop: 4 }}>Checklist per show</p>
      </div>

      <GlassCard padding="sm" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label className="label" style={{ marginBottom: 0, flexShrink: 0 }}>Show</label>
          <select value={filterShow} onChange={(e) => setFilterShow(e.target.value)} className="input" style={{ flex: 1 }}>
            <option value="">All shows</option>
            {shows.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </GlassCard>

      {total > 0 && (
        <GlassCard padding="md" variant="strong" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)" }}>Progress</p>
            <p style={{ fontSize: "0.875rem", fontWeight: 700 }}>{completed} / {total} · {pct}%</p>
          </div>
          <div style={{ height: 8, background: "var(--color-bg-dark)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)", borderRadius: 999, transition: "width 0.4s ease" }} />
          </div>
        </GlassCard>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>Loading…</div>
      ) : tasks.length === 0 ? (
        <GlassCard padding="lg"><div className="empty-state"><div className="empty-state-icon">🔧</div>No equipment tasks yet</div></GlassCard>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {tasks.map((task: any) => {
            const done = task.status === "COMPLETED";
            return (
              <GlassCard key={task.id} padding="md">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={() => toggleTask(task.id, task.status)}
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      border: done ? "none" : "2px solid var(--color-border)",
                      background: done ? "linear-gradient(135deg, var(--color-success) 0%, #3FA562 100%)" : "transparent",
                      color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0,
                      boxShadow: done ? "0 2px 8px rgba(45, 138, 78, 0.30)" : "none",
                    }}
                    aria-label={done ? "Mark incomplete" : "Mark complete"}
                  >
                    {done && <Icon name="check" size={16} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: "0.9375rem", textDecoration: done ? "line-through" : "none", color: done ? "var(--color-text-muted)" : "var(--color-text)" }}>
                      {taskLabels[task.taskType] || task.taskType}
                    </p>
                    {task.show && <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{task.show.name}</p>}
                  </div>
                  {done && task.completedAt && <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{format(new Date(task.completedAt), "MMM d")}</span>}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function AdminEquipmentPage() {
  return <ClientAuthShell pageTitle="Equipment"><EquipmentInner /></ClientAuthShell>;
}
