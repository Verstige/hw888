import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/travel/book-flight — admin adds an employee to a flight (creates TravelTrip + FlightDetail)
// Body: { flightOptionId, userId, overrideCost?, overrideAirline?, notes? }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionRole = (session.user as any)?.role;
  if (sessionRole !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json();
  const { flightOptionId, userId, overrideCost, overrideAirline, overrideFlightNumber, notes } = body;
  if (!flightOptionId || !userId) return NextResponse.json({ error: "flightOptionId and userId required" }, { status: 400 });

  const opt = await prisma.flightOption.findUnique({
    where: { id: flightOptionId },
    include: { show: true },
  });
  if (!opt) return NextResponse.json({ error: "Flight option not found" }, { status: 404 });

  // Create TravelTrip + FlightDetail in a transaction
  const trip = await prisma.$transaction(async (tx) => {
    const t = await tx.travelTrip.create({
      data: {
        userId,
        showId: opt.showId,
        type: "FLIGHT",
        status: "BOOKED",
        notes: notes || null,
      },
    });
    await tx.flightDetail.create({
      data: {
        tripId: t.id,
        airline: overrideAirline || opt.airline,
        flightNumber: overrideFlightNumber || null,
        departureCity: opt.originCity,
        arrivalCity: opt.destinationCity,
        departureTime: opt.outboundDate,
        arrivalTime: opt.outboundDate, // approximate, refined when actual flight booked
        estimatedCost: overrideCost ? Number(overrideCost) : opt.estimatedCost,
        bookingUrl: opt.bookingUrl,
        notes: `Booked from option ${opt.id}${opt.durationMinutes ? ` · ${Math.round(opt.durationMinutes / 60)}h ${opt.durationMinutes % 60}m` : ""}`,
      },
    });
    return t;
  });

  const full = await prisma.travelTrip.findUnique({
    where: { id: trip.id },
    include: { flight: true, show: { select: { id: true, name: true, location: true, startDate: true, endDate: true } }, user: { select: { id: true, name: true, role: true } } },
  });
  return NextResponse.json(full, { status: 201 });
}
