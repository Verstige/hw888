import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/timeclock/[id] — clock out / start break / end break
// Body: { action: "clock_out" | "break_start" | "break_end", notes? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { action, notes } = body;

  const entry = await prisma.timeClock.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN" && entry.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: any = {};
  if (notes !== undefined) data.notes = notes;

  switch (action) {
    case "clock_out":
      if (entry.clockOut) return NextResponse.json({ error: "Already clocked out" }, { status: 400 });
      data.clockOut = new Date();
      // If still on break, close the break
      if (entry.breakStart && !entry.breakEnd) data.breakEnd = new Date();
      break;
    case "break_start":
      if (entry.breakStart && !entry.breakEnd) return NextResponse.json({ error: "Already on break" }, { status: 400 });
      if (entry.clockOut) return NextResponse.json({ error: "Already clocked out" }, { status: 400 });
      data.breakStart = new Date();
      break;
    case "break_end":
      if (!entry.breakStart) return NextResponse.json({ error: "Not on break" }, { status: 400 });
      if (entry.breakEnd) return NextResponse.json({ error: "Break already ended" }, { status: 400 });
      data.breakEnd = new Date();
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updated = await prisma.timeClock.update({ where: { id }, data });
  return NextResponse.json(updated);
}
