import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardClient from "./DashboardClient";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const userId = (session.user as any).id;
  const userRole = (session.user as any).role as "ADMIN" | "MANAGER" | "EMPLOYEE";
  const userName = session.user?.name || "User";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todaySales, activeShows, recentSales, lifetimeAgg] = await Promise.all([
    prisma.sale.aggregate({
      where: { userId, createdAt: { gte: today } },
      _sum: { salePrice: true, commission: true },
      _count: true,
    }),
    prisma.show.findMany({
      where: { status: "ACTIVE", assignments: { some: { userId } } },
      take: 1,
      include: { manager: { select: { name: true } } },
    }),
    prisma.sale.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { show: { select: { name: true, location: true } } },
    }),
    prisma.sale.aggregate({
      where: { userId },
      _sum: { salePrice: true, commission: true },
      _count: true,
    }),
  ]);

  return (
    <DashboardClient
      user={{ id: userId, name: userName, role: userRole }}
      todaySales={{
        total: todaySales._sum.salePrice || 0,
        commission: todaySales._sum.commission || 0,
        count: todaySales._count || 0,
      }}
      lifetimeSales={{
        total: lifetimeAgg._sum.salePrice || 0,
        commission: lifetimeAgg._sum.commission || 0,
        count: lifetimeAgg._count || 0,
      }}
      activeShow={activeShows[0] as any}
      recentSales={recentSales.map((s) => ({
        id: s.id,
        productLevel: s.productLevel,
        productModel: s.productModel,
        productStyle: s.productStyle,
        salePrice: s.salePrice,
        commission: s.commission,
        showName: s.show?.name || "—",
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  );
}
