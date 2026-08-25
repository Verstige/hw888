import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TravelClient from "./TravelClient";

export default async function TravelPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userRole = (session.user as any).role as "ADMIN" | "MANAGER" | "EMPLOYEE";

  // Shows for the flight browser
  const shows = await prisma.show.findMany({
    where: { status: { in: ["UPCOMING", "ACTIVE"] } },
    select: { id: true, name: true, location: true, startDate: true, endDate: true },
    orderBy: { startDate: "asc" },
    take: 50,
  });

  // All users (admin/manager can pick who to book; employee sees self)
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  // Pre-fetch all flight options for upcoming shows (single query for the table)
  const flightOptions = await prisma.flightOption.findMany({
    where: { isActive: true, showId: { in: shows.map((s) => s.id) } },
    orderBy: [{ airline: "asc" }, { estimatedCost: "asc" }],
  });

  return (
    <TravelClient
      userRole={userRole}
      userId={(session.user as any).id}
      shows={shows.map((s) => ({
        ...s,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
      }))}
      users={users}
      flightOptions={flightOptions.map((o) => ({
        ...o,
        outboundDate: o.outboundDate.toISOString(),
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      }))}
    />
  );
}
