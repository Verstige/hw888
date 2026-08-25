# HW888 — Sales Recording Fix + Per-Show Analytics + Date-Range Blackouts + Admin Time-Off
**Date:** Aug 25, 2026
**Branch:** main

---

## Problem statement

Julylan is reporting three things to fix:

1. **"No active cash drawer" block on `/sale`** — can't record sales. Root cause: the shows list only shows the "Open cash drawer" button when `show.status === "ACTIVE"`. The 8 newly-added shows are all `UPCOMING`. No UI to mark a show active.

2. **No per-show analytics** — wants each employee's performance visible per show, and admin wants a full cross-show, cross-manager view.

3. **Date-range blackouts + admin-grantable time off** — employees can submit "I'm unavailable Aug 30 – Sep 2", admins can grant time off (PTO). Both flow into everyone's calendar.

---

## Plan (six phases, each independently shippable)

### Phase 1 — Sales recording fix (THIS ROUND)

Currently you can't open a drawer on an UPCOMING show, so you can't record sales. Two surgical changes:

- **`/admin/shows` page**: add a status dropdown to the edit form (currently the form has every field but status is display-only).
- **`/shows` list page**: remove the `status === "ACTIVE"` gate on the drawer button — show "Open cash drawer" for any UPCOMING or ACTIVE show. (COMPLETED shows get no drawer button, that's correct.)

Result: Julylan can open a drawer on Oregon State Fair right now, even though it's still UPCOMING. POS works.

### Phase 2 — Per-show analytics

- **`/shows/[id]`** new detail page (admin/manager only, or assigned employees too): show overview with KPIs (total sales, commission, sale count, avg ticket), assigned team with per-employee breakdown (sales / commission / count), recent sales.
- **`/analytics` page**: add a "By show" section that already exists + add a "By manager" section (sales under each manager's roster).
- **`/analytics` KPIs**: add a "By manager" filter so admin can drill down to one manager's performance.
- **`/api/analytics`**: extend the response with `byManager` array.

### Phase 3 — Per-employee show performance (employee-facing)

- **`/shows/[id]` for assigned employees**: read-only view of their own sales at that show vs the rest of the team.
- **`/dashboard`**: change "Recent sales" to optionally filter by active show (already grouped by user; just add a context indicator showing which show the recent sale was at).

### Phase 4 — Date-range blackouts (UserAvailability model)

**New Prisma model:**
```prisma
model UserAvailability {
  id          String   @id @default(cuid())
  userId      String
  startDate   DateTime
  endDate     DateTime
  reason      String?  // "PTO", "Doctor appt", "Family" — user-provided
  status      String   @default("PENDING") // PENDING | APPROVED | REJECTED
  approvedBy  String?
  approvedAt  DateTime?
  createdAt   DateTime @default(now())

  user       User  @relation(...)
  approver   User? @relation(...)

  @@index([userId])
  @@index([startDate, endDate])
}
```

**New API endpoints:**
- `POST /api/availability` — employee submits blackout
- `GET /api/availability` — list (admin sees all, employee sees own, manager sees their team)
- `PATCH /api/availability/[id]` — admin/manager approves or rejects
- `DELETE /api/availability/[id]` — user cancels their own

**Calendar integration:** `/shows/calendar` overlay adds availability windows as semi-transparent red bands on the show grid (per employee), or filter view "My unavailability" toggle.

**Sale page impact:** if logged-in employee has an APPROVED blackout for today, POS shows a "You're off today" banner (informational, doesn't block — sometimes last-minute emergencies override).

### Phase 5 — Admin-grantable time off (separate from blackouts)

Two interpretations, want to confirm:

**Option A — Reuse UserAvailability model**: admin creates an entry for any user with status=APPROVED directly, no employee submission step needed. Single model, two create paths (self-submit vs admin-grant).

**Option B — Separate `TimeOff` model**: cleaner separation (PTO vs personal blackout), admin can allocate annual balance per user.

**My recommendation: Option A**. Single model, simpler schema, fewer migrations. The `requestedById` field on UserAvailability distinguishes "I asked" vs "manager gave it to me".

**UI:**
- Admin can create blackouts on behalf of anyone from the user's profile or from the calendar.
- Manager can grant blackouts on behalf of their team (when we have a manager view).

### Phase 6 — Calendar "off" view

Add a toggle on `/shows/calendar`:
- **Shows** (default) — what we have now
- **My time off** — show user's own blackouts + approved time off
- **Team time off** — show everyone's blackouts (admin/manager only)

Each toggle changes the bars on the grid. Off windows render as diagonal-stripe or muted-color bands, clearly distinct from show bars.

---

## Phasing reasoning

Phases 1-3 are the actual sales + analytics blocker you reported. Phases 4-6 are the blackout + time-off work. Each phase is shippable on its own — if you want to ship Phase 1 first and test, then come back for the rest, that works.

I'll need **one decision from you** before starting Phase 4/5:

### Decision needed: Option A vs Option B for time-off model

(A) Reuse UserAvailability with `requestedById` (employee vs admin) — simpler, one model, faster.
(B) Separate TimeOff model — cleaner, but two parallel models to maintain.

I recommend A. Pick your preference, then I build.

---

## Risks

- **Sale page refactor**: the current `/sale` page hard-codes fetching from `/api/drawer?showId=active` which returns the FIRST open drawer. With multiple drawers open across shows, employees need to pick which show they're recording for. Refactor `/sale` to show "Pick a show" if multiple are open, otherwise default to the only open one.

- **Status transitions**: who can mark a show ACTIVE? Auto? Manual? My take: keep it manual, admin/manager-only, surface on the `/shows` list with a "Mark Active" button. Auto-transitioning by date is dangerous (timezone issues, multi-day shows).

- **Offline sale queue**: the existing `/lib/offline.ts` queues offline sales without a show context. They already include `showId`, so they're fine. Just need to make sure the offline indicator on `/sale` shows which show.

- **Calendar perf with many users**: the calendar overlay pulls unavailability for every active employee. With 12 users it's nothing. Won't matter until 100+.

## Out of scope

- Push notifications for time-off approvals
- Calendar export (iCal feed)
- Bulk availability import
- Manager-side performance dashboard (only admin sees full cross-manager view this round)

---

## What I'll deliver this round (assuming you want Phase 1+2+3 first)

1. `/admin/shows` edit form gets a status field
2. `/shows` list: drawer button works for UPCOMING + ACTIVE
3. `/shows/[id]` new detail page with per-employee breakdown
4. `/analytics` extended with byManager section + filter
5. Build, push, deploy, verify live

Then you test the sales workflow. If it works, I move on to Phase 4 (blackouts) with your Option A/B decision.
