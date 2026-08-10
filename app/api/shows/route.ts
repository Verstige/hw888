import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/shows
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const upcoming = searchParams.get("upcoming") === "true";

  let where: any = {};

  if (status) where.status = status;
  if (upcoming) where.startDate = { gte: new Date() };

  if (userRole === "EMPLOYEE" || userRole === "MANAGER") {
    // Filter to assigned shows
    const assignments = await prisma.showAssignment.findMany({
      where: { userId: userRole === "MANAGER" ? undefined : userId },
      select: { showId: true },
    });
    where.id = { in: assignments.map((a) => a.showId) };
  }

  const shows = await prisma.show.findMany({
    where,
    include: {
      manager: { select: { id: true, name: true } },
      assignments: {
        include: { user: { select: { id: true, name: true, role: true } } },
      },
      _count: { select: { sales: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(shows);
}

// POST /api/shows
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, location, address, startDate, endDate, isOutdoor, notes, managerId, employeeIds } = body;

  if (!name || !location || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const show = await prisma.show.create({
    data: {
      name,
      location,
      address,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isOutdoor: !!isOutdoor,
      notes,
      managerId: managerId || null,
    },
  });

  // Assign employees
  if (employeeIds?.length) {
    await prisma.showAssignment.createMany({
      data: employeeIds.map((userId: string) => ({ showId: show.id, userId })),
      skipDuplicates: true,
    });

    // Auto-generate equipment tasks for this show
    const baseTasks: Array<{ showId: string; taskType: "TABLES" | "CHAIRS" | "TENT" | "TENT_WEIGHTS" | "EXTENSION_CORD" | "DISPLAY" }> = [
      { showId: show.id, taskType: "TABLES" },
      { showId: show.id, taskType: "CHAIRS" },
    ];
    if (isOutdoor) {
      baseTasks.push(
        { showId: show.id, taskType: "TENT" },
        { showId: show.id, taskType: "TENT_WEIGHTS" }
      );
    }
    await prisma.equipmentTask.createMany({ data: baseTasks });
  }

  return NextResponse.json(show, { status: 201 });
}
