import { Client } from "@notionhq/client";
import type { Receipt, ReceiptItem } from "@/types";

// Notion APIクライアントの初期化
export const getNotionClient = () => {
  const apiKey = import.meta.env.VITE_NOTION_API_KEY;
  if (!apiKey || apiKey === "your_notion_api_key_here") {
    throw new Error("Notion APIキーが設定されていません");
  }
  return new Client({ auth: apiKey });
};

// データベースIDの取得
export const getReceiptsDatabaseId = () => {
  const dbId = import.meta.env.VITE_NOTION_RECEIPTS_DATABASE_ID;
  if (!dbId || dbId === "your_receipts_database_id_here") {
    throw new Error("NotionレシートデータベースIDが設定されていません");
  }
  return dbId;
};

// Notionページプロパティの型定義（型アサーションで使用）

// レシートをNotionに同期
export const syncReceiptToNotion = async (
  receipt: Receipt
): Promise<string> => {
  try {
    const notion = getNotionClient();
    const databaseId = getReceiptsDatabaseId();

    // レシートページの作成
    const receiptPage = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        店舗名: {
          title: [
            {
              text: {
                content: receipt.storeName || "不明な店舗",
              },
            },
          ],
        },
        日付: {
          date: {
            start: receipt.date.toISOString().split("T")[0],
          },
        },
        合計金額: {
          number: receipt.totalAmount,
        },
        レシートID: {
          rich_text: [
            {
              text: {
                content: receipt.id?.toString() || "",
              },
            },
          ],
        },
        作成日時: {
          date: {
            start: receipt.createdAt.toISOString(),
          },
        },
        更新日時: {
          date: {
            start: receipt.updatedAt.toISOString(),
          },
        },
      },
    });

    return receiptPage.id;
  } catch (error) {
    console.error("Notionへのレシート同期エラー:", error);
    throw error;
  }
};

// 商品アイテムをNotionに同期
export const syncItemsToNotion = async (
  items: ReceiptItem[],
  receiptPageId: string,
  itemsDatabaseId: string
): Promise<void> => {
  try {
    const notion = getNotionClient();

    // 各商品アイテムをNotionに作成
    const promises = items.map((item) =>
      notion.pages.create({
        parent: { database_id: itemsDatabaseId },
        properties: {
          商品名: {
            title: [
              {
                text: {
                  content: item.name,
                },
              },
            ],
          },
          数量: {
            number: item.quantity,
          },
          単価: {
            number: item.unitPrice,
          },
          合計: {
            number: item.totalPrice,
          },
          カテゴリ: {
            select: {
              name: item.category || "その他",
            },
          },
          レシート: {
            relation: [
              {
                id: receiptPageId,
              },
            ],
          },
        },
      })
    );

    await Promise.all(promises);
  } catch (error) {
    console.error("Notionへの商品アイテム同期エラー:", error);
    throw error;
  }
};

// Notion連携が有効かチェック
export const isNotionEnabled = (): boolean => {
  try {
    const apiKey = import.meta.env.VITE_NOTION_API_KEY;
    const dbId = import.meta.env.VITE_NOTION_RECEIPTS_DATABASE_ID;
    return (
      apiKey &&
      apiKey !== "your_notion_api_key_here" &&
      dbId &&
      dbId !== "your_receipts_database_id_here"
    );
  } catch {
    return false;
  }
};

// 接続テスト
export const testNotionConnection = async (): Promise<boolean> => {
  try {
    const notion = getNotionClient();
    const databaseId = getReceiptsDatabaseId();

    // データベースの情報を取得してテスト
    await notion.databases.retrieve({
      database_id: databaseId,
    });

    return true;
  } catch (error) {
    console.error("Notion接続テストエラー:", error);
    return false;
  }
};

// 既存のレシートを一括同期
export const syncAllReceiptsToNotion = async (
  receipts: Receipt[],
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < receipts.length; i++) {
    try {
      await syncReceiptToNotion(receipts[i]);
      success++;
    } catch (error) {
      console.error(`レシート同期エラー (ID: ${receipts[i].id}):`, error);
      failed++;
    }

    if (onProgress) {
      onProgress(i + 1, receipts.length);
    }
  }

  return { success, failed };
};
