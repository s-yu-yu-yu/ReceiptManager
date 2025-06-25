# テスト環境セットアップ

このプロジェクトではVitestを使用してユニットテストを実行します。

## 環境構成

- **テストフレームワーク**: [Vitest](https://vitest.dev/)
- **DOM環境**: jsdom
- **React Testing Library**: React コンポーネントのテスト用
- **Test Database Mock**: fake-indexeddb（IndexedDBのモック）

## セットアップ内容

### 1. 依存関係
```json
{
  "devDependencies": {
    "vitest": "^3.2.4",
    "@vitest/ui": "^3.2.4",
    "jsdom": "^26.1.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.6.1",
    "fake-indexeddb": "^6.0.1"
  }
}
```

### 2. 設定ファイル
- `vitest.config.ts`: Vitest設定
- `src/test/setup.ts`: テストセットアップファイル

### 3. テストスクリプト
```bash
# 全テスト実行
bun test

# UIモードでテスト実行
bun run test:ui

# カバレッジ付きテスト実行
bun run test:coverage
```

## テスト方針

### 対象範囲
1. **ユーティリティ関数**: 純粋関数のロジックをテスト
2. **ビジネスロジック**: カテゴリ処理、データ変換など
3. **UI コンポーネント**: 基本的な描画とイベント処理

### テスト除外対象
- データベース操作を含む関数（統合テストで対応）
- 外部API呼び出し（モックが複雑になるため）
- 複雑なReactコンポーネント（E2Eテストで対応）

## テストファイル構成

```
src/
├── lib/
│   ├── __tests__/
│   │   ├── utils.test.ts
│   │   ├── categories.test.ts
│   │   └── homeHelpers.test.ts
│   └── ...
└── test/
    └── setup.ts
```

## テストガイドライン

### 1. テストの品質
- **テストコードは通ることを目的とせず、意味のあるものにすること**（t-wada氏の方針に従う）
- エッジケースを含む網羅的なテスト
- 可読性の高いテストコード

### 2. 命名規則
```typescript
describe('関数名またはコンポーネント名', () => {
  it('should 期待される動作を記述', () => {
    // テストコード
  })
})
```

### 3. テストケース設計
- 正常系
- 異常系
- 境界値
- エッジケース

## 実装済みテスト

### utilities (src/lib/__tests__/utils.test.ts)
- `cn()` 関数: クラス名結合とTailwind競合解決

### categories (src/lib/__tests__/categories.test.ts)
- `DEFAULT_CATEGORIES`: カテゴリ定数の検証
- `getCategoryNames()`: カテゴリ名リスト取得
- `getCategoryByName()`: カテゴリ名による検索

### homeHelpers (src/lib/__tests__/homeHelpers.test.ts)
- `formatDateForDisplay()`: 日付フォーマット
- `getCurrentMonthString()`: 現在月表示
- `getMainCategories()`: レシートのメインカテゴリ抽出

## 今後の拡張

1. **Reactコンポーネントテスト**: DOM環境の改善後に追加
2. **統合テスト**: データベース操作を含むテスト
3. **E2Eテスト**: Playwright等を使用したエンドツーエンドテスト
4. **視覚回帰テスト**: Storybookとの連携

## トラブルシューティング

### よくある問題
1. **DOM環境エラー**: `jsdom` の設定確認
2. **モック失敗**: `vi.mock()` の記述確認
3. **型エラー**: `@types` パッケージの確認

### デバッグ方法
```bash
# 特定のテストファイルのみ実行
bun test src/lib/__tests__/utils.test.ts

# 詳細ログ出力
bun test --reporter=verbose
```