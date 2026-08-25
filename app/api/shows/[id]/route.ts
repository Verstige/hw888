import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/shows/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, name: true } },
      assignments: { include: { user: { select: { id: true, name: true, role: true } } } },
      _count: { select: { sales: true } },
    },
  });
  if (!show) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(show);
}

// PATCH /api/shows/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const { name, location, address, startDate, endDate, isOutdoor, status, notes, managerId, employeeIds } = body;

  const existing = await prisma.show.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.show.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(location !== undefined && { location }),
      ...(address !== undefined && { address }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(isOutdoor !== undefined && { isOutdoor: !!isOutdoor }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      ...(managerId !== undefined && { managerId: managerId || null }),
    },
  });

  // Replace assignments if provided
  if (Array.isArray(employeeIds)) {
    await prisma.showAssignment.deleteMany({ where: { showId: id } });
    if (employeeIds.length > 0) {
      await prisma.showAssignment.createMany({
        data: employeeIds.map((userId: string) => ({ showId: id, userId })),
        skipDuplicates: true,
      });
    }
  }

  return NextResponse.json(updated);
}

// DELETE /api/shows/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.show.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
