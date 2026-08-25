import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCommissionRate, computeCommission } from "@/lib/commission";

// PATCH /api/sales/[id] — admin edit sale with audit trail
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const sessionUserId = (session.user as any).id;

  const original = await prisma.sale.findUnique({ where: { id } });
  if (!original) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

  const allowedFields = ["salePrice", "productLevel", "productModel", "productStyle", "paymentType", "userId", "showId", "notes"];
  const updates: any = {};
  const logs: any[] = [];

  for (const field of allowedFields) {
    if (body[field] !== undefined && body[field] !== (original as any)[field]) {
      updates[field] = body[field];
      logs.push({
        field,
        oldValue: String((original as any)[field] ?? ""),
        newValue: String(body[field] ?? ""),
      });
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, sale: original, changed: false });
  }

  // If salePrice changed, recompute commission with the user's current rate
  if (updates.salePrice !== undefined) {
    const newUserId = updates.userId ?? original.userId;
    const { baseRate } = await getCommissionRate(newUserId);
    updates.commission = computeCommission(updates.salePrice, baseRate);
    // Do NOT overwrite commissionRateSnapshot — preserve original rate for audit
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.sale.update({ where: { id }, data: updates });

    // Log each changed field
    for (const log of logs) {
      await tx.saleAdjustment.create({
        data: {
          saleId: id,
          adjustedById: sessionUserId,
          field: log.field,
          oldValue: log.oldValue,
          newValue: log.newValue,
          reason: body.reason || null,
        },
      });
    }

    return updated;
  });

  return NextResponse.json({ ok: true, sale: result, changed: true, logs });
}

// DELETE /api/sales/[id] — admin delete (soft = log + mark; hard = remove)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sessionUserId = (session.user as any).id;
  const body = await req.json().catch(() => ({}));

  const original = await prisma.sale.findUnique({ where: { id } });
  if (!original) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

  await prisma.saleAdjustment.create({
    data: {
      saleId: id,
      adjustedById: sessionUserId,
      field: "deleted",
      oldValue: `${original.salePrice} ${original.productLevel} ${original.productModel}`,
      newValue: null,
      reason: body.reason || null,
    },
  });

  await prisma.sale.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
