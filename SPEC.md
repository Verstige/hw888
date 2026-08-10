# HW888 — Holistic World Sales Platform
## Specification Document

---

## 1. Concept & Vision

HW888 is an all-in-one field sales and operations platform for Holistic World (holisticworldus.com). It powers employees at trade shows — recording sales in real-time, tracking commissions, managing travel logistics, and keeping inventory in sync. The experience is clean, fast, and works offline-first since trade shows often have spotty WiFi.

**Feel:** Professional but warm — earthy tones, clear hierarchy, minimal friction. Admin has full visibility; employees have exactly what they need and nothing they don't.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | TailwindCSS |
| Database | PostgreSQL on Railway + Prisma ORM |
| Auth | NextAuth.js (credentials + magic link) |
| PWA | next-pwa (service worker, IndexedDB for offline) |
| State | React Context + SWR for data fetching |
| Deployment | Railway |

---

## 3. Roles & Permissions

| Role | Description |
|---|---|
| **Admin** | Full platform access — all users, all shows, all reports, all inventory, travel/logistics |
| **Manager** | Own team view — assigned employees at assigned shows, team sales, team inventory, team travel |
| **Employee** | Own view — assigned shows, personal sales, personal commission, personal travel/itinerary, check-in |

---

## 4. Product Catalog

### Pricing
| Level | Retail Price | Commission (30%) |
|---|---|---|
| 1X | $200 | $60 |
| 2X | $300 | $90 |
| 3X | $400 | $120 |
| 6X | $600 | $180 |

### Models by Level
| Level | Models |
|---|---|
| 1X | Rolex, Classic Small, Classic Large, XOXO, Butterfly |
| 2X | Classic |
| 3X | Classic Large, Classic Slim |
| 6X | Classic Large, Classic Slim |

### Styles (all levels/models)
Black, Silver, Gold, Copper, Silver/Gold, Rose Gold/Silver, Black/Silver

### Inventory SKUs (from holisticworldus.com)
**Men's Bracelets**
- Thick Design 6X — Black, Silver, Silver Gold, Silver Black, Gold, Black Gold
- Thick Design 3X — Black, Silver, Silver Gold, Black Gold, Silver Black, Gold, Copper
- Plain Color 2X — Black Matte, Silver Shine, Gold

**Women's Bracelets**
- XoXo Ladies — Gold Silver, Rose Gold/Silver, Gold, Silver, Black, Rose Gold
- Ladies Single — Silver, Black Gold, Silver Gold, Black, Gold, Silver Rose Gold
- Butterfly — Silver Rose Gold, Silver, Silver Gold

---

## 5. Data Model

### User
```
id, name, email, passwordHash, role (ADMIN|MANAGER|EMPLOYEE), managerId?, createdAt
```

### Show
```
id, name, location, address, startDate, endDate, isOutdoor, status, managerId, createdAt
```

### ShowAssignment
```
id, showId, userId, assignedAt
```

### CashDrawer
```
id, showId, openingFloat, totalCash, totalCard, closingBalance, openedAt, closedAt
```

### Sale
```
id, showId, userId, productLevel (1X|2X|3X|6X),
productModel, productStyle, salePrice, paymentType (CASH|CARD),
commission, syncedAt, createdAt
```

### InventoryItem
```
id, managerId, productLevel, productModel, productStyle, quantity, lowStockThreshold, updatedAt
```

### TravelTrip
```
id, userId, showId, type (FLIGHT|CAR|HOTEL|AIRBNB), status, createdAt
```

### TravelDetail (polymorphic or linked)
```
id, tripId, airline?, flightNumber?, departureCity?, arrivalCity?,
departureTime?, arrivalTime?, confirmationNumber?,
carCompany?, pickupLocation?, dropoffLocation?, pickupDate?, dropoffDate?,
propertyName?, address?, checkIn?, checkOut?
```

### EquipmentTask
```
id, showId, task (TABLES|CHAIRS|TENT|TENT_WEIGHTS|EXTENSION_CORD|DISPLAY), status (PENDING|COMPLETED), completedBy?, completedAt?
```

### GroceryItem
```
id, showId, item, quantity, estimatedCost?, purchased, purchasedBy?, purchasedAt?
```

---

## 6. Feature Phases

### Phase 1 — Foundation (this session)
- [x] Project scaffold (Next.js + Prisma + Tailwind)
- [x] Database schema (all models)
- [x] Auth (NextAuth — credentials)
- [x] Employee: POS sale screen (Level → Model → Style → Cash/Card → Save)
- [x] Real-time commission calculation (30%)
- [x] PWA offline-first (IndexedDB queue → sync on reconnect)

