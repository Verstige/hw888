import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ShowDetailClient from "./ShowDetailClient";

export default async function ShowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, name: true } },
      assignments: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { assignedAt: "asc" },
      },
      sales: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      _count: { select: { sales: true, equipmentTasks: true } },
    },
  });

  if (!show) notFound();

  // Access check: employees see only shows they're assigned to or are working
  if (userRole === "EMPLOYEE") {
    const isAssigned = show.assignments.some((a) => a.userId === userId);
    if (!isAssigned) redirect("/shows");
  }

  // Per-employee aggregation for this show
  const byEmployee = await prisma.sale.groupBy({
    by: ["userId"],
    where: { showId: id },
    _sum: { salePrice: true, commission: true },
    _count: true,
    orderBy: { _sum: { salePrice: "desc" } },
  });

  // Resolve names
  const userIds = byEmployee.map((b) => b.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, role: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Total sales for this show
  const totalAgg = await prisma.sale.aggregate({
    where: { showId: id },
    _sum: { salePrice: true, commission: true },
    _count: true,
  });

  // Active drawer for this show
  const activeDrawer = await prisma.cashDrawer.findFirst({
    where: { showId: id, isActive: true },
    include: { openedBy: { select: { id: true, name: true } } },
  });

  return (
    <ShowDetailClient
      user={{ id: userId, name: session.user?.name || "User", role: userRole }}
      show={{
        id: show.id,
        name: show.name,
        location: show.location,
        address: show.address,
        startDate: show.startDate.toISOString(),
        endDate: show.endDate.toISOString(),
        isOutdoor: show.isOutdoor,
        status: show.status,
        notes: show.notes,
        manager: show.manager,
        assignments: show.assignments.map((a) => ({
          id: a.id,
          userId: a.userId,
          user: a.user,
        })),
        salesCount: show._count.sales,
        equipmentTaskCount: show._count.equipmentTasks,
      }}
      totalStats={{
        totalSales: totalAgg._sum.salePrice || 0,
        totalCommission: totalAgg._sum.commission || 0,
        saleCount: totalAgg._count || 0,
      }}
      byEmployee={byEmployee.map((b) => ({
        userId: b.userId,
        name: userMap.get(b.userId)?.name || "Unknown",
        role: userMap.get(b.userId)?.role || "EMPLOYEE",
        sales: b._sum.salePrice || 0,
        commission: b._sum.commission || 0,
        count: b._count,
      }))}
      recentSales={show.sales.map((s) => ({
        id: s.id,
        productLevel: s.productLevel,
        productModel: s.productModel,
        productStyle: s.productStyle,
        salePrice: s.salePrice,
        commission: s.commission,
        paymentType: s.paymentType,
        userName: s.user.name,
        createdAt: s.createdAt.toISOString(),
      }))}
      activeDrawer={activeDrawer ? {
        id: activeDrawer.id,
        openingFloat: activeDrawer.openingFloat,
        totalCash: activeDrawer.totalCash,
        totalCard: activeDrawer.totalCard,
        openedBy: activeDrawer.openedBy.name,
        openedAt: activeDrawer.openedAt.toISOString(),
      } : null}
    />
  );
}
