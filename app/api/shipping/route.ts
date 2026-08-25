import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/shipping — list shipping orders (admin/manager: all, employee: own)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let where: any = {};
  if (userRole === "EMPLOYEE") {
    where.createdById = userId;
  } else if (userRole === "MANAGER") {
    const teamIds = await prisma.user.findMany({ where: { managerId: userId, isActive: true }, select: { id: true } });
    where.createdById = { in: [userId, ...teamIds.map((t) => t.id)] };
  }
  if (status && status !== "all") {
    if (status === "active") where.status = { in: ["NEW", "PROCESSING", "SHIPPED"] };
    else if (status === "completed") where.status = { in: ["DELIVERED", "CANCELLED", "RETURNED"] };
    else where.status = status;
  }

  const orders = await prisma.shippingOrder.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      createdBy: { select: { id: true, name: true } },
      events: { orderBy: { createdAt: "desc" }, take: 3 },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(orders);
}

// POST /api/shipping — create a shipping order (admin/manager only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userRole = (session.user as any).role;
  if (userRole === "EMPLOYEE") return NextResponse.json({ error: "Admin/manager only" }, { status: 403 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const {
    customerId, recipientName, recipientEmail, recipientPhone,
    addressLine1, addressLine2, city, state, postalCode, country,
    items, notes, shippingCost, carrier,
  } = body;

  if (!recipientName || !addressLine1 || !city || !state || !postalCode || !items) {
    return NextResponse.json({ error: "Missing required shipping fields" }, { status: 400 });
  }

  // Generate tracking number if carrier provided
  let trackingNumber: string | null = null;
  if (carrier) {
    const ts = Date.now().toString(36).toUpperCase().slice(-6);
    const rand = Math.random().toString(36).toUpperCase().slice(-4);
    trackingNumber = `${carrier.slice(0, 3).toUpperCase()}-${ts}-${rand}`;
  }

  const order = await prisma.shippingOrder.create({
    data: {
      customerId: customerId || null,
      recipientName,
      recipientEmail: recipientEmail || null,
      recipientPhone: recipientPhone || null,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      state,
      postalCode,
      country: country || "US",
      items: typeof items === "string" ? items : JSON.stringify(items),
      notes: notes || null,
      shippingCost: Number(shippingCost) || 0,
      carrier: carrier || "USPS",
      trackingNumber,
      createdById: userId,
    },
  });

  // Auto-create first event
  await prisma.shippingEvent.create({
    data: {
      orderId: order.id,
      status: "NEW",
      description: "Order created",
      createdById: userId,
    },
  });

  return NextResponse.json(order, { status: 201 });
}
