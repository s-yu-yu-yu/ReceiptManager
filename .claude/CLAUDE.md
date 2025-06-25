# Receipt Manager - プロジェクト仕様書

## 概要

レシート画像を AI（Gemini API）で解析し、家計簿管理を自動化する React Web アプリ。

## 技術スタック

- **Core**: React 19.1 + TypeScript 5.8 + Vite 6.3 + Tailwind CSS 4
- **UI**: Radix UI + Lucide Icons
- **State**: Zustand 5.0
- **DB**: Dexie (IndexedDB)
- **AI**: Google Gemini API
- **Camera**: React Camera Pro
- **Package Manager**: bun

## プロジェクト構造

```
src/
├── components/     # UI部品
├── lib/           # ユーティリティ・API連携
├── pages/         # 画面コンポーネント
├── stores/        # 状態管理
└── types/         # 型定義
```

## 主要機能

1. **レシート撮影・解析**: Gemini API で自動データ抽出
2. **データ管理**: IndexedDB でオフライン対応
3. **カテゴリ分類**: 8 種類のデフォルトカテゴリ
4. **分析機能**: Recharts でグラフ表示
5. **Notion 連携**: 自動同期・一括同期対応

## データモデル

```typescript
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

interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}
```

## 環境変数

```env
VITE_GEMINI_API_KEY=xxx
VITE_NOTION_API_KEY=xxx
VITE_NOTION_RECEIPTS_DATABASE_ID=xxx
```

## 開発コマンド

```bash
bun dev        # 開発サーバー
bun build      # ビルド
bun lint       # Lint
bun test       # テスト実行
```

## Git 運用

- **ブランチ**: `feature/*`, `fix/*`, `refactor/*`
- **コミット**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`

## 開発ガイドライン

1. **型安全性**: any を避け、types/index.ts で型管理
2. **エラー処理**: try-catch とユーザーフレンドリーなメッセージ
3. **パフォーマンス**: React.lazy、画像最適化、効率的な DB 操作
4. **セキュリティ**: API キーは環境変数、画像はローカル処理

## 現在の状態

- **完了**: Phase 1-2（基本機能、AI 連携）、Phase 4 部分（Notion 連携）
- **未実装**: Phase 3（分析機能）
- **進捗**: 62.5%

詳細は @.claude/IMPLEMENTATION_STATUS.md 参照。
