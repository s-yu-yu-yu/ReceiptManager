/**
 * 画像処理ユーティリティ関数
 */

/**
 * WebcamのスクリーンショットからBase64データのみを抽出
 * リサイズは行わず、元画像の品質を保持
 */
export function optimizeScreenshot(screenshotDataUrl: string): string {
  // data:image/jpeg;base64, の部分を除去してBase64データのみを返す
  return screenshotDataUrl.split(',')[1];
}

