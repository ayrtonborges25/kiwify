create table if not exists public.members_area_groups (
  id text primary key,
  members_area_id uuid references public.members_areas(id) on delete cascade,
  name text not null,
  students integer not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_members_area_groups_area_id
  on public.members_area_groups(members_area_id);

alter table public.members_area_groups enable row level security;

drop policy if exists "clone anon members area groups read" on public.members_area_groups;
create policy "clone anon members area groups read"
  on public.members_area_groups for select to anon using (true);

drop policy if exists "clone anon members area groups write" on public.members_area_groups;
create policy "clone anon members area groups write"
  on public.members_area_groups for all to anon using (true) with check (true);

drop policy if exists "members area groups authenticated read" on public.members_area_groups;
create policy "members area groups authenticated read"
  on public.members_area_groups for select to authenticated using (true);

drop policy if exists "members area groups authenticated write" on public.members_area_groups;
create policy "members area groups authenticated write"
  on public.members_area_groups for all to authenticated using (true) with check (true);
