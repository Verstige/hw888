import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/drawer — open or close drawer
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const { showId, action, openingFloat } = body;

  if (!showId || !action) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (action === "open") {
    // Check if drawer already open
    const existing = await prisma.cashDrawer.findFirst({
      where: { showId, isActive: true },
    });
    if (existing) {
      return NextResponse.json({ error: "Drawer already open for this show" }, { status: 409 });
    }

    const drawer = await prisma.cashDrawer.create({
      data: {
        showId,
        openedById: userId,
        openingFloat: openingFloat || 0,
      },
    });
    return NextResponse.json(drawer, { status: 201 });
  }

  if (action === "close") {
    const drawer = await prisma.cashDrawer.findFirst({
      where: { showId, isActive: true },
    });
    if (!drawer) {
      return NextResponse.json({ error: "No active drawer found" }, { status: 404 });
    }

    const closed = await prisma.cashDrawer.update({
      where: { id: drawer.id },
      data: {
        isActive: false,
        closedAt: new Date(),
        closingBalance: (drawer.openingFloat + drawer.totalCash),
      },
    });
    return NextResponse.json(closed);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// GET /api/drawer?showId=xxx
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const showId = searchParams.get("showId");
  if (!showId) return NextResponse.json({ error: "showId required" }, { status: 400 });

  const drawer = await prisma.cashDrawer.findFirst({
    where: { showId, isActive: true },
    include: {
      show: { select: { id: true, name: true, location: true } },
      openedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(drawer || null);
}
