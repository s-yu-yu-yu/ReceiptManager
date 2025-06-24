import { useState, useEffect } from "react";
import {
  Settings,
  Database,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  testNotionConnection,
  isNotionEnabled,
  syncAllReceiptsToNotion,
} from "@/lib/notion";
import { db } from "@/lib/db";

interface NotionSettings {
  apiKey: string;
  receiptsDatabaseId: string;
  itemsDatabaseId: string;
}

export function SettingsPage() {
  const [notionSettings, setNotionSettings] = useState<NotionSettings>({
    apiKey: "",
    receiptsDatabaseId: "",
    itemsDatabaseId: "",
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [stats, setStats] = useState({
    totalReceipts: 0,
    totalItems: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // 統計情報の取得
  useEffect(() => {
    const loadStats = async () => {
      const receipts = await db.receipts.count();
      const items = await db.receipts.toArray();
      const totalItems = items.reduce(
        (sum, receipt) => sum + receipt.items.length,
        0
      );

      setStats({
        totalReceipts: receipts,
        totalItems: totalItems,
      });
    };
    loadStats();
  }, []);

  // 環境変数から初期値を設定
  useEffect(() => {
    const apiKey = import.meta.env.VITE_NOTION_API_KEY || "";
    const receiptsDatabaseId = import.meta.env.VITE_NOTION_RECEIPTS_DATABASE_ID || "";
    const itemsDatabaseId = import.meta.env.VITE_NOTION_ITEMS_DATABASE_ID || "";

    if (apiKey !== "your_notion_api_key_here") {
      setNotionSettings({
        apiKey: apiKey,
        receiptsDatabaseId:
          receiptsDatabaseId === "your_receipts_database_id_here" ? "" : receiptsDatabaseId,
        itemsDatabaseId:
          itemsDatabaseId === "your_items_database_id_here" ? "" : itemsDatabaseId,
      });
    }
  }, []);

  const handleNotionTest = async () => {
    if (!notionSettings.apiKey || !notionSettings.receiptsDatabaseId || !notionSettings.itemsDatabaseId) {
      setTestResult({
        success: false,
        message: "APIキーと両方のデータベースIDを入力してください",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      console.log("接続テスト開始", {
        hasApiKey: !!notionSettings.apiKey,
        apiKeyPrefix: notionSettings.apiKey ? notionSettings.apiKey.substring(0, 10) + "..." : "なし",
        receiptsDbId: notionSettings.receiptsDatabaseId,
        itemsDbId: notionSettings.itemsDatabaseId,
        environment: import.meta.env.DEV ? "development" : "production"
      });

      // 一時的に環境変数を設定
      import.meta.env.VITE_NOTION_API_KEY = notionSettings.apiKey;
      import.meta.env.VITE_NOTION_RECEIPTS_DATABASE_ID =
        notionSettings.receiptsDatabaseId;
      import.meta.env.VITE_NOTION_ITEMS_DATABASE_ID =
        notionSettings.itemsDatabaseId;

      console.log("testNotionConnection 実行前");
      const success = await testNotionConnection();
      console.log("testNotionConnection 実行後:", success);

      setTestResult({
        success,
        message: success
          ? import.meta.env.DEV
            ? "設定値の確認が完了しました！（開発環境では実際のAPI接続はスキップ）"
            : "接続に成功しました！"
          : import.meta.env.DEV
          ? "設定値に問題があります。APIキーとデータベースIDを確認してください。"
          : "接続に失敗しました。設定を確認してください。",
      });
    } catch (error) {
      console.error("接続テスト中の予期しないエラー:", error);
      console.error("エラースタック:", error instanceof Error ? error.stack : "スタック情報なし");
      
      let errorMessage = "接続テスト中にエラーが発生しました";
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      setTestResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      console.log("接続テスト終了");
      setIsTesting(false);
    }
  };

  const handleSyncAll = async () => {
    if (!isNotionEnabled()) {
      alert("Notion連携が設定されていません");
      return;
    }

    if (!window.confirm("すべてのレシートをNotionに同期しますか？")) {
      return;
    }

    setIsSyncing(true);
    setSyncProgress(null);

    try {
      const receipts = await db.receipts.toArray();

      if (receipts.length === 0) {
        alert("同期するレシートがありません");
        return;
      }

      const result = await syncAllReceiptsToNotion(
        receipts,
        (current, total) => {
          setSyncProgress({ current, total });
        }
      );

      alert(`同期完了: 成功 ${result.success}件, 失敗 ${result.failed}件`);
    } catch (error) {
      console.error("一括同期エラー:", error);
      alert("同期中にエラーが発生しました");
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleClearData = async () => {
    if (
      window.confirm(
        "すべてのローカルデータを削除しますか？この操作は取り消せません。"
      )
    ) {
      try {
        await db.receipts.clear();
        await db.categories.clear();

        // カテゴリの再初期化
        await db.initializeCategories();

        setStats({ totalReceipts: 0, totalItems: 0 });
        alert("データを削除しました");
      } catch (error) {
        console.error("データ削除エラー:", error);
        alert("データの削除に失敗しました");
      }
    }
  };

  return (
    <div className="container mx-auto p-4 pb-20 max-w-2xl">
      <div className="flex items-center mb-6">
        <Settings className="mr-2" size={24} />
        <h1 className="text-2xl font-bold">設定</h1>
      </div>

      {/* Notion連携設定 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2" size={20} />
            Notion連携
          </CardTitle>
          <CardDescription>
            レシートデータをNotionデータベースに自動同期します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notion-api-key">Notion APIキー</Label>
            <Input
              id="notion-api-key"
              type="password"
              placeholder="secret_xxxxx"
              value={notionSettings.apiKey}
              onChange={(e) =>
                setNotionSettings({
                  ...notionSettings,
                  apiKey: e.target.value,
                })
              }
            />
            <p className="text-sm text-gray-500 mt-1">
              <a
                href="https://www.notion.so/my-integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline inline-flex items-center"
              >
                Integrationを作成して取得
                <ExternalLink size={12} className="ml-1" />
              </a>
            </p>
          </div>

          <div>
            <Label htmlFor="notion-receipts-db-id">レシートデータベースID</Label>
            <Input
              id="notion-receipts-db-id"
              placeholder="32文字の英数字"
              value={notionSettings.receiptsDatabaseId}
              onChange={(e) =>
                setNotionSettings({
                  ...notionSettings,
                  receiptsDatabaseId: e.target.value,
                })
              }
            />
            <p className="text-sm text-gray-500 mt-1">
              レシート情報を保存するデータベース
            </p>
          </div>

          <div>
            <Label htmlFor="notion-items-db-id">商品データベースID</Label>
            <Input
              id="notion-items-db-id"
              placeholder="32文字の英数字"
              value={notionSettings.itemsDatabaseId}
              onChange={(e) =>
                setNotionSettings({
                  ...notionSettings,
                  itemsDatabaseId: e.target.value,
                })
              }
            />
            <p className="text-sm text-gray-500 mt-1">
              商品詳細情報を保存するデータベース
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={handleNotionTest}
              disabled={isTesting}
              variant="outline"
            >
              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              接続テスト
            </Button>

            {testResult && (
              <div
                className={`flex items-center text-sm ${
                  testResult.success ? "text-green-600" : "text-red-600"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle size={16} className="mr-1" />
                ) : (
                  <XCircle size={16} className="mr-1" />
                )}
                {testResult.message}
              </div>
            )}
          </div>

          {/* 一括同期 */}
          {isNotionEnabled() && (
            <div className="border-t pt-4">
              <Button
                onClick={handleSyncAll}
                disabled={isSyncing || stats.totalReceipts === 0}
                className="w-full"
                variant="secondary"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {syncProgress
                      ? `同期中 (${syncProgress.current}/${syncProgress.total})`
                      : "同期準備中..."}
                  </>
                ) : (
                  <>既存のレシートをNotionに同期</>
                )}
              </Button>
              {stats.totalReceipts > 0 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {stats.totalReceipts}件のレシートを同期します
                </p>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              <FileText size={16} className="inline mr-1" />
              <a
                href="/NOTION_SETUP.md"
                target="_blank"
                className="text-blue-500 hover:underline"
              >
                セットアップガイドを見る
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* データ管理 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>データ管理</CardTitle>
          <CardDescription>保存されているレシートデータの管理</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold">{stats.totalReceipts}</p>
              <p className="text-sm text-gray-600">レシート数</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold">{stats.totalItems}</p>
              <p className="text-sm text-gray-600">商品数</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <Button
              variant="destructive"
              onClick={handleClearData}
              className="w-full"
            >
              すべてのデータを削除
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              この操作は取り消せません
            </p>
          </div>
        </CardContent>
      </Card>

      {/* アプリ情報 */}
      <Card>
        <CardHeader>
          <CardTitle>アプリ情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">バージョン</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">最終更新</span>
              <span>{new Date().toLocaleDateString("ja-JP")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
