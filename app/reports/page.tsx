import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ showId?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { showId: initialShowId } = await searchParams;
  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  // Available shows (admin/manager: all; employee: assigned)
  let showsWhere: any = {};
  if (userRole === "EMPLOYEE") {
    const assignments = await prisma.showAssignment.findMany({ where: { userId }, select: { showId: true } });
    showsWhere = { id: { in: assignments.map((a) => a.showId) } };
  }

  const shows = await prisma.show.findMany({
    where: showsWhere,
    select: { id: true, name: true, location: true, startDate: true, endDate: true, status: true },
    orderBy: { startDate: "desc" },
    take: 50,
  });

  return <ReportsClient userRole={userRole} shows={shows.map((s) => ({
    ...s,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
  }))} initialShowId={initialShowId} />;
}
