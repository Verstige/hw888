"use client";

import { useState, useEffect, useMemo } from "react";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { formatCurrency } from "@/lib/products";
import { format } from "date-fns";

type Show = { id: string; name: string; location: string; startDate: string; endDate: string };
type User = { id: string; name: string; email: string; role: string; city?: string | null; homeAirportCode?: string | null };
type Airport = { code: string; name: string; city: string; state: string };
type State = { code: string; name: string };
type FlightOption = {
  id: string;
  showId: string;
  airline: string;
  originCity: string;
  destinationCity: string;
  estimatedCost: number;
  durationMinutes: number | null;
  outboundDate: string;
  bookingUrl: string;
  isActive: boolean;
  notes: string | null;
};
type SearchResult = {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber?: string;
  originCode: string;
  destinationCode: string;
  departureDate: string;
  arrivalDate: string;
  durationMinutes: number;
  price: number;
  currency: string;
  stops: number;
  bookingUrl: string;
  source: "amadeus" | "mock";
};
type BookedFlight = {
  id: string;
  type: string;
  status: string;
  show: Show | null;
  flight: any;
  user?: { id: string; name: string; role: string };
};

const AIRLINE_COLORS: Record<string, string> = {
  FRONTIER: "#1B5E20",
  SOUTHWEST: "#E67E22",
  DELTA: "#003366",
  UNITED: "#1E3A8A",
  AMERICAN: "#DC2626",
  SPIRIT: "#FFD700",
  ALASKA: "#1E3A5F",
};

type Props = {
  userRole: "ADMIN" | "MANAGER" | "EMPLOYEE";
  userId: string;
  shows: Show[];
  users: User[];
  flightOptions: FlightOption[];
  airports: Airport[];
  states: State[];
  currentUser: User;
};

