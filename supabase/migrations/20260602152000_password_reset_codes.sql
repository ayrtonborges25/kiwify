create table if not exists public.password_reset_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  code_hash text not null,
  request_ip text,
  user_agent text,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_reset_codes_email_created_at on public.password_reset_codes (email, created_at desc);
create index if not exists idx_password_reset_codes_user_id_created_at on public.password_reset_codes (user_id, created_at desc);
create index if not exists idx_password_reset_codes_expires_at on public.password_reset_codes (expires_at);

alter table public.password_reset_codes enable row level security;

drop policy if exists "password reset codes admin read" on public.password_reset_codes;
drop policy if exists "password reset codes admin write" on public.password_reset_codes;

create policy "password reset codes admin read" on public.password_reset_codes
for select to authenticated using (public.is_admin());

create policy "password reset codes admin write" on public.password_reset_codes
for all to authenticated using (public.is_admin()) with check (public.is_admin());

notify pgrst, 'reload schema';
