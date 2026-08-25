import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/analytics/my-timeline?days=90 — daily sales + commission for current user
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get("days") || "90"), 365);

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  startDate.setHours(0, 0, 0, 0);

  // Role-scoped: employee sees own, manager sees team, admin sees all (self by default)
  let userFilter: any = userId;
  if (userRole === "MANAGER") {
    const team = await prisma.user.findMany({ where: { managerId: userId, isActive: true }, select: { id: true } });
    userFilter = { in: [userId, ...team.map((t) => t.id)] };
  } else if (userRole === "ADMIN") {
    userFilter = undefined; // all
  }

  const sales = await prisma.sale.findMany({
    where: {
      ...(userFilter ? { userId: userFilter } : {}),
      createdAt: { gte: startDate },
      refundedAmount: { lt: prisma.sale.fields.salePrice }, // not fully refunded
    },
    select: { salePrice: true, commission: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Bucket by day
  const dayMap = new Map<string, { sales: number; commission: number; count: number }>();
  for (let i = 0; i <= days; i++) {
    const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { sales: 0, commission: 0, count: 0 });
  }
  for (const s of sales) {
    const key = new Date(s.createdAt).toISOString().slice(0, 10);
    const entry = dayMap.get(key);
    if (entry) {
      entry.sales += s.salePrice;
      entry.commission += s.commission;
      entry.count += 1;
    }
  }

  const timeline = Array.from(dayMap.entries())
    .map(([date, v]) => ({ date, ...v, sales: Math.round(v.sales * 100) / 100, commission: Math.round(v.commission * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalSales = timeline.reduce((s, d) => s + d.sales, 0);
  const totalCommission = timeline.reduce((s, d) => s + d.commission, 0);
  const totalCount = timeline.reduce((s, d) => s + d.count, 0);

  return NextResponse.json({
    range: days,
    timeline,
    summary: {
      totalSales: Math.round(totalSales * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      saleCount: totalCount,
      avgPerDay: Math.round((totalSales / days) * 100) / 100,
      bestDay: timeline.reduce((max, d) => (d.sales > max.sales ? d : max), { date: "", sales: 0, commission: 0, count: 0 }),
    },
  });
}
