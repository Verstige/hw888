import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/shipping/[id] — update status / tracking / fields
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  const existing = await prisma.shippingOrder.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Permission: admin or creator
  if (userRole !== "ADMIN" && existing.createdById !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowed = ["status", "trackingNumber", "carrier", "notes", "shippingCost", "shippedAt", "deliveredAt"];
  const data: any = {};
  for (const f of allowed) if (body[f] !== undefined) data[f] = body[f];

  // If status changed, auto-set timestamp
  if (body.status === "SHIPPED" && existing.status !== "SHIPPED") data.shippedAt = new Date();
  if (body.status === "DELIVERED" && existing.status !== "DELIVERED") data.deliveredAt = new Date();

  const updated = await prisma.shippingOrder.update({ where: { id }, data });

  // Log event if status changed
  if (body.status && body.status !== existing.status) {
    await prisma.shippingEvent.create({
      data: {
        orderId: id,
        status: body.status,
        description: body.eventDescription || `Status changed from ${existing.status} to ${body.status}`,
        location: body.eventLocation || null,
        createdById: userId,
      },
    });
  }
  return NextResponse.json(updated);
}

// GET /api/shipping/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const order = await prisma.shippingOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: { select: { id: true, name: true, email: true } },
      events: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

// DELETE /api/shipping/[id] — admin only
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.shippingOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
