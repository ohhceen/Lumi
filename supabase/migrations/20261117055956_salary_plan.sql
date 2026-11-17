-- Rencana Gaji: one salary simulation per user. Record-keeping only:
-- it never touches transactions or the balance.
create table if not exists public.salary_plans (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  salary     bigint not null check (salary >= 0 and salary <= 1000000000000),
  -- [{ "name": text, "amount": bigint, "bucket": "needs" | "wants" | "savings" }], validated by the app (Zod)
  items      jsonb not null default '[]'::jsonb
             check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 100),
  updated_at timestamptz not null default now()
);

alter table public.salary_plans enable row level security;

drop policy if exists "own salary plan" on public.salary_plans;
create policy "own salary plan" on public.salary_plans for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.salary_plans to authenticated;
revoke all on public.salary_plans from anon;
