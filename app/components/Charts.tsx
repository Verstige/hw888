"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = {
  primary: "#2D5A3D",
  primaryLight: "#3D7A52",
  secondary: "#C9A84C",
  secondaryLight: "#E0C36A",
  accent: "#C4724A",
  blue: "#3B82F6",
  pink: "#EC4899",
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.blue,
  COLORS.pink,
  COLORS.primaryLight,
  COLORS.secondaryLight,
];

function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <div className="chart-tooltip-label">{label}</div>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="chart-tooltip-row">
          <span className="chart-tooltip-dot" style={{ background: entry.color || entry.fill }} />
          <span>{entry.name}:</span>
          <strong style={{ marginLeft: "auto", color: "var(--color-text)" }}>
            {typeof entry.value === "number"
              ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })
              : entry.value}
          </strong>
        </div>
      ))}
    </div>
  );
}

type RevenuePoint = {
  date: string;
  sales: number;
  commission: number;
};

export function RevenueTrendChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="g-sales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.30} />
              <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="g-commission" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.secondary} stopOpacity={0.28} />
              <stop offset="100%" stopColor={COLORS.secondary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} opacity={0.5} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--color-text-muted)", fontSize: 11, fontWeight: 600 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--color-text-muted)", fontSize: 11, fontWeight: 600 }}
            tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
          />
          <Tooltip content={<GlassTooltip />} cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="sales"
            stroke={COLORS.primary}
            strokeWidth={2.5}
            fill="url(#g-sales)"
            name="Sales"
          />
          <Area
            type="monotone"
            dataKey="commission"
            stroke={COLORS.secondary}
            strokeWidth={2.5}
            fill="url(#g-commission)"
            name="Commission"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type CategoryPoint = {
  name: string;
  value: number;
  count?: number;
};

export function CategoryDonut({ data, label }: { data: CategoryPoint[]; label: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div>
      <div className="chart-container" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<GlassTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}>
          <div className="section-title-sub">{label}</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em", marginTop: 2 }}>
            ${total.toLocaleString()}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gap: 6, marginTop: 4 }}>
        {data.map((d, i) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8125rem" }}>
            <span className="chart-tooltip-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span style={{ color: "var(--color-text)", fontWeight: 600 }}>{d.name}</span>
            <span style={{ marginLeft: "auto", color: "var(--color-text-muted)" }}>
              ${d.value.toLocaleString()}
              {d.count !== undefined && ` · ${d.count}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Performer = {
  userId: string;
  name: string;
  sales: number;
  commission: number;
  count: number;
  rank: number;
};

export function TopPerformersChart({ data }: { data: Performer[] }) {
  const top5 = data.slice(0, 5);
  return (
    <div className="chart-container" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={top5} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" horizontal={false} opacity={0.5} />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--color-text-muted)", fontSize: 11, fontWeight: 600 }}
            tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            width={90}
            tick={{ fill: "var(--color-text)", fontSize: 12, fontWeight: 600 }}
          />
          <Tooltip content={<GlassTooltip />} cursor={{ fill: "var(--color-bg-soft, transparent)" }} />
          <Line
            type="monotone"
            dataKey="sales"
            stroke={COLORS.primary}
            strokeWidth={3}
            dot={{ r: 5, fill: COLORS.primary, strokeWidth: 2, stroke: "white" }}
            activeDot={{ r: 7, fill: COLORS.primary }}
            name="Sales"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
