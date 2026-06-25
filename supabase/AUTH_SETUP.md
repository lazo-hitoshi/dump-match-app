# Supabase Auth セットアップ

`seed.sql` の `public.users` は `auth.users` を参照します。以下の順でセットアップしてください。

## 1. マイグレーション実行

Supabase SQL Editor で以下を順に実行します。

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/seed.sql` の **companies 以降は Auth 作成後**

## 2. 管理者ユーザーを作成

Supabase Dashboard → Authentication → Users → Add user

| 項目 | 値 |
|---|---|
| Email | admin@dumplink.example |
| Password | （開発用パスワード） |
| User UID | `22222222-2222-2222-2222-222222222201` |

UID を固定するには Admin API または SQL で作成します。

```sql
-- service role で実行（Dashboard の SQL Editor では auth スキーマに直接 insert 可）
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
) values (
  '22222222-2222-2222-2222-222222222201',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@dumplink.example',
  crypt('your-password', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false
);
```

その後 `seed.sql` の users 以降を実行します。

## 3. 動作確認

```bash
npm run dev
```

`http://localhost:3000/login` でログイン → `/dashboard` に KPI が表示されれば OK です。
