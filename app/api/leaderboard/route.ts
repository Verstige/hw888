import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/leaderboard?range=7d
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

  type LeaderboardEntry = {
    rank: number;
    userId: string;
    name: string;
    totalSales: number;
    totalCommission: number;
    saleCount: number;
  };

  // Merge with employee names and rank
  const leaderboard: LeaderboardEntry[] = salesData.map((row: { userId: string; _sum: { salePrice: number | null; commission: number | null }; _count: number }, index: number) => {
    const employee = employees.find((e: { id: string }) => e.id === row.userId)!;
    return {
      rank: index + 1,
      userId: row.userId,
      name: employee.name,
      totalSales: row._sum.salePrice || 0,
      totalCommission: row._sum.commission || 0,
      saleCount: row._count,
    };
  });

  // Find current user's rank
  const myRank = leaderboard.findIndex((e: LeaderboardEntry) => e.userId === userId);

  return NextResponse.json({
    range,
    leaderboard,
    myRank: myRank >= 0 ? myRank + 1 : null,
    totalEmployees: employees.length,
  });
}
