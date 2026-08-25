import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  let where: any = {};
  if (userRole === "EMPLOYEE") {
    where.ownerId = userId;
  } else if (userRole === "MANAGER") {
    const teamIds = await prisma.user.findMany({ where: { managerId: userId, isActive: true }, select: { id: true } });
    where.ownerId = { in: [userId, ...teamIds.map((t) => t.id)] };
  }

  const [customers, totalUsers] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { sales: true, shippingOrders: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  // Owners list (for filter)
  const owners = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  return (
    <CustomersClient
      userRole={userRole}
      currentUserId={userId}
      customers={customers.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }))}
      owners={owners}
    />
  );
}
