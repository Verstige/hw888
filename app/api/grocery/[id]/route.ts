import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/grocery/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as any).id;
  const body = await req.json();
  const { status } = body;

  const data: any = {};
  if (status === "PURCHASED") {
    data.status = "PURCHASED";
    data.purchasedAt = new Date();
    data.purchasedById = userId;
  } else if (status === "PENDING") {
    data.status = "PENDING";
    data.purchasedAt = null;
    data.purchasedById = null;
  }

  const item = await prisma.groceryItem.update({ where: { id }, data });
  return NextResponse.json(item);
}
