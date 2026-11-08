# MyMoney Buddy — Phase 1: Requirement Analysis & Architecture

## 1. What we are building (summary)

A private, single-user personal finance web app (Indonesian UI, IDR currency) with:
one main balance, income/expense CRUD, monthly category budgets, daily/monthly reports
with charts, Excel/PDF export, category management and settings (initial balance, timezone).
Data lives in Supabase PostgreSQL; every number on screen is derived from source records.

## 2. Gaps / ambiguities found (and the default I will use)

| # | Gap | Default decision |
|---|-----|------------------|
| 1 | **Authentication** — "single user, no public registration" but no method given. | Supabase Auth, email + password. Public sign-ups disabled in Supabase; the single account is created once from the Supabase dashboard. All routes protected by middleware. |
| 2 | **Data ownership / RLS** — the requested tables have no owner column. | Add `user_id uuid default auth.uid()` to every table and RLS `user_id = auth.uid()`. Costs nothing for one user, and makes the anon key useless without logging in. |
| 3 | **Supabase project** — no URL/keys provided. | Code reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`. No service-role key is needed by the app at all. |
| 4 | **Rupiah decimals** | Amounts stored as `bigint` whole Rupiah (`> 0`, `<= 1e12`). No decimals anywhere. |
| 5 | **Transaction "date" vs timezone** | `transaction_date` is a calendar `date` (no time). Month filters are `date >= first_day AND date < first_day_of_next_month` → no timezone/boundary bugs. The timezone setting (default `Asia/Makassar`) decides what "today" / "this month" are. |
| 6 | **Settings table shape** | One row per user. Adds `timezone` column (required by §7). `currency` fixed to `IDR`. |
| 7 | **Category ↔ transaction type** | A DB trigger rejects an expense with an income category (and vice-versa). Budgets only allowed on expense categories. |
| 8 | **Deleting a category in use** | Blocked by FK `ON DELETE RESTRICT`; the UI offers a **"move transactions to another category, then delete"** flow (atomic SQL function). Budgets of a deleted category are removed. |
| 9 | **Changing a category's type** | Blocked while it has transactions/budgets (would corrupt reports). |
| 10 | **"Remaining Monthly Budget" card** | = sum(budget limits for the month) − sum(expenses in budgeted categories for that month). |
| 11 | **"Most frequent" vs "highest" category** | Most frequent = most expense transactions (count); highest = largest expense total. |
| 12 | **Average daily expense** | Monthly expense ÷ days elapsed in the month (full month for past months, today's day-of-month for the current month). |
| 13 | **Excel/PDF export** | Generated in the browser (`exceljs`, `jspdf` + `jspdf-autotable`) from the same report data shown on screen, so the export always matches the selected period. |

## 3. Architecture

```
Browser ──► Next.js App Router (Vercel / Node)
             ├─ middleware.ts          session refresh + route guard
             ├─ app/(app)/*            Server Components: read data, render pages
             ├─ app/actions/*          Server Actions: create/update/delete (Zod-validated)
             │                          → revalidatePath() so dashboard updates instantly
             ├─ lib/finance/*          PURE functions: balance, budgets, reports (unit-tested)
             ├─ lib/data/*             Supabase queries (server-only)
             └─ components/*           UI kit (shadcn-style), charts (Recharts), mascot
                     │
                     ▼
             Supabase: Auth + PostgreSQL (RLS, constraints, triggers, RPC functions)
```

Key principles
- **Single source of truth**: no stored balance. `balance = initial_balance + Σincome − Σexpense`
  computed from `transactions` each request (SQL `sum` via RPC + tested TS function).
- **Validation twice**: Zod in server actions (friendly messages) + DB constraints (last line of defence).
- **No service-role key** in the app; everything runs as the logged-in user under RLS.
- Server Components for reads → no client-side data fetching, no stale numbers.

## 4. Folder structure

```
mymoney-buddy/
  supabase/migrations/        SQL migrations (schema, RLS, triggers, functions, seed-on-signup)
  src/app/login/              login page
  src/app/(app)/              dashboard, transactions, budget, reports, categories, settings
  src/app/actions/            server actions
  src/components/ui/          button, card, dialog, input, select, badge, progress, toast...
  src/components/             layout (sidebar, mobile nav), mascot, charts, feature forms
  src/lib/finance/            calculations
  src/lib/data/               queries
  src/lib/validation/         zod schemas
  src/lib/format.ts, dates.ts IDR formatting, timezone-aware dates
  tests/unit/                 vitest: calculations, schemas, filters, dates
  tests/db/                   vitest + real PostgreSQL: migrations, constraints, RLS, scenarios
```

## 5. Technical risks

| Risk | Mitigation |
|------|-----------|
| Month-boundary/timezone bugs | `date` column + half-open ranges; "today" computed with `Intl` in the configured timezone; tests at 31 Oct / 1 Nov. |
| Floating-point money | `bigint` in DB, integers in TS, `Number.isSafeInteger` checks. |
| Double counting / drift | No stored totals; aggregates always recomputed. |
| Duplicate budgets | `unique(user_id, category_id, year, month)` + friendly error mapping. |
| Category deletion breaking history | FK restrict + reassignment function. |
| Leaked keys | Only anon key in browser; RLS on all tables; `.env.local` git-ignored. |
| Recharts + SSR | Charts are client components with fixed-height containers. |
| No Supabase available in this sandbox | DB tests run the real migrations on a local PostgreSQL 16 with a simulated `auth` schema, so constraints, triggers, RLS and the 7 scenarios are verified against real SQL. |

## 6. Development plan

1. Phase 2 — design tokens, fonts, layout shell, UI kit, mascot.
2. Phase 3 — migrations, Supabase clients, auth, data layer, finance logic.
3. Phase 4 — Dashboard, Transactions, Budget, Reports (+export), Categories, Settings.
4. Phase 5 — unit + DB integration tests, build, responsive checks, bug fixes.
5. Phase 6 — README: setup, env vars, Supabase config, local run, deployment.
