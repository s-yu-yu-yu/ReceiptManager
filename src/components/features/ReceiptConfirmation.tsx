import React, { useState } from "react";
import { Edit3, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type AnalyzedReceipt } from "@/lib/gemini";
import { type Receipt, type ReceiptItem } from "@/types";

interface ReceiptConfirmationProps {
  analyzedData: AnalyzedReceipt;
  capturedImage?: string;
  onSave: (receipt: Omit<Receipt, "id" | "createdAt" | "updatedAt">) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const CATEGORIES = [
  "食品",
  "日用品",
  "衣類",
  "医薬品",
  "書籍・文房具",
  "その他",
];

export const ReceiptConfirmation: React.FC<ReceiptConfirmationProps> = ({
  analyzedData,
  capturedImage,
  onSave,
  onBack,
  isLoading = false,
}) => {
  const [storeName, setStoreName] = useState(analyzedData.storeName);
  const [date, setDate] = useState(analyzedData.date);
  const [items, setItems] = useState(
    analyzedData.items.map((item, index) => ({
      id: `item-${index}`,
      ...item,
    }))
  );

  // 合計金額の自動計算
  const calculatedTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const addItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      name: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: "その他",
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<ReceiptItem>) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, ...updates };

          // 単価または数量が変更された場合、合計金額を自動計算
          if ("unitPrice" in updates || "quantity" in updates) {
            updatedItem.totalPrice =
              updatedItem.unitPrice * updatedItem.quantity;
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleSave = () => {
    if (!storeName.trim()) {
      alert("店舗名を入力してください");
      return;
    }

    if (items.length === 0) {
      alert("商品を1つ以上追加してください");
      return;
    }

    const receipt: Omit<Receipt, "id" | "createdAt" | "updatedAt"> = {
      date: new Date(date),
      storeName: storeName.trim(),
      items: items.filter((item) => item.name.trim() !== ""),
      totalAmount: calculatedTotal,
      imageUrl: capturedImage,
    };

    onSave(receipt);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto pb-24">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="text-gray-600">
            <ArrowLeft size={20} className="mr-2" />
            戻る
          </Button>
          <h1 className="text-xl font-semibold">レシート確認</h1>
          <div className="w-16" /> {/* スペーサー */}
        </div>

        {/* 信頼度表示 */}
        {analyzedData.confidence < 0.8 && (
          <Card className="mb-4 border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center text-amber-700">
                <Edit3 size={16} className="mr-2" />
                <p className="text-sm">
                  AIの解析精度が低めです（
                  {Math.round(analyzedData.confidence * 100)}%）。
                  内容を確認して修正してください。
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 基本情報 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="storeName">店舗名 *</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="店舗名を入力"
                required
              />
            </div>
            <div>
              <Label htmlFor="date">購入日 *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* 商品一覧 */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">商品一覧</CardTitle>
            <Button onClick={addItem} size="sm" variant="outline">
              <Plus size={16} className="mr-1" />
              追加
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500">
                      商品 {index + 1}
                    </span>
                    {items.length > 1 && (
                      <Button
                        onClick={() => removeItem(item.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>商品名 *</Label>
                      <Input
                        value={item.name}
                        onChange={(e) =>
                          updateItem(item.id, { name: e.target.value })
                        }
                        placeholder="商品名"
                        required
                      />
                    </div>

                    <div>
                      <Label>カテゴリ</Label>
                      <Select
                        value={item.category}
                        onValueChange={(value) =>
                          updateItem(item.id, { category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>数量</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, {
                            quantity: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label>単価（円）</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(item.id, {
                            unitPrice: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>小計（円）</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.totalPrice}
                        onChange={(e) =>
                          updateItem(item.id, {
                            totalPrice: parseInt(e.target.value) || 0,
                          })
                        }
                        className="font-medium"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 合計金額 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">合計金額</span>
              <span className="text-2xl font-bold text-blue-600">
                ¥{calculatedTotal.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 保存ボタン - 画面下部固定 */}
        <div className="sticky bottom-0 bg-background border-t p-4 mt-6">
          <Button
            onClick={handleSave}
            disabled={isLoading || !storeName.trim() || items.length === 0}
            className="w-full max-w-md mx-auto"
            size="lg"
          >
            <Save size={20} className="mr-2" />
            {isLoading ? "保存中..." : "レシートを保存"}
          </Button>
        </div>
      </div>
    </div>
  );
};
