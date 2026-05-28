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

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  checkout_id uuid references public.product_checkouts(id) on delete set null,
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

alter table public.product_links add column if not exists offer_id uuid references public.offers(id) on delete cascade;
alter table public.product_links add column if not exists public_url text;
alter table public.product_links add column if not exists label text;

alter table public.sales add column if not exists offer_id uuid references public.offers(id) on delete set null;

create index if not exists idx_offers_product_id on public.offers(product_id);
create unique index if not exists idx_offers_slug_unique on public.offers(slug);
create index if not exists idx_product_links_offer_id on public.product_links(offer_id);
create index if not exists idx_sales_offer_id on public.sales(offer_id);

drop trigger if exists set_offers_updated_at on public.offers;
create trigger set_offers_updated_at before update on public.offers
for each row execute function public.set_updated_at();

alter table public.offers enable row level security;
alter table public.product_links enable row level security;
alter table public.sales enable row level security;

drop policy if exists "offers authenticated read" on public.offers;
create policy "offers authenticated read" on public.offers
for select to authenticated using (true);

drop policy if exists "offers authenticated write" on public.offers;
create policy "offers authenticated write" on public.offers
for all to authenticated using (true) with check (true);

drop policy if exists "clone anon offers read" on public.offers;
create policy "clone anon offers read" on public.offers
for select to anon using (status is null or status = 'active');

drop policy if exists "clone anon offers write" on public.offers;
create policy "clone anon offers write" on public.offers
for all to anon using (true) with check (true);

drop policy if exists "authenticated links read" on public.product_links;
create policy "authenticated links read" on public.product_links
for select to authenticated using (true);

drop policy if exists "authenticated links write" on public.product_links;
create policy "authenticated links write" on public.product_links
for all to authenticated using (true) with check (true);

drop policy if exists "clone anon product links read" on public.product_links;
create policy "clone anon product links read" on public.product_links
for select to anon using (true);

drop policy if exists "clone anon product links write" on public.product_links;
create policy "clone anon product links write" on public.product_links
for all to anon using (true) with check (true);

drop policy if exists "authenticated sales read" on public.sales;
create policy "authenticated sales read" on public.sales
for select to authenticated using (true);

drop policy if exists "authenticated sales write" on public.sales;
create policy "authenticated sales write" on public.sales
for all to authenticated using (true) with check (true);

drop policy if exists "clone anon sales read" on public.sales;
create policy "clone anon sales read" on public.sales
for select to anon using (true);

drop policy if exists "clone checkout public sale insert" on public.sales;
create policy "clone checkout public sale insert" on public.sales
for insert to anon with check (
  customer_name is not null
  and customer_email is not null
  and amount >= 0
  and coalesce(currency, 'BRL') in ('BRL', 'USD', 'EUR')
  and status in ('pending', 'approved')
  and payment_method in ('Cartão de crédito', 'Pix', 'Boleto')
);

drop policy if exists "clone anon sales write" on public.sales;
create policy "clone anon sales write" on public.sales
for update to anon using (false) with check (false);
