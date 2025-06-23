import { db } from "./db";
import { type Category } from "@/types";

// デフォルトカテゴリ定義（db.tsと同期）
export const DEFAULT_CATEGORIES = [
  { name: "食費", icon: "🍽️", color: "#FF6B6B", order: 1 },
  { name: "日用品", icon: "🧴", color: "#4ECDC4", order: 2 },
  { name: "交通費", icon: "🚃", color: "#45B7D1", order: 3 },
  { name: "外食", icon: "🍴", color: "#F7DC6F", order: 4 },
  { name: "娯楽", icon: "🎮", color: "#BB8FCE", order: 5 },
  { name: "医療費", icon: "🏥", color: "#85C1E2", order: 6 },
  { name: "衣服", icon: "👕", color: "#F8B739", order: 7 },
  { name: "その他", icon: "📦", color: "#95A5A6", order: 8 },
] as const;

// カテゴリ名のリストを取得
export function getCategoryNames(): string[] {
  return DEFAULT_CATEGORIES.map(cat => cat.name);
}

// カテゴリ一覧をデータベースから取得
export async function getCategories(): Promise<Category[]> {
  try {
    return await db.categories.orderBy('order').toArray();
  } catch (error) {
    console.error('Error fetching categories:', error);
    // フォールバック: デフォルトカテゴリを返す
    return DEFAULT_CATEGORIES.map((cat, index) => ({ ...cat, id: index + 1 }));
  }
}

// カテゴリ名からカテゴリ情報を取得
export function getCategoryByName(name: string): typeof DEFAULT_CATEGORIES[number] | undefined {
  return DEFAULT_CATEGORIES.find(cat => cat.name === name);
}