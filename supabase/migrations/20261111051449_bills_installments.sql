-- =====================================================================
-- Tagihan bulanan (bills) & cicilan (installments) — record keeping only.
-- Nothing here moves money: a payment is recorded by the user, optionally
-- together with an expense transaction (atomic SQL functions below).
-- A payment linked to a transaction is removed when that transaction is
-- deleted (ON DELETE CASCADE), so paid status / progress never drift.
-- =====================================================================

-- ---------- bills -----------------------------------------------------
create table if not exists public.bills (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name           text not null check (char_length(btrim(name)) between 1 and 60),
  amount         bigint not null check (amount > 0 and amount <= 1000000000000),  -- usual / estimated amount
  due_day        smallint not null check (due_day between 1 and 31),             -- clamped to the month's last day
  category_id    uuid not null,
  category_type  public.transaction_type not null default 'expense' check (category_type = 'expense'),
  notes          text check (notes is null or char_length(notes) <= 300),
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint bills_category_fkey
    foreign key (category_id, category_type, user_id)
    references public.categories (id, type, user_id)
    on delete restrict on update restrict
);
create index if not exists bills_user_idx on public.bills (user_id, active, due_day);

create table if not exists public.bill_payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  bill_id         uuid not null references public.bills (id) on delete cascade,
  year            smallint not null check (year between 2000 and 2100),
  month           smallint not null check (month between 1 and 12),
  amount          bigint not null check (amount > 0 and amount <= 1000000000000),
  paid_on         date not null,
  transaction_id  uuid references public.transactions (id) on delete cascade,
  created_at      timestamptz not null default now(),
  constraint bill_payments_one_per_month unique (bill_id, year, month)
);
create index if not exists bill_payments_user_period_idx on public.bill_payments (user_id, year, month);

-- ---------- installments -------------------------------------------------
create table if not exists public.installments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name            text not null check (char_length(btrim(name)) between 1 and 60),
  monthly_amount  bigint not null check (monthly_amount > 0 and monthly_amount <= 1000000000000),
  tenor           smallint not null check (tenor between 1 and 360),            -- number of payments
  start_month     date not null check (extract(day from start_month) = 1),     -- month of payment #1
  due_day         smallint not null check (due_day between 1 and 31),
  paid_before     smallint not null default 0,                                 -- payments made before using Lumi
  category_id     uuid not null,
  category_type   public.transaction_type not null default 'expense' check (category_type = 'expense'),
  notes           text check (notes is null or char_length(notes) <= 300),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint installments_paid_before_range check (paid_before between 0 and tenor),
  constraint installments_category_fkey
    foreign key (category_id, category_type, user_id)
    references public.categories (id, type, user_id)
    on delete restrict on update restrict
);
create index if not exists installments_user_idx on public.installments (user_id);

create table if not exists public.installment_payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  installment_id  uuid not null references public.installments (id) on delete cascade,
  amount          bigint not null check (amount > 0 and amount <= 1000000000000),
  paid_on         date not null,
  transaction_id  uuid references public.transactions (id) on delete cascade,
  created_at      timestamptz not null default now()
);
create index if not exists installment_payments_idx on public.installment_payments (user_id, installment_id, paid_on);

-- ---------- updated_at triggers ------------------------------------------
drop trigger if exists bills_updated_at on public.bills;
create trigger bills_updated_at before update on public.bills
  for each row execute function public.set_updated_at();
drop trigger if exists installments_updated_at on public.installments;
create trigger installments_updated_at before update on public.installments
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security --------------------------------------------
alter table public.bills                enable row level security;
alter table public.bill_payments        enable row level security;
alter table public.installments         enable row level security;
alter table public.installment_payments enable row level security;

drop policy if exists "own bills" on public.bills;
create policy "own bills" on public.bills for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "own bill payments" on public.bill_payments;
create policy "own bill payments" on public.bill_payments for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "own installments" on public.installments;
create policy "own installments" on public.installments for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "own installment payments" on public.installment_payments;
create policy "own installment payments" on public.installment_payments for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.bills, public.bill_payments, public.installments, public.installment_payments from anon;
grant select, insert, update, delete on public.bills, public.bill_payments,
      public.installments, public.installment_payments to authenticated;

