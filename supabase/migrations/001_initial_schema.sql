-- DumpLink MVP initial schema
-- Based on DB設計書_MVP.md

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  company_code text not null unique,
  company_type text not null check (company_type in ('site_company', 'truck_company', 'both', 'operator')),
  name text not null,
  corporate_number text,
  representative_name text,
  postal_code text,
  address text not null,
  phone text not null,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  review_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  name text not null,
  email text not null unique,
  phone text,
  role text not null check (role in ('system_admin', 'operator', 'company_admin', 'dispatcher', 'driver', 'viewer')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Auth helpers (must be defined after public.users exists)
create or replace function public.current_user_profile()
returns public.users
language sql
stable
security definer
set search_path = public
as $$
  select u.*
  from public.users u
  where u.id = auth.uid()
    and u.is_active = true;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.is_active = true
      and u.role in ('system_admin', 'operator')
  );
$$;

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.company_id
  from public.users u
  where u.id = auth.uid()
    and u.is_active = true;
$$;

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  driver_code text not null unique,
  name text not null,
  phone text,
  license_type text not null,
  skills text[] not null default '{}',
  license_expires_on date,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.trucks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  truck_code text not null unique,
  plate_number text not null unique,
  truck_type text not null,
  load_capacity numeric,
  skills text[] not null default '{}',
  base_address text,
  base_lat numeric,
  base_lng numeric,
  desired_daily_price integer,
  vehicle_inspection_expires_on date,
  insurance_expires_on date,
  status text not null default 'available' check (status in ('available', 'held', 'booked', 'unavailable')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  site_code text not null unique,
  name text not null,
  address text not null,
  lat numeric,
  lng numeric,
  start_date date not null,
  end_date date not null,
  required_truck_count integer not null check (required_truck_count >= 1),
  required_skills text[] not null default '{}',
  daily_price integer not null check (daily_price >= 0),
  payment_terms text,
  notes text,
  status text not null default 'draft' check (status in ('draft', 'open', 'paused', 'filled', 'completed', 'canceled')),
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (end_date >= start_date)
);

create table public.truck_availabilities (
  id uuid primary key default gen_random_uuid(),
  truck_id uuid not null references public.trucks(id) on delete cascade,
  driver_id uuid references public.drivers(id) on delete set null,
  available_start_date date not null,
  available_end_date date not null,
  area_note text,
  desired_daily_price integer,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (available_end_date >= available_start_date)
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  reservation_code text not null unique,
  site_id uuid not null references public.sites(id) on delete restrict,
  truck_id uuid not null references public.trucks(id) on delete restrict,
  driver_id uuid references public.drivers(id) on delete set null,
  applicant_company_id uuid not null references public.companies(id) on delete restrict,
  approved_by uuid references public.users(id) on delete set null,
  start_date date not null,
  end_date date not null,
  fixed_daily_price integer not null check (fixed_daily_price >= 0),
  status text not null default 'requested' check (
    status in ('requested', 'approved', 'booked', 'in_progress', 'completed', 'canceled', 'rejected')
  ),
  cancel_reason text,
  note text,
  requested_at timestamptz not null default timezone('utc', now()),
  approved_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (end_date >= start_date)
);

