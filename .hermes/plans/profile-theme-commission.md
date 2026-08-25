# HW888 — Theme + Profile + Commission Model + Sturgis Import
**Date:** Aug 25, 2026
**Branch:** main

---

## Clarifications confirmed by user

1. **Commission model** — corrected my misunderstanding:
   - **Employees**: 30% on their own sales only.
   - **Managers**: 30% on their own sales + **additional 3% bonus on the TOTAL TEAM SALES** for every show they attend. If manager + 2 employees bring in $10k total at a show, manager gets $300 bonus on top of their own personal sales commission.

2. **Light theme** — full polish, not just inverted-dark.

3. **Sturgis PDFs** — wait for upload, then build + import + ship in one phase.

---

## Audit findings

- `lib/products.ts:79` hardcodes 30% commission for everyone. `calculateCommission(salePrice)` ignores role entirely.
- Schema has no `CommissionRate` model. Adding it.
- No `/profile` or `/settings` page. Build from scratch.
- CSS currently has dark-mode-as-default + `@media (prefers-color-scheme: dark)` for light fallback. Need a proper token system with explicit theme switching.
- No `/admin/sales` page. Sales only visible via API + dashboard + leaderboard + analytics. Build it.
- Bottom dock has no Profile entry — adds a 5th-6th tab depending on role.

---

## Scope

### Phase 1 — Theme system (no DB change)

**CSS rewrite:**
- Add `[data-theme="light"]` and `[data-theme="dark"]` selectors overriding the `:root` token block
- Add `[data-theme="auto"]` for system preference (default)
- Light theme gets warm-paper palette (off-white bg, dark text, soft shadows, same forest-green + warm-gold accents)
- Glass surface vars get separate light/dark recipes (light = stronger frosted with subtle white tint, dark = current)

**Theme toggle:**
- New `useTheme()` hook reads `localStorage.getItem("hw888-theme")`, sets `document.documentElement.dataset.theme`
- `<ThemeToggle>` component (sun/moon icon button) — placed in SiteShell top bar (desktop) and MobileHeader right slot (mobile)
- Falls back to `prefers-color-scheme` if no localStorage value

### Phase 2 — Commission model + sales calculation rewrite

**New Prisma model:**
```prisma
model CommissionRate {
  id          String   @id @default(cuid())
  userId      String   @unique
  baseRate    Float    @default(0.30)  // 30% on own sales
  managerBonus Float   @default(0.00)  // 3% on team total — only meaningful for managers
  effectiveFrom DateTime @default(now())
  notes       String?
  user        User     @relation(...)

  @@index([userId])
}
```

**New helpers in `lib/commission.ts`:**
- `calculateCommission(salePrice, baseRate)` — replaces hardcoded 30%
- `calculateManagerBonus(teamTotalSales, bonusRate)` — for the 3% team bonus

**`/api/sales` POST rewrite:**
- Lookup user's `CommissionRate.baseRate` (default 0.30 if missing)
- Store `commission` on the Sale row using that rate
- Sales store `commissionRateSnapshot` so historical sales reflect the rate at the time of sale (in case admin overrides later)

**New `/api/sales/team-bonus` route (or compute on demand in `/api/analytics`):**
- For each show the manager attended, compute teamTotalSales and 3% bonus
- Aggregate per manager

### Phase 3 — `/admin/users` gets a commission column + override

- Show user's `baseRate` and `managerBonus` in the list
- "Edit commission" modal: slider/number input for both rates, saves to `CommissionRate`
- Default rates pre-filled: employees 30%/0%, managers 30%/3%

### Phase 4 — `/profile` page (NEW)

**Sections:**
1. **Header** — avatar (gradient initials), name, role badge, email
2. **Theme picker** — three buttons (Auto / Light / Dark) with active state
3. **Personal info** — email (read-only), manager (if employee), team members (if manager)
4. **Live commission card** — large display of total commission earned, with breakdown:
   - "Personal sales commission" (sum of all own sales × 30%)
   - "Manager team bonus" (only if manager) — sum of 3% × total team sales per attended show
5. **Sales stats** — total sales, count, avg ticket, this month, all time
6. **Recent sales** list (last 20)
7. **My attendance** — list of shows assigned with sales + commission per show
8. **Sign out** button at bottom

**API:** `/api/profile/me` returns aggregated stats + commission breakdown.

