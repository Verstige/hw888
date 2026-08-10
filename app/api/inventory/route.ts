import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/inventory
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  const { searchParams } = new URL(req.url);
  const managerId = searchParams.get("managerId");
  const lowStock = searchParams.get("lowStock") === "true";

  let where: any = {};

  if (userRole === "EMPLOYEE") {
    return NextResponse.json({ error: "Inventory not available for employees" }, { status: 403 });
  }

  if (userRole === "MANAGER") {
    where.managerId = userId;
  } else if (managerId) {
    where.managerId = managerId;
  }

  if (lowStock) {
    where = { ...where, quantity: { lte: 5 } }; // Low stock = 5 or below
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    include: {
      manager: { select: { id: true, name: true } },
      show: { select: { id: true, name: true } },
    },
    orderBy: [{ productLevel: "asc" }, { productModel: "asc" }],
  });

  return NextResponse.json(items);
}

// POST /api/inventory — create or update inventory item
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN" && userRole !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { showId, managerId, productLevel, productModel, productStyle, quantity, lowStockThreshold } = body;

  if (!productLevel || !productModel || !productStyle) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const item = await prisma.inventoryItem.upsert({
    where: {
      managerId_productLevel_productModel_productStyle: {
        managerId: managerId || (session.user as any).id,
        productLevel,
        productModel,
        productStyle,
      },
    },
    create: {
      showId: showId || null,
      managerId: managerId || (session.user as any).id,
      productLevel,
      productModel,
      productStyle,
      quantity: quantity || 0,
      lowStockThreshold: lowStockThreshold || 5,
    },
    update: {
      quantity,
      lowStockThreshold,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

// PATCH /api/inventory — update quantity (quick adjustment)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN" && userRole !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, quantity, delta } = body; // either set quantity or add delta

  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newQty = delta !== undefined ? item.quantity + delta : quantity;

  const updated = await prisma.inventoryItem.update({
    where: { id },
    data: { quantity: newQty },
  });

  return NextResponse.json(updated);
}
