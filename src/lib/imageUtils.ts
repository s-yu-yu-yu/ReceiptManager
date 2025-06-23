/**
 * 画像処理ユーティリティ関数
 */

export interface ImageResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * 画像をリサイズしてBase64形式で返す
 */
export function resizeImageToBase64(
  file: File | string,
  options: ImageResizeOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1024,
      maxHeight = 768,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      // 元の画像サイズ
      const { width, height } = img;
      
      // リサイズ比率の計算
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      
      // 新しいサイズ
      const newWidth = Math.floor(width * ratio);
      const newHeight = Math.floor(height * ratio);
      
      // キャンバスサイズ設定
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // 高品質な描画設定
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // 画像を描画
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Base64形式で出力
      const mimeType = `image/${format}`;
      const base64Data = canvas.toDataURL(mimeType, quality);
      
      // data:image/jpeg;base64, の部分を除去
      const base64Only = base64Data.split(',')[1];
      resolve(base64Only);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // 画像ソースの設定
    if (typeof file === 'string') {
      img.src = file;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(file);
    }
  });
}

/**
 * Webcamのスクリーンショットを最適化
 */
export function optimizeScreenshot(
  screenshotDataUrl: string,
  options: ImageResizeOptions = {}
): Promise<string> {
  return resizeImageToBase64(screenshotDataUrl, {
    maxWidth: 1024,
    maxHeight: 768,
    quality: 0.8,
    format: 'jpeg',
    ...options
  });
}

/**
 * ファイルサイズをチェック（MB単位）
 */
export function checkFileSize(base64Data: string, maxSizeMB: number = 5): boolean {
  // Base64データのサイズを計算（バイト）
  const sizeInBytes = (base64Data.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  return sizeInMB <= maxSizeMB;
}

/**
 * 画像の縦横比を保持してリサイズサイズを計算
 */
export function calculateAspectRatioSize(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight, 1);
  
  return {
    width: Math.floor(originalWidth * ratio),
    height: Math.floor(originalHeight * ratio)
  };
}

/**
 * 画像形式の判定
 */
export function getImageFormat(dataUrl: string): string | null {
  const match = dataUrl.match(/^data:image\/([a-zA-Z]+);base64,/);
  return match ? match[1] : null;
}

/**
 * Base64データのサイズを取得（MB単位）
 */
export function getBase64Size(base64Data: string): number {
  const sizeInBytes = (base64Data.length * 3) / 4;
  return sizeInBytes / (1024 * 1024);
}