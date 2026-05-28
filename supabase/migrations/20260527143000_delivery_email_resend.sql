alter table public.product_deliveries
  add column if not exists access_email_sent_at timestamptz;

create index if not exists idx_product_deliveries_access_email_sent_at
  on public.product_deliveries(access_email_sent_at);
