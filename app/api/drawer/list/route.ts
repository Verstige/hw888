import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/drawer/list — list all open cash drawers (filtered by role)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  // Admins see all open drawers. Managers see drawers for shows where they're assigned or managing.
  // Employees see drawers for shows they're assigned to.
  let showFilter: any = { isActive: true };

  if (userRole === "EMPLOYEE" || userRole === "MANAGER") {
    const assignments = await prisma.showAssignment.findMany({
      where: userRole === "MANAGER" ? { user: { managerId: userId } } : { userId },
      select: { showId: true },
    });
    const showIds = assignments.map((a) => a.showId);
    showFilter = { isActive: true, showId: { in: showIds } };
  }

  const drawers = await prisma.cashDrawer.findMany({
    where: showFilter,
    include: {
      show: { select: { id: true, name: true, location: true } },
      openedBy: { select: { id: true, name: true } },
    },
    orderBy: { openedAt: "desc" },
  });

  return NextResponse.json(drawers);
}
