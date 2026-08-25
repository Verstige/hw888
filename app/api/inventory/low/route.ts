import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/inventory/low — items with LOW or OUT status
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.inventoryItem.findMany({
    where: { status: { in: ["LOW", "OUT"] } },
    include: { manager: { select: { id: true, name: true } } },
    orderBy: [{ status: "asc" }, { quantity: "asc" }],
    take: 50,
  });
  return NextResponse.json(items);
}
