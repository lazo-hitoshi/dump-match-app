-- 近傍マッチング: 空きダンプ・承認済み会社を相互に閲覧可能にする

create policy companies_select_approved_partners on public.companies
  for select using (
    status = 'approved'
    and company_type in ('site_company', 'truck_company', 'both')
  );

create policy trucks_select_available on public.trucks
  for select using (status = 'available');

create policy truck_availabilities_select_available on public.truck_availabilities
  for select using (
    is_active = true
    and exists (
      select 1
      from public.trucks t
      where t.id = truck_availabilities.truck_id
        and t.status = 'available'
    )
  );
