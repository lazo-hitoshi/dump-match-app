-- テストユーザー紐づけ（Supabase SQL Editor で Run）
-- lazoltd88@gmail.com → ダンプ会社（東湾ダンプ）
-- lazo.ltd1964@gmail.com → 現場会社（湾岸建設）

insert into public.users (id, company_id, name, email, role, is_active) values
  ('0d52bb66-56ef-4041-b241-5dd98e879ba8', '11111111-1111-1111-1111-111111111201', '配車 一郎', 'lazoltd88@gmail.com', 'dispatcher', true),
  ('f07bfb59-09f4-44ba-b0b3-3ae325e6e4e3', '11111111-1111-1111-1111-111111111102', '現場 太郎', 'lazo.ltd1964@gmail.com', 'company_admin', true)
on conflict (id) do update set
  company_id = excluded.company_id,
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  is_active = excluded.is_active;

-- 確認
select u.email, u.role, c.name as company_name, c.company_type
from public.users u
join public.companies c on c.id = u.company_id
where u.email in ('lazoltd88@gmail.com', 'lazo.ltd1964@gmail.com', 'watanabe@hitoshi.cloud');
