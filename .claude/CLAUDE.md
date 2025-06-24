# Receipt Manager - プロジェクト設計・実装状況

## プロジェクト概要

Receipt Manager は、レシート画像を AI（Gemini API）で解析し、家計簿管理を自動化する React Web アプリケーションです。カメラでレシートを撮影するだけで、商品情報を自動抽出し、カテゴリ別の支出管理や予算管理が可能です。

## 技術スタック

### フロントエンド

- **フレームワーク**: React 19.1.0
- **開発環境**: Vite 6.3.5
- **プログラミング言語**: TypeScript 5.8.3
- **スタイリング**: Tailwind CSS 4.1.10
- **UI コンポーネント**: Radix UI（Dialog, Select, Label 等）
- **アイコン**: Lucide React
- **ルーティング**: React Router DOM 7.6.2
- **状態管理**: Zustand 5.0.5
- **カメラ機能**: React Camera Pro 1.4.0
- **チャート表示**: Recharts

### バックエンド・データベース

- **ローカル DB**: Dexie (IndexedDB wrapper)
- **AI 解析**: Google Gemini API (@google/genai)
- **外部連携**: Notion API (@notionhq/client)

### 開発ツール

- **バンドラー**: Vite
- **Linter**: ESLint 9.25.0 + TypeScript ESLint
- **パッケージマネージャー**: bun（npm から移行済み）

## アーキテクチャ

### プロジェクト構造

```
/src/
├── components/          # コンポーネント
│   ├── features/       # 機能別コンポーネント
│   │   ├── CameraCapture.tsx      # カメラ撮影機能
│   │   └── ReceiptConfirmation.tsx # レシート確認画面
│   ├── layout/         # レイアウトコンポーネント
│   │   └── BottomNavigation.tsx   # ボトムナビゲーション
│   └── ui/             # 基本UIコンポーネント
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       └── FloatingActionButton.tsx # FAB共通コンポーネント
├── lib/                # ユーティリティ
│   ├── db.ts          # Dexie データベース設定
│   ├── gemini.ts      # Gemini API連携
│   ├── notion.ts      # Notion API連携
│   ├── categories.ts  # カテゴリ一元管理
│   ├── homeHelpers.ts # ホーム画面用データ集計
│   └── utils.ts       # 汎用ユーティリティ
├── pages/              # ページコンポーネント
│   ├── AddReceiptPage.tsx    # レシート追加
│   ├── AnalyticsPage.tsx     # 分析画面
│   ├── HomePage.tsx          # ホーム画面
│   ├── ReceiptsPage.tsx      # レシート一覧
│   └── SettingsPage.tsx      # 設定画面
├── stores/             # Zustand状態管理
├── types/              # TypeScript型定義
│   └── index.ts
└── main.tsx           # アプリケーションエントリーポイント
```

## 主要機能

### 1. レシート撮影・AI 解析

- **カメラ撮影**: React Camera Pro によるモバイル最適化レシート撮影
- **高品質撮影**: フルHD解像度、背面カメラ自動選択、最適化された画質
- **AI 解析**: Gemini API でレシート画像から以下を自動抽出
  - 店舗名
  - 購入日
  - 商品リスト（商品名、数量、単価、合計金額、カテゴリ）
  - 合計金額
  - 解析信頼度

### 2. データ管理

- **ローカルストレージ**: IndexedDB（Dexie）によるオフライン対応
- **データ構造**:
  - `receipts`: レシート基本情報
  - `receiptItems`: 商品詳細情報
  - `categories`: カテゴリマスタ
  - `monthlyBudgets`: 月別予算設定
  - `settings`: アプリ設定

### 3. カテゴリ管理

- **デフォルトカテゴリ**: 食費、日用品、交通費、外食、娯楽、医療費、衣服、その他
- **カスタマイズ**: アイコン、色、並び順の設定

### 4. 分析・レポート機能

- **月別集計**: カテゴリ別支出統計
- **チャート表示**: Recharts による視覚的な分析
- **予算管理**: カテゴリ別予算設定と実績比較

### 5. Notion連携機能

