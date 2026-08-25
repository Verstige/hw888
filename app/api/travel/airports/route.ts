import { NextResponse } from "next/server";
import { listAirports, listUSStates } from "@/lib/flights";

export async function GET() {
  return NextResponse.json({
    airports: listAirports(),
    states: listUSStates(),
  });
}
