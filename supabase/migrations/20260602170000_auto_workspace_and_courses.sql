create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','support','viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.product_members (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','coproducer','affiliate','editor','support')),
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

alter table public.profiles add column if not exists settings jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table public.products add column if not exists owner_id uuid references auth.users(id) on delete set null;

create index if not exists idx_workspaces_owner_id on public.workspaces(owner_id);
create index if not exists idx_workspace_members_user_id on public.workspace_members(user_id);
create index if not exists idx_workspace_members_workspace_id on public.workspace_members(workspace_id);
create index if not exists idx_product_members_user_id on public.product_members(user_id);
create index if not exists idx_product_members_product_id on public.product_members(product_id);
create index if not exists idx_products_workspace_id on public.products(workspace_id);
create index if not exists idx_products_owner_id on public.products(owner_id);

create or replace function public.is_platform_admin()
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

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at before update on public.workspaces
for each row execute function public.set_updated_at();

create or replace function public.personal_workspace_name(user_email text, metadata jsonb)
returns text
language sql
stable
as $$
  select coalesce(
    nullif(trim(metadata->>'name'), ''),
    split_part(lower(coalesce(user_email, 'workspace')), '@', 1),
    'Workspace'
  );
$$;

create or replace function public.ensure_personal_workspace(target_user_id uuid, user_email text, metadata jsonb default '{}'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_workspace_id uuid;
  created_workspace_id uuid;
begin
  select workspace_id
  into existing_workspace_id
  from public.workspace_members
  where user_id = target_user_id
  order by created_at
  limit 1;

  if existing_workspace_id is not null then
    return existing_workspace_id;
  end if;

  insert into public.workspaces (name, owner_id)
  values (public.personal_workspace_name(user_email, metadata), target_user_id)
  returning id into created_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (created_workspace_id, target_user_id, 'owner')
  on conflict (workspace_id, user_id) do update set role = 'owner';

  return created_workspace_id;
end;
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

  perform public.ensure_personal_workspace(new.id, new.email, coalesce(new.raw_user_meta_data, '{}'::jsonb));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

do $$
declare
  profile_row record;
begin
  for profile_row in
    select id, email, name
    from public.profiles
  loop
    perform public.ensure_personal_workspace(
      profile_row.id,
      profile_row.email,
      jsonb_build_object('name', profile_row.name)
    );
  end loop;
end;
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.product_members enable row level security;

drop policy if exists "workspaces member read" on public.workspaces;
drop policy if exists "workspaces owner read" on public.workspaces;
create policy "workspaces owner read" on public.workspaces
for select to authenticated using (
  owner_id = auth.uid()
  or exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists "workspaces owner admin write" on public.workspaces;
drop policy if exists "workspaces owner write" on public.workspaces;
create policy "workspaces owner write" on public.workspaces
for all to authenticated
using (owner_id = auth.uid() or public.is_platform_admin())
with check (owner_id = auth.uid() or public.is_platform_admin());

drop policy if exists "workspace members own read" on public.workspace_members;
create policy "workspace members own read" on public.workspace_members
for select to authenticated using (
  user_id = auth.uid()
  or public.is_platform_admin()
  or exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspace_members.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists "workspace members owner admin write" on public.workspace_members;
drop policy if exists "workspace members owner write" on public.workspace_members;
create policy "workspace members owner write" on public.workspace_members
for all to authenticated
using (
  user_id = auth.uid()
  or public.is_platform_admin()
  or exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspace_members.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner','admin')
  )
)
with check (
  user_id = auth.uid()
  or public.is_platform_admin()
  or exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspace_members.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner','admin')
  )
);

drop policy if exists "profiles own settings update" on public.profiles;
create policy "profiles own settings update" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "deliveries student read own" on public.product_deliveries;
create policy "deliveries student read own" on public.product_deliveries
for select to authenticated using (
  user_id = auth.uid()
  or lower(customer_email) = lower(auth.jwt()->>'email')
);

drop policy if exists "student related products read" on public.products;
create policy "student related products read" on public.products
for select to authenticated using (
  exists (
    select 1
    from public.product_deliveries pd
    where pd.product_id = products.id
      and pd.status = 'active'
      and (
        pd.user_id = auth.uid()
        or lower(pd.customer_email) = lower(auth.jwt()->>'email')
      )
  )
);

drop policy if exists "student related members areas read" on public.members_areas;
create policy "student related members areas read" on public.members_areas
for select to authenticated using (
  exists (
    select 1
    from public.product_deliveries pd
    where pd.product_id = members_areas.product_id
      and pd.status = 'active'
      and (
        pd.user_id = auth.uid()
        or lower(pd.customer_email) = lower(auth.jwt()->>'email')
      )
  )
);

notify pgrst, 'reload schema';
