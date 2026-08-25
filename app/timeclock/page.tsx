import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TimeClockClient from "./TimeClockClient";

export default async function TimeClockPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  let where: any = {};
  if (userRole === "EMPLOYEE") where.userId = userId;
  else if (userRole === "MANAGER") {
    const team = await prisma.user.findMany({ where: { managerId: userId, isActive: true }, select: { id: true } });
    where.userId = { in: [userId, ...team.map((t) => t.id)] };
  }

  const [active, recent, shows] = await Promise.all([
    prisma.timeClock.findFirst({
      where: { ...where, clockOut: null },
      include: {
        user: { select: { id: true, name: true } },
        show: { select: { id: true, name: true, location: true } },
      },
    }),
    prisma.timeClock.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        show: { select: { id: true, name: true, location: true } },
      },
      orderBy: { clockIn: "desc" },
      take: 30,
    }),
    prisma.show.findMany({
      where: { status: { in: ["UPCOMING", "ACTIVE"] } },
      select: { id: true, name: true, location: true, startDate: true, endDate: true },
      orderBy: { startDate: "asc" },
      take: 20,
    }),
  ]);

  return (
    <TimeClockClient
      userRole={userRole}
      active={active ? {
        ...active,
        clockIn: active.clockIn.toISOString(),
        clockOut: active.clockOut?.toISOString() || null,
        breakStart: active.breakStart?.toISOString() || null,
        breakEnd: active.breakEnd?.toISOString() || null,
      } : null}
      recent={recent.map((r) => ({
        ...r,
        clockIn: r.clockIn.toISOString(),
        clockOut: r.clockOut?.toISOString() || null,
        breakStart: r.breakStart?.toISOString() || null,
        breakEnd: r.breakEnd?.toISOString() || null,
        updatedAt: r.updatedAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
      }))}
      shows={shows.map((s) => ({
        ...s,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
      }))}
    />
  );
}
