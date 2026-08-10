"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

export default function TravelPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/travel")
      .then((r) => r.json())
      .then((d) => { setTrips(d); setLoading(false); });
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="bg-[var(--color-primary)] text-white px-6 py-5">
        <h1 className="text-xl font-bold">✈️ My Travel</h1>
        <p className="text-sm opacity-80 mt-0.5">Your itinerary and logistics</p>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {trips.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">✈️</div>
            <p className="text-[var(--color-text-muted)]">No travel assigned yet.</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Your admin will add your travel details before each show.</p>
          </div>
        ) : (
          // Group by upcoming / past
          <div className="space-y-6">
            {["FLIGHT", "CAR_RENTAL", "HOTEL", "AIRBNB"].map((type) => {
              const items = trips.filter((t) => t.type === type);
              if (!items.length) return null;
              const labels: Record<string, string> = {
                FLIGHT: "✈️ Flights",
                CAR_RENTAL: "🚗 Car Rentals",
                HOTEL: "🏨 Hotels",
                AIRBNB: "🏠 Airbnb",
              };
              return (
                <div key={type}>
                  <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">{labels[type]}</h2>
                  <div className="space-y-2">
                    {items.map((trip: any) => (
                      <div key={trip.id} className="card">
                        {trip.flight && (
                          <>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold">{trip.flight.airline || "Airline"} {trip.flight.flightNumber}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${trip.status === "CONFIRMED" ? "bg-[var(--color-success)]/10 text-[var(--color-success)]" : "bg-[var(--color-border)] text-[var(--color-text-muted)]"}`}>{trip.status}</span>
                            </div>
                            <p className="text-sm text-[var(--color-text-muted)]">{trip.flight.departureCity} → {trip.flight.arrivalCity}</p>
                            {trip.flight.departureTime && (
                              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                {format(new Date(trip.flight.departureTime), "MMM d, h:mm a")} — {format(new Date(trip.flight.arrivalTime!), "h:mm a")}
                              </p>
                            )}
                            {trip.flight.confirmationNumber && (
                              <p className="text-xs text-[var(--color-secondary)] mt-1">Confirmation: {trip.flight.confirmationNumber}</p>
                            )}
                          </>
                        )}
                        {trip.carRental && (
                          <>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold">{trip.carRental.company || "Car Rental"}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${trip.status === "CONFIRMED" ? "bg-[var(--color-success)]/10 text-[var(--color-success)]" : "bg-[var(--color-border)] text-[var(--color-text-muted)]"}`}>{trip.status}</span>
                            </div>
                            <p className="text-sm text-[var(--color-text-muted)]">{trip.carRental.pickupLocation}</p>
                            {trip.carRental.pickupDate && (
                              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                {format(new Date(trip.carRental.pickupDate), "MMM d")} — {format(new Date(trip.carRental.dropoffDate!), "MMM d, yyyy")}
                              </p>
                            )}
                            {trip.carRental.confirmationNumber && (
                              <p className="text-xs text-[var(--color-secondary)] mt-1">Confirmation: {trip.carRental.confirmationNumber}</p>
                            )}
                          </>
                        )}
                        {trip.accommodation && (
                          <>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold">{trip.accommodation.propertyName || trip.accommodation.type}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${trip.status === "CONFIRMED" ? "bg-[var(--color-success)]/10 text-[var(--color-success)]" : "bg-[var(--color-border)] text-[var(--color-text-muted)]"}`}>{trip.status}</span>
                            </div>
                            {trip.accommodation.address && (
                              <p className="text-sm text-[var(--color-text-muted)]">{trip.accommodation.address}</p>
                            )}
                            {trip.accommodation.checkIn && (
                              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                {format(new Date(trip.accommodation.checkIn), "MMM d")} — {format(new Date(trip.accommodation.checkOut!), "MMM d, yyyy")}
                              </p>
                            )}
                            {trip.accommodation.confirmationNumber && (
                              <p className="text-xs text-[var(--color-secondary)] mt-1">Confirmation: {trip.accommodation.confirmationNumber}</p>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
