alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text not null default 'student';
alter table public.sales add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.product_deliveries add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists idx_sales_user_id on public.sales(user_id);
create index if not exists idx_product_deliveries_user_id on public.product_deliveries(user_id);
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) and exists (
    select 1
    from pg_constraint
    where conname = 'profiles_id_auth_users_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles drop constraint profiles_id_auth_users_fkey;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where contype = 'f'
      and conrelid = 'public.profiles'::regclass
      and confrelid = 'auth.users'::regclass
      and conkey = array[
        (
          select attnum
          from pg_attribute
          where attrelid = 'public.profiles'::regclass
            and attname = 'id'
        )
      ]::smallint[]
  ) then
    alter table public.profiles
      add constraint profiles_id_auth_users_fkey
      foreign key (id) references auth.users(id) on delete cascade;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'student')) not valid;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
      and not convalidated
  ) then
    alter table public.profiles validate constraint profiles_role_check;
  end if;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.current_profile_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'student')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = coalesce(nullif(excluded.name, ''), public.profiles.name),
    role = coalesce(nullif(excluded.role, ''), public.profiles.role),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.sales enable row level security;
alter table public.product_deliveries enable row level security;

drop policy if exists "profiles authenticated read" on public.profiles;
drop policy if exists "profiles authenticated write" on public.profiles;
drop policy if exists "profiles own read" on public.profiles;
drop policy if exists "profiles own update" on public.profiles;
drop policy if exists "profiles own insert" on public.profiles;
drop policy if exists "profiles admin read" on public.profiles;
drop policy if exists "profiles admin write" on public.profiles;

create policy "profiles own read" on public.profiles
for select to authenticated using (id = auth.uid());

create policy "profiles own update" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role = public.current_profile_role());

create policy "profiles own insert" on public.profiles
for insert to authenticated with check (id = auth.uid());

create policy "profiles admin read" on public.profiles
for select to authenticated using (public.is_admin());

create policy "profiles admin write" on public.profiles
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated sales read" on public.sales;
drop policy if exists "authenticated sales write" on public.sales;
drop policy if exists "clone anon sales read" on public.sales;
drop policy if exists "clone anon sales write" on public.sales;
drop policy if exists "sales student read own" on public.sales;
drop policy if exists "sales admin read" on public.sales;
drop policy if exists "sales admin write" on public.sales;

create policy "sales student read own" on public.sales
for select to authenticated using (user_id = auth.uid() or lower(customer_email) = lower(auth.jwt()->>'email'));

create policy "sales admin read" on public.sales
for select to authenticated using (public.is_admin());

create policy "sales admin write" on public.sales
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "clone checkout public sale insert" on public.sales;
create policy "clone checkout public sale insert" on public.sales
for insert to anon with check (
  customer_name is not null
  and customer_email is not null
  and amount >= 0
  and coalesce(currency, 'BRL') in ('BRL', 'USD', 'EUR')
  and status in ('pending', 'approved', 'failed')
  and payment_method in ('Cartão de crédito', 'Pix', 'Boleto', 'CREDIT_CARD', 'PIX', 'BOLETO')
  and (provider is null or provider = 'asaas')
);

drop policy if exists "authenticated deliveries read" on public.product_deliveries;
drop policy if exists "authenticated deliveries write" on public.product_deliveries;
drop policy if exists "clone anon deliveries read" on public.product_deliveries;
drop policy if exists "deliveries student read own" on public.product_deliveries;
drop policy if exists "deliveries admin read" on public.product_deliveries;
drop policy if exists "deliveries admin write" on public.product_deliveries;

create policy "deliveries student read own" on public.product_deliveries
for select to authenticated using (user_id = auth.uid() or lower(customer_email) = lower(auth.jwt()->>'email'));

create policy "deliveries admin read" on public.product_deliveries
for select to authenticated using (public.is_admin());

create policy "deliveries admin write" on public.product_deliveries
for all to authenticated using (public.is_admin()) with check (public.is_admin());

notify pgrst, 'reload schema';
