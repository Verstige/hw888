# HW888 — Holistic World Sales Platform

> All-in-one field sales & operations platform for Holistic World trade shows.

---

## Features

- **💰 Point of Sale** — Level → Model → Style → Cash/Card → Done. Real-time commission calc (30%).
- **📊 Live Leaderboard** — Today, 3D, 7D, 14D, 30D, 60D windows.
- **📅 Show Calendar** — Admin creates shows, assigns employees, tracks cash drawers.
- **🛫 Travel + Logistics** — Flights, car rentals, Airbnb — employee visual timeline.
- **📦 Inventory Tracker** — Per-manager stock levels, low-stock alerts.
- **🔧 Equipment Checklist** — Tables, chairs, tent + weights (auto-generated for outdoor shows).
- **🥗 Grocery List** — Cost-effective meal planning per show.
- **📱 PWA / Offline-First** — Sales queue in IndexedDB, syncs on reconnect.
- **🔐 Role-Based Access** — Admin / Manager / Employee.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | TailwindCSS |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (credentials) |
| PWA | IndexedDB (offline queue) |
| Hosting | Railway |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET
```

### 3. Run migrations

```bash
npx prisma migrate dev --name init
```

### 4. Seed the database

```bash
npx prisma db seed
```

### 5. Run dev server

```bash
npm run dev
```

---

## Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@holisticworldus.com | admin888 |
| Manager | manager@holisticworldus.com | manager888 |
| Employee | employee@holisticworldus.com | employee888 |

---

## Deploy to Railway

1. Push to GitHub
2. Connect repo to [Railway](https://railway.app)
3. Add environment variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
4. Railway auto-detects Next.js and deploys

---

## Product Catalog

| Level | Retail | Commission |
|---|---|---|
| 1X | $200 | $60 |
| 2X | $300 | $90 |
| 3X | $400 | $120 |
| 6X | $600 | $180 |

Models: Rolex, Classic Small, Classic Large, XOXO, Butterfly, Classic Large, Classic Slim
Styles: Black, Silver, Gold, Copper, Silver/Gold, Rose Gold/Silver, Black/Silver

---

## Project Structure

```
app/
  api/
    auth/          — NextAuth endpoints
    sales/         — Record + list sales
    shows/         — CRUD + assignments
    drawer/        — Cash drawer open/close
    inventory/     — Stock management
    leaderboard/   — Rankings
    travel/        — Trip logistics
    equipment/     — Equipment tasks
    grocery/       — Grocery lists
    users/         — User management
  dashboard/       — Main employee dashboard
  sale/            — POS screen
  shows/           — Show list + check-in
  leaderboard/     — Rankings page
  travel/          — Employee travel view
  admin/
    users/         — User management
    inventory/     — Inventory tracker
    equipment/     — Equipment checklist
    grocery/       — Grocery list
  login/           — Auth page
lib/
  prisma.ts        — Prisma client singleton
  products.ts      — Product constants + pricing
  offline.ts       — IndexedDB utilities
prisma/
  schema.prisma    — Full data model
  seed.ts          — Sample data
```
