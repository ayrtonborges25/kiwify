alter table public.sales add column if not exists provider text;
alter table public.sales add column if not exists provider_payment_id text;
alter table public.sales add column if not exists invoice_url text;
alter table public.sales add column if not exists pix_qr_code text;
alter table public.sales add column if not exists pix_copy_paste text;
alter table public.sales add column if not exists boleto_url text;
alter table public.sales add column if not exists paid_at timestamptz;
alter table public.sales add column if not exists raw_provider_response jsonb not null default '{}'::jsonb;

create index if not exists idx_sales_provider_payment_id on public.sales(provider_payment_id);

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
