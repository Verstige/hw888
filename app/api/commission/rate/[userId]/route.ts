import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BASE_RATE, DEFAULT_MANAGER_BONUS } from "@/lib/commission";

// PATCH /api/commission/rate/[userId] — admin updates a user's commission rates
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  const body = await req.json();
  const { baseRate, managerBonus, notes } = body;

  if (baseRate !== undefined && (typeof baseRate !== "number" || baseRate < 0 || baseRate > 1)) {
    return NextResponse.json({ error: "baseRate must be 0..1" }, { status: 400 });
  }
  if (managerBonus !== undefined && (typeof managerBonus !== "number" || managerBonus < 0 || managerBonus > 1)) {
    return NextResponse.json({ error: "managerBonus must be 0..1" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const defaults = target.role === "MANAGER" || target.role === "ADMIN"
    ? { baseRate: DEFAULT_BASE_RATE, managerBonus: DEFAULT_MANAGER_BONUS }
    : { baseRate: DEFAULT_BASE_RATE, managerBonus: 0 };

  const data: any = {
    baseRate: baseRate !== undefined ? baseRate : defaults.baseRate,
    managerBonus: managerBonus !== undefined ? managerBonus : defaults.managerBonus,
    effectiveFrom: new Date(),
    ...(notes !== undefined && { notes: notes || null }),
  };

  const rate = await prisma.commissionRate.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  return NextResponse.json(rate);
}

// GET /api/commission/rate/[userId]
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;
  const rate = await prisma.commissionRate.findUnique({
    where: { userId },
    include: { user: { select: { id: true, name: true, role: true } } },
  });

  if (!rate) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, role: true } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      userId,
      baseRate: DEFAULT_BASE_RATE,
      managerBonus: user.role === "MANAGER" || user.role === "ADMIN" ? DEFAULT_MANAGER_BONUS : 0,
      user,
      defaults: true,
    });
  }
  return NextResponse.json(rate);
}
