import { db } from "./db";
import { type Receipt, type ReceiptItem } from "@/types/index.js";

// レシート作成
export async function createReceipt(
  receiptData: Omit<Receipt, "id" | "createdAt" | "updatedAt">,
  items: Omit<ReceiptItem, "id" | "receiptId">[]
) {
  return await db.transaction("rw", db.receipts, db.receiptItems, async () => {
    const now = new Date();
    const receiptId = await db.receipts.add({
      ...receiptData,
      createdAt: now,
      updatedAt: now,
    });

    const itemsWithReceiptId = items.map((item) => ({
      ...item,
      receiptId,
    }));

    await db.receiptItems.bulkAdd(itemsWithReceiptId);

    return receiptId;
  });
}

// 月別レシート取得
export async function getReceiptsByMonth(yearMonth: string) {
  const startDate = `${yearMonth}-01`;
  const nextMonth = new Date(startDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const endDate = nextMonth.toISOString().split("T")[0];

  return await db.receipts
    .where("date")
    .between(startDate, endDate, true, false)
    .toArray();
}

// 日別レシート取得
export async function getReceiptsByDate(date: string) {
  return await db.receipts.where("date").equals(date).toArray();
}

// 月別合計金額取得
export async function getMonthlyTotal(yearMonth: string) {
  const receipts = await getReceiptsByMonth(yearMonth);
  return receipts.reduce((total, receipt) => total + receipt.amount, 0);
}

// 日別合計金額取得
export async function getDailyTotal(date: string) {
  const receipts = await getReceiptsByDate(date);
  return receipts.reduce((total, receipt) => total + receipt.amount, 0);
}

// カテゴリ別月間集計
export async function getMonthlyCategoryTotals(yearMonth: string) {
  const receipts = await getReceiptsByMonth(yearMonth);
  const categoryTotals = new Map<string, number>();

  receipts.forEach((receipt) => {
    const current = categoryTotals.get(receipt.category) || 0;
    categoryTotals.set(receipt.category, current + receipt.amount);
  });

  return Array.from(categoryTotals.entries()).map(([category, amount]) => ({
    category,
    amount,
  }));
}

// 最近のレシート取得
export async function getRecentReceipts(limit: number = 10) {
  return await db.receipts.orderBy("date").reverse().limit(limit).toArray();
}

// レシート削除
export async function deleteReceipt(receiptId: number) {
  return await db.transaction("rw", db.receipts, db.receiptItems, async () => {
    await db.receiptItems.where("receiptId").equals(receiptId).delete();
    await db.receipts.delete(receiptId);
  });
}
