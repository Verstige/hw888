import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchFlights, listAirports, listUSStates, getAirport } from "@/lib/flights";

// GET /api/travel/search?from=DFW&to=RAP&date=2026-08-27
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date");

  if (!from || !to || !date) {
    return NextResponse.json({ error: "from, to, date required" }, { status: 400 });
  }

  const fromAirport = getAirport(from);
  const toAirport = getAirport(to);
  if (!fromAirport || !toAirport) {
    return NextResponse.json({ error: `Unknown airport code: ${!fromAirport ? from : to}` }, { status: 400 });
  }

  const result = await searchFlights(from, to, date);
  return NextResponse.json({
    query: { from: fromAirport, to: toAirport, date },
    ...result,
  });
}
