import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import DirectoryClient from "./DirectoryClient";

export default async function DirectoryPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as any).role;
  if (role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, email: true, role: true,
      city: true, homeAirportCode: true,
      createdAt: true,
      manager: { select: { id: true, name: true } },
      _count: { select: { sales: true, ownedCustomers: true, managedShows: true } },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <DirectoryClient
      users={users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      }))}
    />
  );
}
