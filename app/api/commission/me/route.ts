import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeUserCommission } from "@/lib/commission";

// GET /api/commission/me — current user's commission breakdown
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role as "ADMIN" | "MANAGER" | "EMPLOYEE";

  const breakdown = await computeUserCommission(userId, userRole);
  return NextResponse.json(breakdown);
}
