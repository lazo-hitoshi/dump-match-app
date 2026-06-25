-- 管理者がアプリから audit_logs を記録できるようにする（会社審査など）

create policy audit_logs_insert on public.audit_logs
  for insert
  with check (
    public.is_admin()
    and actor_user_id = auth.uid()
  );
