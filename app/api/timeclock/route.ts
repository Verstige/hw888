import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/timeclock — list current user's entries (admin/manager: their team's)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  const { searchParams } = new URL(req.url);
  const showId = searchParams.get("showId");
  const userIdFilter = searchParams.get("userId");

  let where: any = {};
  if (userRole === "EMPLOYEE") where.userId = userId;
  else if (userRole === "MANAGER") {
    const team = await prisma.user.findMany({ where: { managerId: userId, isActive: true }, select: { id: true } });
    where.userId = { in: [userId, ...team.map((t) => t.id)] };
  }
  if (userIdFilter) {
    where.userId = userIdFilter;
  }
  if (showId) where.showId = showId;

  const entries = await prisma.timeClock.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, role: true } },
      show: { select: { id: true, name: true, location: true } },
    },
    orderBy: { clockIn: "desc" },
    take: 200,
  });
  return NextResponse.json(entries);
}

// POST /api/timeclock — clock in (idempotent if already clocked in)
// Body: { showId?, notes? }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json().catch(() => ({}));
  const { showId, notes } = body || {};

  // Check for active entry
  const active = await prisma.timeClock.findFirst({
    where: { userId, clockOut: null },
  });
  if (active) {
    return NextResponse.json({ error: "Already clocked in", entry: active }, { status: 400 });
  }

  const entry = await prisma.timeClock.create({
    data: {
      userId,
      showId: showId || null,
      notes: notes || null,
    },
  });
  return NextResponse.json(entry, { status: 201 });
}
