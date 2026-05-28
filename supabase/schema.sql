create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  company text,
  initials text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  name text,
  description text,
  price numeric,
  currency text default 'BRL',
  status text default 'Rascunho',
  image_url text,
  type text,
  sales integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  checkout_id uuid,
  name text,
  slug text unique,
  price numeric,
  currency text default 'BRL',
  payment_methods jsonb not null default '["credit_card","pix","boleto"]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  status text default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_settings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  payment_method text,
  installments integer,
  card_statement text,
  boleto_validity_days integer default 3,
  two_cards_enabled boolean not null default false,
  card_pix_enabled boolean not null default false,
  smart_installments_enabled boolean not null default false,
  repeat_email_enabled boolean not null default true,
  collect_address_enabled boolean not null default false,
  collect_instagram_enabled boolean not null default false,
  auto_currency_enabled boolean not null default false,
  thank_you_enabled boolean not null default false,
  thank_you_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text,
  url text,
  type text,
  status text default 'Ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_checkouts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  name text,
  offer text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkout_settings (
  id uuid primary key default gen_random_uuid(),
  checkout_id uuid references public.product_checkouts(id) on delete cascade,
  name text,
  primary_color text,
  background_color text,
  logo_url text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  customer_name text,
  customer_email text,
  amount numeric,
  currency text default 'BRL',
  status text,
  payment_method text,
  provider text,
  provider_payment_id text,
  invoice_url text,
  pix_qr_code text,
  pix_copy_paste text,
  boleto_url text,
  boleto_due_date date,
  paid_at timestamptz,
  raw_provider_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.members_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  product_id uuid references public.products(id) on delete set null,
  title text,
  description text,
  cover_url text,
  settings jsonb not null default '{}'::jsonb,
  customization jsonb not null default '{}'::jsonb,
  students integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members_area_groups (
  id text primary key,
  members_area_id uuid references public.members_areas(id) on delete cascade,
  name text not null,
  students integer not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  members_area_id uuid references public.members_areas(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  title text,
  description text,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text,
  position integer default 0,
  status text default 'Publicado',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  module_id uuid references public.modules(id) on delete set null,
  title text,
  video_url text,
  position integer,
  status text default 'Publicado',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  entity_type text,
  entity_id uuid,
  file_url text,
  file_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.product_deliveries (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  customer_email text,
  delivery_type text,
  access_url text,
  status text default 'active',
  access_email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists user_id uuid references auth.users(id) on delete set null default auth.uid();
alter table public.products add column if not exists name text;
alter table public.products add column if not exists description text;
alter table public.products add column if not exists price numeric;
alter table public.products add column if not exists currency text default 'BRL';
alter table public.products add column if not exists status text default 'Rascunho';
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists type text;
alter table public.products add column if not exists sales integer default 0;
alter table public.products add column if not exists created_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();
alter table public.products add column if not exists slug text;
alter table public.products add column if not exists delivery_url text;
alter table public.products alter column slug drop not null;
alter table public.products alter column delivery_url drop not null;
alter table public.products alter column price drop not null;
alter table public.products alter column name drop not null;
alter table public.products drop constraint if exists products_status_check;
alter table public.products drop constraint if exists products_price_check;

alter table public.offers add column if not exists product_id uuid references public.products(id) on delete cascade;
alter table public.offers add column if not exists checkout_id uuid references public.product_checkouts(id) on delete set null;
alter table public.offers add column if not exists name text;
alter table public.offers add column if not exists slug text;
alter table public.offers add column if not exists price numeric;
alter table public.offers add column if not exists currency text default 'BRL';
alter table public.offers add column if not exists payment_methods jsonb not null default '["credit_card","pix","boleto"]'::jsonb;
alter table public.offers add column if not exists settings jsonb not null default '{}'::jsonb;
alter table public.offers add column if not exists is_default boolean not null default false;
alter table public.offers add column if not exists status text default 'active';
alter table public.offers add column if not exists created_at timestamptz not null default now();
alter table public.offers add column if not exists updated_at timestamptz not null default now();

alter table public.product_settings add column if not exists product_id uuid references public.products(id) on delete cascade;
alter table public.product_settings add column if not exists payment_method text;
alter table public.product_settings add column if not exists installments integer;
alter table public.product_settings add column if not exists card_statement text;
alter table public.product_settings add column if not exists boleto_validity_days integer default 3;
alter table public.product_settings add column if not exists two_cards_enabled boolean not null default false;
alter table public.product_settings add column if not exists card_pix_enabled boolean not null default false;
alter table public.product_settings add column if not exists smart_installments_enabled boolean not null default false;
alter table public.product_settings add column if not exists repeat_email_enabled boolean not null default true;
alter table public.product_settings add column if not exists collect_address_enabled boolean not null default false;
alter table public.product_settings add column if not exists collect_instagram_enabled boolean not null default false;
alter table public.product_settings add column if not exists auto_currency_enabled boolean not null default false;
alter table public.product_settings add column if not exists thank_you_enabled boolean not null default false;
alter table public.product_settings add column if not exists thank_you_url text;
alter table public.product_settings add column if not exists upsell_settings jsonb not null default '{}'::jsonb;
alter table public.product_settings add column if not exists created_at timestamptz not null default now();
alter table public.product_settings add column if not exists updated_at timestamptz not null default now();

alter table public.product_links add column if not exists product_id uuid references public.products(id) on delete cascade;
alter table public.product_links add column if not exists offer_id uuid references public.offers(id) on delete cascade;
alter table public.product_links add column if not exists public_url text;
alter table public.product_links add column if not exists label text;
alter table public.product_links add column if not exists title text;
alter table public.product_links add column if not exists url text;
alter table public.product_links add column if not exists type text;
alter table public.product_links add column if not exists status text default 'Ativo';
alter table public.product_links add column if not exists created_at timestamptz not null default now();
alter table public.product_links add column if not exists updated_at timestamptz not null default now();

alter table public.product_checkouts add column if not exists product_id uuid references public.products(id) on delete cascade;
alter table public.product_checkouts add column if not exists name text;
alter table public.product_checkouts add column if not exists offer text;
alter table public.product_checkouts add column if not exists is_default boolean not null default false;
alter table public.product_checkouts add column if not exists created_at timestamptz not null default now();
alter table public.product_checkouts add column if not exists updated_at timestamptz not null default now();

alter table public.checkout_settings add column if not exists checkout_id uuid references public.product_checkouts(id) on delete cascade;
alter table public.checkout_settings add column if not exists name text;
alter table public.checkout_settings add column if not exists primary_color text;
alter table public.checkout_settings add column if not exists background_color text;
alter table public.checkout_settings add column if not exists logo_url text;
alter table public.checkout_settings add column if not exists settings jsonb not null default '{}'::jsonb;
alter table public.checkout_settings add column if not exists created_at timestamptz not null default now();
alter table public.checkout_settings add column if not exists updated_at timestamptz not null default now();

alter table public.sales add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.sales add column if not exists offer_id uuid references public.offers(id) on delete set null;
alter table public.sales add column if not exists customer_name text;
alter table public.sales add column if not exists customer_email text;
alter table public.sales add column if not exists amount numeric;
alter table public.sales add column if not exists currency text default 'BRL';
alter table public.sales add column if not exists status text;
alter table public.sales add column if not exists payment_method text;
alter table public.sales add column if not exists provider text;
alter table public.sales add column if not exists provider_payment_id text;
alter table public.sales add column if not exists invoice_url text;
alter table public.sales add column if not exists pix_qr_code text;
alter table public.sales add column if not exists pix_copy_paste text;
alter table public.sales add column if not exists boleto_url text;
alter table public.sales add column if not exists boleto_due_date date;
alter table public.sales add column if not exists paid_at timestamptz;
alter table public.sales add column if not exists raw_provider_response jsonb not null default '{}'::jsonb;
alter table public.sales add column if not exists created_at timestamptz not null default now();

alter table public.members_areas add column if not exists user_id uuid references auth.users(id) on delete set null default auth.uid();
alter table public.members_areas add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.members_areas add column if not exists title text;
alter table public.members_areas add column if not exists description text;
alter table public.members_areas add column if not exists cover_url text;
alter table public.members_areas add column if not exists settings jsonb not null default '{}'::jsonb;
alter table public.members_areas add column if not exists customization jsonb not null default '{}'::jsonb;
alter table public.members_areas add column if not exists students integer default 0;
alter table public.members_areas add column if not exists created_at timestamptz not null default now();
alter table public.members_areas add column if not exists updated_at timestamptz not null default now();

alter table public.courses add column if not exists members_area_id uuid references public.members_areas(id) on delete cascade;
alter table public.courses add column if not exists member_area_id uuid;
alter table public.courses add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.courses add column if not exists slug text;
alter table public.courses add column if not exists title text;
alter table public.courses add column if not exists description text;
alter table public.courses add column if not exists cover_url text;
alter table public.courses add column if not exists created_at timestamptz not null default now();
alter table public.courses add column if not exists updated_at timestamptz not null default now();
alter table public.courses alter column slug drop not null;
alter table public.courses alter column title drop not null;
alter table public.courses drop constraint if exists courses_status_check;

alter table public.modules add column if not exists course_id uuid references public.courses(id) on delete cascade;
alter table public.modules add column if not exists title text;
alter table public.modules add column if not exists image_url text;
alter table public.modules add column if not exists position integer default 0;
alter table public.modules add column if not exists status text default 'Publicado';
alter table public.modules add column if not exists created_at timestamptz not null default now();
alter table public.modules add column if not exists updated_at timestamptz not null default now();

alter table public.lessons add column if not exists course_id uuid references public.courses(id) on delete cascade;
alter table public.lessons add column if not exists module_id uuid references public.modules(id) on delete set null;
alter table public.lessons add column if not exists title text;
alter table public.lessons add column if not exists description text;
alter table public.lessons add column if not exists content text;
alter table public.lessons add column if not exists video_url text;
alter table public.lessons add column if not exists thumbnail_url text;
alter table public.lessons add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table public.lessons add column if not exists release_type text default 'immediate';
alter table public.lessons add column if not exists release_days integer default 0;
alter table public.lessons add column if not exists release_date date;
alter table public.lessons add column if not exists duration_limited boolean not null default false;
alter table public.lessons add column if not exists position integer;
alter table public.lessons add column if not exists status text default 'Publicado';
alter table public.lessons add column if not exists created_at timestamptz not null default now();
alter table public.lessons add column if not exists updated_at timestamptz not null default now();

alter table public.uploads add column if not exists entity_type text;
alter table public.uploads add column if not exists entity_id uuid;
alter table public.uploads add column if not exists file_url text;
alter table public.uploads add column if not exists file_type text;
alter table public.uploads add column if not exists created_at timestamptz not null default now();

alter table public.product_deliveries add column if not exists sale_id uuid references public.sales(id) on delete cascade;
alter table public.product_deliveries add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.product_deliveries add column if not exists customer_email text;
alter table public.product_deliveries add column if not exists delivery_type text;
alter table public.product_deliveries add column if not exists access_url text;
alter table public.product_deliveries add column if not exists status text default 'active';
alter table public.product_deliveries add column if not exists access_email_sent_at timestamptz;
alter table public.product_deliveries add column if not exists created_at timestamptz not null default now();

create index if not exists idx_products_user_id on public.products(user_id);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_offers_product_id on public.offers(product_id);
create unique index if not exists idx_offers_slug_unique on public.offers(slug);
create unique index if not exists idx_product_settings_product_unique on public.product_settings(product_id);
create index if not exists idx_product_settings_product_id on public.product_settings(product_id);
create index if not exists idx_product_links_product_id on public.product_links(product_id);
create index if not exists idx_product_links_offer_id on public.product_links(offer_id);
create index if not exists idx_product_checkouts_product_id on public.product_checkouts(product_id);
create unique index if not exists idx_checkout_settings_checkout_unique on public.checkout_settings(checkout_id);
create index if not exists idx_checkout_settings_checkout_id on public.checkout_settings(checkout_id);
create index if not exists idx_sales_product_id on public.sales(product_id);
create index if not exists idx_sales_offer_id on public.sales(offer_id);
create index if not exists sales_product_id_idx on public.sales(product_id);
create index if not exists sales_offer_id_idx on public.sales(offer_id);
create index if not exists idx_sales_provider_payment_id on public.sales(provider_payment_id);
create index if not exists idx_sales_created_at on public.sales(created_at desc);
create index if not exists idx_members_areas_user_id on public.members_areas(user_id);
create index if not exists idx_members_areas_product_id on public.members_areas(product_id);
create index if not exists idx_members_area_groups_area_id on public.members_area_groups(members_area_id);
create index if not exists idx_courses_members_area_id on public.courses(members_area_id);
create index if not exists idx_courses_product_id on public.courses(product_id);
create index if not exists idx_modules_course_id on public.modules(course_id);
create index if not exists idx_lessons_course_id on public.lessons(course_id);
create index if not exists idx_uploads_entity on public.uploads(entity_type, entity_id);
create unique index if not exists idx_product_deliveries_sale_unique on public.product_deliveries(sale_id);
create index if not exists idx_product_deliveries_product_id on public.product_deliveries(product_id);
create index if not exists product_deliveries_sale_id_idx on public.product_deliveries(sale_id);
create index if not exists product_deliveries_product_id_idx on public.product_deliveries(product_id);
create index if not exists idx_product_deliveries_customer_email on public.product_deliveries(customer_email);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_offers_updated_at on public.offers;
create trigger set_offers_updated_at before update on public.offers
for each row execute function public.set_updated_at();

drop trigger if exists set_product_settings_updated_at on public.product_settings;
create trigger set_product_settings_updated_at before update on public.product_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_product_links_updated_at on public.product_links;
create trigger set_product_links_updated_at before update on public.product_links
for each row execute function public.set_updated_at();

drop trigger if exists set_product_checkouts_updated_at on public.product_checkouts;
create trigger set_product_checkouts_updated_at before update on public.product_checkouts
for each row execute function public.set_updated_at();

drop trigger if exists set_checkout_settings_updated_at on public.checkout_settings;
create trigger set_checkout_settings_updated_at before update on public.checkout_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_members_areas_updated_at on public.members_areas;
create trigger set_members_areas_updated_at before update on public.members_areas
for each row execute function public.set_updated_at();

drop trigger if exists set_courses_updated_at on public.courses;
create trigger set_courses_updated_at before update on public.courses
for each row execute function public.set_updated_at();

drop trigger if exists set_modules_updated_at on public.modules;
create trigger set_modules_updated_at before update on public.modules
for each row execute function public.set_updated_at();

drop trigger if exists set_lessons_updated_at on public.lessons;
create trigger set_lessons_updated_at before update on public.lessons
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.offers enable row level security;
alter table public.product_settings enable row level security;
alter table public.product_links enable row level security;
alter table public.product_checkouts enable row level security;
alter table public.checkout_settings enable row level security;
alter table public.sales enable row level security;
alter table public.members_areas enable row level security;
alter table public.members_area_groups enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.uploads enable row level security;
alter table public.product_deliveries enable row level security;

drop policy if exists "profiles authenticated read" on public.profiles;
create policy "profiles authenticated read" on public.profiles
for select to authenticated using (id = auth.uid());

drop policy if exists "profiles authenticated write" on public.profiles;
create policy "profiles authenticated write" on public.profiles
for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "products authenticated read" on public.products;
create policy "products authenticated read" on public.products
for select to authenticated using (user_id = auth.uid() or user_id is null);

drop policy if exists "products authenticated write" on public.products;
create policy "products authenticated write" on public.products
for all to authenticated using (user_id = auth.uid() or user_id is null) with check (user_id = auth.uid() or user_id is null);

drop policy if exists "offers authenticated read" on public.offers;
create policy "offers authenticated read" on public.offers for select to authenticated using (true);
drop policy if exists "offers authenticated write" on public.offers;
create policy "offers authenticated write" on public.offers for all to authenticated using (true) with check (true);

drop policy if exists "members areas authenticated read" on public.members_areas;
create policy "members areas authenticated read" on public.members_areas
for select to authenticated using (user_id = auth.uid() or user_id is null);

drop policy if exists "members areas authenticated write" on public.members_areas;
create policy "members areas authenticated write" on public.members_areas
for all to authenticated using (user_id = auth.uid() or user_id is null) with check (user_id = auth.uid() or user_id is null);

drop policy if exists "authenticated product child read" on public.product_settings;
create policy "authenticated product child read" on public.product_settings for select to authenticated using (true);
drop policy if exists "authenticated product child write" on public.product_settings;
create policy "authenticated product child write" on public.product_settings for all to authenticated using (true) with check (true);

drop policy if exists "authenticated links read" on public.product_links;
create policy "authenticated links read" on public.product_links for select to authenticated using (true);
drop policy if exists "authenticated links write" on public.product_links;
create policy "authenticated links write" on public.product_links for all to authenticated using (true) with check (true);

drop policy if exists "authenticated checkouts read" on public.product_checkouts;
create policy "authenticated checkouts read" on public.product_checkouts for select to authenticated using (true);
drop policy if exists "authenticated checkouts write" on public.product_checkouts;
create policy "authenticated checkouts write" on public.product_checkouts for all to authenticated using (true) with check (true);

drop policy if exists "authenticated checkout settings read" on public.checkout_settings;
create policy "authenticated checkout settings read" on public.checkout_settings for select to authenticated using (true);
drop policy if exists "authenticated checkout settings write" on public.checkout_settings;
create policy "authenticated checkout settings write" on public.checkout_settings for all to authenticated using (true) with check (true);

drop policy if exists "authenticated sales read" on public.sales;
create policy "authenticated sales read" on public.sales for select to authenticated using (true);
drop policy if exists "authenticated sales write" on public.sales;
create policy "authenticated sales write" on public.sales for all to authenticated using (true) with check (true);

drop policy if exists "authenticated courses read" on public.courses;
create policy "authenticated courses read" on public.courses for select to authenticated using (true);
drop policy if exists "authenticated courses write" on public.courses;
create policy "authenticated courses write" on public.courses for all to authenticated using (true) with check (true);

drop policy if exists "authenticated modules read" on public.modules;
create policy "authenticated modules read" on public.modules for select to authenticated using (true);
drop policy if exists "authenticated modules write" on public.modules;
create policy "authenticated modules write" on public.modules for all to authenticated using (true) with check (true);

drop policy if exists "authenticated lessons read" on public.lessons;
create policy "authenticated lessons read" on public.lessons for select to authenticated using (true);
drop policy if exists "authenticated lessons write" on public.lessons;
create policy "authenticated lessons write" on public.lessons for all to authenticated using (true) with check (true);

drop policy if exists "authenticated uploads read" on public.uploads;
create policy "authenticated uploads read" on public.uploads for select to authenticated using (true);
drop policy if exists "authenticated uploads write" on public.uploads;
create policy "authenticated uploads write" on public.uploads for all to authenticated using (true) with check (true);

drop policy if exists "authenticated deliveries read" on public.product_deliveries;
create policy "authenticated deliveries read" on public.product_deliveries for select to authenticated using (true);
drop policy if exists "authenticated deliveries write" on public.product_deliveries;
create policy "authenticated deliveries write" on public.product_deliveries for all to authenticated using (true) with check (true);

drop policy if exists "clone anon products read" on public.products;
create policy "clone anon products read" on public.products for select to anon using (true);
drop policy if exists "clone anon products write" on public.products;
create policy "clone anon products write" on public.products for all to anon using (true) with check (true);

drop policy if exists "clone anon offers read" on public.offers;
create policy "clone anon offers read" on public.offers for select to anon using (status is null or status = 'active');
drop policy if exists "clone anon offers write" on public.offers;
create policy "clone anon offers write" on public.offers for all to anon using (true) with check (true);

drop policy if exists "clone anon product settings read" on public.product_settings;
create policy "clone anon product settings read" on public.product_settings for select to anon using (true);
drop policy if exists "clone anon product settings write" on public.product_settings;
create policy "clone anon product settings write" on public.product_settings for all to anon using (true) with check (true);

drop policy if exists "clone anon product links read" on public.product_links;
create policy "clone anon product links read" on public.product_links for select to anon using (true);
drop policy if exists "clone anon product links write" on public.product_links;
create policy "clone anon product links write" on public.product_links for all to anon using (true) with check (true);

drop policy if exists "clone anon product checkouts read" on public.product_checkouts;
create policy "clone anon product checkouts read" on public.product_checkouts for select to anon using (true);
drop policy if exists "clone anon product checkouts write" on public.product_checkouts;
create policy "clone anon product checkouts write" on public.product_checkouts for all to anon using (true) with check (true);

drop policy if exists "clone anon checkout settings read" on public.checkout_settings;
create policy "clone anon checkout settings read" on public.checkout_settings for select to anon using (true);
drop policy if exists "clone anon checkout settings write" on public.checkout_settings;
create policy "clone anon checkout settings write" on public.checkout_settings for all to anon using (true) with check (true);

drop policy if exists "clone anon sales read" on public.sales;
create policy "clone anon sales read" on public.sales for select to anon using (true);

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

drop policy if exists "clone anon sales write" on public.sales;
create policy "clone anon sales write" on public.sales for update to anon using (false) with check (false);

drop policy if exists "clone anon members areas read" on public.members_areas;
create policy "clone anon members areas read" on public.members_areas for select to anon using (true);
drop policy if exists "clone anon members areas write" on public.members_areas;
create policy "clone anon members areas write" on public.members_areas for all to anon using (true) with check (true);

drop policy if exists "clone anon members area groups read" on public.members_area_groups;
create policy "clone anon members area groups read" on public.members_area_groups for select to anon using (true);
drop policy if exists "clone anon members area groups write" on public.members_area_groups;
create policy "clone anon members area groups write" on public.members_area_groups for all to anon using (true) with check (true);
drop policy if exists "members area groups authenticated read" on public.members_area_groups;
create policy "members area groups authenticated read" on public.members_area_groups for select to authenticated using (true);
drop policy if exists "members area groups authenticated write" on public.members_area_groups;
create policy "members area groups authenticated write" on public.members_area_groups for all to authenticated using (true) with check (true);

drop policy if exists "clone anon courses read" on public.courses;
create policy "clone anon courses read" on public.courses for select to anon using (true);
drop policy if exists "clone anon courses write" on public.courses;
create policy "clone anon courses write" on public.courses for all to anon using (true) with check (true);

drop policy if exists "clone anon modules read" on public.modules;
create policy "clone anon modules read" on public.modules for select to anon using (true);
drop policy if exists "clone anon modules write" on public.modules;
create policy "clone anon modules write" on public.modules for all to anon using (true) with check (true);

drop policy if exists "clone anon lessons read" on public.lessons;
create policy "clone anon lessons read" on public.lessons for select to anon using (true);
drop policy if exists "clone anon lessons write" on public.lessons;
create policy "clone anon lessons write" on public.lessons for all to anon using (true) with check (true);

drop policy if exists "clone anon uploads read" on public.uploads;
create policy "clone anon uploads read" on public.uploads for select to anon using (true);
drop policy if exists "clone anon uploads write" on public.uploads;
create policy "clone anon uploads write" on public.uploads for all to anon using (true) with check (true);

drop policy if exists "clone anon deliveries read" on public.product_deliveries;
create policy "clone anon deliveries read" on public.product_deliveries for select to anon using (status = 'active');

drop policy if exists "clone public storage read" on storage.objects;
create policy "clone public storage read" on storage.objects
for select to anon, authenticated using (bucket_id in ('product-images', 'course-videos', 'member-area-covers', 'checkout-assets'));

drop policy if exists "clone public storage insert" on storage.objects;
create policy "clone public storage insert" on storage.objects
for insert to anon, authenticated with check (bucket_id in ('product-images', 'course-videos', 'member-area-covers', 'checkout-assets'));

drop policy if exists "clone public storage update" on storage.objects;
create policy "clone public storage update" on storage.objects
for update to anon, authenticated using (bucket_id in ('product-images', 'course-videos', 'member-area-covers', 'checkout-assets')) with check (bucket_id in ('product-images', 'course-videos', 'member-area-covers', 'checkout-assets'));

notify pgrst, 'reload schema';
