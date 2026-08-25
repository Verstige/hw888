import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildDigestHtml } from "@/lib/email";

// POST /api/cron/digest — runs daily at 9pm ET, sends digest to all admin/manager emails
// Set CRON_SECRET env var and use as a bearer token for security
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // Today (start of day)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // All sales today
  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: startOfDay } },
    include: {
      user: { select: { id: true, name: true, email: true, emailDigest: true } },
      show: { select: { id: true, name: true } },
    },
  });

  if (sales.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no sales today" });
  }

  // Aggregate
  const totalSales = sales.reduce((s, x) => s + x.salePrice, 0);
  const totalCommission = sales.reduce((s, x) => s + x.commission, 0);
  const cashTotal = sales.filter((s) => s.paymentType === "CASH").reduce((s, x) => s + x.salePrice, 0);
  const cardTotal = sales.filter((s) => s.paymentType === "CARD").reduce((s, x) => s + x.salePrice, 0);

  // By employee
  const empMap = new Map<string, { name: string; email: string; sales: number; count: number; commission: number }>();
  for (const s of sales) {
    const e = empMap.get(s.userId) || { name: s.user.name, email: s.user.email, sales: 0, count: 0, commission: 0 };
    e.sales += s.salePrice;
    e.commission += s.commission;
    e.count += 1;
    empMap.set(s.userId, e);
  }
  const byEmployee = Array.from(empMap.values())
    .map((e) => ({ name: e.name, sales: e.sales, count: e.count, commission: e.commission }))
    .sort((a, b) => b.sales - a.sales);

  // By show
  const showMap = new Map<string, { name: string; sales: number; count: number }>();
  for (const s of sales) {
    const k = s.showId;
    const entry = showMap.get(k) || { name: s.show.name, sales: 0, count: 0 };
    entry.sales += s.salePrice;
    entry.count += 1;
    showMap.set(k, entry);
  }
  const byShow = Array.from(showMap.values()).sort((a, b) => b.sales - a.sales);

  // Low stock items
  const lowStock = await prisma.inventoryItem.findMany({
    where: { status: { in: ["LOW", "OUT"] } },
    include: { manager: { select: { name: true } } },
    orderBy: { quantity: "asc" },
    take: 10,
  });

  const html = buildDigestHtml({
    date: startOfDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    totalSales,
    totalCommission,
    saleCount: sales.length,
    byEmployee,
    byShow,
    lowStock: lowStock.map((l) => ({
      managerName: l.manager.name,
      level: l.productLevel,
      model: l.productModel,
      style: l.productStyle,
      quantity: l.quantity,
      status: l.status,
    })),
    cashTotal,
    cardTotal,
  });

  // Recipients: admins + managers who have emailDigest = true (or unset)
  const recipients = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "MANAGER"] },
      isActive: true,
      NOT: { emailDigest: false },
    },
    select: { email: true },
  });

  const subject = `HW888 Daily Digest — ${startOfDay.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — $${totalSales.toFixed(0)} in sales`;

  let sent = 0;
  for (const r of recipients) {
    const result = await sendEmail({ to: r.email, subject, html });
    if (result.ok) sent++;
  }

  return NextResponse.json({ ok: true, sent, recipients: recipients.length, totalSales, saleCount: sales.length });
}
