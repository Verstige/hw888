import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/directory — admin sees all users + filterable + exportable
export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      city: true,
      homeAirportCode: true,
      isActive: true,
      createdAt: true,
      manager: { select: { id: true, name: true } },
      _count: { select: { sales: true, ownedCustomers: true, managedShows: true } },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(users);
}
