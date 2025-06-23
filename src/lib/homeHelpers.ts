import { db } from "./db";
import { type Receipt } from "@/types";

/**
 * 月間合計金額を取得
 */
export async function getMonthlyTotal(
  year: number,
  month: number
): Promise<number> {
  const startDate = new Date(year, month - 1, 1); // 月の最初の日
  const endDate = new Date(year, month, 0, 23, 59, 59); // 月の最後の日

  try {
    const receipts = await db.receipts
      .where("date")
      .between(startDate, endDate, true, true)
      .toArray();

    return receipts.reduce((total, receipt) => total + receipt.totalAmount, 0);
  } catch (error) {
    console.error("Error fetching monthly total:", error);
    return 0;
  }
}

/**
 * 日間合計金額を取得
 */
export async function getDailyTotal(date: Date): Promise<number> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const receipts = await db.receipts
      .where("date")
      .between(startOfDay, endOfDay, true, true)
      .toArray();

    return receipts.reduce((total, receipt) => total + receipt.totalAmount, 0);
  } catch (error) {
    console.error("Error fetching daily total:", error);
    return 0;
  }
}

/**
 * 最近のレシートを取得（指定件数）
 */
export async function getRecentReceipts(limit: number = 3): Promise<Receipt[]> {
  try {
    const receipts = await db.receipts
      .orderBy("createdAt")
      .reverse()
      .limit(limit)
      .toArray();

    return receipts;
  } catch (error) {
    console.error("Error fetching recent receipts:", error);
    return [];
  }
}


/**
 * 月表示用の文字列を取得
 */
export function getCurrentMonthString(): string {
  return new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
  });
}

/**
 * 日付を表示用にフォーマット
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
}

/**
 * レシートの主要カテゴリを取得（最大3つ）
 */
export function getMainCategories(receipt: Receipt): string[] {
  const categoryCount = new Map<string, number>();

  receipt.items.forEach((item) => {
    if (item.category) {
      const count = categoryCount.get(item.category) || 0;
      categoryCount.set(item.category, count + 1);
    }
  });

  return Array.from(categoryCount.entries())
    .sort((a, b) => b[1] - a[1]) // 出現回数でソート
    .slice(0, 3) // 上位3つ
    .map(([category]) => category);
}
