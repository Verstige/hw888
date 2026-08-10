import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/equipment/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status, assignedToId } = body;

  const data: any = {};
  if (status) {
    data.status = status;
    if (status === "COMPLETED") {
      data.completedAt = new Date();
      data.completedById = (session.user as any).id;
    }
  }
  if (assignedToId !== undefined) data.assignedToId = assignedToId;

  const task = await prisma.equipmentTask.update({ where: { id }, data });
  return NextResponse.json(task);
}
