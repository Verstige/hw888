// Email sending via Resend (https://resend.com)
// Set RESEND_API_KEY + EMAIL_FROM in Railway env. If missing, logs to console instead.

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "HW888 <noreply@hw888.app>";

  if (!apiKey) {
    // No API key configured — log instead
    console.log("📧 [EMAIL - no RESEND_API_KEY]", {
      to: payload.to,
      from,
      subject: payload.subject,
    });
    return { ok: true, id: "logged-only" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text || payload.html.replace(/<[^>]+>/g, ""),
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: err };
    }
    const data = await res.json();
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

// HTML receipt template
export function buildReceiptHtml(opts: {
  customerName?: string;
  showName: string;
  showDate: string;
  items: Array<{ level: string; model: string; style: string; price: number }>;
  total: number;
  paymentType: string;
  receiptNumber: string;
  sellerName: string;
  discount?: number;
  discountReason?: string;
}): string {
  const itemRows = opts.items
    .map(
      (i) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${i.level.replace("LEVEL_", "")} · ${i.model}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${i.style}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${i.price.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 20px; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #2D5A3D 0%, #1F3F2A 100%); color: white; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; letter-spacing: -0.02em;">HW888 Receipt</h1>
      <p style="margin: 8px 0 0; opacity: 0.85; font-size: 14px;">${opts.showName}</p>
    </div>
    <div style="padding: 24px;">
      ${opts.customerName ? `<p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">Hi ${opts.customerName}, thanks for your purchase!</p>` : ""}
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Level · Model</th>
            <th style="padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Style</th>
            <th style="padding: 10px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      ${opts.discount && opts.discount > 0 ? `
      <div style="padding: 12px; background: rgba(45, 138, 78, 0.08); border-radius: 10px; margin-bottom: 12px;">
        <p style="margin: 0; font-size: 14px; color: #2D8A4E; font-weight: 600;">
          Discount applied: -$${opts.discount.toFixed(2)}${opts.discountReason ? ` (${opts.discountReason})` : ""}
        </p>
      </div>` : ""}
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-top: 2px solid #2D5A3D; border-bottom: 1px solid #e5e7eb; margin-bottom: 16px;">
        <span style="font-size: 16px; font-weight: 700;">Total</span>
        <span style="font-size: 24px; font-weight: 800; color: #2D5A3D;">$${opts.total.toFixed(2)}</span>
      </div>
      <div style="background: #f9fafb; padding: 16px; border-radius: 10px; font-size: 13px; color: #6b7280; line-height: 1.6;">
        <p style="margin: 0 0 4px;"><strong style="color: #374151;">Receipt #:</strong> ${opts.receiptNumber}</p>
        <p style="margin: 0 0 4px;"><strong style="color: #374151;">Show:</strong> ${opts.showName} (${opts.showDate})</p>
        <p style="margin: 0 0 4px;"><strong style="color: #374151;">Payment:</strong> ${opts.paymentType}</p>
        <p style="margin: 0;"><strong style="color: #374151;">Served by:</strong> ${opts.sellerName}</p>
      </div>
      <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
        Thanks for visiting Holistic World! Keep this receipt for your records.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// Daily digest template
export function buildDigestHtml(opts: {
  date: string;
  totalSales: number;
  totalCommission: number;
  saleCount: number;
  byEmployee: Array<{ name: string; sales: number; count: number; commission: number }>;
  byShow: Array<{ name: string; sales: number; count: number }>;
  lowStock: Array<{ managerName: string; level: string; model: string; style: string; quantity: number; status: string }>;
  cashTotal: number;
  cardTotal: number;
}): string {
  const employeeRows = opts.byEmployee
    .map(
      (e, i) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">#${i + 1} ${e.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${e.count}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${e.sales.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #C9A84C; font-weight: 600;">$${e.commission.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const showRows = opts.byShow
    .map(
      (s) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${s.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${s.count}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${s.sales.toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const lowRows = opts.lowStock.length === 0 ? `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #9ca3af;">All inventory healthy</td></tr>` : opts.lowStock.map((l) => `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${l.managerName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${l.level.replace("LEVEL_", "")} · ${l.model} · ${l.style}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${l.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;"><span style="background: ${l.status === "OUT" ? "#DC2626" : "#E67E22"}; color: white; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">${l.status}</span></td>
      </tr>`).join("");

  return `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 20px; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 720px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #2D5A3D 0%, #1F3F2A 100%); color: white; padding: 24px;">
      <h1 style="margin: 0; font-size: 22px; letter-spacing: -0.02em;">Daily Sales Digest</h1>
      <p style="margin: 8px 0 0; opacity: 0.85; font-size: 14px;">${opts.date}</p>
    </div>
    <div style="padding: 24px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
        <div style="padding: 16px; background: linear-gradient(135deg, rgba(45, 90, 61, 0.10) 0%, rgba(45, 90, 61, 0.04) 100%); border-radius: 12px; text-align: center;">
          <p style="margin: 0; font-size: 11px; font-weight: 700; color: #2D5A3D; text-transform: uppercase; letter-spacing: 0.05em;">Total Sales</p>
          <p style="margin: 6px 0 0; font-size: 24px; font-weight: 800; color: #2D5A3D;">$${opts.totalSales.toFixed(2)}</p>
        </div>
        <div style="padding: 16px; background: linear-gradient(135deg, rgba(201, 168, 76, 0.18) 0%, rgba(201, 168, 76, 0.06) 100%); border-radius: 12px; text-align: center;">
          <p style="margin: 0; font-size: 11px; font-weight: 700; color: #C9A84C; text-transform: uppercase; letter-spacing: 0.05em;">Commission</p>
          <p style="margin: 6px 0 0; font-size: 24px; font-weight: 800; color: #C9A84C;">$${opts.totalCommission.toFixed(2)}</p>
        </div>
        <div style="padding: 12px; background: #f9fafb; border-radius: 10px; text-align: center;">
          <p style="margin: 0; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Cash</p>
          <p style="margin: 4px 0 0; font-size: 16px; font-weight: 700;">$${opts.cashTotal.toFixed(2)}</p>
        </div>
        <div style="padding: 12px; background: #f9fafb; border-radius: 10px; text-align: center;">
          <p style="margin: 0; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Card</p>
          <p style="margin: 4px 0 0; font-size: 16px; font-weight: 700;">$${opts.cardTotal.toFixed(2)}</p>
        </div>
      </div>
      <h2 style="margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Top performers</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead><tr style="background: #f9fafb;">
          <th style="padding: 10px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase;">Rep</th>
          <th style="padding: 10px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Sales</th>
          <th style="padding: 10px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Revenue</th>
          <th style="padding: 10px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Commission</th>
        </tr></thead>
        <tbody>${employeeRows}</tbody>
      </table>
      <h2 style="margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">By show</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead><tr style="background: #f9fafb;">
          <th style="padding: 10px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase;">Show</th>
          <th style="padding: 10px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Sales</th>
          <th style="padding: 10px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Revenue</th>
        </tr></thead>
        <tbody>${showRows}</tbody>
      </table>
      <h2 style="margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Low stock alerts</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead><tr style="background: #f9fafb;">
          <th style="padding: 10px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase;">Manager</th>
          <th style="padding: 10px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase;">Item</th>
          <th style="padding: 10px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Qty</th>
          <th style="padding: 10px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Status</th>
        </tr></thead>
        <tbody>${lowRows}</tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
}
