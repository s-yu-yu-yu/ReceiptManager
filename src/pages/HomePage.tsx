import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HomePage() {
  // 仮のデータ（後でIndexedDBから取得）
  const currentMonth = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
  const monthlyTotal = 45280;
  const todayTotal = 3450;
  const recentReceipts = [
    { id: 1, store: 'セブンイレブン', amount: 1280, date: '2024-01-15', category: '食費' },
    { id: 2, store: 'イオン', amount: 5430, date: '2024-01-15', category: '日用品' },
    { id: 3, store: 'スターバックス', amount: 650, date: '2024-01-14', category: '外食' },
  ];

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
          <p className="text-2xl font-semibold">¥{todayTotal.toLocaleString()}</p>
        </CardContent>
      </Card>

      {/* 最近のレシート */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">最近のレシート</h2>
        <div className="space-y-3">
          {recentReceipts.map((receipt) => (
            <Card key={receipt.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{receipt.store}</h3>
                    <p className="text-sm text-muted-foreground">{receipt.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">¥{receipt.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{receipt.date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAB（追加ボタン） */}
      <Button
        size="icon"
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}