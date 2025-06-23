# 食費管理アプリ - Claude Code作業指示書

## 事前準備

### 環境構築
```bash
# Reactプロジェクトの初期化（Vite使用）
npm create vite@latest receipt-manager -- --template react-ts
cd receipt-manager

# 必要なパッケージのインストール
npm install -D tailwindcss postcss autoprefixer
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-tabs
npm install class-variance-authority clsx tailwind-merge lucide-react
npm install zustand dexie recharts react-webcam
npm install @google/generative-ai
npm install react-router-dom

# Tailwind CSS初期化
npx tailwindcss init -p
```

## Phase 1: 基本機能実装（2週間）

### タスク1: プロジェクトセットアップ

1. **Tailwind設定**
   - `tailwind.config.js`を更新してshadcn/ui対応
   - `src/index.css`にTailwindディレクティブ追加

2. **shadcn/ui初期化**
   ```bash
   npx shadcn-ui@latest init
   ```

3. **プロジェクト構造作成**
   ```
   src/
   ├── components/
   │   ├── ui/          # shadcn/uiコンポーネント
   │   ├── layout/      # レイアウトコンポーネント
   │   └── features/    # 機能別コンポーネント
   ├── lib/
   │   ├── db.ts        # IndexedDB設定
   │   └── utils.ts     # ユーティリティ関数
   ├── stores/          # Zustand stores
   ├── types/           # TypeScript型定義
   └── pages/           # ページコンポーネント
   ```

### タスク2: 基本UI構築

1. **底部ナビゲーション作成**
   - `src/components/layout/BottomNavigation.tsx`
   - Home、BarChart、Receipt、Settings のアイコン使用

2. **ページルーティング設定**
   - `src/App.tsx`でReact Router設定
   - 各ページのスケルトン作成

3. **ホーム画面実装**
   - 今月の合計額表示
   - 本日の支出カード
   - 最近のレシート一覧
   - FAB（追加ボタン）

### タスク3: IndexedDBセットアップ

1. **Dexie.js設定**（`src/lib/db.ts`）
   ```typescript
   import Dexie, { Table } from 'dexie';
   
   export interface Receipt {
     id?: string;
     date: Date;
     storeName: string;
     items: ReceiptItem[];
     totalAmount: number;
     imageUrl?: string;
     createdAt: Date;
     updatedAt: Date;
   }
   
   export interface ReceiptItem {
     id: string;
     name: string;
     category?: string;
     quantity: number;
     unitPrice: number;
     totalPrice: number;
   }
   
   class ReceiptDatabase extends Dexie {
     receipts!: Table<Receipt>;
     
     constructor() {
       super('ReceiptManagerDB');
       this.version(1).stores({
         receipts: '++id, date, storeName, totalAmount, createdAt'
       });
     }
   }
   
   export const db = new ReceiptDatabase();
   ```

2. **Zustandストア作成**（`src/stores/receiptStore.ts`）

### タスク4: レシート手動入力機能

1. **入力フォーム作成**
   - 店舗名、日付入力
   - 品目追加・削除機能
   - 合計金額自動計算

2. **バリデーション実装**
   - 必須項目チェック
   - 金額の妥当性確認

## Phase 2: AI連携（1週間）

### タスク1: Gemini AI API統合

1. **環境変数設定**
   - `.env.local`作成
   - `VITE_GEMINI_API_KEY`設定

2. **API呼び出し関数作成**（`src/lib/gemini.ts`）
   ```typescript
   import { GoogleGenerativeAI } from '@google/generative-ai';
   
   const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
   
   export async function analyzeReceipt(imageBase64: string) {
     const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
     
     const prompt = `レシート画像から以下の情報を抽出してください：
     - 店舗名
     - 購入日
     - 各商品（名前、数量、単価、合計）
     - 合計金額
     
     JSON形式で返してください。`;
     
     const result = await model.generateContent([
       prompt,
       {
         inlineData: {
           mimeType: "image/jpeg",
           data: imageBase64
         }
       }
     ]);
     
     return JSON.parse(result.response.text());
   }
   ```

### タスク2: カメラ機能実装

1. **カメラコンポーネント作成**（`src/components/features/CameraCapture.tsx`）
   - react-webcam使用
   - ガイド枠表示
   - 撮影・再撮影機能

2. **画像処理**
   - Canvas APIで画像リサイズ
   - Base64エンコード

### タスク3: レシート読み取り処理

1. **読み取り結果確認画面**
   - AI解析結果表示
   - 編集可能なフォーム
   - 保存前の確認

## Phase 3: 分析機能（1週間）

### タスク1: グラフ表示機能

1. **分析画面実装**（`src/pages/AnalyticsPage.tsx`）
   - タブ切替（週/月/年）
   - Rechartsによるグラフ表示

2. **グラフコンポーネント作成**
   - 支出推移（棒グラフ）
   - カテゴリ別（横棒グラフ）
   - 円グラフ

### タスク2: 統計計算ロジック

1. **集計関数作成**（`src/lib/analytics.ts`）
   - 期間別集計
   - カテゴリ別集計
   - 前期間比較

2. **データフォーマット処理**
   - Recharts用データ変換
   - 日付フォーマット

### タスク3: フィルタリング機能

1. **検索・フィルターUI**
   - 期間選択
   - カテゴリフィルター
   - 金額範囲指定

2. **フィルターロジック実装**
   - IndexedDBクエリ最適化
   - リアルタイム検索

## Phase 4: 拡張機能（1週間）

### タスク1: Notion API連携

1. **Notion設定画面**
   - APIキー入力
   - データベースID設定
   - 同期設定

2. **同期処理実装**（`src/lib/notion.ts`）
   - データアップロード
   - 差分同期
   - エラーハンドリング

### タスク2: エクスポート機能

1. **CSVエクスポート**
   - 期間指定
   - フォーマット選択
   - ダウンロード処理

2. **データバックアップ**
   - JSON形式エクスポート
   - インポート機能

### タスク3: UI改善・バグ修正

1. **パフォーマンス最適化**
   - 無限スクロール実装
   - 画像の遅延読み込み
   - メモ化

2. **PWA対応**
   - Service Worker設定
   - オフライン対応
   - インストール可能化

## 各フェーズ共通の注意事項

### コード品質
- TypeScriptの型定義を徹底
- ESLint/Prettierの設定と適用
- コンポーネントの適切な分割

### テスト
- 主要機能のユニットテスト作成
- E2Eテストの検討

### コミット規則
- feat: 新機能
- fix: バグ修正
- refactor: リファクタリング
- docs: ドキュメント
- style: スタイル調整

### セキュリティ
- APIキーの適切な管理
- XSS対策
- データバリデーション

## デバッグ・動作確認コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# 型チェック
npm run type-check

# リント
npm run lint
```

## トラブルシューティング

### よくある問題
1. **Gemini API エラー**
   - APIキーの確認
   - クォータ制限の確認
   - CORS設定

2. **IndexedDB エラー**
   - ブラウザ互換性
   - ストレージ容量
   - 同期処理の競合

3. **カメラアクセス**
   - HTTPS必須
   - 権限設定
   - デバイス互換性