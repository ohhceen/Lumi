-- =====================================================================
-- MyMoney Buddy — initial schema
-- Money is stored as BIGINT whole Rupiah. Balances are never stored;
-- they are always derived from settings.initial_balance + transactions.
-- =====================================================================

-- ---------- Types ----------------------------------------------------
do $$ begin
  create type public.transaction_type as enum ('income', 'expense');
exception when duplicate_object then null; end $$;

-- ---------- Helpers --------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- profiles -------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default 'Teman' check (char_length(btrim(name)) between 1 and 60),
  created_at  timestamptz not null default now()
);

-- ---------- settings (one row per user) ------------------------------
create table if not exists public.settings (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  initial_balance  bigint not null default 0
                   check (initial_balance between -1000000000000 and 1000000000000),
  currency         text not null default 'IDR' check (currency = 'IDR'),
  timezone         text not null default 'Asia/Makassar' check (char_length(timezone) between 1 and 64),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------- categories -----------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  type        public.transaction_type not null,
  icon        text not null default 'circle' check (char_length(icon) between 1 and 40),
  created_at  timestamptz not null default now(),
  -- target for composite FKs: guarantees a transaction/budget uses a
  -- category of the SAME user and the SAME type.
  constraint categories_id_type_user_key unique (id, type, user_id)
);

create unique index if not exists categories_user_type_name_uidx
  on public.categories (user_id, type, lower(btrim(name)));

-- ---------- transactions ---------------------------------------------
create table if not exists public.transactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type              public.transaction_type not null,
  description       text not null check (char_length(btrim(description)) between 1 and 100),
  amount            bigint not null check (amount > 0 and amount <= 1000000000000),
  category_id       uuid not null,
  transaction_date  date not null,
  notes             text check (notes is null or char_length(notes) <= 500),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- ON DELETE RESTRICT: a category in use cannot be deleted (use
  -- reassign_and_delete_category). ON UPDATE RESTRICT: a used category
  -- cannot change type.
  constraint transactions_category_fkey
    foreign key (category_id, type, user_id)
    references public.categories (id, type, user_id)
    on delete restrict on update restrict
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc, created_at desc);
create index if not exists transactions_user_category_idx
  on public.transactions (user_id, category_id);
create index if not exists transactions_user_type_date_idx
  on public.transactions (user_id, type, transaction_date);

-- ---------- budgets --------------------------------------------------
create table if not exists public.budgets (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id    uuid not null,
  -- always 'expense': makes the composite FK reject income categories
  category_type  public.transaction_type not null default 'expense' check (category_type = 'expense'),
  month          smallint not null check (month between 1 and 12),
  year           smallint not null check (year between 2000 and 2100),
  amount         bigint not null check (amount > 0 and amount <= 1000000000000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint budgets_category_fkey
    foreign key (category_id, category_type, user_id)
    references public.categories (id, type, user_id)
    on delete cascade on update restrict,
  constraint budgets_unique_category_month unique (user_id, category_id, year, month)
);

create index if not exists budgets_user_period_idx on public.budgets (user_id, year, month);

-- ---------- updated_at triggers --------------------------------------
drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

drop trigger if exists transactions_updated_at on public.transactions;
create trigger transactions_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();

drop trigger if exists budgets_updated_at on public.budgets;
create trigger budgets_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ---------------------------------------
alter table public.profiles     enable row level security;
alter table public.settings     enable row level security;
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets      enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "own settings" on public.settings;
create policy "own settings" on public.settings
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "own categories" on public.categories;
create policy "own categories" on public.categories
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "own budgets" on public.budgets;
create policy "own budgets" on public.budgets
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- anon never touches data
revoke all on public.profiles, public.settings, public.categories,
              public.transactions, public.budgets from anon;
grant select, insert, update, delete on public.profiles, public.settings,
      public.categories, public.transactions, public.budgets to authenticated;

-- ---------- Default data for a user ----------------------------------
create or replace function public.seed_user_defaults(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (p_user) on conflict (id) do nothing;
  insert into public.settings (user_id) values (p_user) on conflict (user_id) do nothing;

  insert into public.categories (user_id, name, type, icon)
  select p_user, c.name, c.type::public.transaction_type, c.icon
  from (values
    ('Gaji',               'income',  'briefcase'),
    ('Freelance',          'income',  'laptop'),
    ('Uang Saku',          'income',  'wallet'),
    ('Bisnis',             'income',  'store'),
    ('Investasi',          'income',  'trending-up'),
    ('Pemasukan Lainnya',  'income',  'plus-circle'),
    ('Makanan & Minuman',  'expense', 'utensils'),
    ('Transportasi',       'expense', 'bus'),
    ('Belanja',            'expense', 'shopping-bag'),
    ('Hiburan',            'expense', 'gamepad'),
    ('Pendidikan',         'expense', 'graduation-cap'),
    ('Kesehatan',          'expense', 'heart-pulse'),
    ('Tagihan & Utilitas', 'expense', 'receipt'),
    ('Sewa',               'expense', 'home'),
    ('Perjalanan',         'expense', 'plane'),
    ('Perawatan Diri',     'expense', 'sparkles'),
    ('Pengeluaran Lainnya','expense', 'circle')
  ) as c(name, type, icon)
  where not exists (select 1 from public.categories x where x.user_id = p_user);
end;
$$;

revoke all on function public.seed_user_defaults(uuid) from public, anon, authenticated;

-- New auth user -> profile, settings, default categories
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.seed_user_defaults(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Called by the app after login; idempotent (covers users created
-- before this migration was applied).
create or replace function public.ensure_user_setup()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  perform public.seed_user_defaults(v_uid);
end;
$$;

revoke all on function public.ensure_user_setup() from public, anon;
grant execute on function public.ensure_user_setup() to authenticated;

-- ---------- Aggregates (run with caller's RLS) -----------------------
-- Totals of income/expense in an optional half-open date range
-- [p_start, p_end). NULL bounds mean "unbounded".
create or replace function public.transaction_totals(p_start date default null, p_end date default null)
returns table (total_income bigint, total_expense bigint, transaction_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(sum(t.amount) filter (where t.type = 'income'), 0)::bigint,
    coalesce(sum(t.amount) filter (where t.type = 'expense'), 0)::bigint,
    count(*)::bigint
  from public.transactions t
  where (p_start is null or t.transaction_date >= p_start)
    and (p_end   is null or t.transaction_date <  p_end);
$$;

grant execute on function public.transaction_totals(date, date) to authenticated;

-- Current balance = initial balance + all income - all expenses
create or replace function public.current_balance()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((select s.initial_balance from public.settings s where s.user_id = auth.uid()), 0)
       + coalesce((select sum(case when t.type = 'income' then t.amount else -t.amount end)
                   from public.transactions t), 0)::bigint;
$$;

grant execute on function public.current_balance() to authenticated;

-- Move every transaction of a category to another category (same type,
-- enforced by FK) and delete the source category. Atomic.
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

  delete from public.categories where id = p_source;
  if not found then
    raise exception 'source category not found' using errcode = 'P0002';
  end if;
  return v_moved;
end;
$$;

grant execute on function public.reassign_and_delete_category(uuid, uuid) to authenticated;
