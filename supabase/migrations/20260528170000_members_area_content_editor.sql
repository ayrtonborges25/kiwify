alter table public.modules add column if not exists image_url text;

alter table public.lessons add column if not exists description text;
alter table public.lessons add column if not exists content text;
alter table public.lessons add column if not exists thumbnail_url text;
alter table public.lessons add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table public.lessons add column if not exists release_type text default 'immediate';
alter table public.lessons add column if not exists release_days integer default 0;
alter table public.lessons add column if not exists release_date date;
alter table public.lessons add column if not exists duration_limited boolean not null default false;
