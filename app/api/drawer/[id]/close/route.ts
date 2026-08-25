import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/drawer/[id]/close — close-out a cash drawer session
// Body: { countedCash, countedCard, notes? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  const { id } = await params;
  const body = await req.json();
  const { countedCash, countedCard, notes } = body;

  if (countedCash === undefined || countedCard === undefined) {
    return NextResponse.json({ error: "countedCash and countedCard required" }, { status: 400 });
  }

  const drawer = await prisma.cashDrawer.findUnique({ where: { id } });
  if (!drawer) return NextResponse.json({ error: "Drawer not found" }, { status: 404 });
  if (!drawer.isActive) return NextResponse.json({ error: "Drawer already closed" }, { status: 400 });
  if (userRole !== "ADMIN" && drawer.openedById !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const numCountedCash = Number(countedCash);
  const numCountedCard = Number(countedCard);
  const expectedCash = drawer.openingFloat + drawer.totalCash;
  const expectedCard = drawer.totalCard;
  const discCash = Math.round((numCountedCash - expectedCash) * 100) / 100;
  const discCard = Math.round((numCountedCard - expectedCard) * 100) / 100;
  const closingBalance = Math.round((numCountedCash + numCountedCard) * 100) / 100;

  const updated = await prisma.cashDrawer.update({
    where: { id },
    data: {
      countedCash: numCountedCash,
      countedCard: numCountedCard,
      discrepancyCash: discCash,
      discrepancyCard: discCard,
      closingBalance,
      closeNotes: notes || null,
      closedAt: new Date(),
      closedById: userId,
      isActive: false,
    },
  });

  return NextResponse.json({
    ok: true,
    drawer: updated,
    summary: {
      expectedCash,
      expectedCard,
      countedCash: numCountedCash,
      countedCard: numCountedCard,
      discrepancyCash: discCash,
      discrepancyCard: discCard,
      hasDiscrepancy: discCash !== 0 || discCard !== 0,
    },
  });
}
