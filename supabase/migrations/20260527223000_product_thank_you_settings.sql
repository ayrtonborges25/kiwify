alter table public.product_settings
  add column if not exists thank_you_enabled boolean not null default false;

alter table public.product_settings
  add column if not exists thank_you_url text;
