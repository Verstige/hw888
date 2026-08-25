import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ShippingClient from "./ShippingClient";

export default async function ShippingPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  let where: any = {};
  if (userRole === "EMPLOYEE") {
    where.createdById = userId;
  } else if (userRole === "MANAGER") {
    const teamIds = await prisma.user.findMany({ where: { managerId: userId, isActive: true }, select: { id: true } });
    where.createdById = { in: [userId, ...teamIds.map((t) => t.id)] };
  }

  const [orders, customers] = await Promise.all([
    prisma.shippingOrder.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        events: { orderBy: { createdAt: "desc" }, take: 3 },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.customer.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
  ]);

  return (
    <ShippingClient
      userRole={userRole}
      orders={orders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        shippedAt: o.shippedAt?.toISOString() || null,
        deliveredAt: o.deliveredAt?.toISOString() || null,
        updatedAt: o.updatedAt.toISOString(),
        events: o.events.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
      }))}
      customers={customers}
    />
  );
}
