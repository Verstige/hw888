import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const RANGE_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "60d": 60,
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fillMissingDays(
  buckets: Map<string, { sales: number; commission: number }>,
  startDate: Date,
  endDate: Date,
): Array<{ date: string; sales: number; commission: number; label: string }> {
  const result: Array<{ date: string; sales: number; commission: number; label: string }> = [];
  const cursor = startOfDay(startDate);
  const end = startOfDay(endDate);
  while (cursor <= end) {
    const key = isoDay(cursor);
    const entry = buckets.get(key) || { sales: 0, commission: 0 };
    const label = cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    result.push({ date: key, sales: Math.round(entry.sales), commission: Math.round(entry.commission), label });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  if (userRole === "EMPLOYEE") {
    return NextResponse.json({ error: "Manager or admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "30d";
  const days = RANGE_DAYS[range] || 30;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  const priorEndDate = new Date(startDate);
  priorEndDate.setDate(priorEndDate.getDate() - 1);
  priorEndDate.setHours(23, 59, 59, 999);
  const priorStartDate = new Date(priorEndDate);
  priorStartDate.setDate(priorStartDate.getDate() - days + 1);
  priorStartDate.setHours(0, 0, 0, 0);

  // Scope: admin sees everything; manager sees their team only
  let employeeFilter: any = { isActive: true, role: "EMPLOYEE" };
  if (userRole === "MANAGER") {
    employeeFilter.managerId = userId;
  }

  const employees = await prisma.user.findMany({
    where: employeeFilter,
    select: { id: true, name: true },
  });
  const employeeIds = employees.map((e) => e.id);
  const employeeMap = new Map(employees.map((e) => [e.id, e.name]));

  // Current period aggregates
  const [currentAgg, priorAgg] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: startDate, lte: endDate } },
      _sum: { salePrice: true, commission: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: priorStartDate, lte: priorEndDate } },
      _sum: { salePrice: true, commission: true },
      _count: true,
    }),
  ]);

  const currentSales = currentAgg._sum.salePrice || 0;
  const currentCommission = currentAgg._sum.commission || 0;
  const currentCount = currentAgg._count || 0;
  const priorSales = priorAgg._sum.salePrice || 0;
  const priorCommission = priorAgg._sum.commission || 0;
  const priorCount = priorAgg._count || 0;

  const pct = (now: number, then: number): number => {
    if (!then || then === 0) return now > 0 ? 100 : 0;
    return ((now - then) / then) * 100;
  };

  const activeShowIds = await prisma.show.findMany({
    where: {
      OR: [
        { status: "ACTIVE" },
        { status: "UPCOMING", endDate: { gte: new Date() } },
      ],
    },
    select: { id: true },
  });

  // Revenue by day (raw query — group by date)
  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    select: { salePrice: true, commission: true, createdAt: true, showId: true, userId: true, productLevel: true, paymentType: true },
  });

  const dayBuckets = new Map<string, { sales: number; commission: number }>();
  const byShow = new Map<string, { sales: number; commission: number; count: number }>();
  const byLevel = new Map<string, { sales: number; count: number }>();
  const byPayment = new Map<string, { sales: number; count: number }>();
  const byUser = new Map<string, { sales: number; commission: number; count: number }>();

  for (const s of sales) {
    const day = isoDay(s.createdAt);
    const d = dayBuckets.get(day) || { sales: 0, commission: 0 };
    d.sales += s.salePrice;
    d.commission += s.commission;
    dayBuckets.set(day, d);

    const sh = byShow.get(s.showId) || { sales: 0, commission: 0, count: 0 };
    sh.sales += s.salePrice;
    sh.commission += s.commission;
    sh.count += 1;
    byShow.set(s.showId, sh);

    const lvl = byLevel.get(s.productLevel) || { sales: 0, count: 0 };
    lvl.sales += s.salePrice;
    lvl.count += 1;
    byLevel.set(s.productLevel, lvl);

    const pay = byPayment.get(s.paymentType) || { sales: 0, count: 0 };
    pay.sales += s.salePrice;
    pay.count += 1;
    byPayment.set(s.paymentType, pay);

    const usr = byUser.get(s.userId) || { sales: 0, commission: 0, count: 0 };
    usr.sales += s.salePrice;
    usr.commission += s.commission;
    usr.count += 1;
    byUser.set(s.userId, usr);
  }

  // Fetch show names
  const showIds = Array.from(byShow.keys());
  const shows = await prisma.show.findMany({
    where: { id: { in: showIds } },
    select: { id: true, name: true, location: true, startDate: true },
  });
  const showMap = new Map(shows.map((s) => [s.id, s]));

  const revenueByDay = fillMissingDays(dayBuckets, startDate, endDate);

  const byShowArr = Array.from(byShow.entries())
    .map(([id, v]) => ({
      showId: id,
      name: showMap.get(id)?.name || "Unknown",
      location: showMap.get(id)?.location || "",
      startDate: showMap.get(id)?.startDate?.toISOString() || null,
      sales: Math.round(v.sales),
      commission: Math.round(v.commission),
      count: v.count,
    }))
    .sort((a, b) => b.sales - a.sales);

  const byLevelArr = Array.from(byLevel.entries())
    .map(([level, v]) => ({
      name: level.replace("LEVEL_", ""),
      value: Math.round(v.sales),
      count: v.count,
    }))
    .sort((a, b) => b.value - a.value);

  const byPaymentArr = Array.from(byPayment.entries())
    .map(([type, v]) => ({
      name: type,
      value: Math.round(v.sales),
      count: v.count,
    }))
    .sort((a, b) => b.value - a.value);

  const topPerformers = Array.from(byUser.entries())
    .map(([uid, v]) => ({
      userId: uid,
      name: employeeMap.get(uid) || "Unknown",
      sales: Math.round(v.sales),
      commission: Math.round(v.commission),
      count: v.count,
      rank: 0,
    }))
    .sort((a, b) => b.sales - a.sales)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const kpis = {
    totalSales: Math.round(currentSales),
    totalCommission: Math.round(currentCommission),
    saleCount: currentCount,
    avgTicket: currentCount > 0 ? Math.round(currentSales / currentCount) : 0,
    activeEmployees: new Set(sales.map((s) => s.userId)).size,
    activeShows: new Set(sales.map((s) => s.showId)).size,
    deltaSalesPct: pct(currentSales, priorSales),
    deltaCommissionPct: pct(currentCommission, priorCommission),
    deltaCountPct: pct(currentCount, priorCount),
    deltaAvgTicketPct: pct(
      currentCount > 0 ? currentSales / currentCount : 0,
      priorCount > 0 ? priorSales / priorCount : 0,
    ),
  };

  return NextResponse.json({
    range,
    days,
    kpis,
    revenueByDay,
    byShow: byShowArr,
    byLevel: byLevelArr,
    byPayment: byPaymentArr,
    topPerformers,
  });
}
