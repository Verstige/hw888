// IndexedDB utilities for offline-first PWA
import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "hw888-offline";
const DB_VERSION = 1;

export interface PendingSale {
  id: string;
  showId: string;
  userId: string;
  productLevel: string;
  productModel: string;
  productStyle: string;
  salePrice: number;
  paymentType: "CASH" | "CARD";
  commission: number;
  createdAt: string;
  synced: boolean;
}

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Pending sales queue
      if (!db.objectStoreNames.contains("pendingSales")) {
        const store = db.createObjectStore("pendingSales", { keyPath: "id" });
        store.createIndex("synced", "synced");
        store.createIndex("createdAt", "createdAt");
      }
    },
  });
}

export async function queueSale(sale: PendingSale): Promise<void> {
  const db = await getDB();
  await db.put("pendingSales", sale);
}

export async function getPendingSales(): Promise<PendingSale[]> {
  const db = await getDB();
  const tx = db.transaction("pendingSales", "readonly");
  const index = tx.store.index("synced");
  const range = IDBKeyRange.only(0); // 0 = false (not synced)
  return index.getAll(range);
}

export async function markSaleSynced(id: string): Promise<void> {
  const db = await getDB();
  const sale = await db.get("pendingSales", id);
  if (sale) {
    sale.synced = true;
    await db.put("pendingSales", sale);
  }
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  const tx = db.transaction("pendingSales", "readonly");
  const index = tx.store.index("synced");
  return await index.count(IDBKeyRange.only(false));
}

export async function clearSyncedSales(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("pendingSales", "readwrite");
  const index = tx.store.index("synced");
  const keys = await index.getAllKeys(IDBKeyRange.only(true));
  await Promise.all(keys.map((k) => tx.store.delete(k)));
}
