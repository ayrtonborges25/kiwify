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

alter table public.products add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table public.products add column if not exists owner_id uuid references auth.users(id) on delete set null;

create index if not exists idx_workspaces_owner_id on public.workspaces(owner_id);
create index if not exists idx_workspace_members_user_id on public.workspace_members(user_id);
create index if not exists idx_workspace_members_workspace_id on public.workspace_members(workspace_id);
create index if not exists idx_product_members_user_id on public.product_members(user_id);
create index if not exists idx_product_members_product_id on public.product_members(product_id);
create index if not exists idx_products_workspace_id on public.products(workspace_id);
create index if not exists idx_products_owner_id on public.products(owner_id);

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at before update on public.workspaces
for each row execute function public.set_updated_at();

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

create or replace function public.can_access_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.workspace_members
      where user_id = auth.uid()
    );
$$;

create or replace function public.can_access_workspace(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.workspace_members
      where workspace_id = target_workspace_id
        and user_id = auth.uid()
    );
$$;

create or replace function public.can_manage_product(target_product_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.products p
      join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where p.id = target_product_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner','admin','support')
    )
    or exists (
      select 1
      from public.product_members pm
      where pm.product_id = target_product_id
        and pm.user_id = auth.uid()
        and pm.role in ('owner','coproducer','editor','support')
    );
$$;

create or replace function public.can_edit_product(target_product_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.products p
      join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where p.id = target_product_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner','admin')
    )
    or exists (
      select 1
      from public.product_members pm
      where pm.product_id = target_product_id
        and pm.user_id = auth.uid()
        and pm.role in ('owner','editor','support')
    );
$$;

create or replace function public.can_view_sales(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.workspace_members
      where workspace_id = target_workspace_id
        and user_id = auth.uid()
    );
$$;

create or replace function public.can_access_members_area(target_members_area_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.members_areas ma
      join public.products p on p.id = ma.product_id
      join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where ma.id = target_members_area_id
        and wm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.members_areas ma
      join public.product_members pm on pm.product_id = ma.product_id
      where ma.id = target_members_area_id
        and pm.user_id = auth.uid()
        and pm.role in ('owner','coproducer','editor','support')
    );
$$;

create or replace function public.can_access_club(target_members_area_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.product_deliveries pd
    left join public.sales s on s.id = pd.sale_id
    where pd.status = 'active'
      and (
        pd.user_id = auth.uid()
        or lower(pd.customer_email) = lower(auth.jwt()->>'email')
      )
      and (
        s.id is null
        or (
          s.status in ('approved','Pago','pago','recebido','confirmado')
          and (
            s.user_id = auth.uid()
            or lower(s.customer_email) = lower(auth.jwt()->>'email')
          )
        )
      )
      and (
        pd.access_url = ('/club=' || target_members_area_id::text)
        or exists (
          select 1
          from public.members_areas ma
          where ma.id = target_members_area_id
            and ma.product_id = coalesce(pd.product_id, s.product_id)
        )
      )
  );
$$;

do $$
declare
  admin_id uuid;
  default_workspace_id uuid;
begin
  select id
  into admin_id
  from public.profiles
  where lower(email) = 'ayrtonborgesfotografias@gmail.com'
  limit 1;

  if admin_id is null then
    select id
    into admin_id
    from public.profiles
    where role = 'admin'
    order by created_at
    limit 1;
  end if;

  if admin_id is not null then
    select id
    into default_workspace_id
    from public.workspaces
    where name = 'Digital Borges'
    order by created_at
    limit 1;

    if default_workspace_id is null then
      insert into public.workspaces (name, owner_id)
      values ('Digital Borges', admin_id)
      returning id into default_workspace_id;
    else
      update public.workspaces
      set owner_id = coalesce(owner_id, admin_id)
      where id = default_workspace_id;
    end if;

    insert into public.workspace_members (workspace_id, user_id, role)
    values (default_workspace_id, admin_id, 'owner')
    on conflict (workspace_id, user_id) do update
    set role = 'owner';

    update public.products
    set
      workspace_id = coalesce(workspace_id, default_workspace_id),
      owner_id = coalesce(owner_id, user_id, admin_id)
    where workspace_id is null
       or owner_id is null;

    insert into public.product_members (product_id, user_id, role)
    select id, coalesce(owner_id, admin_id), 'owner'
    from public.products
    where coalesce(owner_id, admin_id) is not null
    on conflict (product_id, user_id) do update
    set role = 'owner';
  end if;
end;
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.product_members enable row level security;

drop policy if exists "workspaces member read" on public.workspaces;
create policy "workspaces member read" on public.workspaces
for select to authenticated using (public.can_access_workspace(id));

drop policy if exists "workspaces owner admin write" on public.workspaces;
create policy "workspaces owner admin write" on public.workspaces
for all to authenticated
using (
  public.is_platform_admin()
  or exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = auth.uid()
      and wm.role in ('owner','admin')
  )
)
with check (
  public.is_platform_admin()
  or exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = auth.uid()
      and wm.role in ('owner','admin')
  )
);

