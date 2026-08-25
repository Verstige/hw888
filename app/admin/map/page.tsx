import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ShowMapClient from "./ShowMapClient";

export default async function ShowMapPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const shows = await prisma.show.findMany({
    where: { status: { in: ["UPCOMING", "ACTIVE", "COMPLETED"] } },
    select: { id: true, name: true, location: true, startDate: true, endDate: true, status: true },
    orderBy: { startDate: "desc" },
    take: 100,
  });

  return (
    <ShowMapClient
      shows={shows.map((s) => ({
        ...s,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
      }))}
    />
  );
}
