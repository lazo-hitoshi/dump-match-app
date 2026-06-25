# DumpLink 設計資料

`D:\dump-match-app\ko\outputs\` から本プロジェクトへ引き継いだ資料です。

## 読む順番

| 優先 | 資料 | 用途 |
|---:|---|---|
| 1 | [要件定義書_MVP.md](./要件定義書_MVP.md) | 何を作るかの中心資料 |
| 2 | [DB設計書_MVP.md](./DB設計書_MVP.md) | DB・API・権限設計（`supabase/migrations/` の元） |
| 3 | [本番化設計メモ.md](./本番化設計メモ.md) | 業務ルール・画面一覧・予約ルール |
| 4 | [Cursor引き継ぎ指示書.md](./Cursor引き継ぎ指示書.md) | Cursor への依頼手順・実装順 |
| 5 | [prototype/](./prototype/) | UI プロトタイプ（`index.html` をブラウザで開いて参照） |

## UI プロトタイプの見方

```bash
# ブラウザで開く（パスは環境に合わせて調整）
start docs/prototype/index.html
```

試作品は UI 参考用です。本番コードとしてそのまま使わず、Next.js 側に移植してください。
