import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports/show?showId=xxx&range=show|today|7d
// Returns daily breakdown, per-employee, by-level, by-payment for a show
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const showId = searchParams.get("showId");
  const range = searchParams.get("range") || "show";
  if (!showId) return NextResponse.json({ error: "showId required" }, { status: 400 });

  const show = await prisma.show.findUnique({
    where: { id: showId },
    select: { id: true, name: true, location: true, startDate: true, endDate: true, status: true },
  });
  if (!show) return NextResponse.json({ error: "Show not found" }, { status: 404 });

  // Date window
  let fromDate: Date;
  const now = new Date();
  if (range === "today") {
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === "7d") {
    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else {
    fromDate = new Date(0);
  }

  // Fetch all sales for the show in window
  const sales = await prisma.sale.findMany({
    where: { showId, createdAt: { gte: fromDate } },
    select: {
      id: true,
      userId: true,
      salePrice: true,
      commission: true,
      productLevel: true,
      paymentType: true,
      createdAt: true,
    },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(new Set(sales.map((s) => s.userId))) } },
    select: { id: true, name: true, role: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Totals
  const totalSales = sales.reduce((s, x) => s + x.salePrice, 0);
  const totalCommission = sales.reduce((s, x) => s + x.commission, 0);
  const cashTotal = sales.filter((s) => s.paymentType === "CASH").reduce((s, x) => s + x.salePrice, 0);
  const cardTotal = sales.filter((s) => s.paymentType === "CARD").reduce((s, x) => s + x.salePrice, 0);

  // By day
  const dayMap = new Map<string, { sales: number; commission: number; count: number; cash: number; card: number; perEmployee: Record<string, { sales: number; count: number }> }>();
  for (const s of sales) {
    const d = new Date(s.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const entry = dayMap.get(key) || { sales: 0, commission: 0, count: 0, cash: 0, card: 0, perEmployee: {} };
    entry.sales += s.salePrice;
    entry.commission += s.commission;
    entry.count += 1;
    if (s.paymentType === "CASH") entry.cash += s.salePrice;
    else entry.card += s.salePrice;
    const emp = entry.perEmployee[s.userId] || { sales: 0, count: 0 };
    emp.sales += s.salePrice;
    emp.count += 1;
    entry.perEmployee[s.userId] = emp;
    dayMap.set(key, entry);
  }
  const byDay = Array.from(dayMap.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // By employee
  const empMap = new Map<string, { sales: number; commission: number; count: number }>();
  for (const s of sales) {
    const e = empMap.get(s.userId) || { sales: 0, commission: 0, count: 0 };
    e.sales += s.salePrice;
    e.commission += s.commission;
    e.count += 1;
    empMap.set(s.userId, e);
  }
  const byEmployee = Array.from(empMap.entries())
    .map(([userId, v]) => ({
      userId,
      name: userMap.get(userId)?.name || "Unknown",
      role: userMap.get(userId)?.role || "EMPLOYEE",
      ...v,
      avg: v.sales / Math.max(v.count, 1),
    }))
    .sort((a, b) => b.sales - a.sales);

  // By level
  const lvlMap = new Map<string, { sales: number; count: number }>();
  for (const s of sales) {
    const e = lvlMap.get(s.productLevel) || { sales: 0, count: 0 };
    e.sales += s.salePrice;
    e.count += 1;
    lvlMap.set(s.productLevel, e);
  }
  const byLevel = Array.from(lvlMap.entries())
    .map(([level, v]) => ({ level, ...v }))
    .sort((a, b) => b.sales - a.sales);

  return NextResponse.json({
    show,
    totalSales: Math.round(totalSales * 100) / 100,
    totalCommission: Math.round(totalCommission * 100) / 100,
    saleCount: sales.length,
    cashTotal: Math.round(cashTotal * 100) / 100,
    cardTotal: Math.round(cardTotal * 100) / 100,
    byDay: byDay.map((d) => ({
      ...d,
      sales: Math.round(d.sales * 100) / 100,
      commission: Math.round(d.commission * 100) / 100,
      cash: Math.round(d.cash * 100) / 100,
      card: Math.round(d.card * 100) / 100,
      perEmployee: Object.fromEntries(Object.entries(d.perEmployee).map(([k, v]) => [k, { sales: Math.round(v.sales * 100) / 100, count: v.count }])),
    })),
    byEmployee: byEmployee.map((e) => ({
      ...e,
      sales: Math.round(e.sales * 100) / 100,
      commission: Math.round(e.commission * 100) / 100,
      avg: Math.round(e.avg * 100) / 100,
    })),
    byLevel: byLevel.map((l) => ({ ...l, sales: Math.round(l.sales * 100) / 100 })),
    byPayment: { CASH: Math.round(cashTotal * 100) / 100, CARD: Math.round(cardTotal * 100) / 100 },
  });
}
