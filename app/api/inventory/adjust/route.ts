import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/inventory/adjust — manually adjust inventory quantity
// Body: { inventoryId, delta, reason, notes? }
// reason: "restock" | "shrinkage" | "manual" | "correction"
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  const body = await req.json();
  const { inventoryId, delta, reason, notes } = body;

  if (!inventoryId || delta === undefined || !reason) {
    return NextResponse.json({ error: "inventoryId, delta, reason required" }, { status: 400 });
  }
  if (!["restock", "shrinkage", "manual", "correction"].includes(reason)) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const inventory = await prisma.inventoryItem.findUnique({ where: { id: inventoryId } });
  if (!inventory) return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });

  // Only admin or the manager who owns this inventory can adjust
  if (userRole !== "ADMIN" && inventory.managerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const numDelta = Math.floor(Number(delta));
  const newQty = Math.max(0, inventory.quantity + numDelta);
  const newStatus = newQty === 0 ? "OUT" : newQty <= inventory.lowStockThreshold ? "LOW" : "OK";

  await prisma.$transaction([
    prisma.inventoryItem.update({
      where: { id: inventoryId },
      data: { quantity: newQty, status: newStatus },
    }),
    prisma.inventoryAdjustment.create({
      data: {
        inventoryId,
        adjustedById: userId,
        delta: numDelta,
        reason,
        notes: notes || null,
      },
    }),
  ]);

  const updated = await prisma.inventoryItem.findUnique({ where: { id: inventoryId } });
  return NextResponse.json(updated);
}

// GET /api/inventory/adjust — list recent adjustments
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const inventoryId = searchParams.get("inventoryId");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = {};
  if (inventoryId) where.inventoryId = inventoryId;

  const adjustments = await prisma.inventoryAdjustment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      adjustedBy: { select: { id: true, name: true } },
      inventory: { select: { id: true, productLevel: true, productModel: true, productStyle: true } },
    },
  });
  return NextResponse.json(adjustments);
}
