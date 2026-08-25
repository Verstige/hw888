"use client";

import { useEffect, useState } from "react";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { format } from "date-fns";

type Show = {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
};

// US cities database (location → lat/lon for map pins)
const CITY_COORDS: Record<string, { lat: number; lng: number; state: string }> = {
  "sturgis, sd": { lat: 44.4097, lng: -103.5094, state: "SD" },
  "rapid city": { lat: 44.0805, lng: -103.2310, state: "SD" },
  "austin": { lat: 30.2672, lng: -97.7431, state: "TX" },
  "dallas": { lat: 32.7767, lng: -96.7970, state: "TX" },
  "houston": { lat: 29.7604, lng: -95.3698, state: "TX" },
  "san antonio": { lat: 29.4241, lng: -98.4936, state: "TX" },
  "orlando": { lat: 28.5383, lng: -81.3792, state: "FL" },
  "myrtle beach": { lat: 33.6891, lng: -78.8867, state: "SC" },
  "portland": { lat: 45.5152, lng: -122.6784, state: "OR" },
  "seattle": { lat: 47.6062, lng: -122.3321, state: "WA" },
  "denver": { lat: 39.7392, lng: -104.9903, state: "CO" },
  "phoenix": { lat: 33.4484, lng: -112.0740, state: "AZ" },
  "las vegas": { lat: 36.1699, lng: -115.1398, state: "NV" },
  "los angeles": { lat: 34.0522, lng: -118.2437, state: "CA" },
  "san diego": { lat: 32.7157, lng: -117.1611, state: "CA" },
  "san francisco": { lat: 37.7749, lng: -122.4194, state: "CA" },
  "charlotte": { lat: 35.2271, lng: -80.8431, state: "NC" },
  "atlanta": { lat: 33.7490, lng: -84.3880, state: "GA" },
  "chicago": { lat: 41.8781, lng: -87.6298, state: "IL" },
  "miami": { lat: 25.7617, lng: -80.1918, state: "FL" },
  "raleigh": { lat: 35.7796, lng: -78.6382, state: "NC" },
};

