create table if not exists public.product_deliveries (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  customer_email text,
  delivery_type text,
  access_url text,
  status text default 'active',
  created_at timestamptz not null default now()
);

alter table public.product_deliveries add column if not exists sale_id uuid references public.sales(id) on delete cascade;
alter table public.product_deliveries add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.product_deliveries add column if not exists customer_email text;
alter table public.product_deliveries add column if not exists delivery_type text;
alter table public.product_deliveries add column if not exists access_url text;
alter table public.product_deliveries add column if not exists status text default 'active';
alter table public.product_deliveries add column if not exists created_at timestamptz not null default now();

create unique index if not exists idx_product_deliveries_sale_unique on public.product_deliveries(sale_id);
create index if not exists idx_product_deliveries_product_id on public.product_deliveries(product_id);
create index if not exists idx_product_deliveries_customer_email on public.product_deliveries(customer_email);

alter table public.product_deliveries enable row level security;

drop policy if exists "authenticated deliveries read" on public.product_deliveries;
create policy "authenticated deliveries read" on public.product_deliveries
for select to authenticated using (true);

drop policy if exists "authenticated deliveries write" on public.product_deliveries;
create policy "authenticated deliveries write" on public.product_deliveries
for all to authenticated using (true) with check (true);

drop policy if exists "clone anon deliveries read" on public.product_deliveries;
create policy "clone anon deliveries read" on public.product_deliveries
for select to anon using (status = 'active');

notify pgrst, 'reload schema';