- **自動同期**: 新規レシート保存時にNotionへ自動同期
- **一括同期**: 既存レシートの一括Notion同期
- **接続テスト**: API設定の検証機能
- **エラーハンドリング**: 同期失敗時の適切な処理

## データベース設計

### テーブル構造（IndexedDB）

```typescript
// Receipt: レシート基本情報
interface Receipt {
  id?: number;
  date: Date;
  storeName: string;
  items: ReceiptItem[];
  totalAmount: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ReceiptItem: 商品詳細
interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

// Category: カテゴリマスタ
interface Category {
  id?: number;
  name: string;
  icon?: string;
  color?: string;
  order: number;
}
```

## AI 連携仕様

### Gemini API 設定

- **モデル**: gemini-2.5-flash
- **入力**: レシート画像（Base64 エンコード）
- **出力**: JSON 形式の構造化データ
- **エラーハンドリング**: レスポンス検証と補正処理

### プロンプト設計

日本語レシートに特化した解析プロンプトで以下を抽出：

- 店舗名の正確な認識
- 日本語商品名の保持
- 数値データの型安全性確保
- カテゴリの自動分類

## 開発・ビルドコマンド

### 基本コマンド

```bash
# 開発サーバー起動
bun run dev

# プロダクションビルド
bun run build

# Lint実行
bun run lint

# プレビュー
bun run preview
```

### 環境変数

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_NOTION_API_KEY=your_notion_api_key
VITE_NOTION_RECEIPTS_DATABASE_ID=your_database_id
```

## 設定ファイル

### TypeScript 設定

- **tsconfig.json**: プロジェクト参照設定
- **tsconfig.app.json**: アプリケーション用設定
- **tsconfig.node.json**: Node.js 用設定
- **パスエイリアス**: `@/*` → `./src/*`

### ESLint 設定

- **TypeScript 対応**: typescript-eslint 使用
- **React 対応**: react-hooks, react-refresh 対応
- **推奨ルール**: JS と TypeScript の recommended 設定

### Vite 設定

- **React**: @vitejs/plugin-react 使用
- **Tailwind**: @tailwindcss/vite 統合
- **エイリアス**: `@` → `/src`

## ブランチ・Git 運用

### ブランチ戦略

- **メインブランチ**: main
- **フィーチャーブランチ**: `feature/機能名`
- **バグ修正**: `fix/修正内容`

### コミットメッセージ規約

```bash
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
refactor: リファクタリング
style: コードスタイル修正
test: テスト追加・修正
```

## 開発上の注意点

### 1. 型安全性

- **厳密な型定義**: `any`の使用を避ける
- **インターフェース統一**: `types/index.ts`で一元管理
- **実行時検証**: Gemini API レスポンスの型検証実装

### 2. パフォーマンス最適化

- **遅延読み込み**: React.lazy 使用推奨
- **画像最適化**: WebP 形式推奨
- **IndexedDB**: 大量データの効率的な管理

### 3. エラーハンドリング

- **API 呼び出し**: 適切な try-catch 実装
- **画像処理**: ファイルサイズ・形式チェック
- **ユーザビリティ**: わかりやすいエラーメッセージ

### 4. セキュリティ

- **API キー**: 環境変数での管理必須
- **画像データ**: ローカル処理でプライバシー保護

### 5. 開発フロー

- **作業完了後**: IMPLEMENTATION_STATUS.md を更新
- **作業完了後**: CLAUDE.md を更新
- **作業完了後**: MCP を利用してユーザーに通知

## トラブルシューティング

### よく使うコマンド

```bash
# node_modules再インストール
rm -rf node_modules bun.lockb && bun install

# キャッシュクリア
rm -rf dist .vite

# 型チェック
bun x tsc --noEmit
```

### 既知の問題

- Gemini API 制限: リクエスト頻度制限に注意
- ブラウザ互換性: IndexedDB 対応ブラウザでのみ動作
- カメラ機能: HTTPS環境またはlocalhostでのみ動作

## パッケージ管理

- **現在**: bun 使用（npm から移行済み）
- **ロックファイル**: bun.lockb
- **推奨**: 継続して bun を使用
