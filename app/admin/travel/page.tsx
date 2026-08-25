import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AdminTravelClient from "./AdminTravelClient";

export default async function AdminTravelPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as any).role;
  if (role !== "ADMIN") redirect("/travel");

  const shows = await prisma.show.findMany({
    where: { status: { in: ["UPCOMING", "ACTIVE"] } },
    select: { id: true, name: true, location: true, startDate: true, endDate: true },
    orderBy: { startDate: "asc" },
  });

  return (
    <AdminTravelClient
      shows={shows.map((s) => ({
        ...s,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
      }))}
    />
  );
}
