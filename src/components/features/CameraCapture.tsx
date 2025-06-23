import React, { useRef, useCallback, useState } from "react";
import Webcam from "react-webcam";
import { Camera, RotateCcw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CameraCaptureProps {
  onCapture: (imageBase64: string) => void;
  onClose: () => void;
  isAnalyzing?: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onClose,
  isAnalyzing = false,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const retake = useCallback(() => {
    setCapturedImage(null);
  }, []);

  const confirm = useCallback(() => {
    if (capturedImage) {
      // data:image/jpeg;base64, の部分を除去してBase64データのみを送信
      const base64Data = capturedImage.split(",")[1];
      onCapture(base64Data);
    }
  }, [capturedImage, onCapture]);

  const handleUserMedia = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  const videoConstraints = {
    width: { ideal: 1080 },
    height: { ideal: 1920 }, // 縦長（9:16）でレシート撮影に最適
    aspectRatio: 9/16,
    facingMode: "environment", // 背面カメラを優先
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm max-h-[85vh] overflow-y-auto">
        <CardContent className="p-4 pb-6">
          <div className="relative">
            {/* カメラヘッダー */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">レシート撮影</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </Button>
            </div>

            {/* カメラビュー */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-[3/4]">
              {!capturedImage ? (
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={0.95}
                    videoConstraints={videoConstraints}
                    onUserMedia={handleUserMedia}
                    className="w-full h-full object-cover"
                  />

                  {/* ガイド枠 */}
                  <div className="absolute inset-6 border-2 border-white border-dashed rounded-lg pointer-events-none">
                    <div className="absolute -top-8 left-0 right-0 text-center">
                      <span className="text-white text-sm bg-black bg-opacity-60 px-3 py-1 rounded-full">
                        📄 レシート全体を枠内に収めてください
                      </span>
                    </div>
                    {/* コーナーマーカー */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-white"></div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-white"></div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-white"></div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-white"></div>
                  </div>

                  {/* カメラ準備中の表示 */}
                  {!isCameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <div className="text-center text-gray-600">
                        <Camera size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">カメラを準備中...</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <img
                  src={capturedImage}
                  alt="Captured receipt"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* 操作ボタン */}
            <div className="flex justify-center space-x-4 mt-4">
              {!capturedImage ? (
                <Button
                  onClick={capture}
                  disabled={!isCameraReady || isAnalyzing}
                  className="px-8 py-3"
                >
                  <Camera size={20} className="mr-2" />
                  撮影
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={retake}
                    disabled={isAnalyzing}
                    className="px-6 py-3"
                  >
                    <RotateCcw size={20} className="mr-2" />
                    撮り直し
                  </Button>
                  <Button
                    onClick={confirm}
                    disabled={isAnalyzing}
                    className="px-6 py-3"
                  >
                    <Check size={20} className="mr-2" />
                    {isAnalyzing ? "解析中..." : "確定"}
                  </Button>
                </>
              )}
            </div>

            {/* 分析中の表示 */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-700">
                    AIがレシートを解析中...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    しばらくお待ちください
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
