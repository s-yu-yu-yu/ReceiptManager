import { useState } from "react";
import { Camera, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CameraCapture } from "@/components/features/CameraCapture";
import { ReceiptConfirmation } from "@/components/features/ReceiptConfirmation";
import { analyzeReceipt, type AnalyzedReceipt } from "@/lib/gemini";
import { db } from "@/lib/db";
import { type Receipt } from "@/types";
import { useNavigate } from "react-router-dom";

type Step = "method-selection" | "camera" | "confirmation";

export default function AddReceiptPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("method-selection");
  const [capturedImage, setCapturedImage] = useState<string>("");
  const [analyzedData, setAnalyzedData] = useState<AnalyzedReceipt | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const handleMethodSelect = (method: "camera" | "manual") => {
    if (method === "camera") {
      setStep("camera");
    } else {
      // 手動入力フォームに遷移（後で実装）
      navigate("/receipts/manual");
    }
  };

  const handleCapture = async (imageBase64: string) => {
    setIsAnalyzing(true);
    setError("");

    try {
      // 元画像をそのまま使用（品質劣化を防ぐ）
      const capturedImageUrl = `data:image/png;base64,${imageBase64}`;
      setCapturedImage(capturedImageUrl);

      // Gemini AIで解析（元画像のBase64データを使用）
      const result = await analyzeReceipt(imageBase64);
      setAnalyzedData(result);
      setStep("confirmation");
    } catch (err) {
      console.error("Receipt analysis error:", err);
      setError(
        err instanceof Error ? err.message : "レシートの解析に失敗しました"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async (
    receiptData: Omit<Receipt, "id" | "createdAt" | "updatedAt">
  ) => {
    setIsSaving(true);
    setError("");

    try {
      const now = new Date();
      const receipt: Receipt = {
        ...receiptData,
        id: Date.now(), // タイムスタンプを使用してユニークなIDを生成
        createdAt: now,
        updatedAt: now,
      };

      await db.receipts.add(receipt);

      // 成功時はホーム画面に戻る
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Failed to save receipt:", err);
      setError("レシートの保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    switch (step) {
      case "camera":
        setStep("method-selection");
        setCapturedImage("");
        setError("");
        break;
      case "confirmation":
        setStep("camera");
        setAnalyzedData(null);
        setError("");
        break;
      default:
        navigate("/");
    }
  };

  // エラー表示
  if (error && step !== "camera") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <p className="font-medium">エラーが発生しました</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
            <Button
              onClick={() => setStep("method-selection")}
              className="w-full"
            >
              もう一度試す
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ステップ別レンダリング
  switch (step) {
    case "method-selection":
      return (
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-md mx-auto">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="text-gray-600"
              >
                <ArrowLeft size={20} className="mr-2" />
                戻る
              </Button>
              <h1 className="text-xl font-semibold">レシート追加</h1>
              <div className="w-16" />
            </div>

            {/* 方法選択 */}
            <div className="space-y-4">
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleMethodSelect("camera")}
              >
                <CardContent className="p-6 text-center">
                  <Camera size={48} className="mx-auto mb-4 text-blue-600" />
                  <h2 className="text-lg font-semibold mb-2">カメラで撮影</h2>
                  <p className="text-gray-600 text-sm">
                    レシートを撮影してAIが自動で読み取ります
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-md transition-shadow opacity-50"
                onClick={() => handleMethodSelect("manual")}
              >
                <CardContent className="p-6 text-center">
                  <FileText size={48} className="mx-auto mb-4 text-green-600" />
                  <h2 className="text-lg font-semibold mb-2">手動で入力</h2>
                  <p className="text-gray-600 text-sm">
                    店舗名や商品を手動で入力します
                  </p>
                  <p className="text-xs text-amber-600 mt-2">※ 後日実装予定</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );

    case "camera":
      return (
        <CameraCapture
          onCapture={handleCapture}
          onClose={handleBack}
          isAnalyzing={isAnalyzing}
        />
      );

    case "confirmation":
      return analyzedData ? (
        <ReceiptConfirmation
          analyzedData={analyzedData}
          capturedImage={capturedImage}
          onSave={handleSave}
          onBack={handleBack}
          isLoading={isSaving}
        />
      ) : null;

    default:
      return null;
  }
}