### Phase 5 — `/admin/sales` page (NEW)

**Replaces the missing admin sales overview:**
- Table with columns: Date · Employee · Show · Level/Model/Style · Amount · Payment · Commission
- Filters: date range (today/7d/30d/all), show, employee, payment type
- **Totals row pinned to bottom** — total sales, total commission, total count, avg ticket. This is the "totals sales column" the user asked for.
- Pagination (50 per page)
- CSV export button

### Phase 6 — Sturgis PDF import

**Workflow:**
1. User uploads PDFs (one or several) via `/admin/import` page or direct file share
2. Server-side parse with `pdf-parse` npm package
3. AI extraction prompt: "Extract every sale row: date, employee name, level, model, style, amount, payment type"
4. Match employee names to existing users (fuzzy match, admin confirms ambiguous ones)
5. Bulk POST to `/api/sales` with proper `showId` (auto-create "Sturgis 2026" show if not exists, manager = whoever was running it)
6. Show import summary: X sales imported, Y skipped, Z ambiguous (need review)

**Schema work:**
- New `/api/import/sturgis` endpoint with multipart upload
- Background processing OR inline (depends on PDF size — these will be small)

---

## Build order

1. Theme system (CSS rewrite + toggle)
2. CommissionRate model + migration + seed for 12 existing users
3. `/api/sales` POST rewrite + `/api/profile/me`
4. `/admin/users` commission edit UI
5. `/profile` page
6. `/admin/sales` page with totals
7. Bottom dock Profile tab
8. (Blocked) Sturgis PDF import — wait for files

---

## Risks

- **Sales already exist**: the one test sale ($400 at Texas) was computed with 30%. When I rewrite the commission calc, the existing sale stays as-is (stored value), but new sales use the new lookup. Document this so it's not surprising.

- **Light theme contrast**: warm-paper bg with green accents needs careful tuning. The current `--color-primary: #2D5A3D` is dark forest — on a near-white bg it should still pass contrast. Will verify visually after build.

- **Manager bonus attribution**: if a manager attends show A but their team ALSO has employees who attended show A, the team bonus includes ALL show A sales (including the manager's own sales). User said "total sales from the show" so this is correct. But should the bonus exclude the manager's own sales to avoid double-counting? Default interpretation: bonus applies to ALL team sales at the show, including manager's own. Flag this for confirmation.

- **PDF format variability**: the Sturgis PDFs could be handwritten scans, typed receipts, spreadsheets printed as PDFs, etc. I'll need to see one to know. Defensive: build a UI for manual review of extracted rows before committing the import.

- **Profile page auth**: every user can see their own commission. Manager can see their team members' commission too. Admin can see all. No privacy leak here since the data is already accessible via other paths.

---

## Open question

**Manager bonus scope** — I want to confirm before I write the calc: does the manager's 3% bonus on team total sales INCLUDE the manager's own sales, or only the employees under them?

Defaulting to: includes all show sales (manager + employees under them). Will note this in the Profile page UI so it's transparent.

---

## What I'll deliver THIS round (once you sign off)

If you say "go" now, I'll build Phases 1-5 + bottom dock update + ship to live. Sturgis import is blocked until you upload PDFs.

Files affected (estimate):
- `app/globals.css` — major rewrite for theme tokens
- `app/components/SiteShell.tsx` — add ThemeToggle
- `app/components/MobileHeader.tsx` — add ThemeToggle slot
- `app/components/ThemeToggle.tsx` — NEW
- `app/lib/commission.ts` — NEW (replaces lib/products.ts calculateCommission)
- `app/api/sales/route.ts` — rewrite for dynamic commission
- `app/api/profile/me/route.ts` — NEW
- `app/api/commission/[userId]/route.ts` — NEW (admin override)
- `app/profile/page.tsx` — NEW
- `app/admin/users/page.tsx` — add commission column + edit
- `app/admin/sales/page.tsx` — NEW
- `app/admin/import/page.tsx` — NEW (Sturgis upload, deferred to Phase 7)
- `prisma/schema.prisma` — add CommissionRate model
- `prisma/seed.ts` — add CommissionRate seed
- `app/components/BottomDock.tsx` — add Profile tab
- `app/components/TopNav.tsx` — add Profile link
- Migration script for existing 12 users' CommissionRate records

Approx ~15 files, ~1200 lines.
