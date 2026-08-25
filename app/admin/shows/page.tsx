import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AdminShowsClient from "./AdminShowsClient";

export default async function AdminShowsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN") redirect("/dashboard");

  const [shows, managers, employees] = await Promise.all([
    prisma.show.findMany({
      include: {
        manager: { select: { id: true, name: true } },
        assignments: { include: { user: { select: { id: true, name: true, role: true } } } },
        _count: { select: { sales: true } },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "MANAGER", isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AdminShowsClient
      user={{ name: session.user?.name || "Admin", role: "ADMIN" }}
      initialShows={shows as any}
      managers={managers as any}
      employees={employees as any}
    />
  );
}