drop policy if exists "workspace members own read" on public.workspace_members;
create policy "workspace members own read" on public.workspace_members
for select to authenticated using (user_id = auth.uid() or public.can_access_workspace(workspace_id));

drop policy if exists "workspace members owner admin write" on public.workspace_members;
create policy "workspace members owner admin write" on public.workspace_members
for all to authenticated
using (
  public.is_platform_admin()
  or exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspace_members.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner','admin')
  )
)
with check (
  public.is_platform_admin()
  or exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspace_members.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner','admin')
  )
);

drop policy if exists "product members own read" on public.product_members;
create policy "product members own read" on public.product_members
for select to authenticated using (user_id = auth.uid() or public.can_manage_product(product_id));

drop policy if exists "product members manager write" on public.product_members;
create policy "product members manager write" on public.product_members
for all to authenticated
using (public.can_manage_product(product_id))
with check (public.can_manage_product(product_id));

drop policy if exists "products authenticated read" on public.products;
drop policy if exists "products contextual read" on public.products;
create policy "products contextual read" on public.products
for select to authenticated using (
  public.is_platform_admin()
  or owner_id = auth.uid()
  or user_id = auth.uid()
  or public.can_access_workspace(workspace_id)
  or exists (
    select 1
    from public.product_members pm
    where pm.product_id = products.id
      and pm.user_id = auth.uid()
  )
);

drop policy if exists "products authenticated write" on public.products;
drop policy if exists "products contextual insert" on public.products;
create policy "products contextual insert" on public.products
for insert to authenticated with check (
  public.is_platform_admin()
  or owner_id = auth.uid()
  or user_id = auth.uid()
  or public.can_access_workspace(workspace_id)
);

drop policy if exists "products contextual update" on public.products;
create policy "products contextual update" on public.products
for update to authenticated
using (public.can_manage_product(id))
with check (public.can_manage_product(id));

drop policy if exists "products contextual delete" on public.products;
create policy "products contextual delete" on public.products
for delete to authenticated using (public.can_manage_product(id));

drop policy if exists "authenticated sales read" on public.sales;
drop policy if exists "sales contextual read" on public.sales;
create policy "sales contextual read" on public.sales
for select to authenticated using (
  user_id = auth.uid()
  or lower(customer_email) = lower(auth.jwt()->>'email')
  or exists (
    select 1
    from public.products p
    where p.id = sales.product_id
      and (
        public.can_manage_product(p.id)
        or public.can_access_workspace(p.workspace_id)
      )
  )
);

drop policy if exists "authenticated sales write" on public.sales;
drop policy if exists "sales contextual write" on public.sales;
create policy "sales contextual write" on public.sales
for all to authenticated
using (
  public.is_platform_admin()
  or exists (
    select 1
    from public.products p
    where p.id = sales.product_id
      and public.can_manage_product(p.id)
  )
)
with check (
  public.is_platform_admin()
  or exists (
    select 1
    from public.products p
    where p.id = sales.product_id
      and public.can_manage_product(p.id)
  )
);

drop policy if exists "authenticated deliveries read" on public.product_deliveries;
drop policy if exists "deliveries contextual read" on public.product_deliveries;
create policy "deliveries contextual read" on public.product_deliveries
for select to authenticated using (
  user_id = auth.uid()
  or lower(customer_email) = lower(auth.jwt()->>'email')
  or exists (
    select 1
    from public.products p
    where p.id = product_deliveries.product_id
      and public.can_manage_product(p.id)
  )
);

drop policy if exists "authenticated deliveries write" on public.product_deliveries;
drop policy if exists "deliveries contextual write" on public.product_deliveries;
create policy "deliveries contextual write" on public.product_deliveries
for all to authenticated
using (
  public.is_platform_admin()
  or exists (
    select 1
    from public.products p
    where p.id = product_deliveries.product_id
      and public.can_manage_product(p.id)
  )
)
with check (
  public.is_platform_admin()
  or exists (
    select 1
    from public.products p
    where p.id = product_deliveries.product_id
      and public.can_manage_product(p.id)
  )
);

drop policy if exists "members areas authenticated read" on public.members_areas;
drop policy if exists "members areas contextual read" on public.members_areas;
create policy "members areas contextual read" on public.members_areas
for select to authenticated using (
  user_id = auth.uid()
  or public.can_access_members_area(id)
);

drop policy if exists "members areas authenticated write" on public.members_areas;
drop policy if exists "members areas contextual write" on public.members_areas;
create policy "members areas contextual write" on public.members_areas
for all to authenticated
using (
  public.is_platform_admin()
  or user_id = auth.uid()
  or public.can_access_members_area(id)
)
with check (
  public.is_platform_admin()
  or user_id = auth.uid()
  or public.can_access_members_area(id)
);

notify pgrst, 'reload schema';
