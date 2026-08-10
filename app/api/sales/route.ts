import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateCommission } from "@/lib/products";

// POST /api/sales — record a sale
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const { showId, productLevel, productModel, productStyle, salePrice, paymentType, isOffline } = body;

  if (!showId || !productLevel || !productModel || !productStyle || !salePrice || !paymentType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const commission = calculateCommission(salePrice);

  const sale = await prisma.sale.create({
    data: {
      showId,
      userId,
      productLevel,
      productModel,
      productStyle,
      salePrice,
      paymentType,
      commission,
      isOffline: !!isOffline,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  // Update cash drawer totals
  await prisma.cashDrawer.updateMany({
    where: { showId, isActive: true },
    data: {
      ...(paymentType === "CASH" ? { totalCash: { increment: salePrice } } : {}),
      ...(paymentType === "CARD" ? { totalCard: { increment: salePrice } } : {}),
    },
  });

  return NextResponse.json(sale, { status: 201 });
}

// GET /api/sales
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  const { searchParams } = new URL(req.url);
  const showId = searchParams.get("showId");
  const range = searchParams.get("range"); // today, 3d, 7d, 14d, 30d, 60d
  const limit = parseInt(searchParams.get("limit") || "50");

  let where: any = {};

  if (showId) where.showId = showId;

  // Role-based filtering
  if (userRole === "EMPLOYEE") {
    where.userId = userId;
  } else if (userRole === "MANAGER") {
    const teamIds = await prisma.user.findMany({
      where: { managerId: userId, isActive: true },
      select: { id: true },
    });
    where.userId = { in: [userId, ...teamIds.map((t: { id: string }) => t.id)] };
  }

  // Date range filter
  if (range) {
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case "today": startDate = new Date(now.setHours(0, 0, 0, 0)); break;
      case "3d": startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); break;
      case "7d": startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); break;
      case "14d": startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); break;
      case "30d": startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); break;
      case "60d": startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(0);
    }
    where.createdAt = { gte: startDate };
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
      show: { select: { id: true, name: true, location: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const totals = await prisma.sale.aggregate({
    where,
    _sum: { salePrice: true, commission: true },
    _count: true,
  });

  return NextResponse.json({ sales, totals });
}
