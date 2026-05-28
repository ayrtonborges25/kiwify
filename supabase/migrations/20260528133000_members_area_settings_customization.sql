alter table public.members_areas
  add column if not exists settings jsonb not null default '{}'::jsonb;

alter table public.members_areas
  add column if not exists customization jsonb not null default '{}'::jsonb;
