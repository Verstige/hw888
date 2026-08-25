import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/sales/[id]/refund — refund a sale (full or partial)
// Body: { amount?, reason, restock? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const { amount, reason, restock = true } = await req.json();

  if (!reason) {
    return NextResponse.json({ error: "reason required" }, { status: 400 });
  }

  const original = await prisma.sale.findUnique({
    where: { id },
    include: { show: { select: { managerId: true, id: true } } },
  });
  if (!original) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

  const refundAmount = amount ? Math.min(Number(amount), original.salePrice - original.refundedAmount) : original.salePrice - original.refundedAmount;

  if (refundAmount <= 0) {
    return NextResponse.json({ error: "Nothing left to refund" }, { status: 400 });
  }

  const newRefundedTotal = original.refundedAmount + refundAmount;
  const isFullRefund = newRefundedTotal >= original.salePrice - 0.005;
  const userId = (session.user as any).id;

  const result = await prisma.$transaction(async (tx) => {
    // Update sale
    const updated = await tx.sale.update({
      where: { id },
      data: {
        refundedAmount: newRefundedTotal,
        refundedAt: new Date(),
        refundedById: userId,
        refundReason: reason,
        source: isFullRefund ? "refund" : "partial-refund",
      },
    });

    // Adjust drawer totals (subtract from totalCash or totalCard based on original paymentType)
    const drawerDelta: any = {};
    if (original.paymentType === "CASH") drawerDelta.totalCash = { decrement: refundAmount };
    else if (original.paymentType === "CARD") drawerDelta.totalCard = { decrement: refundAmount };
    if (Object.keys(drawerDelta).length > 0) {
      await tx.cashDrawer.updateMany({ where: { showId: original.showId, isActive: true }, data: drawerDelta });
    }

    // Restock inventory if requested
    if (restock && original.show?.managerId) {
      const inventory = await tx.inventoryItem.findUnique({
        where: {
          managerId_productLevel_productModel_productStyle: {
            managerId: original.show.managerId,
            productLevel: original.productLevel,
            productModel: original.productModel,
            productStyle: original.productStyle,
          },
        },
      });
      if (inventory) {
        const newQty = inventory.quantity + 1;
        const newStatus = newQty === 0 ? "OUT" : newQty <= inventory.lowStockThreshold ? "LOW" : "OK";
        await tx.inventoryItem.update({
          where: { id: inventory.id },
          data: { quantity: newQty, status: newStatus },
        });
        await tx.inventoryAdjustment.create({
          data: {
            inventoryId: inventory.id,
            adjustedById: userId,
            delta: 1,
            reason: "manual",
            notes: `Refund of sale ${id} (${reason})`,
          },
        });
      }
    }

    // Reverse the commission proportionally
    const commissionRefundRatio = refundAmount / original.salePrice;
    const commissionReversed = Math.round(original.commission * commissionRefundRatio * 100) / 100;

    return {
      sale: updated,
      summary: {
        refundAmount,
        totalRefunded: newRefundedTotal,
        isFullRefund,
        commissionReversed,
        drawerAdjustments: drawerDelta,
      },
    };
  });

  return NextResponse.json({ ok: true, ...result });
}
