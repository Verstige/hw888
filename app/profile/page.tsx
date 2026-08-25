import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      employees: {
        where: { isActive: true },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!user) redirect("/login");

  // Airports + states for the location picker
  const airports = (await import("@/lib/flights")).listAirports();
  const states = (await import("@/lib/flights")).listUSStates();

  // Recent sales (last 30)
  const recentSales = await prisma.sale.findMany({
    where: { userId },
    include: { show: { select: { id: true, name: true, location: true, startDate: true, endDate: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // All attended shows (assignments + managed)
  const [assignments, managedShows] = await Promise.all([
    prisma.showAssignment.findMany({
      where: { userId },
      include: {
        show: {
          select: {
            id: true, name: true, location: true, startDate: true, endDate: true, status: true,
            manager: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.show.findMany({
      where: { managerId: userId },
      select: { id: true, name: true, location: true, startDate: true, endDate: true, status: true },
    }),
  ]);

  const allAttended = [
    ...managedShows.map((s) => ({ ...s, asManager: true, manager: null as any })),
    ...assignments.map((a) => ({ ...a.show, asManager: false })),
  ];

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as "ADMIN" | "MANAGER" | "EMPLOYEE",
        manager: user.manager,
        employees: user.employees,
        city: user.city,
        homeAirportCode: user.homeAirportCode,
      }}
      airports={airports}
      states={states}
      recentSales={recentSales.map((s) => ({
        id: s.id,
        productLevel: s.productLevel,
        productModel: s.productModel,
        productStyle: s.productStyle,
        salePrice: s.salePrice,
        commission: s.commission,
        commissionRateSnapshot: s.commissionRateSnapshot,
        paymentType: s.paymentType,
        showName: s.show?.name || "—",
        createdAt: s.createdAt.toISOString(),
      }))}
      attendedShows={allAttended.map((s) => ({
        id: s.id,
        name: s.name,
        location: s.location,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
        status: s.status,
        asManager: s.asManager,
      }))}
    />
  );
}
