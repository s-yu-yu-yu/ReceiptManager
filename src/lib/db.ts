import Dexie, { type Table } from "dexie";
import {
  type Receipt,
  type ReceiptItem,
  type Category,
  type MonthlyBudget,
  type Settings,
} from "@/types/index.js";

export class ReceiptDatabase extends Dexie {
  receipts!: Table<Receipt>;
  receiptItems!: Table<ReceiptItem>;
  categories!: Table<Category>;
  monthlyBudgets!: Table<MonthlyBudget>;
  settings!: Table<Settings>;

  constructor() {
    super("ReceiptDatabase");

    this.version(1).stores({
      receipts: "id, date, storeName, totalAmount, createdAt",
      receiptItems: "++id, receiptId, name, category",
      categories: "++id, name, order",
      monthlyBudgets: "++id, yearMonth, categoryId",
      settings: "++id, key",
    });
  }
}

export const db = new ReceiptDatabase();

// 初期カテゴリデータの投入
export async function initializeDatabase() {
  const count = await db.categories.count();
  if (count === 0) {
    // デフォルトカテゴリを追加
    await db.categories.bulkAdd([
      { name: "食費", icon: "🍽️", color: "#FF6B6B", order: 1 },
      { name: "日用品", icon: "🧴", color: "#4ECDC4", order: 2 },
      { name: "交通費", icon: "🚃", color: "#45B7D1", order: 3 },
      { name: "外食", icon: "🍴", color: "#F7DC6F", order: 4 },
      { name: "娯楽", icon: "🎮", color: "#BB8FCE", order: 5 },
      { name: "医療費", icon: "🏥", color: "#85C1E2", order: 6 },
      { name: "衣服", icon: "👕", color: "#F8B739", order: 7 },
      { name: "その他", icon: "📦", color: "#95A5A6", order: 8 },
    ]);
  }
}
