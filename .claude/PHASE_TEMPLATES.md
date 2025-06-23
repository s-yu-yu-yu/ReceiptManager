# 食費管理アプリ - 各フェーズ実装テンプレート

## Phase 1 テンプレート

### 底部ナビゲーション（src/components/layout/BottomNavigation.tsx）
```typescript
import { Home, BarChart, Receipt, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'ホーム' },
    { path: '/analytics', icon: BarChart, label: '分析' },
    { path: '/receipts', icon: Receipt, label: '履歴' },
    { path: '/settings', icon: Settings, label: '設定' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center py-2 px-3 min-w-[64px]",
                isActive ? "text-blue-600" : "text-gray-600"
              )}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### レシート入力フォーム（src/components/features/ReceiptForm.tsx）
```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { useReceiptStore } from '@/stores/receiptStore';
import { ReceiptItem } from '@/types';

export function ReceiptForm({ onComplete }: { onComplete: () => void }) {
  const [storeName, setStoreName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<ReceiptItem[]>([
    { id: '1', name: '', quantity: 1, unitPrice: 0, totalPrice: 0 }
  ]);

  const addReceipt = useReceiptStore((state) => state.addReceipt);

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    }]);
  };

  const updateItem = (id: string, field: keyof ReceiptItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalPrice = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    await addReceipt({
      date: new Date(date),
      storeName,
      items,
      totalAmount,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="storeName">店舗名</Label>
        <Input
          id="storeName"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="date">購入日</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>購入品目</Label>
        {items.map((item) => (
          <div key={item.id} className="flex gap-2">
            <Input
              placeholder="品名"
              value={item.name}
              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
              required
            />
            <Input
              type="number"
              placeholder="数量"
              value={item.quantity}
              onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value))}
              className="w-20"
              min="1"
              required
            />
            <Input
              type="number"
              placeholder="単価"
              value={item.unitPrice}
              onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
              className="w-24"
              min="0"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(item.id)}
              disabled={items.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addItem} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          品目を追加
        </Button>
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <span className="text-lg font-semibold">
          合計: ¥{items.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()}
        </span>
        <Button type="submit">保存</Button>
      </div>
    </form>
  );
}
```

## Phase 2 テンプレート

### Gemini AI 処理関数（src/lib/gemini.ts）
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface ReceiptData {
  storeName: string;
  date: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
}

export async function analyzeReceipt(imageBase64: string): Promise<ReceiptData> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `レシート画像を解析して、以下のJSON形式で情報を抽出してください：
    {
      "storeName": "店舗名",
      "date": "YYYY-MM-DD形式の日付",
      "items": [
        {
          "name": "商品名",
          "quantity": 数量（数値）,
          "unitPrice": 単価（数値）,
          "totalPrice": 小計（数値）
        }
      ],
      "totalAmount": 合計金額（数値）
    }
    
    注意点：
    - 日付が不明な場合は今日の日付を使用
    - 数量が不明な場合は1を使用
    - 金額は税込み価格を使用`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      }
    ]);

    const response = result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('レシートの解析に失敗しました');
  }
}
```

### カメラキャプチャコンポーネント（src/components/features/CameraCapture.tsx）
```typescript
import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Upload } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImageSrc(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setImageSrc(null);
  };

  const confirm = () => {
    if (imageSrc) {
      onCapture(imageSrc);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImageSrc(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  if (imageSrc) {
    return (
      <div className="relative">
        <img src={imageSrc} alt="Captured receipt" className="w-full" />
        <div className="flex gap-2 mt-4">
          <Button onClick={retake} variant="outline" className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            撮り直す
          </Button>
          <Button onClick={confirm} className="flex-1">
            この画像を使用
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          className="w-full rounded-lg"
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full border-2 border-dashed border-white/50 rounded-lg" />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button onClick={capture} className="flex-1">
          <Camera className="h-4 w-4 mr-2" />
          撮影
        </Button>
        <Button variant="outline" className="flex-1" asChild>
          <label>
            <Upload className="h-4 w-4 mr-2" />
            画像選択
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </Button>
      </div>
    </div>
  );
}
```

## Phase 3 テンプレート

