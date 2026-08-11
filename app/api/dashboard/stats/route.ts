import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = (session.user as any)?.id;
  const role = (session.user as any)?.role;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  let salesFilter: any = {};
  if (role === "EMPLOYEE") {
    salesFilter = { employeeId: userId };
  } else if (role === "MANAGER") {
    const teamIds = await prisma.user.findMany({ where: { managerId: userId }, select: { id: true } });
    salesFilter = { employeeId: { in: teamIds.map((t) => t.id) } };
  }

  const [todaySales, weekSales, todayTxns] = await Promise.all([
    prisma.sale.aggregate({
      where: { ...salesFilter, createdAt: { gte: startOfDay } },
      _sum: { salePrice: true, commission: true },
    }),
    prisma.sale.aggregate({
      where: { ...salesFilter, createdAt: { gte: startOfWeek } },
      _sum: { salePrice: true, commission: true },
    }),
    prisma.sale.count({ where: { ...salesFilter, createdAt: { gte: startOfDay } } }),
  ]);

  return NextResponse.json({
    todaySales: todaySales._sum.salePrice || 0,
    todayCommission: todaySales._sum.commission || 0,
    weekSales: weekSales._sum.salePrice || 0,
    weekCommission: weekSales._sum.commission || 0,
    todayTransactions: todayTxns,
    pendingSync: 0,
  });
}
