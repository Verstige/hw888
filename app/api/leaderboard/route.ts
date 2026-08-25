import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/leaderboard?range=today|3d|7d|14d|30d|60d|all
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "7d";

  const now = new Date();
  let startDate: Date;
  switch (range) {
    case "today": startDate = new Date(now.setHours(0, 0, 0, 0)); break;
    case "3d": startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); break;
    case "7d": startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); break;
    case "14d": startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); break;
    case "30d": startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); break;
    case "60d": startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); break;
    case "all": startDate = new Date(0); break;
    default: startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  const userFilter = { isActive: true, role: "EMPLOYEE" as const } as any;
  if (userRole === "MANAGER") {
    userFilter.managerId = userId;
  }

  const employees = await prisma.user.findMany({
    where: userFilter,
    select: { id: true, name: true, role: true },
  });

  const employeeIds = employees.map((e: { id: string }) => e.id);

  const salesData = await prisma.sale.groupBy({
    by: ["userId"],
    where: {
      userId: { in: employeeIds },
      createdAt: { gte: startDate },
    },
    _sum: { salePrice: true, commission: true },
    _count: true,
    orderBy: { _sum: { salePrice: "desc" } },
  });

  // Per-employee base rate (for commission % display)
  const rates = await prisma.commissionRate.findMany({
    where: { userId: { in: employeeIds } },
    select: { userId: true, baseRate: true, managerBonus: true },
  });
  const rateMap = new Map(rates.map((r) => [r.userId, r]));

  type LeaderboardEntry = {
    rank: number;
    userId: string;
    name: string;
    totalSales: number;
    totalCommission: number;
    saleCount: number;
    baseRate: number;
    commissionPct: number;
    avgPerSale: number;
  };

  const leaderboard: LeaderboardEntry[] = salesData.map((row: { userId: string; _sum: { salePrice: number | null; commission: number | null }; _count: number }, index: number) => {
    const employee = employees.find((e: { id: string }) => e.id === row.userId)!;
    const totalSales = row._sum.salePrice || 0;
    const totalCommission = row._sum.commission || 0;
    const baseRate = rateMap.get(row.userId)?.baseRate ?? 0.30;
    const commissionPct = totalSales > 0 ? (totalCommission / totalSales) * 100 : 0;
    return {
      rank: index + 1,
      userId: row.userId,
      name: employee.name,
      totalSales,
      totalCommission,
      saleCount: row._count,
      baseRate,
      commissionPct,
      avgPerSale: totalSales / Math.max(row._count, 1),
    };
  });

  // Include employees with zero sales so the leaderboard isn't empty
  for (const e of employees) {
    if (!leaderboard.find((l) => l.userId === e.id)) {
      const baseRate = rateMap.get(e.id)?.baseRate ?? 0.30;
      leaderboard.push({
        rank: leaderboard.length + 1,
        userId: e.id,
        name: e.name,
        totalSales: 0,
        totalCommission: 0,
        saleCount: 0,
        baseRate,
        commissionPct: 0,
        avgPerSale: 0,
      });
    }
  }

  const myRank = leaderboard.findIndex((e: LeaderboardEntry) => e.userId === userId);

  return NextResponse.json({
    range,
    leaderboard,
    myRank: myRank >= 0 ? myRank + 1 : null,
    totalEmployees: employees.length,
  });
}
