import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AdminDrawersClient from "./AdminDrawersClient";

export default async function AdminDrawersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as any).role;
  if (role !== "ADMIN") redirect("/dashboard");

  const drawers = await prisma.cashDrawer.findMany({
    orderBy: { openedAt: "desc" },
    take: 100,
    include: {
      show: { select: { id: true, name: true, location: true } },
      openedBy: { select: { id: true, name: true } },
      closedBy: { select: { id: true, name: true } },
    },
  });

  return (
    <AdminDrawersClient
      drawers={drawers.map((d) => ({
        ...d,
        openedAt: d.openedAt.toISOString(),
        closedAt: d.closedAt?.toISOString() || null,
      }))}
    />
  );
}
