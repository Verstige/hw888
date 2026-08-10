/**
 * HW888 Database Seed Script
 * Run: npx prisma db seed
 * Add to package.json: "prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }
 */

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding HW888 database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin888", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@holisticworldus.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@holisticworldus.com",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin created: ${admin.email} (password: admin888)`);

  // Create sample manager
  const managerPassword = await bcrypt.hash("manager888", 12);
  const manager = await prisma.user.upsert({
    where: { email: "manager@holisticworldus.com" },
    update: {},
    create: {
      name: "Sarah Manager",
      email: "manager@holisticworldus.com",
      passwordHash: managerPassword,
      role: "MANAGER",
    },
  });
  console.log(`✅ Manager created: ${manager.email} (password: manager888)`);

  // Create sample employee
  const empPassword = await bcrypt.hash("employee888", 12);
  const emp = await prisma.user.upsert({
    where: { email: "employee@holisticworldus.com" },
    update: {},
    create: {
      name: "John Employee",
      email: "employee@holisticworldus.com",
      passwordHash: empPassword,
      role: "EMPLOYEE",
      managerId: manager.id,
    },
  });
  console.log(`✅ Employee created: ${emp.email} (password: employee888)`);

  // Create sample show
  const show = await prisma.show.upsert({
    where: { id: "sample-show-001" },
    update: {},
    create: {
      id: "sample-show-001",
      name: "Austin Trade Show",
      location: "Austin Convention Center, TX",
      address: "500 E Cesar Chavez St, Austin, TX 78701",
      startDate: new Date("2026-08-15"),
      endDate: new Date("2026-08-17"),
      isOutdoor: false,
      status: "UPCOMING",
      managerId: manager.id,
    },
  });
  console.log(`✅ Sample show created: ${show.name}`);

  // Assign employees to show
  await prisma.showAssignment.upsert({
    where: { showId_userId: { showId: show.id, userId: emp.id } },
    update: {},
    create: { showId: show.id, userId: emp.id },
  });
  await prisma.showAssignment.upsert({
    where: { showId_userId: { showId: show.id, userId: manager.id } },
    update: {},
    create: { showId: show.id, userId: manager.id },
  });
  console.log(`✅ Employees assigned to show`);

  // Create sample inventory for manager
  const styles = ["Black", "Silver", "Gold", "Copper", "Silver/Gold", "Rose Gold/Silver", "Black/Silver"] as const;
  const levels: Array<{ level: "LEVEL_1X" | "LEVEL_2X" | "LEVEL_3X" | "LEVEL_6X"; models: string[] }> = [
    { level: "LEVEL_1X", models: ["Rolex", "Classic Small", "Classic Large", "XOXO", "Butterfly"] },
    { level: "LEVEL_2X", models: ["Classic"] },
    { level: "LEVEL_3X", models: ["Classic Large", "Classic Slim"] },
    { level: "LEVEL_6X", models: ["Classic Large", "Classic Slim"] },
  ];

  for (const { level, models } of levels) {
    for (const model of models) {
      for (const style of styles) {
        await prisma.inventoryItem.upsert({
          where: {
            managerId_productLevel_productModel_productStyle: {
              managerId: manager.id,
              productLevel: level,
              productModel: model,
              productStyle: style,
            },
          },
          update: {},
          create: {
            managerId: manager.id,
            productLevel: level,
            productModel: model,
            productStyle: style,
            quantity: Math.floor(Math.random() * 20) + 1,
            lowStockThreshold: 5,
          },
        });
      }
    }
  }
  console.log(`✅ Inventory seeded for ${manager.name}`);

  // Create equipment tasks for sample show
  const tasks: Array<{ showId: string; taskType: "TABLES" | "CHAIRS" | "TENT" | "TENT_WEIGHTS" }> = [
    { showId: show.id, taskType: "TABLES" },
    { showId: show.id, taskType: "CHAIRS" },
    { showId: show.id, taskType: "TENT" },
    { showId: show.id, taskType: "TENT_WEIGHTS" },
  ];
  const activeTasks = show.isOutdoor ? tasks : tasks.filter((t) => t.taskType === "TABLES" || t.taskType === "CHAIRS");
  for (const task of activeTasks) {
    await prisma.equipmentTask.upsert({
      where: { id: `seed-${task.taskType}-${show.id}` },
      update: {},
      create: { id: `seed-${task.taskType}-${show.id}`, ...task },
    });
  }
  console.log(`✅ Equipment tasks created for ${show.name}`);

  // Create sample grocery items
  const groceryItems = [
    { item: "Chicken breast (5 lbs)", quantity: "5 lbs", estimatedCost: 25 },
    { item: "Brown rice (big bag)", quantity: "1 bag", estimatedCost: 8 },
    { item: "Mixed vegetables", quantity: "3 bags", estimatedCost: 12 },
    { item: "Eggs (dozen)", quantity: "2 dozen", estimatedCost: 8 },
    { item: "Oatmeal", quantity: "1 large container", estimatedCost: 6 },
    { item: "Almond butter", quantity: "1 jar", estimatedCost: 10 },
    { item: "Bananas", quantity: "2 bunches", estimatedCost: 4 },
    { item: "Protein bars", quantity: "1 box", estimatedCost: 15 },
  ];

  for (const gi of groceryItems) {
    await prisma.groceryItem.create({
      data: {
        showId: show.id,
        addedById: manager.id,
        item: gi.item,
        quantity: gi.quantity,
        estimatedCost: gi.estimatedCost,
      },
    });
  }
  console.log(`✅ Grocery list created for ${show.name}`);

  console.log("\n🎉 Seed complete!");
  console.log("\n📋 Login credentials:");
  console.log("  Admin:    admin@holisticworldus.com / admin888");
  console.log("  Manager:  manager@holisticworldus.com / manager888");
  console.log("  Employee: employee@holisticworldus.com / employee888");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
