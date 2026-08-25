import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCommissionRate, computeCommission } from "@/lib/commission";

// POST /api/import/sales — bulk insert sales for a show (admin/manager only)
// Body: { showId, source?, sales: [{ userId, productLevel, productModel, productStyle, salePrice, paymentType, createdAt? }, ...] }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role === "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { showId, source = "import", sales } = body;

  if (!showId || !Array.isArray(sales) || sales.length === 0) {
    return NextResponse.json({ error: "showId and non-empty sales array required" }, { status: 400 });
  }

  // Verify show exists
  const show = await prisma.show.findUnique({ where: { id: showId }, select: { id: true, name: true } });
  if (!show) return NextResponse.json({ error: "Show not found" }, { status: 404 });

  // Validate users
  const userIds = Array.from(new Set(sales.map((s: any) => s.userId)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, isActive: true },
    select: { id: true },
  });
  const validUserIds = new Set(users.map((u) => u.id));

  // Pre-fetch commission rates for all users (single batch query)
  const rates = await prisma.commissionRate.findMany({
    where: { userId: { in: Array.from(validUserIds) } },
    select: { userId: true, baseRate: true },
  });
  const rateMap = new Map(rates.map((r) => [r.userId, r.baseRate]));

  // Build sale records
  const records = sales.map((s: any) => {
    const userId = s.userId;
    if (!validUserIds.has(userId)) {
      throw new Error(`User ${userId} not found or inactive`);
    }
    const baseRate = rateMap.get(userId) ?? 0.30;
    const salePrice = Number(s.salePrice);
    const commission = computeCommission(salePrice, baseRate);
    return {
      showId,
      userId,
      productLevel: s.productLevel || "LEVEL_1X",
      productModel: s.productModel || "Unknown",
      productStyle: s.productStyle || "Unknown",
      salePrice,
      paymentType: s.paymentType || "CASH",
      commission,
      commissionRateSnapshot: baseRate,
      source: s.source || source,
      notes: s.notes || null,
      createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
      syncedAt: new Date(),
    };
  });

  // Bulk insert
  const result = await prisma.sale.createMany({ data: records });

  // Update cash drawer totals for the show if any drawer is open
  // (sum cash vs card)
  const drawerUpdate: any = {};
  for (const r of records) {
    if (r.paymentType === "CASH") drawerUpdate.totalCash = { increment: r.salePrice };
    else if (r.paymentType === "CARD") drawerUpdate.totalCard = { increment: r.salePrice };
  }
  if (Object.keys(drawerUpdate).length > 0) {
    await prisma.cashDrawer.updateMany({ where: { showId, isActive: true }, data: drawerUpdate });
  }

  return NextResponse.json({
    ok: true,
    showId,
    imported: result.count,
    source,
  });
}
