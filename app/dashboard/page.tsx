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

  // Build user-scoped filter
  let userFilter: any = userId;
  if (userRole === "MANAGER") {
    const team = await prisma.user.findMany({ where: { managerId: userId, isActive: true }, select: { id: true } });
    userFilter = { in: [userId, ...team.map((t) => t.id)] };
  } else if (userRole === "ADMIN") {
    userFilter = undefined;
  }

  const userFilterApplied = userFilter ? { userId: userFilter } : {};

  const [
    todayAgg,
    recentSales,
    lifetimeAgg,
    activeShows,
    upcomingShows,
    lowInventoryItems,
    pendingShipping,
    pendingRefunds,
    teamSize,
    activeClockIns,
    unsyncedSalesCount,
    userHomeAirport,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { ...userFilterApplied, createdAt: { gte: today } },
      _sum: { salePrice: true, commission: true },
      _count: true,
    }),
    prisma.sale.findMany({
      where: userFilterApplied,
      include: {
        show: { select: { name: true, location: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.sale.aggregate({
      where: userFilterApplied,
      _sum: { salePrice: true, commission: true },
      _count: true,
    }),
    prisma.show.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true, name: true, location: true, startDate: true, endDate: true,
        manager: { select: { name: true } },
        _count: { select: { sales: true, assignments: true } },
      },
      orderBy: { startDate: "asc" },
      take: 4,
    }),
    prisma.show.findMany({
      where: { status: "UPCOMING", startDate: { gte: today } },
      select: { id: true, name: true, location: true, startDate: true, endDate: true, manager: { select: { name: true } } },
      orderBy: { startDate: "asc" },
      take: 4,
    }),
    prisma.inventoryItem.findMany({
      where: { status: { in: ["LOW", "OUT"] } },
      include: { manager: { select: { name: true } } },
      orderBy: { quantity: "asc" },
      take: 5,
    }),
    prisma.shippingOrder.count({ where: { status: { in: ["NEW", "PROCESSING", "SHIPPED"] } } }),
    prisma.sale.count({
      where: {
        ...userFilterApplied,
        OR: [{ source: "refund" }, { source: "partial-refund" }],
        refundedAt: { not: null },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    userRole === "MANAGER"
      ? prisma.user.count({ where: { managerId: userId, isActive: true } })
      : userRole === "ADMIN"
      ? prisma.user.count({ where: { isActive: true } })
      : Promise.resolve(0),
    prisma.timeClock.findMany({
      where: { clockOut: null },
      include: { user: { select: { id: true, name: true } }, show: { select: { name: true } } },
      take: 10,
    }),
    userRole !== "EMPLOYEE" ? prisma.sale.count({ where: { source: "import", offlineSynced: false, isOffline: true } }) : Promise.resolve(0),
    prisma.user.findUnique({
      where: { id: userId },
      select: { city: true, homeAirportCode: true },
    }),
  ]);

  // Hourly sales today (for sparkline)
  const hoursBack = new Date(today);
  const hourlyAgg = await prisma.sale.findMany({
    where: { ...userFilterApplied, createdAt: { gte: today } },
    select: { salePrice: true, createdAt: true },
  });
  const hourlyBuckets = Array(24).fill(0);
  for (const s of hourlyAgg) {
    const hour = new Date(s.createdAt).getHours();
    hourlyBuckets[hour] += s.salePrice;
  }

  // Active show for current user (or first org-wide if admin)
  let activeShowForUser: any = null;
  if (userRole === "EMPLOYEE") {
    const myActive = await prisma.show.findFirst({
      where: { status: "ACTIVE", assignments: { some: { userId } } },
      include: { manager: { select: { name: true } } },
    });
    activeShowForUser = myActive;
  } else {
    activeShowForUser = activeShows[0] || null;
  }

  return (
    <DashboardClient
      user={{ id: userId, name: userName, role: userRole }}
      city={userHomeAirport?.city || null}
      homeAirport={userHomeAirport?.homeAirportCode || null}
      todaySales={{
        total: todayAgg._sum.salePrice || 0,
        commission: todayAgg._sum.commission || 0,
        count: todayAgg._count || 0,
      }}
      lifetimeSales={{
        total: lifetimeAgg._sum.salePrice || 0,
        commission: lifetimeAgg._sum.commission || 0,
        count: lifetimeAgg._count || 0,
      }}
      activeShows={activeShows.map((s) => ({
        ...s,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
      }))}
      activeShow={activeShowForUser ? {
        ...activeShowForUser,
        startDate: activeShowForUser.startDate.toISOString(),
        endDate: activeShowForUser.endDate.toISOString(),
      } : null}
      upcomingShows={upcomingShows.map((s) => ({
        ...s,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
      }))}
      lowInventory={lowInventoryItems.map((i) => ({
        ...i,
        updatedAt: i.updatedAt.toISOString(),
      }))}
      pendingShipping={pendingShipping}
      pendingRefunds={pendingRefunds}
      teamSize={teamSize}
      activeClockIns={activeClockIns.map((c) => ({
        id: c.id,
        clockIn: c.clockIn.toISOString(),
        user: c.user,
        show: c.show ? { name: c.show.name } : null,
      }))}
      unsyncedSales={unsyncedSalesCount}
      hourlyBuckets={hourlyBuckets.map((v) => Math.round(v * 100) / 100)}
      recentSales={recentSales.map((s) => ({
        id: s.id,
        productLevel: s.productLevel,
        productModel: s.productModel,
        productStyle: s.productStyle,
        salePrice: s.salePrice,
        commission: s.commission,
        showName: s.show?.name || "—",
        sellerName: s.user.name,
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  );
}
