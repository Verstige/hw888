import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCommissionRate, computeCommission } from "@/lib/commission";

// POST /api/sales — record a sale (uses user's CommissionRate for commission)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const { showId, productLevel, productModel, productStyle, salePrice, paymentType, isOffline, discount, discountReason } = body;

  if (!showId || !productLevel || !productModel || !productStyle || !salePrice || !paymentType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { baseRate } = await getCommissionRate(userId);
  // If a discount is applied (preset or manual), commission is calculated on the FINAL price paid
  const numDiscount = Math.max(0, Math.min(Number(discount) || 0, salePrice));
  const finalPrice = Math.max(0, salePrice - numDiscount);
  const commission = computeCommission(finalPrice, baseRate);

  const sale = await prisma.sale.create({
    data: {
      showId,
      userId,
      productLevel,
      productModel,
      productStyle,
      salePrice: finalPrice,
      paymentType,
      commission,
      commissionRateSnapshot: baseRate,
      discount: numDiscount > 0 ? numDiscount : undefined,
      discountReason: numDiscount > 0 ? (discountReason || undefined) : undefined,
      isOffline: !!isOffline,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  // Update cash drawer totals using the FINAL price (what was actually collected)
  await prisma.cashDrawer.updateMany({
    where: { showId, isActive: true },
    data: {
      ...(paymentType === "CASH" ? { totalCash: { increment: finalPrice } } : {}),
      ...(paymentType === "CARD" ? { totalCard: { increment: finalPrice } } : {}),
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
  const userIdFilter = searchParams.get("userId");
  const paymentType = searchParams.get("paymentType");
  const range = searchParams.get("range"); // today, 3d, 7d, 14d, 30d, 60d, all
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

  let where: any = {};

  if (showId) where.showId = showId;
  if (userIdFilter) where.userId = userIdFilter;
  if (paymentType) where.paymentType = paymentType;

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
  if (range && range !== "all") {
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

  const [sales, totals, totalCount] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true } },
        show: { select: { id: true, name: true, location: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.sale.aggregate({
      where,
      _sum: { salePrice: true, commission: true },
      _count: true,
    }),
    prisma.sale.count({ where }),
  ]);

  return NextResponse.json({
    sales,
    totals: {
      totalSales: totals._sum.salePrice || 0,
      totalCommission: totals._sum.commission || 0,
      count: totals._count || 0,
    },
    pagination: { total: totalCount, limit, offset },
  });
}
