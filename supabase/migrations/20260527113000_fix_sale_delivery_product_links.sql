alter table public.sales add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.sales add column if not exists offer_id uuid references public.offers(id) on delete set null;
alter table public.sales add column if not exists customer_email text;
alter table public.sales add column if not exists amount numeric;
alter table public.sales add column if not exists status text;

alter table public.product_deliveries add column if not exists sale_id uuid references public.sales(id) on delete cascade;
alter table public.product_deliveries add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.product_deliveries add column if not exists customer_email text;
alter table public.product_deliveries add column if not exists access_url text;

update public.sales s
set product_id = o.product_id
from public.offers o
where s.product_id is null
  and s.offer_id = o.id
  and o.product_id is not null;

update public.product_deliveries d
set product_id = s.product_id,
    customer_email = coalesce(d.customer_email, s.customer_email)
from public.sales s
where d.sale_id = s.id
  and (d.product_id is null or d.customer_email is null)
  and s.product_id is not null;

create index if not exists sales_product_id_idx on public.sales(product_id);
create index if not exists sales_offer_id_idx on public.sales(offer_id);
create index if not exists product_deliveries_sale_id_idx on public.product_deliveries(sale_id);
create index if not exists product_deliveries_product_id_idx on public.product_deliveries(product_id);
