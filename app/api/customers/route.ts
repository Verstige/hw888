import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/customers — list customers (role-scoped: employee sees own, manager sees team, admin sees all)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") || "";

  let where: any = {};
  if (userRole === "EMPLOYEE") {
    where.ownerId = userId;
  } else if (userRole === "MANAGER") {
    const teamIds = await prisma.user.findMany({ where: { managerId: userId, isActive: true }, select: { id: true } });
    where.ownerId = { in: [userId, ...teamIds.map((t) => t.id)] };
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { sales: true, shippingOrders: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return NextResponse.json(customers);
}

// POST /api/customers — create a customer
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();
  const { name, email, phone, city, state, notes, tags } = body;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const customer = await prisma.customer.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      city: city || null,
      state: state || null,
      notes: notes || null,
      tags: tags || null,
      ownerId: userId,
    },
  });
  return NextResponse.json(customer, { status: 201 });
}
