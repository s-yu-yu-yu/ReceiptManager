# 食費管理アプリ - Claude Code作業指示書

## 事前準備

### 環境構築
```bash
# Reactプロジェクトの初期化（Vite使用）
bun create vite@latest receipt-manager -- --template react-ts
cd receipt-manager

# パッケージマネージャをbunに移行
bun install

# 必要なパッケージのインストール
bun add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-tabs
bun add class-variance-authority clsx tailwind-merge lucide-react
bun add zustand dexie recharts react-webcam
bun add @google/genai  # 最新のGemini APIライブラリ
bun add react-router-dom
bun add @tailwindcss/vite  # Tailwind CSS v4用

# shadcn/ui初期化
bunx shadcn@latest init
bunx shadcn@latest add button card label input select
```

### ✅ 実装完了状況
- **Phase 1**: ✅ 完了（基本機能実装）
- **Phase 2**: ✅ 完了（AI連携機能）
- **Phase 3**: 🔄 未実装（分析機能）
- **Phase 4**: 🔄 未実装（拡張機能）

## Phase 1: 基本機能実装 ✅ 完了

### ✅ タスク1: プロジェクトセットアップ

1. **Tailwind設定**
   - ✅ Tailwind CSS v4対応（@tailwindcss/vite使用）
   - ✅ `src/index.css`にTailwindディレクティブ追加
   - ✅ postcss.config.js不要（Tailwind v4の新機能）

2. **shadcn/ui初期化**
   - ✅ shadcn/ui設定完了
   - ✅ button, card, label, input, selectコンポーネント追加

3. **プロジェクト構造作成**
   ```
   src/
   ├── components/
   │   ├── ui/          # ✅ shadcn/uiコンポーネント
   │   ├── layout/      # ✅ レイアウトコンポーネント
   │   └── features/    # ✅ 機能別コンポーネント
   ├── lib/
   │   ├── db.ts        # ✅ IndexedDB設定
   │   ├── utils.ts     # ✅ ユーティリティ関数
   │   ├── gemini.ts    # ✅ Gemini AI API
   │   └── imageUtils.ts # ✅ 画像処理ユーティリティ
   ├── stores/          # 🔄 Zustand stores（未使用）
   ├── types/           # ✅ TypeScript型定義
   └── pages/           # ✅ ページコンポーネント
   ```

### ✅ タスク2: 基本UI構築

1. **底部ナビゲーション作成**
   - ✅ `src/components/layout/BottomNavigation.tsx`実装完了
   - ✅ Home、BarChart、Receipt、Settings のアイコン使用
   - ✅ React Routerによるページ遷移

2. **ページルーティング設定**
   - ✅ `src/App.tsx`でReact Router設定完了
   - ✅ 全ページスケルトン作成済み
   - ✅ `/receipts/add`ルート追加

3. **ホーム画面実装**
   - ✅ 今月の合計額表示（モックデータ）
   - ✅ 本日の支出カード
   - ✅ 最近のレシート一覧（モックデータ）
   - ✅ FAB（追加ボタン）- レシート追加ページへ遷移

### ✅ タスク3: IndexedDBセットアップ

1. **Dexie.js設定完了**（`src/lib/db.ts`）
   ```typescript
   import Dexie, { type Table } from "dexie";
   
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
     quantity: number;
     unitPrice: number;
     totalPrice: number;
     category?: string;
   }
   
   export class ReceiptDatabase extends Dexie {
     receipts!: Table<Receipt>;
     receiptItems!: Table<ReceiptItem>;
     categories!: Table<Category>;
     monthlyBudgets!: Table<MonthlyBudget>;
     settings!: Table<Settings>;
   
     constructor() {
       super("ReceiptDatabase");
       this.version(1).stores({
         receipts: "id, date, storeName, totalAmount, createdAt",
         receiptItems: "++id, receiptId, name, category",
         categories: "++id, name, order",
         monthlyBudgets: "++id, yearMonth, categoryId",
         settings: "++id, key",
       });
     }
   }
   
   export const db = new ReceiptDatabase();
   ```
   - ✅ 5つのテーブル定義完了
   - ✅ 初期カテゴリデータ自動投入機能
   - ✅ 型安全なデータベース操作