-- ---------- Recording a payment (atomic, caller's RLS) ---------------------
-- Marks a bill paid for a month. With p_record = true it also records the
-- expense transaction (in the bill's category) and links it.
create or replace function public.pay_bill(
  p_bill uuid, p_year integer, p_month integer, p_amount bigint, p_paid_on date, p_record boolean
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_bill public.bills;
  v_tx uuid;
  v_payment uuid;
begin
  select * into v_bill from public.bills where id = p_bill;
  if not found then
    raise exception 'bill not found' using errcode = 'P0002';
  end if;
  if p_record then
    insert into public.transactions (type, description, amount, category_id, transaction_date, notes)
    values ('expense', v_bill.name, p_amount, v_bill.category_id, p_paid_on, 'Tagihan ' || lpad(p_month::text, 2, '0') || '/' || p_year)
    returning id into v_tx;
  end if;
  insert into public.bill_payments (bill_id, year, month, amount, paid_on, transaction_id)
  values (p_bill, p_year, p_month, p_amount, p_paid_on, v_tx)
  returning id into v_payment;
  return v_payment;
end;
$$;
grant execute on function public.pay_bill(uuid, integer, integer, bigint, date, boolean) to authenticated;

-- Records one installment payment, optionally with its expense transaction.
create or replace function public.pay_installment(
  p_installment uuid, p_amount bigint, p_paid_on date, p_record boolean
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_inst public.installments;
  v_count integer;
  v_tx uuid;
  v_payment uuid;
begin
  select * into v_inst from public.installments where id = p_installment;
  if not found then
    raise exception 'installment not found' using errcode = 'P0002';
  end if;
  select count(*) into v_count from public.installment_payments where installment_id = p_installment;
  if v_inst.paid_before + v_count >= v_inst.tenor then
    raise exception 'installment already paid off' using errcode = '23514';
  end if;
  if p_record then
    insert into public.transactions (type, description, amount, category_id, transaction_date, notes)
    values ('expense', v_inst.name, p_amount, v_inst.category_id, p_paid_on,
            'Cicilan ke-' || (v_inst.paid_before + v_count + 1) || ' dari ' || v_inst.tenor)
    returning id into v_tx;
  end if;
  insert into public.installment_payments (installment_id, amount, paid_on, transaction_id)
  values (p_installment, p_amount, p_paid_on, v_tx)
  returning id into v_payment;
  return v_payment;
end;
$$;
grant execute on function public.pay_installment(uuid, bigint, date, boolean) to authenticated;

-- ---------- Category reassignment now also moves bills & installments -------
create or replace function public.reassign_and_delete_category(p_source uuid, p_target uuid)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_moved integer;
begin
  if p_source = p_target then
    raise exception 'source and target category must differ' using errcode = '22023';
  end if;
  if not exists (select 1 from public.categories where id = p_target) then
    raise exception 'target category not found' using errcode = 'P0002';
  end if;

  update public.transactions set category_id = p_target where category_id = p_source;
  get diagnostics v_moved = row_count;
  -- bills / installments only reference expense categories (FK enforces it)
  update public.bills set category_id = p_target where category_id = p_source;
  update public.installments set category_id = p_target where category_id = p_source;

  delete from public.categories where id = p_source;
  if not found then
    raise exception 'source category not found' using errcode = 'P0002';
  end if;
  return v_moved;
end;
$$;

-- Usage now counts transactions, bills and installments (categories page).
drop function if exists public.category_usage();
create function public.category_usage()
returns table (category_id uuid, transaction_count bigint, bill_count bigint, installment_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.id,
         (select count(*) from public.transactions t where t.category_id = c.id),
         (select count(*) from public.bills b where b.category_id = c.id),
         (select count(*) from public.installments i where i.category_id = c.id)
  from public.categories c;
$$;
grant execute on function public.category_usage() to authenticated;