### 分析ページ（src/pages/AnalyticsPage.tsx）
```typescript
import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useReceiptStore } from '@/stores/receiptStore';
import { startOfWeek, endOfWeek, format, eachDayOfInterval } from 'date-fns';
import { ja } from 'date-fns/locale';

export function AnalyticsPage() {
  const receipts = useReceiptStore((state) => state.receipts);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  const weekData = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { locale: ja });
    const end = endOfWeek(today, { locale: ja });
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayReceipts = receipts.filter(
        r => format(r.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      const total = dayReceipts.reduce((sum, r) => sum + r.totalAmount, 0);

      return {
        date: format(day, 'E', { locale: ja }),
        amount: total
      };
    });
  }, [receipts]);

  const totalAmount = useMemo(() => {
    return receipts.reduce((sum, r) => sum + r.totalAmount, 0);
  }, [receipts]);

  const dailyAverage = useMemo(() => {
    const days = new Set(receipts.map(r => format(r.date, 'yyyy-MM-dd'))).size || 1;
    return Math.round(totalAmount / days);
  }, [receipts, totalAmount]);

  return (
    <div className="container py-6 pb-20">
      <h1 className="text-2xl font-bold mb-6">支出分析</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">今月の合計</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">¥{totalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">1日平均</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">¥{dailyAverage.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="week">週</TabsTrigger>
          <TabsTrigger value="month">月</TabsTrigger>
          <TabsTrigger value="year">年</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>今週の支出</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `¥${value}`} />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month">
          <Card>
            <CardHeader>
              <CardTitle>今月の支出</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">実装予定</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="year">
          <Card>
            <CardHeader>
              <CardTitle>今年の支出</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">実装予定</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Phase 4 テンプレート

### CSVエクスポート機能（src/lib/export.ts）
```typescript
import { Receipt } from '@/types';
import { format } from 'date-fns';

export function exportToCSV(receipts: Receipt[], startDate?: Date, endDate?: Date) {
  // フィルタリング
  const filtered = receipts.filter(receipt => {
    if (startDate && receipt.date < startDate) return false;
    if (endDate && receipt.date > endDate) return false;
    return true;
  });

  // CSVヘッダー
  const headers = ['購入日', '店舗名', '品目名', '数量', '単価', '小計', '合計金額'];
  
  // CSVデータ作成
  const rows: string[][] = [headers];
  
  filtered.forEach(receipt => {
    receipt.items.forEach((item, index) => {
      rows.push([
        format(receipt.date, 'yyyy-MM-dd'),
        index === 0 ? receipt.storeName : '',
        item.name,
        item.quantity.toString(),
        item.unitPrice.toString(),
        item.totalPrice.toString(),
        index === 0 ? receipt.totalAmount.toString() : ''
      ]);
    });
  });

  // CSV文字列生成
  const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });

  // ダウンロード
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `receipts_${format(new Date(), 'yyyyMMdd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(receipts: Receipt[]) {
  const json = JSON.stringify(receipts, null, 2);
  const blob = new Blob([json], { type: 'application/json' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `receipts_backup_${format(new Date(), 'yyyyMMdd')}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

## 共通ユーティリティ

### Zustandストア（src/stores/receiptStore.ts）
```typescript
import { create } from 'zustand';
import { Receipt } from '@/types';
import { db } from '@/lib/db';

interface ReceiptStore {
  receipts: Receipt[];
  loading: boolean;
  error: string | null;
  
  fetchReceipts: () => Promise<void>;
  addReceipt: (receipt: Omit<Receipt, 'id'>) => Promise<void>;
  updateReceipt: (id: string, receipt: Partial<Receipt>) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
}

export const useReceiptStore = create<ReceiptStore>((set, get) => ({
  receipts: [],
  loading: false,
  error: null,

  fetchReceipts: async () => {
    set({ loading: true, error: null });
    try {
      const receipts = await db.receipts.toArray();
      set({ receipts, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addReceipt: async (receipt) => {
    try {
      const id = await db.receipts.add(receipt);
      const newReceipt = { ...receipt, id: id.toString() };
      set({ receipts: [...get().receipts, newReceipt] });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateReceipt: async (id, updates) => {
    try {
      await db.receipts.update(id, updates);
      set({
        receipts: get().receipts.map(r => 
          r.id === id ? { ...r, ...updates } : r
        )
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteReceipt: async (id) => {
    try {
      await db.receipts.delete(id);
      set({
        receipts: get().receipts.filter(r => r.id !== id)
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  }
}));
```