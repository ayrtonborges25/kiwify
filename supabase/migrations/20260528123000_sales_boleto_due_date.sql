alter table public.sales
  add column if not exists boleto_due_date date;
