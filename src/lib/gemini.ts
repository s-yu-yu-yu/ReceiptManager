import { GoogleGenAI } from "@google/genai";
import { getCategoryNames } from "./categories";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export interface AnalyzedReceipt {
  storeName: string;
  date: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    category?: string;
  }[];
  totalAmount: number;
  confidence: number;
}

export async function analyzeReceipt(
  imageBase64: string
): Promise<AnalyzedReceipt> {
  try {
    const categories = getCategoryNames().join('、');
    const prompt = `レシート画像から以下の情報を抽出してください：

必須項目：
- 店舗名 (storeName)
- 購入日 (date: YYYY-MM-DD形式)
- 各商品の詳細 (items配列)
  - 商品名 (name)  
  - 数量 (quantity)
  - 単価 (unitPrice)
  - 合計金額 (totalPrice)
  - カテゴリ (category: ${categories}から選択)
- 合計金額 (totalAmount)
- 解析信頼度 (confidence: 0-1の値)

JSON形式で返してください。日本語の商品名はそのまま記録してください。
数値は必ず数字型で返してください（文字列ではなく）。

例：
{
  "storeName": "スーパーマーケット",
  "date": "2024-01-15",
  "items": [
    {
      "name": "牛乳",
      "quantity": 1,
      "unitPrice": 298,
      "totalPrice": 298,
      "category": "食品"
    }
  ],
  "totalAmount": 298,
  "confidence": 0.95
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const responseText = response.text;

    if (!responseText) {
      throw new Error('Gemini APIからの応答が空です');
    }

    // JSONの抽出（マークダウンのコードブロックを除去）
    const jsonMatch =
      responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
      responseText.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;

    if (!jsonText) {
      throw new Error('レスポンスからJSONデータを抽出できませんでした');
    }

    const analyzedData = JSON.parse(jsonText.trim()) as AnalyzedReceipt;

    // データの検証と補正
    if (!analyzedData.storeName) analyzedData.storeName = "unknown";
    if (!analyzedData.date)
      analyzedData.date = new Date().toISOString().split("T")[0];
    if (!analyzedData.items || !Array.isArray(analyzedData.items))
      analyzedData.items = [];
    if (typeof analyzedData.totalAmount !== "number")
      analyzedData.totalAmount = 0;
    if (typeof analyzedData.confidence !== "number")
      analyzedData.confidence = 0.5;

    // 商品データの検証
    analyzedData.items = analyzedData.items.map((item) => ({
      name: item.name || "不明な商品",
      quantity: typeof item.quantity === "number" ? item.quantity : 1,
      unitPrice: typeof item.unitPrice === "number" ? item.unitPrice : 0,
      totalPrice: typeof item.totalPrice === "number" ? item.totalPrice : 0,
      category: item.category || "その他",
    }));

    return analyzedData;
  } catch (error) {
    console.error("Receipt analysis failed:", error);
    throw new Error(
      "レシートの解析に失敗しました。画像が不鮮明であるか、APIエラーが発生しました。"
    );
  }
}
