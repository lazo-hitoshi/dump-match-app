-- Auth ユーザー作成後に実行（UID を自分の auth.users.id に置き換え）
-- companies は seed.sql の先頭ブロックを先に実行してください

insert into public.users (id, company_id, name, email, role, is_active) values
  ('46b7b2d4-5cb6-4296-b03e-a8a39e4db420', '11111111-1111-1111-1111-111111111101', '管理者', 'watanabe@hitoshi.cloud', 'operator', true)
on conflict (id) do update set
  company_id = excluded.company_id,
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  is_active = excluded.is_active;