### Phase 2 — Admin + Shows + Calendar
- [ ] Admin dashboard (overview stats)
- [ ] User management (create/edit/deactivate users)
- [ ] Show creation + calendar view
- [ ] Assign employees to shows
- [ ] Cash drawer open/close per show
- [ ] Manager role — team view

### Phase 3 — Inventory Tracker
- [ ] Manager inventory screen (per manager)
- [ ] Admin: all managers' inventory
- [ ] Low-stock alerts
- [ ] Inventory adjustment log

### Phase 4 — Equipment + Grocery
- [ ] Auto-generate equipment checklist on show creation (tables/chairs always; tent+weights if outdoor)
- [ ] Mark equipment complete
- [ ] Grocery list per show
- [ ] Assign shopper / mark purchased

### Phase 5 — Travel + Logistics
- [ ] Flight, car rental, Airbnb/hotel entry
- [ ] Employee visual timeline (travel → show → travel → home)
- [ ] Admin/manager: full team travel view

### Phase 6 — Leaderboard + Reports
- [ ] Live leaderboard (Today, 3D, 7D, 14D, 30D, 60D)
- [ ] Admin: all employees leaderboard
- [ ] CSV/PDF export
- [ ] Email reports (scheduled)

---

## 7. Offline Strategy

- Service worker caches app shell + all static assets
- IndexedDB stores: pending sales, pending syncs
- On reconnect: auto-sync queue to server, conflict resolution (server wins, log discrepancies)
- Offline indicator in UI — clear "offline mode" badge

---

## 8. API Design

### Auth
- `POST /api/auth/signin` — credentials login
- `POST /api/auth/signout` — sign out
- `GET /api/auth/session` — current session

### Users (Admin only)
- `GET /api/users` — list all users
- `POST /api/users` — create user
- `PATCH /api/users/:id` — update user
- `DELETE /api/users/:id` — deactivate user

### Shows
- `GET /api/shows` — list shows (filtered by role)
- `POST /api/shows` — create show (Admin)
- `GET /api/shows/:id` — show detail
- `PATCH /api/shows/:id` — update show
- `POST /api/shows/:id/assign` — assign employees
- `GET /api/shows/:id/calendar` — calendar view data

### Sales
- `POST /api/sales` — record sale (also handles offline queue sync)
- `GET /api/sales` — list sales (filtered by user/show/date range)
- `GET /api/sales/me` — current user's sales

### Inventory
- `GET /api/inventory` — manager's inventory (or all for admin)
- `PATCH /api/inventory/:id` — update quantity
- `GET /api/inventory/low-stock` — low stock items

### Cash Drawer
- `POST /api/drawer/open` — open drawer for show
- `POST /api/drawer/close` — close drawer, record totals
- `GET /api/drawer/:showId` — current drawer status

### Travel
- `GET /api/travel` — user's trips (or team/all)
- `POST /api/travel` — create trip leg
- `PATCH /api/travel/:id` — update trip leg

### Equipment
- `GET /api/equipment/:showId` — equipment tasks for show
- `PATCH /api/equipment/:id` — mark complete

### Grocery
- `GET /api/grocery/:showId` — grocery list for show
- `POST /api/grocery` — add item
- `PATCH /api/grocery/:id` — mark purchased

### Leaderboard
- `GET /api/leaderboard?range=7d` — leaderboard for date range

---

## 9. UI/UX Direction

**Color Palette:** Earthy + professional
- Primary: Deep forest green (`#2D5A3D`) — matches holistic/wellness brand
- Secondary: Warm gold (`#C9A84C`) — luxury, matches product gold tones
- Background: Off-white / warm gray
- Text: Dark charcoal
- Accent: Terracotta for alerts/warnings

**Typography:** Clean sans-serif (Inter or similar)

**Layout:**
- Admin: Sidebar nav + main content area
- Employee: Bottom nav (Sale, Shows, Stats, Profile)
- Mobile-first responsive design

**Key Screens:**
1. Login
2. Employee POS (Level → Model → Style → Pay → Done)
3. My Stats (commission earned, sales count, leaderboard position)
4. Show Check-In (open drawer, see assigned show)
5. Admin Dashboard (stats overview)
6. Show Calendar (calendar view of all shows)
7. User Management (table with create/edit)
8. Inventory (table per manager)
9. Travel Timeline (visual timeline per employee)
10. Equipment + Grocery (checklists)
11. Leaderboard

---

*Last updated: Session start*
