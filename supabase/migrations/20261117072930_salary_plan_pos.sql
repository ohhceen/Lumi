-- Rencana Gaji v2: the salary is split into three pos; the breakdown items are optional.
alter table public.salary_plans
  add column if not exists needs_amount   bigint not null default 0 check (needs_amount   between 0 and 1000000000000),
  add column if not exists wants_amount   bigint not null default 0 check (wants_amount   between 0 and 1000000000000),
  add column if not exists savings_amount bigint not null default 0 check (savings_amount between 0 and 1000000000000);

-- Plans saved before this change only had items: start each pos at the sum of its items.
update public.salary_plans p
set needs_amount   = coalesce((select sum((e->>'amount')::bigint) from jsonb_array_elements(p.items) e where e->>'bucket' = 'needs'), 0),
    wants_amount   = coalesce((select sum((e->>'amount')::bigint) from jsonb_array_elements(p.items) e where e->>'bucket' = 'wants'), 0),
    savings_amount = coalesce((select sum((e->>'amount')::bigint) from jsonb_array_elements(p.items) e where e->>'bucket' = 'savings'), 0)
where p.needs_amount = 0 and p.wants_amount = 0 and p.savings_amount = 0 and jsonb_array_length(p.items) > 0;
