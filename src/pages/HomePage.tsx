import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { type Receipt } from "@/types";
import {
  getMonthlyTotal,
  getDailyTotal,
  getRecentReceipts,
  getCurrentMonthString,
  formatDateForDisplay,
  getMainCategories,
} from "@/lib/homeHelpers";

export function HomePage() {
  const navigate = useNavigate();

  // 状態管理
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
  const [todayTotal, setTodayTotal] = useState<number>(0);
  const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // 現在の月の表示文字列
  const currentMonth = getCurrentMonthString();

  // データ取得
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError("");

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonthNum = now.getMonth() + 1;

        // 並行してデータを取得
        const [monthly, daily, receipts] = await Promise.all([
          getMonthlyTotal(currentYear, currentMonthNum),
          getDailyTotal(now),
          getRecentReceipts(3),
        ]);

        setMonthlyTotal(monthly);
        setTodayTotal(daily);
        setRecentReceipts(receipts);
      } catch (err) {
        console.error("Error loading homepage data:", err);
        setError("データの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 pb-20">
        <div className="animate-pulse">
          {/* ヘッダースケルトン */}
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>

          {/* 本日の支出カードスケルトン */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="h-5 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-28"></div>
            </CardContent>
          </Card>

          {/* 最近のレシートスケルトン */}
          <div className="mb-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="h-5 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-5 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* FAB */}
        <Button
          size="icon"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
          onClick={() => navigate("/receipts/add")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  // エラー時の表示
  if (error) {
    return (
      <div className="container mx-auto p-4 pb-20">
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>再読み込み</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-20">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{currentMonth}</h1>
        <p className="text-3xl font-bold text-primary">
          ¥{monthlyTotal.toLocaleString()}
        </p>
      </div>

      {/* 本日の支出カード */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">本日の支出</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            ¥{todayTotal.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* 最近のレシート */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">最近のレシート</h2>
        <div className="space-y-3">
          {recentReceipts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  まだレシートが登録されていません
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/receipts/add")}
                >
                  最初のレシートを追加
                </Button>
              </CardContent>
            </Card>
          ) : (
            recentReceipts.map((receipt) => {
              const mainCategories = getMainCategories(receipt);
              return (
                <Card
                  key={receipt.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/receipts/${receipt.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{receipt.storeName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {mainCategories.length > 0
                            ? mainCategories.join("、")
                            : "カテゴリなし"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ¥{receipt.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateForDisplay(receipt.date)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* FAB（追加ボタン） */}
      <Button
        size="icon"
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
        onClick={() => navigate("/receipts/add")}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
