"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { formatCurrency } from "@/lib/products";

type Show = { id: string; name: string; location: string; startDate: string; endDate: string };

const AIRLINES = [
  { code: "FRONTIER", bookingUrl: (from: string, to: string, date: string) => `https://www.flyfrontier.com/web-check-in/?flightType=OW&from=${from}&to=${to}&departDate=${date}` },
  { code: "SOUTHWEST", bookingUrl: (from: string, to: string, date: string) => `https://www.southwest.com/air/booking/select.html?adultPassengersCount=1&departureDate=${date}&departureTimeOfDay=ALL_DAY&destinationAirportCode=${to}&fareType=USD&originationAirportCode=${from}&returnDate=&returnTimeOfDay=ALL_DAY&seniorPassengersCount=0&tripType=oneway` },
  { code: "DELTA", bookingUrl: (from: string, to: string, date: string) => `https://www.delta.com/flight-search/book?tripType=ONE_WAY&fromCity=${from}&toCity=${to}&departDate=${date}` },
  { code: "UNITED", bookingUrl: (from: string, to: string, date: string) => `https://www.united.com/en/us/fsr/flight-search/book?f=OneWay&from=${from}&to=${to}&d=${date}` },
  { code: "AMERICAN", bookingUrl: (from: string, to: string, date: string) => `https://www.aa.com/booking/find?locale=en_US&tripType=oneWay&from=${from}&to=${to}&departDate=${date}` },
  { code: "SPIRIT", bookingUrl: (from: string, to: string, date: string) => `https://www.spirit.com/book/?o1=${from}&d1=${to}&dd1=${date}` },
  { code: "ALASKA", bookingUrl: (from: string, to: string, date: string) => `https://www.alaskaair.com/shopping/flights?From=${from}&To=${to}&Depart=${date}` },
];

const CITY_CODES: Record<string, string> = {
  "Dallas": "DFW", "Houston": "IAH", "Austin": "AUS", "Denver": "DEN",
  "Las Vegas": "LAS", "Phoenix": "PHX", "Los Angeles": "LAX",
  "Sturgis, SD": "RAP", "Rapid City": "RAP", "Portland": "PDX",
  "Seattle": "SEA", "Chicago": "ORD", "Atlanta": "ATL",
  "Orlando": "MCO", "Miami": "MIA", "Myrtle Beach": "MYR",
};

export default function AdminTravelClient({ shows }: { shows: Show[] }) {
  const router = useRouter();
  const [showId, setShowId] = useState(shows[0]?.id || "");
  const [airline, setAirline] = useState("FRONTIER");
  const [originCity, setOriginCity] = useState("DFW");
  const [destinationCity, setDestinationCity] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [outboundDate, setOutboundDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const show = shows.find((s) => s.id === showId);

  useEffect(() => {
    if (show && !destinationCity) {
      const cityKey = Object.keys(CITY_CODES).find((k) => show.location.includes(k));
      if (cityKey) setDestinationCity(CITY_CODES[cityKey]);
    }
  }, [show, destinationCity]);

  useEffect(() => {
    if (show && !outboundDate) {
      const d = new Date(show.startDate);
      d.setDate(d.getDate() - 1);
      setOutboundDate(d.toISOString().slice(0, 10));
    }
  }, [show, outboundDate]);

  const buildUrl = (): string => {
    const a = AIRLINES.find((x) => x.code === airline);
    if (!a) return "";
    return a.bookingUrl(originCity, destinationCity, outboundDate);
  };

  const submit = async () => {
    setError(null); setSuccess(null);
    if (!showId || !airline || !originCity || !destinationCity || !estimatedCost || !outboundDate) {
      setError("Fill all required fields"); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/travel/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId, airline, originCity, destinationCity,
          estimatedCost: Number(estimatedCost),
          durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
          outboundDate: new Date(outboundDate).toISOString(),
          bookingUrl: buildUrl(),
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed");
      }
      setSuccess(`Flight option added: ${airline} ${originCity}→${destinationCity} @ ${formatCurrency(Number(estimatedCost))}`);
      setEstimatedCost(""); setDurationMinutes(""); setNotes("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClientAuthShell pageTitle="Admin · Travel flights" pageSubtitle="Add flight options for upcoming shows">
      <div style={{ marginBottom: "1rem" }}>
        <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Admin · Travel flights</h1>
        <p className="section-title-sub" style={{ marginTop: 4 }}>Add flight options for Frontier, Southwest, Delta, etc. to upcoming shows</p>
      </div>

      <GlassCard padding="lg" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }} className="form-grid-2">
          <div>
            <label className="label">Show *</label>
            <select className="input" value={showId} onChange={(e) => setShowId(e.target.value)}>
              <option value="">Pick a show…</option>
              {shows.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.location})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Airline *</label>
            <select className="input" value={airline} onChange={(e) => setAirline(e.target.value)}>
              {AIRLINES.map((a) => <option key={a.code} value={a.code}>{a.code}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Origin city code *</label>
            <input className="input" placeholder="e.g. DFW" value={originCity} onChange={(e) => setOriginCity(e.target.value.toUpperCase())} maxLength={4} />
          </div>
          <div>
            <label className="label">Destination city code *</label>
            <input className="input" placeholder="e.g. RAP" value={destinationCity} onChange={(e) => setDestinationCity(e.target.value.toUpperCase())} maxLength={4} />
          </div>
          <div>
            <label className="label">Estimated cost (USD, one-way) *</label>
            <input className="input" type="number" inputMode="decimal" placeholder="e.g. 280" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} />
          </div>
          <div>
            <label className="label">Flight duration (minutes)</label>
            <input className="input" type="number" placeholder="e.g. 165" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label">Outbound date *</label>
            <input className="input" type="date" value={outboundDate} onChange={(e) => setOutboundDate(e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label">Notes (optional)</label>
            <input className="input" placeholder="e.g. Direct flight, 1-stop via DEN" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {error && <div style={{ padding: "0.625rem 0.875rem", background: "rgba(196, 68, 68, 0.10)", color: "var(--color-danger)", borderRadius: 10, fontSize: "0.8125rem", fontWeight: 600, marginTop: 12 }}>{error}</div>}
        {success && <div style={{ padding: "0.625rem 0.875rem", background: "rgba(45, 138, 78, 0.10)", color: "var(--color-success)", borderRadius: 10, fontSize: "0.8125rem", fontWeight: 600, marginTop: 12 }}>{success}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button onClick={submit} disabled={saving} className="btn btn-primary">
            {saving ? "Adding…" : "Add flight option"}
          </button>
        </div>
      </GlassCard>

      <GlassCard padding="md" variant="soft">
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
          <strong>Tip:</strong> Booking URLs auto-generate deep links to each airline's search with route + date pre-filled. Add Frontier, Southwest, and Delta options for each upcoming show — employees can self-book via the link or admin can assign them. Frontier is usually cheapest, Delta/Southwest most reliable.
        </p>
      </GlassCard>
    </ClientAuthShell>
  );
}
