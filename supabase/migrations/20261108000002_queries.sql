-- =====================================================================
-- Query functions used by the app (all SECURITY INVOKER => RLS applies)
-- =====================================================================

-- Transaction history with search / filters / sort / pagination.
-- Date filter is a half-open range [p_start, p_end).
create or replace function public.search_transactions(
  p_search    text default null,
  p_type      public.transaction_type default null,
  p_category  uuid default null,
  p_start     date default null,
  p_end       date default null,
  p_sort      text default 'newest',
  p_limit     integer default 20,
  p_offset    integer default 0
)
returns table (
  id               uuid,
  type             public.transaction_type,
  description      text,
  amount           bigint,
  category_id      uuid,
  category_name    text,
  category_icon    text,
  transaction_date date,
  notes            text,
  created_at       timestamptz,
  updated_at       timestamptz,
  total_count      bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select t.id, t.type, t.description, t.amount, t.category_id,
         c.name, c.icon, t.transaction_date, t.notes, t.created_at, t.updated_at,
         count(*) over () as total_count
  from public.transactions t
  join public.categories c on c.id = t.category_id
  where (p_search is null or btrim(p_search) = ''
         or t.description ilike '%' || replace(replace(replace(btrim(p_search), '\', '\\'), '%', '\%'), '_', '\_') || '%')
    and (p_type is null or t.type = p_type)
    and (p_category is null or t.category_id = p_category)
    and (p_start is null or t.transaction_date >= p_start)
    and (p_end is null or t.transaction_date < p_end)
  order by
    case when p_sort = 'oldest' then t.transaction_date end asc,
    case when p_sort = 'oldest' then t.created_at end asc,
    case when p_sort <> 'oldest' then t.transaction_date end desc,
    case when p_sort <> 'oldest' then t.created_at end desc,
    t.id
  limit greatest(1, least(coalesce(p_limit, 20), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;

grant execute on function public.search_transactions(text, public.transaction_type, uuid, date, date, text, integer, integer) to authenticated;

-- Income / expense per calendar month in [p_start, p_end) — for trends.
create or replace function public.monthly_totals(p_start date, p_end date)
returns table (year integer, month integer, total_income bigint, total_expense bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select extract(year from t.transaction_date)::int,
         extract(month from t.transaction_date)::int,
         coalesce(sum(t.amount) filter (where t.type = 'income'), 0)::bigint,
         coalesce(sum(t.amount) filter (where t.type = 'expense'), 0)::bigint
  from public.transactions t
  where t.transaction_date >= p_start and t.transaction_date < p_end
  group by 1, 2
  order by 1, 2;
$$;

grant execute on function public.monthly_totals(date, date) to authenticated;

-- Number of transactions using each category (for the categories page).
create or replace function public.category_usage()
returns table (category_id uuid, transaction_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select t.category_id, count(*)::bigint from public.transactions t group by t.category_id;
$$;

grant execute on function public.category_usage() to authenticated;
