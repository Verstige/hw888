import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/drawer/list — list all drawer sessions (admin/manager)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = (session.user as any).role;
  if (userRole === "EMPLOYEE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const drawers = await prisma.cashDrawer.findMany({
    orderBy: { openedAt: "desc" },
    take: 100,
    include: {
      show: { select: { id: true, name: true, location: true } },
      openedBy: { select: { id: true, name: true } },
      closedBy: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(drawers);
}
