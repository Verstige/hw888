import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/equipment
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const showId = searchParams.get("showId");

  let where: any = {};
  if (showId) where.showId = showId;

  const tasks = await prisma.equipmentTask.findMany({
    where,
    include: {
      show: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      completedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(tasks);
}
