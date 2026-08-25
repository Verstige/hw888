import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeUserCommission } from "@/lib/commission";

// GET /api/commission/[userId] — admin/manager view of any user's breakdown
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;
  const sessionUserId = (session.user as any).id;
  const sessionRole = (session.user as any).role;

  // Permission check: admin sees anyone, manager sees their team, employee sees only self
  if (sessionRole === "EMPLOYEE" && userId !== sessionUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (sessionRole === "MANAGER") {
    if (userId !== sessionUserId) {
      const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { managerId: true },
      });
      if (!target || target.managerId !== sessionUserId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true, email: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const breakdown = await computeUserCommission(userId, target.role as any);
  return NextResponse.json({ user: target, breakdown });
}