2. **Zustandストア**
   - 🔄 未実装（現在はIndexedDB直接操作）

### 🔄 タスク4: レシート手動入力機能（Phase 2で統合実装）

- 📝 手動入力機能は後日実装予定
- ✅ AI連携版のレシート確認・編集フォームで代替実装済み

## Phase 2: AI連携 ✅ 完了

### ✅ タスク1: Gemini AI API統合

1. **環境変数設定**
   - ✅ `.env.local`作成済み
   - ✅ `VITE_GEMINI_API_KEY`設定済み

2. **API呼び出し関数作成**（`src/lib/gemini.ts`）
   ```typescript
   import { GoogleGenAI } from "@google/genai";
   
   const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
   
   export async function analyzeReceipt(imageBase64: string): Promise<AnalyzedReceipt> {
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
     // レスポンス処理とデータ検証
   }
   ```
   - ✅ 最新の`@google/genai`ライブラリ使用
   - ✅ `gemini-2.5-flash`モデル使用
   - ✅ 詳細なプロンプトエンジニアリング
   - ✅ エラーハンドリングと型安全性

### ✅ タスク2: カメラ機能実装

1. **カメラコンポーネント作成**（`src/components/features/CameraCapture.tsx`）
   - ✅ react-webcam使用
   - ✅ レシート撮影用ガイド枠表示
   - ✅ 撮影・再撮影・確定機能
   - ✅ 背面カメラ優先設定
   - ✅ カメラ準備中表示
   - ✅ 解析中のローディング表示

2. **画像処理**（`src/lib/imageUtils.ts`）
   - ✅ Canvas APIで画像リサイズ
   - ✅ Base64エンコード処理
   - ✅ 画像最適化（1024x768、品質80%）
   - ✅ ファイルサイズチェック機能
   - ✅ 縦横比保持リサイズ

### ✅ タスク3: レシート読み取り処理

1. **読み取り結果確認画面**（`src/components/features/ReceiptConfirmation.tsx`）
   - ✅ AI解析結果表示
   - ✅ 信頼度による警告表示
   - ✅ 編集可能なフォーム（店舗名、日付、商品詳細）
   - ✅ 商品の追加・削除機能
   - ✅ 単価×数量の自動計算
   - ✅ カテゴリ選択（6種類）
   - ✅ 合計金額の自動計算
   - ✅ バリデーション機能
   - ✅ IndexedDBへの保存

2. **統合フロー**（`src/pages/AddReceiptPage.tsx`）
   - ✅ 撮影方法選択
   - ✅ カメラ撮影
   - ✅ AI解析
   - ✅ 結果確認・編集
   - ✅ データ保存
   - ✅ ホーム画面へ戻る

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
bun dev

# ビルド
bun run build

# プレビュー
bun run preview

# リント
bun run lint
```

## トラブルシューティング

### よくある問題
1. **Gemini API エラー**
   - ✅ APIキーの確認（.env.localに設定）
   - ✅ 最新ライブラリ@google/genai使用
   - ✅ gemini-2.5-flashモデル使用
   - クォータ制限の確認
   - CORS設定

2. **IndexedDB エラー**
   - ✅ Dexie.js使用で互換性確保
   - ✅ 型安全なスキーマ定義
   - ストレージ容量
   - 同期処理の競合

3. **カメラアクセス**
   - ✅ HTTPS必須（開発時はlocalhostで可能）
   - ✅ react-webcam使用で権限管理
   - ✅ 背面カメラ優先設定
   - デバイス互換性

4. **パッケージ管理**
   - ✅ bunパッケージマネージャ使用
   - ✅ package-lock.json削除済み
   - ✅ bun.lockb使用

5. **Tailwind CSS v4**
   - ✅ @tailwindcss/vite使用
   - ✅ postcss.config.js不要
   - ✅ 最新の設定対応済み