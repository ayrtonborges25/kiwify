alter table public.product_settings
  add column if not exists upsell_settings jsonb not null default '{}'::jsonb;
