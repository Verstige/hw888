# HW888 — Liquid Glass UI Upgrade + Add Shows + Full Analytics
**Date:** Aug 25, 2026
**Repo:** Verstige/hw888
**Deploy target:** Railway (auto on push to main)

---

## Scope (user-confirmed)

1. **Liquid glass design system** — frosted glass surfaces, soft shadows, ambient gradients, subtle motion. iOS 26 / visionOS-flavored. Built on existing Tailwind 4 + CSS vars.
2. **Beautiful login hero** — gradient mesh background, glass card, brand presence
3. **Add shows** — new `/admin/shows` page (full form: name, location, address, dates, outdoor toggle, manager, multi-select employees). POST already exists at `/api/shows`.
4. **Full analytics dashboard** — `/analytics` page with Recharts: KPIs, revenue-by-day trend, by-show breakdown, by-level mix, by-payment-type, top performers, commission trend. Admin-only.
5. **Mobile bottom dock** — iOS-style dock with 5 tabs (Home / Sale / Shows / Stats / More). Sticky bottom, safe-area aware, active indicator. Replaces per-page header nav.
6. **Build, deploy, verify live** — push to main, poll Railway, hit live URL.

## Constraints

- **No regressions** on existing routes — `/dashboard`, `/sale`, `/shows`, `/leaderboard`, `/travel`, `/admin/users|inventory|equipment|grocery`, login, all API routes
- **TypeScript clean** — `next build` must pass
- **No new env vars** — `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` are the existing surface
- **Mobile-first** — bottom dock drives nav on phones (< 768px), top tabs on desktop
- **iOS PWA** — viewportFit cover, 16px input floor, 44px tap targets, safe-area insets (per nextjs-mobile-pass-a skill)

## Design system

**Surface tokens** (in `app/globals.css` + `:root`):
- `--glass-bg: rgba(255, 255, 255, 0.55)` (light) / `rgba(20, 24, 28, 0.55)` (dark via `@media (prefers-color-scheme: dark)`)
- `--glass-border: rgba(255, 255, 255, 0.4)`
- `--glass-blur: 24px`
- `--glass-shadow: 0 8px 32px rgba(15, 23, 42, 0.12)`
- Ambient gradient: forest-green → warm-gold radial mesh on body, low opacity
- Brand colors preserved: `--color-primary` (deep forest), `--color-secondary` (warm gold)

**Components (new, in `app/components/`):**
- `GlassCard` — frosted surface with backdrop-filter, hover lift
- `BottomDock` — iOS-style 5-tab dock, sticky bottom, safe-area-aware
- `MobileHeader` — slim top bar on mobile (hamburger + page title)
- `KpiTile` — large number + label + delta indicator
- `HeroLogin` — gradient mesh background + glass card

**Modified files:**
- `app/globals.css` — add glass tokens, gradient bg, dock layout, mobile safe-area
- `app/layout.tsx` — viewportFit: cover, themeColor, optional ServiceWorkerRegister placeholder
- `app/page.tsx` — already redirects; no change
- `app/login/page.tsx` — replace with HeroLogin
- `app/dashboard/page.tsx` — refactor to use GlassCard, link to /analytics, dock-friendly
- `app/shows/page.tsx` — GlassCard, dock, link to /admin/shows for admins
- `app/leaderboard/page.tsx` — GlassCard, dock, range pills restyle
- `app/sale/page.tsx` — dock, glass payment summary
- `app/admin/users/page.tsx` + others — dock + glass

**New files:**
- `app/admin/shows/page.tsx` — admin show management with create form
- `app/analytics/page.tsx` — full analytics dashboard (admin/manager)
- `app/api/analytics/route.ts` — aggregate endpoint: revenue-by-day, by-show, by-level, by-payment, top-performers, KPIs
- `app/components/GlassCard.tsx`
- `app/components/BottomDock.tsx`
- `app/components/MobileHeader.tsx`
- `app/components/KpiTile.tsx`
- `app/components/Charts.tsx` — Recharts wrappers with glass styling
- `app/components/SiteShell.tsx` — wraps all authed pages with dock + header
- `app/components/HeroLogin.tsx`

## Analytics API contract (`/api/analytics`)

**Query params:** `range=7d|30d|60d` (default 30d)

**Response shape:**
```ts
{
  range: string,
  kpis: {
    totalSales: number,
    totalCommission: number,
    saleCount: number,
    avgTicket: number,
    activeEmployees: number,
    activeShows: number,
    deltaSalesPct: number,    // vs prior period
    deltaCommissionPct: number,
  },
  revenueByDay: Array<{ date: string, sales: number, commission: number }>,
  byShow: Array<{ showId: string, name: string, sales: number, commission: number, count: number }>,
  byLevel: Array<{ level: string, sales: number, count: number }>,
  byPayment: Array<{ type: string, sales: number, count: number }>,
  topPerformers: Array<{ userId, name, sales, commission, count, rank }>,
}
```

Server-side aggregation via Prisma `groupBy` + raw SQL for date-bucketing where useful.

## Analytics page sections (in order)

1. Range pills (7d / 30d / 60d)
2. KPI tiles row: Total Sales, Total Commission, Avg Ticket, Active Employees, Active Shows, Sale Count — each with delta vs prior period
3. Revenue trend (line chart, dual-line: sales + commission over time)
4. Two-column: By Level (donut) + By Payment Type (donut)
5. By Show table (sortable)
6. Top Performers (ranked cards)

## Bottom dock tabs (mobile-first)

For EMPLOYEE: Home / Sale / Shows / Leaderboard / More
For MANAGER: Home / Sale / Shows / Analytics / More
For ADMIN: Home / Sale / Shows / Analytics / Admin

Active tab shows gradient pill behind icon + small label. Inactive tabs are icon-only at 60% opacity. Tapping inactive tab → navigates. Tapping active tab → scrolls to top.

The "More" tab opens a glass sheet with secondary actions (Travel, Sign Out, Theme toggle).

## Verification checklist (post-deploy)

1. `curl https://hw888-production.up.railway.app/` → 302 to /dashboard (or /login)
2. Login as admin → /dashboard renders with new glass
3. /analytics loads, charts render, no SSR errors
4. /admin/shows form creates a show (verify via DB row or re-fetch /api/shows)
5. Bottom dock visible at < 768px viewport, 5 tabs render correctly
6. No console errors in browser
7. Build log clean (no TS errors, no warnings)

## Risks

- **Recharts bundle size**: ~90KB gzip — acceptable, page-only load
- **backdrop-filter on Safari**: requires `-webkit-backdrop-filter` prefix
- **Dock safe-area**: must test on iPhone with home indicator; otherwise content hidden
- **Existing dashboards (users/inventory/equipment/grocery)**: refactor to use dock + glass — must not break their existing functionality

## Out of scope (explicit)

- Real-time updates (would need WebSockets)
- Offline analytics (analytics page is online-only)
- Push notifications (already covered in nextjs-pwa skill, separate scope)
- Show editing / deletion UI (form is create-only this round)
