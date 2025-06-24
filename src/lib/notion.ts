import type { Receipt, ReceiptItem } from "@/types";

// 定数
const NOTION_API_VERSION = "2022-06-28";
const NOTION_BASE_URL = "https://api.notion.com/v1";
const DEFAULT_PLACEHOLDER_KEYS = {
  API_KEY: "your_notion_api_key_here",
  RECEIPTS_DB: "your_receipts_database_id_here",
  ITEMS_DB: "your_items_database_id_here",
} as const;

// 環境変数取得のヘルパー
const getEnvValue = (
  key: string,
  placeholder: string,
  errorMessage: string
): string => {
  const value = import.meta.env[key];
  if (!value || value === placeholder) {
    throw new Error(errorMessage);
  }
  return value;
};

// API設定の取得
export const getNotionApiKey = (): string =>
  getEnvValue(
    "VITE_NOTION_API_KEY",
    DEFAULT_PLACEHOLDER_KEYS.API_KEY,
    "Notion APIキーが設定されていません"
  );

export const getReceiptsDatabaseId = (): string =>
  getEnvValue(
    "VITE_NOTION_RECEIPTS_DATABASE_ID",
    DEFAULT_PLACEHOLDER_KEYS.RECEIPTS_DB,
    "NotionレシートデータベースIDが設定されていません"
  );

export const getItemsDatabaseId = (): string =>
  getEnvValue(
    "VITE_NOTION_ITEMS_DATABASE_ID",
    DEFAULT_PLACEHOLDER_KEYS.ITEMS_DB,
    "Notion商品データベースIDが設定されていません"
  );

// Notion APIリクエストのヘルパー
const notionRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> => {
  const apiKey = getNotionApiKey();

  const response = await fetch(`${NOTION_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_API_VERSION,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Notion API Error: ${response.status} ${
        response.statusText
      } - ${JSON.stringify(errorData)}`
    );
  }

  return response.json();
};

// Notionページプロパティ作成のヘルパー
const createTextProperty = (content: string) => ({
  text: { content },
});

const createTitleProperty = (content: string) => ({
  title: [createTextProperty(content)],
});

const createRichTextProperty = (content: string) => ({
  rich_text: [createTextProperty(content)],
});

const createDateProperty = (date: Date) => ({
  date: { start: date.toISOString() },
});

const createDateOnlyProperty = (date: Date) => ({
  date: { start: date.toISOString().split("T")[0] },
});

const createNumberProperty = (value: number) => ({
  number: value,
});

const createSelectProperty = (name: string) => ({
  select: { name },
});

const createRelationProperty = (id: string) => ({
  relation: [{ id }],
});

// レシートページプロパティの作成
const createReceiptProperties = (receipt: Receipt) => ({
  店舗名: createTitleProperty(receipt.storeName || "不明な店舗"),
  日付: createDateOnlyProperty(receipt.date),
  合計金額: createNumberProperty(receipt.totalAmount),
  レシートID: createRichTextProperty(receipt.id?.toString() || ""),
  作成日時: createDateProperty(receipt.createdAt),
  更新日時: createDateProperty(receipt.updatedAt),
});

// 商品ページプロパティの作成
const createItemProperties = (item: ReceiptItem, receiptPageId: string) => ({
  商品名: createTitleProperty(item.name),
  数量: createNumberProperty(item.quantity),
  単価: createNumberProperty(item.unitPrice),
  合計: createNumberProperty(item.totalPrice),
  カテゴリ: createSelectProperty(item.category || "その他"),
  レシート: createRelationProperty(receiptPageId),
});

// データベース情報を取得
export const getDatabase = async (databaseId: string) =>
  notionRequest(`/databases/${databaseId}`);

// ページを作成
export const createPage = async (payload: Record<string, unknown>) =>
  notionRequest("/pages", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// 商品アイテムをNotionに同期
export const syncItemsToNotion = async (
  items: ReceiptItem[],
  receiptPageId: string,
  itemsDatabaseId: string
): Promise<void> => {
  if (!items.length) return;

  const itemPages = items.map((item) => ({
    parent: { database_id: itemsDatabaseId },
    properties: createItemProperties(item, receiptPageId),
  }));

  await Promise.all(itemPages.map(createPage));
};

// レシートをNotionに同期
export const syncReceiptToNotion = async (
  receipt: Receipt
): Promise<string> => {
  const databaseId = getReceiptsDatabaseId();

  const pageData = {
    parent: { database_id: databaseId },
    properties: createReceiptProperties(receipt),
  };

  const receiptPage = (await createPage(pageData)) as { id: string };

  // 商品アイテムも同期（失敗してもレシート同期は成功とする）
  if (receipt.items?.length > 0) {
    try {
      const itemsDatabaseId = getItemsDatabaseId();
      await syncItemsToNotion(receipt.items, receiptPage.id, itemsDatabaseId);
    } catch (itemsError) {
      console.warn("商品アイテムの同期に失敗:", itemsError);
    }
  }

  return receiptPage.id;
};

// Notion連携が有効かチェック
export const isNotionEnabled = (): boolean => {
  try {
    const configs = [
      import.meta.env.VITE_NOTION_API_KEY !== DEFAULT_PLACEHOLDER_KEYS.API_KEY,
      import.meta.env.VITE_NOTION_RECEIPTS_DATABASE_ID !==
        DEFAULT_PLACEHOLDER_KEYS.RECEIPTS_DB,
      import.meta.env.VITE_NOTION_ITEMS_DATABASE_ID !==
        DEFAULT_PLACEHOLDER_KEYS.ITEMS_DB,
    ];

    return configs.every(Boolean);
  } catch {
    return false;
  }
};

// 接続テスト
export const testNotionConnection = async (): Promise<boolean> => {
  try {
    if (import.meta.env.DEV) {
      console.warn(
        "開発環境ではCORS制限により接続テストが失敗する可能性があります。本番環境では正常に動作します。"
      );
    }

    await Promise.all([
      getDatabase(getReceiptsDatabaseId()),
      getDatabase(getItemsDatabaseId()),
    ]);

    return true;
  } catch (error) {
    console.error("Notion接続テストエラー:", error);

    if (error instanceof Error && error.message.includes("Failed to fetch")) {
      console.warn("CORSエラー: 本番環境では正常に動作します。");
    }

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

  for (const [index, receipt] of receipts.entries()) {
    try {
      await syncReceiptToNotion(receipt);
      success++;
    } catch (error) {
      console.error(`レシート同期エラー (ID: ${receipt.id}):`, error);
      failed++;
    }

    onProgress?.(index + 1, receipts.length);

    // 最後以外でレート制限対策の待機
    if (index < receipts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return { success, failed };
};
