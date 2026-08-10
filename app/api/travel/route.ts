import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/travel
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  let where: any = {};
  if (userRole === "EMPLOYEE") {
    where.userId = userId;
  } else if (userRole === "MANAGER") {
    where.user = { managerId: userId };
  }

  const trips = await prisma.travelTrip.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
      show: { select: { id: true, name: true, location: true, startDate: true, endDate: true } },
      flight: true,
      carRental: true,
      accommodation: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(trips);
}

// POST /api/travel
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, showId, type, status, notes, flight, carRental, accommodation } = body;

  const trip = await prisma.travelTrip.create({
    data: {
      userId,
      showId: showId || null,
      type,
      status: status || "PENDING",
      notes,
    },
  });

  if (type === "FLIGHT" && flight) {
    await prisma.flightDetail.create({
      data: { tripId: trip.id, ...flight },
    });
  } else if (type === "CAR_RENTAL" && carRental) {
    await prisma.carRental.create({
      data: { tripId: trip.id, ...carRental },
    });
  } else if ((type === "HOTEL" || type === "AIRBNB") && accommodation) {
    await prisma.accommodation.create({
      data: { tripId: trip.id, type, ...accommodation },
    });
  }

  const full = await prisma.travelTrip.findUnique({
    where: { id: trip.id },
    include: { flight: true, carRental: true, accommodation: true },
  });

  return NextResponse.json(full, { status: 201 });
}