export default function TravelClient({ userRole, userId, shows, users, flightOptions, airports, states, currentUser }: Props) {
  const [tab, setTab] = useState<"browse" | "search" | "booked">("search");
  const [showFilter, setShowFilter] = useState<string>("");
  const [airlineFilter, setAirlineFilter] = useState<string>("");
  const [bookings, setBookings] = useState<BookedFlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookModalOption, setBookModalOption] = useState<FlightOption | null>(null);

  // Search state
  const [from, setFrom] = useState<string>(currentUser.homeAirportCode || "");
  const [to, setTo] = useState<string>("");
  const [fromState, setFromState] = useState<string>("");
  const [toState, setToState] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchSource, setSearchSource] = useState<"amadeus" | "mock" | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/travel")
      .then((r) => r.json())
      .then((d) => { setBookings(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filteredOptions = useMemo(() => {
    return flightOptions.filter((o) => {
      if (showFilter && o.showId !== showFilter) return false;
      if (airlineFilter && o.airline !== airlineFilter) return false;
      return true;
    });
  }, [flightOptions, showFilter, airlineFilter]);

  const groupedByShow = useMemo(() => {
    const map: Record<string, { show: Show; options: FlightOption[] }> = {};
    for (const opt of filteredOptions) {
      const show = shows.find((s) => s.id === opt.showId);
      if (!show) continue;
      if (!map[opt.showId]) map[opt.showId] = { show, options: [] };
      map[opt.showId].options.push(opt);
    }
    return Object.values(map).sort((a, b) => new Date(a.show.startDate).getTime() - new Date(b.show.startDate).getTime());
  }, [filteredOptions, shows]);

  // Filter airport dropdowns by state
  const fromAirports = useMemo(() => fromState ? airports.filter((a) => a.state === fromState) : airports, [airports, fromState]);
  const toAirports = useMemo(() => toState ? airports.filter((a) => a.state === toState) : airports, [airports, toState]);

  const handleSearch = async () => {
    if (!from || !to || !date) {
      setSearchError("Pick origin, destination, and date");
      return;
    }
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const r = await fetch(`/api/travel/search?from=${from}&to=${to}&date=${date}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Search failed");
      setSearchResults(data.offers || []);
      setSearchSource(data.source);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleBookFlightOption = async (optionId: string, userIdToBook: string) => {
    const res = await fetch("/api/travel/book-flight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flightOptionId: optionId, userId: userIdToBook }),
    });
    if (res.ok) {
      const newTrip = await res.json();
      setBookings((b) => [...b, newTrip]);
      setBookModalOption(null);
      setTab("booked");
    } else {
      const e = await res.json();
      alert(e.error || "Booking failed");
    }
  };

  const isAdmin = userRole === "ADMIN";

  return (
    <ClientAuthShell pageTitle="Travel" pageSubtitle="Flights, hotels, cars">
      <div style={{ marginBottom: "1rem" }}>
        <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Travel</h1>
        <p className="section-title-sub" style={{ marginTop: 4 }}>
          {currentUser.city ? `${currentUser.city} · ${currentUser.homeAirportCode || "no home airport set"}` : "Set your home airport in /profile"}
        </p>
      </div>

      {/* Tabs */}
      <div className="pill-group" style={{ marginBottom: "1rem", width: "100%" }}>
        <button onClick={() => setTab("search")} className={`pill ${tab === "search" ? "pill-active" : ""}`} style={{ flex: 1 }}>
          <Icon name="search" size={14} /><span>Search flights</span>
        </button>
        <button onClick={() => setTab("browse")} className={`pill ${tab === "browse" ? "pill-active" : ""}`} style={{ flex: 1 }}>
          <Icon name="package" size={14} /><span>Saved options</span>
        </button>
        <button onClick={() => setTab("booked")} className={`pill ${tab === "booked" ? "pill-active" : ""}`} style={{ flex: 1 }}>
          <Icon name="check" size={14} /><span>Booked ({bookings.filter((b) => b.type === "FLIGHT").length})</span>
        </button>
      </div>

      {tab === "search" && (
        <>
          {/* Search form */}
          <GlassCard padding="md" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }} className="form-grid-2">
              <div>
                <label className="label">From state</label>
                <select className="input" value={fromState} onChange={(e) => { setFromState(e.target.value); setFrom(""); }}>
                  <option value="">Any state</option>
                  {states.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">To state</label>
                <select className="input" value={toState} onChange={(e) => { setToState(e.target.value); setTo(""); }}>
                  <option value="">Any state</option>
                  {states.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Departure airport</label>
                <select className="input" value={from} onChange={(e) => setFrom(e.target.value)}>
                  <option value="">Pick an airport…</option>
                  {fromAirports.map((a) => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Arrival airport</label>
                <select className="input" value={to} onChange={(e) => setTo(e.target.value)}>
                  <option value="">Pick an airport…</option>
                  {toAirports.map((a) => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="label">Departure date</label>
                <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <button onClick={handleSearch} disabled={searching || !from || !to || !date} className="btn btn-primary" style={{ width: "100%", marginTop: 12 }}>
              {searching ? "Searching…" : "Search flights"}
            </button>
            {searchError && (
              <div style={{ padding: "0.625rem 0.875rem", background: "rgba(196, 68, 68, 0.10)", color: "var(--color-danger)", borderRadius: 10, fontSize: "0.8125rem", fontWeight: 600, marginTop: 10 }}>
                {searchError}
              </div>
            )}
          </GlassCard>

          {/* Search results */}
          {searchResults.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p className="section-title-sub">{searchResults.length} flight{searchResults.length !== 1 ? "s" : ""} found</p>
                {searchSource === "mock" && (
                  <span style={{ fontSize: "0.6875rem", padding: "0.25rem 0.5rem", background: "rgba(201, 168, 76, 0.18)", color: "var(--color-secondary-dark)", borderRadius: 8, fontWeight: 700 }}>
                    ESTIMATE · Set Amadeus API keys in Railway env for live data
                  </span>
                )}
                {searchSource === "amadeus" && (
                  <span style={{ fontSize: "0.6875rem", padding: "0.25rem 0.5rem", background: "rgba(45, 138, 78, 0.15)", color: "var(--color-success)", borderRadius: 8, fontWeight: 700 }}>
                    LIVE · Amadeus
                  </span>
                )}
              </div>
              <GlassCard padding="md" style={{ marginBottom: "1rem" }}>
                <div style={{ display: "grid", gap: 8 }}>
                  {searchResults.map((r) => (
                    <div key={r.id} style={{
                      padding: "0.75rem 0.875rem",
                      background: "var(--glass-bg-soft)",
                      border: "1px solid var(--glass-border-soft)",
                      borderRadius: 14,
                      display: "grid",
                      gap: 8,
                      gridTemplateColumns: "auto 1fr auto",
                      alignItems: "center",
                    }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: 12,
                        background: AIRLINE_COLORS[r.airlineCode] || AIRLINE_COLORS[r.airline] || "#666",
                        color: "white",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.05em",
                      }}>
                        {r.airlineCode.slice(0, 2)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>
                          {r.airline} {r.flightNumber ? `· ${r.flightNumber}` : ""}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          {format(new Date(r.departureDate), "EEE MMM d, h:mm a")} → {format(new Date(r.arrivalDate), "h:mm a")}
                          · {Math.floor(r.durationMinutes / 60)}h {r.durationMinutes % 60}m
                          {r.stops > 0 ? ` · ${r.stops} stop${r.stops > 1 ? "s" : ""}` : " · nonstop"}
                        </p>
                        <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{r.originCode} → {r.destinationCode}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "1rem", fontWeight: 800 }}>{formatCurrency(r.price)}</p>
                        <a href={r.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "0.375rem 0.5rem", minHeight: 32, fontSize: "0.75rem", marginTop: 4 }}>
                          <Icon name="search" size={12} /><span>Book</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </>
          )}

          {searchSource === "mock" && searchResults.length === 0 && !searching && (
            <GlassCard padding="md" variant="soft">
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
                💡 <strong>Tip:</strong> Set <code>AMADEUS_CLIENT_ID</code> and <code>AMADEUS_CLIENT_SECRET</code> in Railway env to enable live flight search. Without keys, results are estimates based on distance + airline base rates.
              </p>
            </GlassCard>
          )}
        </>
      )}

      {tab === "browse" && (
        <>
          <GlassCard padding="md" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }} className="form-grid-2">
              <div>
                <label className="label">Show</label>
                <select className="input" value={showFilter} onChange={(e) => setShowFilter(e.target.value)}>
                  <option value="">All upcoming shows</option>
                  {shows.map((s) => <option key={s.id} value={s.id}>{s.name} ({format(new Date(s.startDate), "MMM d")})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Airline</label>
                <select className="input" value={airlineFilter} onChange={(e) => setAirlineFilter(e.target.value)}>
                  <option value="">All airlines</option>
                  {Object.keys(AIRLINE_COLORS).map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
          </GlassCard>

          {groupedByShow.length === 0 ? (
            <GlassCard padding="lg">
              <div className="empty-state">
                <div className="empty-state-icon">✈️</div>
                <p style={{ marginBottom: 4 }}>No saved flight options yet</p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {isAdmin ? "Add flight options via /admin/travel." : "Ask your admin to add flights for upcoming shows."}
                </p>
              </div>
            </GlassCard>
          ) : groupedByShow.map(({ show, options }) => (
            <GlassCard key={show.id} padding="md" style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <h2 style={{ fontSize: "1.0625rem", fontWeight: 700 }}>{show.name}</h2>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {format(new Date(show.startDate), "MMM d")} – {format(new Date(show.endDate), "MMM d, yyyy")} · {show.location}
                  </p>
                </div>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {options.map((opt) => (
                  <div key={opt.id} style={{
                    padding: "0.75rem 0.875rem",
                    background: "var(--glass-bg-soft)",
                    border: "1px solid var(--glass-border-soft)",
                    borderRadius: 14,
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "auto 1fr auto",
                    alignItems: "center",
                  }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 12,
                      background: AIRLINE_COLORS[opt.airline] || "#666",
                      color: "white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.05em",
                    }}>
                      {opt.airline.slice(0, 2)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>
                        {opt.airline} · {opt.originCity} → {opt.destinationCity}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {format(new Date(opt.outboundDate), "EEE MMM d, yyyy")}
                        {opt.durationMinutes ? ` · ${Math.floor(opt.durationMinutes / 60)}h ${opt.durationMinutes % 60}m` : ""}
                      </p>
                      {opt.notes && (
                        <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: 2, fontStyle: "italic" }}>
                          {opt.notes}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "1rem", fontWeight: 800 }}>{formatCurrency(opt.estimatedCost)}</p>
                      <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>est. one-way</p>
                      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                        <a href={opt.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding: "0.375rem 0.5rem", minHeight: 32, fontSize: "0.75rem" }}>
                          <Icon name="search" size={12} /><span>Book</span>
                        </a>
                        {isAdmin && (
                          <button onClick={() => setBookModalOption(opt)} className="btn btn-primary" style={{ padding: "0.375rem 0.625rem", minHeight: 32, fontSize: "0.75rem" }}>
                            <Icon name="plus" size={12} /><span>Assign</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </>
      )}

      {tab === "booked" && (
        <GlassCard padding="md">
          {loading ? (
            <p style={{ textAlign: "center", padding: 20, color: "var(--color-text-muted)" }}>Loading…</p>
          ) : bookings.filter((b) => b.type === "FLIGHT").length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📋</div><p>No flights booked yet</p></div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {bookings.filter((b) => b.type === "FLIGHT").map((b) => {
                const f = b.flight;
                if (!f) return null;
                const showUser = userRole === "ADMIN" || userRole === "MANAGER" ? b.user?.name : null;
                return (
                  <div key={b.id} style={{
                    padding: "0.75rem 0.875rem",
                    background: "var(--glass-bg-soft)",
                    border: "1px solid var(--glass-border-soft)",
                    borderRadius: 14,
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "0.9375rem", fontWeight: 700 }}>
                          {showUser ? `${showUser} · ` : ""}{f.airline} · {f.departureCity} → {f.arrivalCity}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          {b.show?.name ? `${b.show.name} · ` : ""}{f.departureTime ? format(new Date(f.departureTime), "EEE MMM d") : ""}
                          {f.flightNumber ? ` · ${f.flightNumber}` : ""}
                        </p>
                        {f.notes && <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: 2, fontStyle: "italic" }}>{f.notes}</p>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className={`badge ${b.status === "CONFIRMED" ? "badge-success" : b.status === "BOOKED" ? "badge-primary" : ""}`}>{b.status}</span>
                        {f.estimatedCost && <p style={{ fontSize: "0.8125rem", fontWeight: 700, marginTop: 4 }}>{formatCurrency(f.estimatedCost)}</p>}
                        {f.bookingUrl && (
                          <a href={f.bookingUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.6875rem", color: "var(--color-primary)" }}>
                            Airline link →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      {bookModalOption && (
        <AssignModal
          option={bookModalOption}
          users={users.filter((u) => u.role !== "ADMIN" || isAdmin)}
          shows={shows}
          onClose={() => setBookModalOption(null)}
          onConfirm={(uid) => handleBookFlightOption(bookModalOption.id, uid)}
        />
      )}
    </ClientAuthShell>
  );
}

function AssignModal({ option, users, shows, onClose, onConfirm }: {
  option: FlightOption;
  users: User[];
  shows: Show[];
  onClose: () => void;
  onConfirm: (userId: string) => void;
}) {
  const [selected, setSelected] = useState("");
  const show = shows.find((s) => s.id === option.showId);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Assign to flight</h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: "0.375rem", minHeight: 32 }} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <GlassCard padding="md" variant="soft" style={{ marginBottom: 12 }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 700 }}>{option.airline}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {option.originCity} → {option.destinationCity} · {format(new Date(option.outboundDate), "MMM d, yyyy")}
          </p>
          {show && <p style={{ fontSize: "0.75rem", marginTop: 4 }}>{show.name}</p>}
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, marginTop: 4 }}>{formatCurrency(option.estimatedCost)} est.</p>
        </GlassCard>
        <div>
          <label className="label">Employee or manager</label>
          <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">— Pick someone —</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button onClick={() => selected && onConfirm(selected)} disabled={!selected} className="btn btn-primary" style={{ flex: 1 }}>
            Book flight
          </button>
        </div>
      </div>
    </div>
  );
}