create table public.reservation_status_logs (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid not null references public.users(id) on delete restrict,
  reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  target_type text not null check (target_type in ('company', 'truck', 'driver', 'reservation', 'site')),
  target_id uuid not null,
  document_type text not null,
  file_url text not null,
  original_filename text not null,
  expires_on date,
  uploaded_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  related_type text,
  related_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references public.users(id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  before_data jsonb,
  after_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Reservation overlap guard
-- ---------------------------------------------------------------------------

alter table public.reservations
  add constraint reservations_no_truck_overlap
  exclude using gist (
    truck_id with =,
    daterange(start_date, end_date, '[]') with &&
  )
  where (status in ('approved', 'booked', 'in_progress'));

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------

create or replace view public.site_reservation_summary
with (security_invoker = true)
as
select
  s.id as site_id,
  s.required_truck_count,
  count(r.id) filter (
    where r.status in ('approved', 'booked', 'in_progress')
  ) as booked_count,
  s.required_truck_count - count(r.id) filter (
    where r.status in ('approved', 'booked', 'in_progress')
  ) as remaining_count,
  (s.required_truck_count - count(r.id) filter (
    where r.status in ('approved', 'booked', 'in_progress')
  )) <= 0 as is_filled
from public.sites s
left join public.reservations r on r.site_id = s.id
group by s.id, s.required_truck_count;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index companies_status_idx on public.companies(status);
create index users_company_id_idx on public.users(company_id);
create index trucks_company_id_status_idx on public.trucks(company_id, status);
create index trucks_skills_idx on public.trucks using gin(skills);
create index sites_company_id_status_idx on public.sites(company_id, status);
create index sites_dates_idx on public.sites(start_date, end_date);
create index sites_required_skills_idx on public.sites using gin(required_skills);
create index truck_availabilities_truck_id_idx on public.truck_availabilities(truck_id);
create index truck_availabilities_dates_idx on public.truck_availabilities(available_start_date, available_end_date);
create index reservations_site_id_idx on public.reservations(site_id);
create index reservations_truck_dates_idx on public.reservations(truck_id, start_date, end_date);
create index reservations_status_idx on public.reservations(status);
create index notifications_user_read_idx on public.notifications(user_id, read_at);
create index audit_logs_target_idx on public.audit_logs(target_type, target_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger set_companies_updated_at before update on public.companies
  for each row execute function public.set_updated_at();
create trigger set_users_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger set_drivers_updated_at before update on public.drivers
  for each row execute function public.set_updated_at();
create trigger set_trucks_updated_at before update on public.trucks
  for each row execute function public.set_updated_at();
create trigger set_sites_updated_at before update on public.sites
  for each row execute function public.set_updated_at();
create trigger set_truck_availabilities_updated_at before update on public.truck_availabilities
  for each row execute function public.set_updated_at();
create trigger set_reservations_updated_at before update on public.reservations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Reservation business functions
-- ---------------------------------------------------------------------------

create or replace function public.site_remaining_count(p_site_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(srs.remaining_count, 0)::integer
  from public.site_reservation_summary srs
  where srs.site_id = p_site_id;
$$;

create or replace function public.skills_match(required_skills text[], available_skills text[])
returns boolean
language sql
immutable
as $$
  select coalesce(required_skills, '{}') <@ coalesce(available_skills, '{}');
$$;

create or replace function public.request_reservation(
  p_site_id uuid,
  p_truck_id uuid,
  p_driver_id uuid,
  p_start_date date,
  p_end_date date,
  p_note text default null
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users;
  v_site public.sites;
  v_truck public.trucks;
  v_driver public.drivers;
  v_site_company public.companies;
  v_truck_company public.companies;
  v_reservation public.reservations;
  v_code text;
begin
  select * into v_user from public.users where id = auth.uid() and is_active = true;
  if not found then
    raise exception 'Unauthorized';
  end if;

  if v_user.role not in ('system_admin', 'operator', 'company_admin', 'dispatcher') then
    raise exception 'Permission denied';
  end if;

  select * into v_site from public.sites where id = p_site_id for update;
  if not found then raise exception 'Site not found'; end if;

  select * into v_truck from public.trucks where id = p_truck_id for update;
  if not found then raise exception 'Truck not found'; end if;

  select * into v_site_company from public.companies where id = v_site.company_id;
  select * into v_truck_company from public.companies where id = v_truck.company_id;

  if v_site_company.status <> 'approved' or v_truck_company.status <> 'approved' then
    raise exception 'Company not approved';
  end if;

  if v_site.status <> 'open' then
    raise exception 'Site is not open';
  end if;

  if public.site_remaining_count(v_site.id) <= 0 then
    raise exception 'No remaining truck slots';
  end if;

  if v_truck.status = 'unavailable' then
    raise exception 'Truck unavailable';
  end if;

  if p_driver_id is not null then
    select * into v_driver from public.drivers where id = p_driver_id;
    if not found or v_driver.company_id <> v_truck.company_id or v_driver.status <> 'active' then
      raise exception 'Invalid driver';
    end if;
    if not public.skills_match(v_site.required_skills, v_driver.skills) then
      raise exception 'Driver skills do not match';
    end if;
  end if;

  if not public.skills_match(v_site.required_skills, v_truck.skills) then
    raise exception 'Truck skills do not match';
  end if;

  if p_start_date < v_site.start_date or p_end_date > v_site.end_date then
    raise exception 'Reservation dates out of site range';
  end if;

  if not exists (
    select 1
    from public.truck_availabilities ta
    where ta.truck_id = p_truck_id
      and ta.is_active = true
      and ta.available_start_date <= p_start_date
      and ta.available_end_date >= p_end_date
  ) then
    raise exception 'Truck availability not found';
  end if;

  if v_user.role not in ('system_admin', 'operator') and v_truck.company_id <> v_user.company_id then
    raise exception 'Cannot request for another company truck';
  end if;

  v_code := 'R-' || lpad((floor(random() * 999999))::text, 6, '0');

  insert into public.reservations (
    reservation_code,
    site_id,
    truck_id,
    driver_id,
    applicant_company_id,
    start_date,
    end_date,
    fixed_daily_price,
    status,
    note
  ) values (
    v_code,
    p_site_id,
    p_truck_id,
    p_driver_id,
    v_truck.company_id,
    p_start_date,
    p_end_date,
    v_site.daily_price,
    'requested',
    p_note
  )
  returning * into v_reservation;

  insert into public.reservation_status_logs (reservation_id, from_status, to_status, changed_by, reason)
  values (v_reservation.id, null, 'requested', v_user.id, p_note);

  insert into public.audit_logs (actor_user_id, action, target_type, target_id, after_data)
  values (v_user.id, 'request_reservation', 'reservation', v_reservation.id, to_jsonb(v_reservation));

  insert into public.notifications (user_id, notification_type, title, body, related_type, related_id)
  select u.id, 'reservation_requested', '予約申請がありました', '現場 ' || v_site.name || ' への予約申請', 'reservation', v_reservation.id
  from public.users u
  where u.is_active = true and u.role in ('system_admin', 'operator');

  return v_reservation;
end;
$$;

create or replace function public.approve_reservation(
  p_reservation_id uuid,
  p_reason text default null
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users;
  v_reservation public.reservations;
  v_site public.sites;
  v_old_status text;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can approve reservations';
  end if;

  select * into v_user from public.users where id = auth.uid();

  select * into v_reservation from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'Reservation not found'; end if;

  if v_reservation.status <> 'requested' then
    raise exception 'Reservation is not requestable';
  end if;

  select * into v_site from public.sites where id = v_reservation.site_id for update;

  if v_site.status <> 'open' then
    raise exception 'Site is not open';
  end if;

  if public.site_remaining_count(v_site.id) <= 0 then
    raise exception 'No remaining truck slots';
  end if;

  v_old_status := v_reservation.status;

  update public.reservations
  set status = 'approved',
      approved_by = v_user.id,
      approved_at = timezone('utc', now())
  where id = p_reservation_id
  returning * into v_reservation;

  update public.trucks
  set status = 'booked'
  where id = v_reservation.truck_id;

  insert into public.reservation_status_logs (reservation_id, from_status, to_status, changed_by, reason)
  values (v_reservation.id, v_old_status, 'approved', v_user.id, p_reason);

  insert into public.audit_logs (actor_user_id, action, target_type, target_id, after_data)
  values (v_user.id, 'approve_reservation', 'reservation', v_reservation.id, to_jsonb(v_reservation));

  insert into public.notifications (user_id, notification_type, title, body, related_type, related_id)
  select u.id, 'reservation_approved', '予約が承認されました', '予約 ' || v_reservation.reservation_code || ' が承認されました', 'reservation', v_reservation.id
  from public.users u
  where u.company_id = v_reservation.applicant_company_id and u.is_active = true;

  return v_reservation;
end;
$$;

create or replace function public.cancel_reservation(
  p_reservation_id uuid,
  p_reason text
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users;
  v_reservation public.reservations;
  v_old_status text;
begin
  select * into v_user from public.users where id = auth.uid() and is_active = true;
  if not found then raise exception 'Unauthorized'; end if;

  select * into v_reservation from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'Reservation not found'; end if;

  if v_reservation.status in ('completed', 'canceled', 'rejected') then
    raise exception 'Reservation cannot be canceled';
  end if;

  if not public.is_admin()
     and v_user.company_id not in (v_reservation.applicant_company_id)
     and v_user.company_id <> (select company_id from public.sites where id = v_reservation.site_id) then
    raise exception 'Permission denied';
  end if;

  if v_reservation.status = 'requested' and not public.is_admin()
     and v_user.company_id <> v_reservation.applicant_company_id then
    raise exception 'Only applicant can cancel requested reservation';
  end if;

  v_old_status := v_reservation.status;

  update public.reservations
  set status = 'canceled',
      cancel_reason = p_reason,
      canceled_at = timezone('utc', now())
  where id = p_reservation_id
  returning * into v_reservation;

  update public.trucks
  set status = 'available'
  where id = v_reservation.truck_id
    and not exists (
      select 1 from public.reservations r
      where r.truck_id = v_reservation.truck_id
        and r.id <> v_reservation.id
        and r.status in ('approved', 'booked', 'in_progress')
    );

  insert into public.reservation_status_logs (reservation_id, from_status, to_status, changed_by, reason)
  values (v_reservation.id, v_old_status, 'canceled', v_user.id, p_reason);

  insert into public.audit_logs (actor_user_id, action, target_type, target_id, after_data)
  values (v_user.id, 'cancel_reservation', 'reservation', v_reservation.id, to_jsonb(v_reservation));

  return v_reservation;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.drivers enable row level security;
alter table public.trucks enable row level security;
alter table public.sites enable row level security;
alter table public.truck_availabilities enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_status_logs enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.messages enable row level security;
alter table public.audit_logs enable row level security;

create policy companies_select on public.companies
  for select using (
    public.is_admin() or id = public.current_company_id()
  );

create policy companies_update_admin on public.companies
  for update using (public.is_admin());

create policy users_select on public.users
  for select using (
    public.is_admin() or company_id = public.current_company_id() or id = auth.uid()
  );

create policy drivers_select on public.drivers
  for select using (
    public.is_admin() or company_id = public.current_company_id()
  );

create policy drivers_modify on public.drivers
  for all using (
    public.is_admin() or company_id = public.current_company_id()
  );

create policy trucks_select on public.trucks
  for select using (
    public.is_admin()
    or company_id = public.current_company_id()
    or exists (
      select 1 from public.reservations r
      join public.sites s on s.id = r.site_id
      where r.truck_id = trucks.id
        and s.company_id = public.current_company_id()
    )
  );

create policy trucks_modify on public.trucks
  for all using (
    public.is_admin() or company_id = public.current_company_id()
  );

create policy sites_select on public.sites
  for select using (
    public.is_admin()
    or company_id = public.current_company_id()
    or status = 'open'
  );

create policy sites_modify on public.sites
  for all using (
    public.is_admin() or company_id = public.current_company_id()
  );

create policy truck_availabilities_all on public.truck_availabilities
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.trucks t
      where t.id = truck_availabilities.truck_id
        and t.company_id = public.current_company_id()
    )
  );

create policy reservations_select on public.reservations
  for select using (
    public.is_admin()
    or applicant_company_id = public.current_company_id()
    or exists (
      select 1 from public.sites s
      where s.id = reservations.site_id
        and s.company_id = public.current_company_id()
    )
  );

create policy reservation_logs_select on public.reservation_status_logs
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.reservations r
      where r.id = reservation_status_logs.reservation_id
        and (
          r.applicant_company_id = public.current_company_id()
          or exists (
            select 1 from public.sites s
            where s.id = r.site_id and s.company_id = public.current_company_id()
          )
        )
    )
  );

create policy documents_all on public.documents
  for all using (
    public.is_admin() or company_id = public.current_company_id()
  );

create policy notifications_select on public.notifications
  for select using (user_id = auth.uid());

create policy notifications_update on public.notifications
  for update using (user_id = auth.uid());

create policy audit_logs_select on public.audit_logs
  for select using (public.is_admin());

create policy messages_select on public.messages
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.reservations r
      where r.id = messages.reservation_id
        and (
          r.applicant_company_id = public.current_company_id()
          or exists (
            select 1 from public.sites s
            where s.id = r.site_id and s.company_id = public.current_company_id()
          )
        )
    )
  );

-- Auth bootstrap: create profile row after signup
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  return new;
end;
$$;

grant usage on schema public to anon, authenticated;
grant select on public.site_reservation_summary to authenticated;
grant execute on function public.request_reservation(uuid, uuid, uuid, date, date, text) to authenticated;
grant execute on function public.approve_reservation(uuid, text) to authenticated;
grant execute on function public.cancel_reservation(uuid, text) to authenticated;
