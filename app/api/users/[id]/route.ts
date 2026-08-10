import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  // Users can see themselves; admin/manager can see their team
  if (userId !== id && userRole !== "ADMIN" && userRole !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id, isActive: true },
    select: { id: true, name: true, email: true, role: true, managerId: true, createdAt: true },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

// PATCH /api/users/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  if (userId !== id && userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const allowed = userRole === "ADMIN"
    ? ["name", "email", "role", "managerId", "isActive"]
    : ["name"];

  const data: any = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json(user);
}
