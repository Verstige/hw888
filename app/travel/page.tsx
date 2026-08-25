"use client";

import { useState, useEffect } from "react";
import { ClientAuthShell } from "@/app/components/ClientAuthShell";
import { GlassCard } from "@/app/components/GlassCard";
import { Icon } from "@/app/components/Icon";
import { format } from "date-fns";

function TravelInner() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/travel").then((r) => r.json()).then((d) => { setTrips(d); setLoading(false); });
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>Loading…</div>;

  if (trips.length === 0) {
    return (
      <GlassCard padding="lg" style={{ textAlign: "center", maxWidth: 360, margin: "2rem auto" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>✈️</div>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: 4 }}>No travel assigned</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Your admin will add travel details before each show.</p>
      </GlassCard>
    );
  }

  const groups = [
    { type: "FLIGHT", label: "Flights", icon: "plane" as const },
    { type: "CAR_RENTAL", label: "Car rentals", icon: "shopping" as const },
    { type: "HOTEL", label: "Hotels", icon: "home" as const },
    { type: "AIRBNB", label: "Airbnb", icon: "home" as const },
  ];

  return (
    <>
      <div style={{ marginBottom: "1rem" }}>
        <h1 className="text-gradient" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Travel</h1>
        <p className="section-title-sub" style={{ marginTop: 4 }}>Your itinerary and logistics</p>
      </div>

      {groups.map((g) => {
        const items = trips.filter((t) => t.type === g.type);
        if (items.length === 0) return null;
        return (
          <div key={g.type} style={{ marginBottom: "1.5rem" }}>
            <div className="section-title">
              <h2 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "1rem" }}>
                <Icon name={g.icon} size={16} /> {g.label}
              </h2>
              <span className="section-title-sub">{items.length}</span>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {items.map((trip: any) => (
                <GlassCard key={trip.id} padding="md">
                  {trip.flight && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{trip.flight.airline || "Airline"} {trip.flight.flightNumber}</span>
                        <span className={`badge ${trip.status === "CONFIRMED" ? "badge-success" : ""}`}>{trip.status}</span>
                      </div>
                      <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{trip.flight.departureCity} → {trip.flight.arrivalCity}</p>
                      {trip.flight.departureTime && (
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 4 }}>
                          {format(new Date(trip.flight.departureTime), "MMM d, h:mm a")} — {format(new Date(trip.flight.arrivalTime!), "h:mm a")}
                        </p>
                      )}
                      {trip.flight.confirmationNumber && <p style={{ fontSize: "0.75rem", color: "var(--color-secondary-dark)", fontWeight: 600, marginTop: 4 }}>Confirmation: {trip.flight.confirmationNumber}</p>}
                    </div>
                  )}
                  {trip.carRental && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{trip.carRental.company || "Car rental"}</span>
                        <span className={`badge ${trip.status === "CONFIRMED" ? "badge-success" : ""}`}>{trip.status}</span>
                      </div>
                      <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{trip.carRental.pickupLocation}</p>
                      {trip.carRental.pickupDate && <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 4 }}>{format(new Date(trip.carRental.pickupDate), "MMM d")} — {format(new Date(trip.carRental.dropoffDate!), "MMM d, yyyy")}</p>}
                      {trip.carRental.confirmationNumber && <p style={{ fontSize: "0.75rem", color: "var(--color-secondary-dark)", fontWeight: 600, marginTop: 4 }}>Confirmation: {trip.carRental.confirmationNumber}</p>}
                    </div>
                  )}
                  {trip.accommodation && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{trip.accommodation.propertyName || trip.accommodation.type}</span>
                        <span className={`badge ${trip.status === "CONFIRMED" ? "badge-success" : ""}`}>{trip.status}</span>
                      </div>
                      {trip.accommodation.address && <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{trip.accommodation.address}</p>}
                      {trip.accommodation.checkIn && <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 4 }}>{format(new Date(trip.accommodation.checkIn), "MMM d")} — {format(new Date(trip.accommodation.checkOut!), "MMM d, yyyy")}</p>}
                      {trip.accommodation.confirmationNumber && <p style={{ fontSize: "0.75rem", color: "var(--color-secondary-dark)", fontWeight: 600, marginTop: 4 }}>Confirmation: {trip.accommodation.confirmationNumber}</p>}
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function TravelPage() {
  return <ClientAuthShell pageTitle="Travel"><TravelInner /></ClientAuthShell>;
}
