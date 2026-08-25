import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/travel/flights/[id] — admin only: update a flight option
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const data: any = {};
  for (const f of ["airline", "originCity", "destinationCity", "estimatedCost", "durationMinutes", "outboundDate", "bookingUrl", "notes", "isActive"]) {
    if (body[f] !== undefined) {
      if (f === "estimatedCost" || f === "durationMinutes") data[f] = Number(body[f]);
      else if (f === "outboundDate") data[f] = new Date(body[f]);
      else data[f] = body[f];
    }
  }
  const updated = await prisma.flightOption.update({ where: { id }, data });
  return NextResponse.json(updated);
}

// DELETE /api/travel/flights/[id] — admin only: deactivate
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.flightOption.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
