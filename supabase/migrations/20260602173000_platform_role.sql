alter table public.profiles add column if not exists platform_role text not null default 'user';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_platform_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_platform_role_check
      check (platform_role in ('super_admin', 'user')) not valid;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_platform_role_check'
      and conrelid = 'public.profiles'::regclass
      and not convalidated
  ) then
    alter table public.profiles validate constraint profiles_platform_role_check;
  end if;
end;
$$;

update public.profiles
set
  platform_role = 'super_admin',
  updated_at = now()
where lower(email) = 'ayrtonborgesfotografias@gmail.com';

create or replace function public.is_platform_super_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and platform_role = 'super_admin'
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_platform_super_admin()
    or exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'admin'
    );
$$;

notify pgrst, 'reload schema';
