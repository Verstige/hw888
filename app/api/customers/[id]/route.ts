import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/customers/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      sales: {
        include: { sale: { include: { show: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
      },
      shippingOrders: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Permission: admin OR owner OR (manager and owner is in their team)
  if (userRole !== "ADMIN") {
    if (customer.ownerId !== userId) {
      if (userRole === "MANAGER") {
        const owner = await prisma.user.findUnique({ where: { id: customer.ownerId } });
        if (owner?.managerId !== userId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }
  return NextResponse.json(customer);
}

// PATCH /api/customers/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (userRole !== "ADMIN" && existing.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowed = ["name", "email", "phone", "city", "state", "notes", "tags"];
  const data: any = {};
  for (const f of allowed) if (body[f] !== undefined) data[f] = body[f];

  const updated = await prisma.customer.update({ where: { id }, data });
  return NextResponse.json(updated);
}

// DELETE /api/customers/[id] — admin only
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
