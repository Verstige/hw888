import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/travel/flights?showId=xxx — list flight options for a show (or all shows)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const showId = searchParams.get("showId");
  const airline = searchParams.get("airline");

  const where: any = {};
  if (showId) where.showId = showId;
  if (airline) where.airline = airline;
  where.isActive = true;

  const options = await prisma.flightOption.findMany({
    where,
    orderBy: [{ airline: "asc" }, { estimatedCost: "asc" }],
    include: { show: { select: { id: true, name: true, location: true, startDate: true, endDate: true } } },
  });

  return NextResponse.json(options);
}

// POST /api/travel/flights — admin only: create a flight option
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { showId, airline, originCity, destinationCity, estimatedCost, durationMinutes, outboundDate, bookingUrl, notes } = body;

  if (!showId || !airline || !originCity || !destinationCity || !estimatedCost || !outboundDate || !bookingUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const option = await prisma.flightOption.create({
    data: {
      showId,
      airline,
      originCity,
      destinationCity,
      estimatedCost: Number(estimatedCost),
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      outboundDate: new Date(outboundDate),
      bookingUrl,
      notes: notes || null,
    },
  });
  return NextResponse.json(option, { status: 201 });
}
