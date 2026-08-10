import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/grocery
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const showId = searchParams.get("showId");

  let where: any = {};
  if (showId) where.showId = showId;

  const items = await prisma.groceryItem.findMany({
    where,
    include: {
      show: { select: { id: true, name: true } },
      addedBy: { select: { id: true, name: true } },
      purchasedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(items);
}

// POST /api/grocery
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const { showId, item, quantity, estimatedCost } = body;

  if (!item) return NextResponse.json({ error: "Item is required" }, { status: 400 });

  const groceryItem = await prisma.groceryItem.create({
    data: {
      showId: showId || "",
      addedById: userId,
      item,
      quantity: quantity || null,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
    },
  });

  return NextResponse.json(groceryItem, { status: 201 });
}
