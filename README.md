# DumpLink MVP

ダンプ・現場マッチングアプリの MVP 本番版です。

## 技術構成

- Next.js 15 + TypeScript + Tailwind CSS
- Supabase Auth / PostgreSQL / Storage

## セットアップ

1. 依存関係をインストール

```bash
npm install
```

2. 環境変数を設定

```bash
copy .env.local.example .env.local
```

3. Supabase プロジェクトを作成し、マイグレーションを SQL Editor で実行

| 順番 | ファイル |
|------|----------|
| ① | `supabase/migrations/001_initial_schema.sql` |
| ② | `supabase/migrations/002_audit_logs_insert_policy.sql` |
| ③ | `supabase/migrations/003_backfill_coordinates.sql`（地図用座標） |

4. Supabase Auth で管理者ユーザーを作成（例: `watanabe@hitoshi.cloud`）

5. `supabase/seed-after-auth.sql` を実行（会社マスタ + テストデータ + 管理者紐づけ）

6. （任意）現場会社・ダンプ会社のテストユーザー

- Auth で `site-test@hitoshi.cloud` / `truck-test@hitoshi.cloud` を作成
- `supabase/seed-test-users.sql` の UID を置き換えて実行

7. 開発サーバー起動

```bash
npm run dev
```

ブラウザはターミナルに表示された `Local:` の URL を開いてください（例: `http://localhost:3000/login`）。

## Vercel デプロイ

1. GitHub にリポジトリを push
2. [Vercel](https://vercel.com) で New Project → リポジトリをインポート
3. Environment Variables に以下を設定

| 名前 | 値 |
|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |

4. Deploy 後、Supabase → Authentication → URL Configuration に本番 URL を追加

| 項目 | 例 |
|------|-----|
| Site URL | `https://your-app.vercel.app` |
| Redirect URLs | `https://your-app.vercel.app/**` |

## ディレクトリ

| パス | 内容 |
|---|---|
| `app/(dashboard)/` | 認証後の各画面 |
| `components/layout/` | サイドバー・ヘッダー |
| `lib/actions/` | サーバーアクション（CRUD・予約） |
| `docs/` | 設計資料・UIプロトタイプ |
| `types/` | DB 型・ドメイン型 |
| `supabase/migrations/` | SQL マイグレーション |
| `supabase/seed-after-auth.sql` | Auth 後の seed |
| `supabase/seed-test-users.sql` | 会社別テストユーザー |

## MVP 仮ルール

- 予約承認: 管理者のみ
- GPS: なし（OpenStreetMap で地図表示、住所から座標取得）
- 請求・支払: 手動
- ドライバー電話: 予約確定後のみ表示

## 資料

設計資料はプロジェクト内の [`docs/`](./docs/) にあります。

| 資料 | パス |
|---|---|
| 要件定義書 | `docs/要件定義書_MVP.md` |
| DB設計書 | `docs/DB設計書_MVP.md` |
| 本番化設計メモ | `docs/本番化設計メモ.md` |
| Cursor引き継ぎ指示書 | `docs/Cursor引き継ぎ指示書.md` |
| UIプロトタイプ | `docs/prototype/index.html` |
