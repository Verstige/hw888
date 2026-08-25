import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCommissionRate, computeCommission } from "@/lib/commission";

// POST /api/sales/[id]/split — split one sale across multiple employees
// Body: { splits: [{ userId, fraction? }] } — fractions must sum to 1.0, default split is equal across all entries
// Each split creates a new Sale record with source="split" and parentSaleId pointing to original
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionUserId = (session.user as any).id;
  const sessionRole = (session.user as any).role;

  const { id } = await params;
  const body = await req.json();
  const { splits } = body;

  if (!Array.isArray(splits) || splits.length < 2) {
    return NextResponse.json({ error: "Need at least 2 splits" }, { status: 400 });
  }

  // Validate fractions sum to ~1.0
  const totalFraction = splits.reduce((sum: number, s: any) => sum + (Number(s.fraction) || 0), 0);
  if (Math.abs(totalFraction - 1.0) > 0.01) {
    return NextResponse.json({ error: `Fractions must sum to 1.0 (got ${totalFraction.toFixed(3)})` }, { status: 400 });
  }

  // Get original sale
  const original = await prisma.sale.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!original) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

  // Permission check: any user who owns the sale, plus admin/manager
  if (sessionRole === "EMPLOYEE" && original.userId !== sessionUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate all user IDs
  const userIds = splits.map((s: any) => s.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, isActive: true },
    select: { id: true, name: true },
  });
  if (users.length !== userIds.length) {
    return NextResponse.json({ error: "One or more users not found" }, { status: 400 });
  }
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Pre-fetch commission rates
  const rates = await prisma.commissionRate.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, baseRate: true },
  });
  const rateMap = new Map(rates.map((r) => [r.userId, r.baseRate]));

  // Create split sales + adjustment log
  const result = await prisma.$transaction(async (tx) => {
    // Mark original as having been split (set salePrice = 0, source=split, note child split)
    // We'll delete the original and replace with split children. To preserve audit trail,
    // we keep the original but zero out its commission contribution by setting a flag.
    // Actually: the cleanest model is: original stays as the "audit record", children are the
    // real commission-bearing sales. We'll set source='split-parent' on original to mark it.

    await tx.sale.update({
      where: { id },
      data: { source: "split-parent", notes: `Split into ${splits.length} parts on ${new Date().toISOString()}` },
    });

    const children = [];
    for (const s of splits) {
      const fraction = Number(s.fraction);
      const childPrice = Math.round(original.salePrice * fraction * 100) / 100;
      const baseRate = rateMap.get(s.userId) ?? 0.30;
      const commission = computeCommission(childPrice, baseRate);
      const child = await tx.sale.create({
        data: {
          showId: original.showId,
          userId: s.userId,
          productLevel: original.productLevel,
          productModel: original.productModel,
          productStyle: original.productStyle,
          salePrice: childPrice,
          paymentType: original.paymentType,
          commission,
          commissionRateSnapshot: baseRate,
          source: "split",
          parentSaleId: original.id,
          notes: s.notes || `Split from original sale (${(fraction * 100).toFixed(0)}%)`,
          createdAt: original.createdAt,
        },
      });
      children.push({ ...child, employeeName: userMap.get(s.userId)?.name });
    }

    // Log the split on the parent
    await tx.saleAdjustment.create({
      data: {
        saleId: original.id,
        adjustedById: sessionUserId,
        field: "split",
        oldValue: `${original.salePrice} to ${original.user.name}`,
        newValue: `${children.length} parts`,
        reason: body.reason || null,
      },
    });

    return children;
  });

  return NextResponse.json({ ok: true, originalId: id, splits: result });
}
