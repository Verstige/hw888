import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listAirports, listUSStates } from "@/lib/flights";
import TravelClient from "./TravelClient";

export default async function TravelPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userRole = (session.user as any).role as "ADMIN" | "MANAGER" | "EMPLOYEE";
  const userId = (session.user as any).id;

  const shows = await prisma.show.findMany({
    where: { status: { in: ["UPCOMING", "ACTIVE"] } },
    select: { id: true, name: true, location: true, startDate: true, endDate: true },
    orderBy: { startDate: "asc" },
    take: 50,
  });

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true, city: true, homeAirportCode: true },
    orderBy: { name: "asc" },
  });

  const currentUser = users.find((u) => u.id === userId) || { id: userId, name: "", email: "", role: userRole };

  const flightOptions = await prisma.flightOption.findMany({
    where: { isActive: true, showId: { in: shows.map((s) => s.id) } },
    orderBy: [{ airline: "asc" }, { estimatedCost: "asc" }],
  });

  return (
    <TravelClient
      userRole={userRole}
      userId={userId}
      currentUser={currentUser}
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
      airports={listAirports()}
      states={listUSStates()}
    />
  );
}
