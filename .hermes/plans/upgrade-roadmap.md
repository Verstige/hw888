# HW888 — Upgrade Roadmap (3 Tiers)
**Date:** Aug 25, 2026
**Branch:** main

---

## Tier 1 — High impact (recommend doing next)

### 1. Inventory auto-deduct
- **Why:** Currently `/admin/inventory` shows static counts. Sales don't decrement `InventoryItem.quantity`. Without this, your inventory pages are misleading.
- **Scope:**
  - `/api/sales` POST: look up `InventoryItem` by (managerId, productLevel, productModel, productStyle), decrement by 1, decrement again if discount was applied (no, that's wrong — 1 sale = 1 bracelet sold)
  - If inventory goes below `lowStockThreshold`, mark item as LOW (new `status` field) and surface to dashboard
  - Add `/api/inventory/adjust` for manual stock adjustments with reason
- **Effort:** 1-2 hours
- **Files:** `/api/sales/route.ts`, `/api/inventory/[id]/adjust/route.ts` (new), `/admin/inventory/page.tsx` (LOW badge), `/dashboard` (low-stock alert)
- **Tests:** Record a sale, check inventory count drops; manual adjustment logged

### 2. Cash drawer reconciliation
- **Why:** Catches drawer drift before it compounds. Rep counts cash at end of day, system flags if expected vs actual differs.
- **Scope:**
  - CashDrawer schema: `closedAt`, `finalCountCash`, `finalCountCard`, `expectedCash`, `expectedCard`, `discrepancyCash`, `discrepancyCard`, `closedById`, `notes`
  - `/api/drawer/[id]/close` POST: enter final counts, system computes discrepancy, writes to DB
  - `/admin/drawers` (new): list all drawer sessions, filter by discrepancy, click to investigate
- **Effort:** 2-3 hours
- **Files:** schema.prisma, `/api/drawer/[id]/close/route.ts` (new), `/admin/drawers/page.tsx` (new)

### 3. Daily sales digest emails
- **Why:** Keeps everyone on the same page without opening the app. Manager + admin get a 9pm recap of: today's sales, commission totals, top performers, low stock alerts.
- **Scope:**
  - Pick an email provider: Resend (recommended, $0 for <100 emails/day) or SendGrid
  - New cron job: runs 9pm ET daily, fetches today's sales, builds digest, sends to all admin/manager
  - User preference: `User.emailDigest` boolean (default true)
  - Add env var `RESEND_API_KEY` + `EMAIL_FROM`
- **Effort:** 1-2 hours (excluding Resend account setup ~5 min)
- **Files:** `/lib/email.ts` (new), `/api/cron/digest/route.ts` (new), schedule via Railway cron or external cron-job.org
- **You need:** free Resend account at resend.com + verified sending domain

### 4. Receipts (email/SMS)
- **Why:** Customers want proof of purchase. Reps don't have to email/print manually.
- **Scope:**
  - Capture customer email at sale (optional field)
  - After sale saved, POST to `/api/receipts` with the sale id → sends formatted email with show date, items, total, commission disclaimer
  - SMS via Twilio (paid) or skip for now — email only
- **Effort:** 2-3 hours
- **Files:** `/api/receipts/route.ts` (new), `/sale/page.tsx` (add customer email input), receipt template
- **You need:** Resend account

### 5. Cash drawer reconciliation (re-listed for emphasis)
- *See #2 above*

### 6. Multi-currency + sales tax
- **Why:** Operating across state lines. Oregon 0%, Texas 6.25%, Colorado 2.9% (varies by city), Florida 6%, South Carolina 6%, North Carolina 4.75%.
- **Scope:**
  - `Show.taxRate` field (per-show tax override)
  - Default rates by state in `lib/tax.ts`
  - Sale schema: `taxAmount`, `taxRate`
  - `/sale` shows tax line
  - `/reports` shows tax collected
- **Effort:** 3-4 hours
- **Files:** schema.prisma, `lib/tax.ts` (new), `/api/sales`, `/sale`, `/api/reports`

### 7. Stripe / Square integration
- **Why:** Currently `paymentType: "CARD"` is just a label. Reps can't actually charge cards.
- **Scope:**
  - Add Stripe Terminal SDK (in-person card readers) OR Square SDK
  - `/sale` payment step triggers real charge
  - Record Stripe charge id on Sale
- **Effort:** 4-6 hours
- **You need:** Stripe account + card reader hardware ($59 for Stripe Reader M2). Or Square ($49 reader).

### 8. Offline queue UI
- **Why:** Reps need visibility on pending offline sales.
- **Scope:**
  - Show "3 sales queued" badge with dropdown listing them
  - "Force sync now" button
  - Auto-sync on reconnect
- **Effort:** 30 min (most logic already in `lib/offline.ts`)
- **Files:** `/components/OfflineSyncIndicator.tsx` (new), `/SiteShell.tsx` (mount it)

---

## Tier 2 — Strategic (do when revenue justifies)

### 9. Customer database + CRM
- Capture name/phone/email at sale time
- Send follow-up texts after show ("Thanks for visiting our booth at Sturgis!")
- Tracks repeat customers, biggest spenders
- **Effort:** 6-8 hours
- **You need:** Twilio account ($) for SMS

### 10. Per-show budget tracking
- `Show.budgetRevenue`, `Show.budgetExpense`
- Dashboard widget: progress bar, % to goal
- **Effort:** 3 hours

### 11. Mobile push notifications
- Web Push API
- Notify employee when their flight is booked
- Notify manager when drawer is opened
- **Effort:** 4 hours

### 12. Photo capture on sales
- Camera capture, upload to S3/R2, attach to sale
- Dispute resolution
- **Effort:** 4 hours

### 13. Goal setting per show
- Admin sets revenue target
- Real-time progress on dashboard
- **Effort:** 2 hours

### 14. Refund/return flow
- Reverses sale, restocks inventory, writes audit log
- **Effort:** 4 hours

### 15. Multi-cashier drawers
- Two reps on one drawer, splits at end of day
- **Effort:** 3 hours

### 16. Show location map view
- Embed Mapbox or Leaflet
- All upcoming shows as pins
- **Effort:** 3 hours

### 17. PWA install prompt
- Manifest already exists; add the install banner
- **Effort:** 30 min

---

## Tier 3 — Polish

### 18. Theme "auto" option
- Already works internally; expose in UI

### 19. Onboarding tour
- First-login flow: "Welcome — here's how to record a sale"
- Use `react-joyride` or build custom
- **Effort:** 2 hours

### 20. Sale confirmation animation
- Confetti / haptic on confirmed sale
- Use `canvas-confetti` library
- **Effort:** 30 min

### 21. Voice memo notes
- Hold-to-record voice, attach to sale
- MediaRecorder API + Supabase Storage
- **Effort:** 3 hours

### 22. Photo upload for show hero
- Admin uploads banner per show
- **Effort:** 2 hours

### 23. Sales history timeline chart
- Visual chart on /profile showing daily sales last 90 days
- **Effort:** 1 hour

### 24. Time clock / attendance
- Clock in/out per show, payroll export
- **Effort:** 6 hours

### 25. Equipment rental tracking
- Tables exist; needs UI flow
- **Effort:** 4 hours

### 26. Grocery list shared edit
- Real-time collab on grocery lists
- **Effort:** 4 hours

---

## Tier 4 — Outside help needed

- Accounting integration (QuickBooks / Xero)
- Customer-facing ecommerce site
- Multi-tenant
- SSO/SAML
- Multi-region DB

---

## Sequencing recommendation

### Wave 1 (this week)
1. **Offline queue UI** (30 min) — quick win, rep morale
2. **Inventory auto-deduct** (2 hr) — closes critical data loop
3. **Receipts via email** (2 hr) — customer-facing polish

### Wave 2 (next week)
4. **Daily digest emails** (2 hr) — accountability loop
5. **Cash drawer reconciliation** (3 hr) — protects revenue
6. **Show location map** (3 hr) — visual overview

### Wave 3 (when revenue justifies)
7. **Multi-currency + tax** (4 hr) — needed before tax season
8. **Customer CRM** (8 hr) — biggest missed revenue
9. **Stripe/Square integration** (6 hr) — closes the loop

### Wave 4 (polish)
10. **PWA install prompt** (30 min)
11. **Onboarding tour** (2 hr)
12. **Sale confirmation animation** (30 min)

---

## External accounts needed (free tiers)

| Service | Free Tier | Used For |
|---|---|---|
| Resend | 100 emails/day, 3,000/month | Receipts + daily digest |
| Cloudflare R2 | 10 GB / month | Photo uploads + voice memos |
| Mapbox | 50,000 map loads/month | Show location map |

---

## Decision tree — when to start each

**Start inventory auto-deduct when:**
- You've recorded 50+ sales and want to know actual stock
- Reps are starting to ask "do we have more black 2X?"

**Start cash drawer reconciliation when:**
- You've run 3+ shows and have cash drawer history
- You suspect drawer drift (cash counted doesn't match sales)

**Start customer CRM when:**
- You're spending >$100/month on show fees and need follow-up ROI
- Customers have asked "do you have a website?"

**Start Stripe integration when:**
- You have a card reader ($59 Stripe Reader M2 or $49 Square)
- Card transactions are >30% of sales
