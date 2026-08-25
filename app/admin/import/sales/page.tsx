import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ImportSalesClient from "./ImportSalesClient";

export default async function ImportSalesPage({ searchParams }: { searchParams: Promise<{ showId?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const userRole = (session.user as any).role as "ADMIN" | "MANAGER" | "EMPLOYEE";
  if (userRole === "EMPLOYEE") redirect("/dashboard");

  const { showId: initialShowId } = await searchParams;

  // All active shows (recent first)
  const shows = await prisma.show.findMany({
    select: { id: true, name: true, location: true, startDate: true, endDate: true, status: true },
    orderBy: { startDate: "desc" },
    take: 100,
  });

  // All active employees + managers (for sales assignment)
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  return (
    <ImportSalesClient
      userRole={userRole}
      shows={shows.map((s) => ({
        ...s,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
      }))}
      users={users}
      initialShowId={initialShowId}
    />
  );
}
