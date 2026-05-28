alter table public.product_settings
  add column if not exists boleto_validity_days integer default 3;
