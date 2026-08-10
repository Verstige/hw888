"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

export default function AdminEquipmentPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterShow, setFilterShow] = useState("");

  const load = () => {
    const url = filterShow ? `/api/equipment?showId=${filterShow}` : "/api/equipment";
    fetch(url).then((r) => r.json()).then((d) => { setTasks(d); setLoading(false); });
    fetch("/api/shows?status=ACTIVE").then((r) => r.json()).then((d) => setShows(d));
  };

  useEffect(() => { load(); }, [filterShow]);

  const toggleTask = async (id: string, currentStatus: string) => {
    await fetch(`/api/equipment/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED" }),
    });
    load();
  };

  const taskLabels: Record<string, string> = {
    TABLES: "Tables",
    CHAIRS: "Chairs",
    TENT: "Tent",
    TENT_WEIGHTS: "Tent Weights",
    EXTENSION_CORD: "Extension Cord",
    DISPLAY: "Display Materials",
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="bg-[var(--color-primary)] text-white px-6 py-5">
        <h1 className="text-xl font-bold">Equipment Checklist</h1>
        <p className="text-sm opacity-80 mt-0.5">Tables, chairs, tent & weights for outdoor shows</p>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[var(--color-text-muted)]">Show:</label>
          <select value={filterShow} onChange={(e) => setFilterShow(e.target.value)} className="px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-sm">
            <option value="">All Shows</option>
            {shows.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="card text-center py-12 text-[var(--color-text-muted)]">No equipment tasks yet.</div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task: any) => (
              <div key={task.id} className="card flex items-center gap-3">
                <button
                  onClick={() => toggleTask(task.id, task.status)}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${task.status === "COMPLETED" ? "bg-[var(--color-success)] border-[var(--color-success)] text-white" : "border-[var(--color-border)]"}`}
                >
                  {task.status === "COMPLETED" && "✓"}
                </button>
                <div className="flex-1">
                  <p className={`font-medium ${task.status === "COMPLETED" ? "line-through text-[var(--color-text-muted)]" : ""}`}>
                    {taskLabels[task.taskType] || task.taskType}
                  </p>
                  {task.show && (
                    <p className="text-xs text-[var(--color-text-muted)]">{task.show.name}</p>
                  )}
                </div>
                {task.status === "COMPLETED" && task.completedAt && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {format(new Date(task.completedAt), "MMM d")}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
