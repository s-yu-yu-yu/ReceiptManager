import type { Receipt, ReceiptItem } from "@/types";

// 定数
const NOTION_API_VERSION = "2022-06-28";
const NOTION_BASE_URL = "https://api.notion.com/v1";
const DEFAULT_PLACEHOLDER_KEYS = {
  API_KEY: "your_notion_api_key_here",
  RECEIPTS_DB: "your_receipts_database_id_here",
  ITEMS_DB: "your_items_database_id_here",
} as const;

// 一時的な設定値を格納するグローバル変数
let tempNotionConfig: {
  apiKey?: string;
  receiptsDatabaseId?: string;
  itemsDatabaseId?: string;
} = {};

// 環境変数取得のヘルパー
const getEnvValue = (
  key: string,
  placeholder: string,
  errorMessage: string
): string => {
  // 一時設定があればそれを使用
  if (key === "VITE_NOTION_API_KEY" && tempNotionConfig.apiKey) {
    return tempNotionConfig.apiKey;
  }
  if (key === "VITE_NOTION_RECEIPTS_DATABASE_ID" && tempNotionConfig.receiptsDatabaseId) {
    return tempNotionConfig.receiptsDatabaseId;
  }
  if (key === "VITE_NOTION_ITEMS_DATABASE_ID" && tempNotionConfig.itemsDatabaseId) {
    return tempNotionConfig.itemsDatabaseId;
  }

  const value = import.meta.env[key];
  if (!value || value === placeholder) {
    throw new Error(errorMessage);
  }
  return value;
};

// 一時的な設定値を設定する関数
export const setTempNotionConfig = (config: {
  apiKey?: string;
  receiptsDatabaseId?: string;
  itemsDatabaseId?: string;
}) => {
  tempNotionConfig = { ...config };
};

// 一時設定をクリアする関数
export const clearTempNotionConfig = () => {
  tempNotionConfig = {};
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

  console.log(`Notion API Request: ${options.method || "GET"} ${endpoint}`);

  const response = await fetch(`${NOTION_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_API_VERSION,
      ...options.headers,
    },
  });

  console.log(`Notion API Response: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Notion API Error Response:", errorData);
    throw new Error(
      `Notion API Error: ${response.status} ${
        response.statusText
      } - ${JSON.stringify(errorData)}`
    );
  }

  const responseData = await response.json();
  console.log("Notion API Success Response:", responseData);
  return responseData;
};

// Notionページプロパティ作成のヘルパー（公式SDK準拠）
const createTitleProperty = (content: string) => ({
  title: [
    {
      text: {
        content: content,
      },
    },
  ],
});

const createRichTextProperty = (content: string) => ({
  rich_text: [
    {
      text: {
        content: content,
      },
    },
  ],
});

const createDateProperty = (date: Date) => ({
  date: {
    start: date.toISOString(),
  },
});

const createDateOnlyProperty = (date: Date) => ({
  date: {
    start: date.toISOString().split("T")[0],
  },
});

const createNumberProperty = (value: number) => ({
  number: value,
});

const createSelectProperty = (name: string) => ({
  select: {
    name: name,
  },
});

const createRelationProperty = (id: string) => ({
  relation: [
    {
      id: id,
    },
  ],
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
  try {
    const databaseId = getReceiptsDatabaseId();

    console.log("レシート同期開始:", {
      receiptId: receipt.id,
      storeName: receipt.storeName,
      databaseId: databaseId,
    });

    const pageData = {
      parent: { database_id: databaseId },
      properties: createReceiptProperties(receipt),
    };

    console.log("送信データ:", JSON.stringify(pageData, null, 2));

    const receiptPage = (await createPage(pageData)) as { id: string };

    console.log("レシートページ作成成功:", receiptPage.id);

    // 商品アイテムも同期（失敗してもレシート同期は成功とする）
    if (receipt.items?.length > 0) {
      try {
        const itemsDatabaseId = getItemsDatabaseId();
        console.log(`商品同期開始: ${receipt.items.length}件`);
        await syncItemsToNotion(receipt.items, receiptPage.id, itemsDatabaseId);
        console.log("商品同期成功");
      } catch (itemsError) {
        console.warn("商品アイテムの同期に失敗:", itemsError);
      }
    }

    return receiptPage.id;
  } catch (error) {
    console.error("レシート同期エラー詳細:", {
      error: error,
      receipt: {
        id: receipt.id,
        storeName: receipt.storeName,
        itemsCount: receipt.items?.length || 0,
      },
    });
    throw error;
  }
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

// 接続テスト（簡易版 - 設定値のみチェック）
export const testNotionConnection = async (): Promise<boolean> => {
  console.log("testNotionConnection 開始");
  
  try {
    console.log("環境確認:", {
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE,
      prod: import.meta.env.PROD
    });

    // 開発環境では設定値のみチェック
    if (import.meta.env.DEV) {
      console.warn(
        "開発環境ではCORS制限により実際のAPI接続テストはスキップします。設定値のみチェックします。"
      );
      
      try {
        // 設定値の検証
        console.log("設定値取得開始");
        const apiKey = getNotionApiKey();
        console.log("APIキー取得成功");
        const receiptsDbId = getReceiptsDatabaseId();
        console.log("レシートDB ID取得成功");
        const itemsDbId = getItemsDatabaseId();
        console.log("商品DB ID取得成功");
        
        console.log("設定確認:");
        console.log(
          "- API Key:",
          apiKey ? `${apiKey.substring(0, 10)}...` : "未設定"
        );
        console.log("- Receipts DB ID:", receiptsDbId);
        console.log("- Items DB ID:", itemsDbId);
        
        return true; // 開発環境では設定があれば成功とする
      } catch (configError) {
        console.error("設定値取得エラー:", configError);
        throw configError;
      }
    }

    // 本番環境では実際のAPI接続テスト
    console.log("本番環境でのAPI接続テスト開始");
    
    try {
      const receiptsDbId = getReceiptsDatabaseId();
      const itemsDbId = getItemsDatabaseId();
      
      console.log("データベース接続テスト開始");
      console.log("レシートDB:", receiptsDbId);
      console.log("商品DB:", itemsDbId);
      
      const results = await Promise.all([
        getDatabase(receiptsDbId),
        getDatabase(itemsDbId),
      ]);
      
      console.log("データベース接続テスト成功:", results);
      return true;
    } catch (apiError) {
      console.error("API接続エラー:", apiError);
      throw apiError;
    }

  } catch (error) {
    console.error("testNotionConnection エラー詳細:", {
      error: error,
      message: error instanceof Error ? error.message : "不明なエラー",
      stack: error instanceof Error ? error.stack : "スタック情報なし",
      type: typeof error,
      constructor: error?.constructor?.name
    });

    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch")) {
        console.warn(
          "CORS制限: ブラウザからの直接アクセスが制限されています。"
        );
      } else if (error.message.includes("Unauthorized")) {
        console.error(
          "認証エラー: APIキーが正しくないか、権限が不足しています。"
        );
      } else if (error.message.includes("object_not_found")) {
        console.error(
          "データベースエラー: 指定されたデータベースIDが見つかりません。"
        );
      } else if (error.message.includes("設定されていません")) {
        console.error("設定エラー:", error.message);
      }
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