function findCoords(location: string): { lat: number; lng: number; state: string } | null {
  const lower = location.toLowerCase();
  for (const [key, val] of Object.entries(CITY_COORDS)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: "#3B82F6",
  ACTIVE: "#2D8A4E",
  COMPLETED: "#6B7280",
  CANCELLED: "#DC2626",
};

export default function ShowMapClient({ shows }: { shows: Show[] }) {
  const [selected, setSelected] = useState<Show | null>(null);

  const mapped = shows.map((s) => {
    const coords = findCoords(s.location);
    return { ...s, coords };
  }).filter((s) => s.coords !== null);

  const unmapped = shows.filter((s) => findCoords(s.location) === null);

  // SVG bounds
  const minLat = 24, maxLat = 49, minLng = -125, maxLng = -67;
  const projectX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * 800;
  const projectY = (lat: number) => ((maxLat - lat) / (maxLat - minLat)) * 500;

  return (
    <ClientAuthShell pageTitle="Show map" pageSubtitle="All upcoming + recent shows at a glance">
      <div style={{ marginBottom: "1rem" }}>
        <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Show map</h1>
        <p className="section-title-sub" style={{ marginTop: 4 }}>
          {mapped.length} mapped · {unmapped.length} need city match
        </p>
      </div>

      <GlassCard padding="md" style={{ marginBottom: "1rem", overflow: "auto" }}>
        <div style={{ position: "relative", minWidth: 840, height: 540 }}>
          <svg viewBox="0 0 800 500" style={{ width: "100%", height: "100%", display: "block" }}>
            {/* US background gradient */}
            <defs>
              <radialGradient id="mapGlow" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="rgba(45, 90, 61, 0.06)" />
                <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
              </radialGradient>
            </defs>
            <rect width="800" height="500" fill="url(#mapGlow)" />
            <rect width="800" height="500" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

            {/* Rough US outline */}
            <g stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="rgba(255,255,255,0.02)">
              <path d="M 80 200 L 100 180 L 200 170 L 300 130 L 450 130 L 600 100 L 700 110 L 730 140 L 740 180 L 760 220 L 780 280 L 780 360 L 700 380 L 600 400 L 500 420 L 380 420 L 280 400 L 180 380 L 100 320 Z" />
            </g>

            {/* State grid hint (faint lines) */}
            <g stroke="rgba(255,255,255,0.04)" strokeWidth="1">
              <line x1="0" y1="170" x2="800" y2="170" />
              <line x1="0" y1="280" x2="800" y2="280" />
              <line x1="0" y1="390" x2="800" y2="390" />
              <line x1="200" y1="0" x2="200" y2="500" />
              <line x1="400" y1="0" x2="400" y2="500" />
              <line x1="600" y1="0" x2="600" y2="500" />
            </g>

            {/* Pins */}
            {mapped.map((s) => {
              const x = projectX(s.coords!.lng);
              const y = projectY(s.coords!.lat);
              const color = STATUS_COLORS[s.status] || "#6B7280";
              const isActive = selected?.id === s.id;
              return (
                <g
                  key={s.id}
                  onClick={() => setSelected(s)}
                  style={{ cursor: "pointer" }}
                >
                  {isActive && (
                    <circle cx={x} cy={y} r="14" fill={color} opacity="0.3">
                      <animate attributeName="r" values="14;22;14" dur="1.6s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={x} cy={y} r={isActive ? 10 : 7} fill={color} stroke="white" strokeWidth="2" />
                  {isActive && (
                    <text x={x} y={y - 16} textAnchor="middle" fill="white" fontSize="12" fontWeight="700">
                      {s.name}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Selected show card overlay */}
          {selected && (
            <div style={{
              position: "absolute",
              top: 16, right: 16,
              width: 280,
              padding: 14,
              background: "var(--glass-bg-strong)",
              backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
              WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
              border: "1px solid var(--glass-border)",
              borderRadius: 14,
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <p style={{ fontSize: "0.9375rem", fontWeight: 700, lineHeight: 1.2 }}>{selected.name}</p>
                <button onClick={() => setSelected(null)} className="btn btn-ghost" style={{ padding: "0.25rem", minHeight: 28 }}>
                  <Icon name="x" size={14} />
                </button>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{selected.location}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 4 }}>
                {format(new Date(selected.startDate), "MMM d")} – {format(new Date(selected.endDate), "MMM d, yyyy")}
              </p>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <a href={`/admin/shows`} className="btn btn-secondary" style={{ padding: "0.375rem 0.625rem", minHeight: 30, fontSize: "0.75rem", flex: 1 }}>
                  Manage
                </a>
                <a href={`/reports?showId=${selected.id}`} className="btn btn-primary" style={{ padding: "0.375rem 0.625rem", minHeight: 30, fontSize: "0.75rem", flex: 1 }}>
                  Report
                </a>
              </div>
            </div>
          )}

          {/* Legend */}
          <div style={{
            position: "absolute",
            bottom: 16, left: 16,
            padding: 10,
            background: "var(--glass-bg-strong)",
            backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            border: "1px solid var(--glass-border)",
            borderRadius: 10,
            fontSize: "0.6875rem",
          }}>
            <p style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.05em" }}>Status</p>
            {Object.entries(STATUS_COLORS).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <div style={{ width: 10, height: 10, borderRadius: 999, background: v }} />
                <span>{k}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {unmapped.length > 0 && (
        <GlassCard padding="md">
          <p style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: 8 }}>Couldn't place on map (city not recognized)</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {unmapped.map((s) => (
              <a key={s.id} href={`/admin/shows`} className="btn btn-secondary" style={{ minHeight: 30, padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}>
                {s.name} · {s.location}
              </a>
            ))}
          </div>
        </GlassCard>
      )}
    </ClientAuthShell>
  );
}
