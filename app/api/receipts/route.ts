import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildReceiptHtml } from "@/lib/email";

// POST /api/receipts — send a receipt for a sale to a customer email
// Body: { saleId, customerEmail, customerName? }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { saleId, customerEmail, customerName } = await req.json();
  if (!saleId || !customerEmail) {
    return NextResponse.json({ error: "saleId and customerEmail required" }, { status: 400 });
  }
  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      user: { select: { name: true } },
      show: { select: { id: true, name: true, startDate: true, endDate: true } },
    },
  });
  if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

  // Permission: admin or the seller
  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN" && sale.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const showDate = new Date(sale.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const html = buildReceiptHtml({
    customerName,
    showName: sale.show.name,
    showDate,
    items: [{ level: sale.productLevel, model: sale.productModel, style: sale.productStyle, price: sale.salePrice }],
    total: sale.salePrice,
    paymentType: sale.paymentType,
    receiptNumber: sale.id.slice(-8).toUpperCase(),
    sellerName: sale.user.name,
    discount: sale.discount || undefined,
    discountReason: sale.discountReason || undefined,
  });

  const result = await sendEmail({
    to: customerEmail,
    subject: `Receipt for your purchase at ${sale.show.name}`,
    html,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.id });
}
