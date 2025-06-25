# Receipt Manager

レシート画像をAIで解析し、家計簿管理を自動化するReact Webアプリケーション。カメラでレシートを撮影するだけで、商品情報を自動抽出し、カテゴリ別の支出管理が可能です。

## 主な機能

- 📸 **レシート撮影・AI解析** - Gemini APIでレシート画像から情報を自動抽出
- 💾 **データ管理** - IndexedDBによるオフライン対応のローカルストレージ
- 📊 **支出分析** - カテゴリ別の支出統計（開発中）
- 🔗 **Notion連携** - レシートデータをNotionデータベースに自動同期
- 📱 **モバイル対応** - スマートフォンでの快適な操作

## 技術スタック

- **フロントエンド**: React 19.1.0 + TypeScript + Vite
- **スタイリング**: Tailwind CSS v4 + Radix UI
- **データベース**: IndexedDB (Dexie)
- **AI**: Google Gemini API
- **外部連携**: Notion API
- **カメラ**: React Camera Pro

## セットアップ

### 1. 依存関係のインストール

```bash
# bunを使用（推奨）
bun install

# または npm を使用
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定：

```env
# Gemini AI API Key（必須）
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Notion API Settings（オプション）
VITE_NOTION_API_KEY=your_notion_api_key_here
VITE_NOTION_RECEIPTS_DATABASE_ID=your_database_id_here
```

### 3. Gemini APIキーの取得

1. [Google AI Studio](https://aistudio.google.com/app/apikey)にアクセス
2. 「Get API key」をクリック
3. 取得したAPIキーを`.env.local`に設定

### 4. Notion連携の設定（オプション）

Notion連携を使用する場合は、以下の手順で設定：

#### 4.1 Notion APIキーの取得

1. [Notion Integrations](https://www.notion.so/my-integrations)にアクセス
2. 「新しいインテグレーション」をクリック
3. 以下の情報を入力：
   - 名前: Receipt Manager
   - ワークスペース: 使用するワークスペースを選択
4. 「送信」をクリック
5. 表示される「Internal Integration Token」をコピーして`.env.local`に設定

#### 4.2 Notionデータベースの作成

1. Notionで新しいページを作成
2. データベース（フルページ）を選択
3. 以下のプロパティを追加：

| プロパティ名 | タイプ | 説明 |
|------------|-------|------|
| 店舗名 | タイトル | レシートの店舗名 |
| 日付 | 日付 | 購入日 |
| 合計金額 | 数値 | レシート合計金額 |
| レシートID | テキスト | ローカルDBのID |
| 作成日時 | 日付 | レコード作成日時 |
| 更新日時 | 日付 | レコード更新日時 |

#### 4.3 データベースへのアクセス権限設定

1. 作成したデータベースページの右上「...」メニューをクリック
2. 「接続」をクリック
3. 作成したインテグレーション（Receipt Manager）を検索して追加

#### 4.4 データベースIDの取得

1. データベースページのURLをコピー
2. URLから以下の部分を抽出：
   ```
   https://www.notion.so/workspace-name/データベースID?v=xxx
   ```
   データベースIDは32文字の英数字
3. 取得したIDを`.env.local`に設定

#### 4.5 接続確認

アプリの設定画面でNotion連携セクションの「接続テスト」を実行して確認

## 開発

### 開発サーバーの起動

```bash
bun run dev
# または
npm run dev
```

http://localhost:5173 でアプリケーションにアクセス

### ビルド

```bash
bun run build
# または
npm run build
```

### Lint

```bash
bun run lint
# または
npm run lint
```

### テスト

```bash
# テスト実行
bun test
# または
npm run test

# UIモードでテスト実行
bun run test:ui

# カバレッジ付きテスト実行
bun run test:coverage
```

詳細なテスト情報は [docs/testing.md](docs/testing.md) を参照してください。

## 使い方

1. **レシート撮影**
   - ホーム画面の「+」ボタンをタップ
   - 「カメラで撮影」を選択
   - レシートを撮影

2. **AI解析**
   - 撮影後、自動的にAIがレシート内容を解析
   - 店舗名、日付、商品リストが自動抽出される

3. **内容確認・編集**
   - AI解析結果を確認
   - 必要に応じて修正
   - 「レシートを保存」をタップ

4. **Notion同期**（設定済みの場合）
   - 新規レシートは自動的にNotionに同期
   - 既存データは設定画面から一括同期可能

## プロジェクト構造

```
src/
├── components/          # UIコンポーネント
├── lib/                # ユーティリティ
│   ├── db.ts          # IndexedDB設定
│   ├── gemini.ts      # Gemini API連携
│   └── notion.ts      # Notion API連携
├── pages/              # ページコンポーネント
├── stores/             # 状態管理
└── types/              # TypeScript型定義
```

## トラブルシューティング

### カメラが起動しない
- HTTPS環境またはlocalhostでのみカメラ機能が使用可能
- ブラウザのカメラ権限を確認

### Notion同期エラー
- APIキーとデータベースIDが正しいか確認
- インテグレーションがデータベースに接続されているか確認
- **開発環境では接続テストが失敗します** - これは正常です
- 本番環境（デプロイ後）では正常に動作します

### AI解析エラー
- Gemini APIキーが正しく設定されているか確認
- APIの利用制限に達していないか確認

## ライセンス

Private Project