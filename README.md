# MyMoney Buddy 💙

A cute, private personal-finance tracker for one person: record income and expenses, see your one main balance, set monthly budgets per category, and understand your habits with daily/monthly reports. The UI is in Indonesian, amounts are in Rupiah, and the mascot is **Bibo**, an original little blue alien from a savings planet.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn-style components (Radix) · Lucide · Recharts · Supabase (PostgreSQL + Auth) · Zod · date-fns · ExcelJS / jsPDF · Vitest · Playwright

---

## Features

| Area | What you get |
|---|---|
| **Dashboard** | Greeting + date + motivational message, Bibo whose mood reacts to your month, Total Balance / monthly Income / monthly Expenses / Remaining Budget cards, 6-month income-vs-expense chart, category donut, daily spending chart, recent transactions, budget progress and budget alerts. Month selector. |
| **Transactions** | Add / edit / delete (with confirmation) income and expenses. Search by description, filter by type, category, month or exact date, sort newest/oldest, pagination. Table on desktop, cards on mobile. Quick-add button on every page. |
| **Balance** | `Current Balance = Initial Balance + Total Income − Total Expenses`, always recomputed from the records. Nothing is stored as a running balance, so edits and deletes can never double-count. |
| **Budget** | One budget per expense category per month (enforced by the database). Progress bars with 4 states: **<70% safe**, **70–89% approaching**, **90–99% almost exceeded**, **≥100% exceeded**, plus friendly alerts. "Copy from last month". Lists spending in categories with no budget. |
| **Reports** | Monthly: income, expenses, net cash flow, most frequent category, highest-spending category, average daily expense, comparison with the previous month. Daily: income / expenses / net + that day's transactions. Charts: income vs expense (12 months), monthly expense trend, category breakdown, daily trend. **Export to Excel (.xlsx) and PDF** for the selected month. |
| **Categories** | 6 income + 11 expense defaults are created automatically. Add / edit (name, type, icon) / delete. A category that is still used by transactions can only be deleted by **moving its transactions to another category** of the same type (done atomically in SQL). |
| **Settings** | Name, initial balance (can be negative), timezone (default **Asia/Makassar**, which decides what "today" and "this month" are). |

## Architecture

```
Browser ──► Next.js (Vercel/Node)
             ├─ src/middleware.ts        refreshes the Supabase session, guards every page
             ├─ src/app/(app)/*          Server Components: read data → render
             ├─ src/app/actions/*        Server Actions: Zod validation → DB → revalidatePath
             ├─ src/lib/finance          pure, unit-tested calculations (balance, budgets, reports)
             ├─ src/lib/data             server-only Supabase queries
             └─ src/components           UI kit, charts, mascot, forms
                     │  (anon key + user session; Row Level Security applies)
                     ▼
             Supabase: Auth + PostgreSQL (constraints, triggers, RLS, SQL functions)
```

Design decisions in brief (full analysis in [`docs/PHASE-1-ANALYSIS.md`](docs/PHASE-1-ANALYSIS.md)):

- **Money is `bigint` whole Rupiah**, never floating point. Shown as `Rp1.000.000`, with no decimals.
- **`transaction_date` is a calendar `date`**, and month filters are half-open ranges (`>= 1st` and `< 1st of next month`), so there are no timezone or month-boundary bugs.
- **The database protects itself:** `amount > 0` checks, composite foreign keys so a transaction or budget can only use a category of the *same user and same type*, a unique key preventing duplicate monthly budgets, and `ON DELETE RESTRICT` for categories in use.
- **Row Level Security on every table** (`user_id = auth.uid()`). The app only uses the public anon key plus the logged-in user's session. **No service-role key is needed or used.**
- **Single user:** public sign-up is disabled; you create your one account in the Supabase dashboard.

## Database

Migrations are in [`supabase/migrations`](supabase/migrations):

| Table | Purpose |
|---|---|
| `profiles` | your display name (id = auth user id) |
| `settings` | `initial_balance`, `currency` (IDR), `timezone` (one row) |
| `categories` | `name`, `type` (`income`/`expense`), `icon` |
| `transactions` | `type`, `description`, `amount`, `category_id`, `transaction_date`, `notes`, timestamps |
| `budgets` | `category_id`, `month`, `year`, `amount`, unique per category/month |

SQL functions (all `SECURITY INVOKER`, so RLS applies): `transaction_totals`, `current_balance`, `search_transactions`, `monthly_totals`, `category_usage`, `reassign_and_delete_category`, `ensure_user_setup`. A trigger on `auth.users` creates the profile, settings and default categories for a new account.

---

## Setup

### 1. Requirements

- Node.js 20+ (tested on 22)
- A Supabase project (free tier is fine): https://supabase.com

### 2. Install

```bash
npm install
```

### 3. Create the database

In the Supabase dashboard, open **SQL Editor**, then paste and run each file in `supabase/migrations/` **in order**:

1. `20261108000001_init.sql`
2. `20261108000002_queries.sql`

(Or, with the Supabase CLI linked to your project: `npx supabase db push`.)

### 4. Make it single-user

1. **Authentication → Sign In / Providers → Email**: keep Email enabled, and turn **"Allow new users to sign up" OFF**.
2. **Authentication → Users → Add user → Create new user**: enter your email and a strong password, and tick **Auto Confirm User**.

The trigger creates your settings and the default categories automatically. If you created the user *before* running the migrations, that's fine too: the app runs `ensure_user_setup()` on first login.

### 5. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → `anon` / publishable key |

> ⚠️ Never put the `service_role` key in `.env.local` or anywhere in the frontend. The app does not need it.

### 6. Run locally

```bash
npm run dev
```

Open http://localhost:3000 and log in with the account from step 4. If the env vars are missing, the app shows a setup page instead of crashing.

---

## Running tests

| Command | What it runs | Needs |
|---|---|---|
| `npm run test:unit` | 52 unit tests: balance scenarios 1–5, budget usage and thresholds (scenario 6), month boundaries (scenario 7), reports, IDR formatting, timezone handling, Zod validation | nothing |
| `npm run test:db` | 29 integration tests that apply the **real migrations** to PostgreSQL and test constraints, RLS isolation, duplicate budgets, invalid amounts, category/type mismatches, category reassignment, filters, search, sorting, pagination and the 7 scenarios at SQL level | a local PostgreSQL superuser (default `postgres://postgres:postgres@localhost:5432/postgres`, override with `TEST_DATABASE_ADMIN_URL`); skipped if none |
| `npm run test:e2e` | 11 Playwright tests in a real browser against a real local Supabase: login, empty states, scenarios 1–7 through the UI (checking the displayed balance against the database), validation, budgets and alerts, filters, category reassignment, Excel/PDF export, mobile layout | Docker + local Supabase (below) and a production build |

End-to-end setup:

```bash
npm run db:start
```

```bash
npx supabase status -o env
```

Put `API_URL` and `ANON_KEY` from that output into `.env.local`, then:

```bash
npm run build
```

```bash
npm run test:e2e
```

The E2E global setup creates its own test user (`buddy@example.com`) through the local admin API. The service-role key is only used by the test harness, never by the app.

## Deployment (Vercel)

1. Push the repository to GitHub.
2. On https://vercel.com, choose **Add New → Project** and import the repo (the framework is detected as Next.js).
3. Add the two environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy.
5. In Supabase, go to **Authentication → URL Configuration** and set **Site URL** to your Vercel URL.

Any Node host works the same way: `npm run build && npm start`.

## Project structure

```
src/
  app/
    (app)/            dashboard, transactions, budget, reports, categories, settings (+ loading/error)
    actions/          server actions (transactions, budgets, categories, settings, auth)
    login/  setup/
  components/
    ui/               button, card, input/select, dialog, confirm dialog, badge, progress, skeleton
    charts/           Recharts components + validated colour tokens
    forms/            transaction, budget, category, settings forms
    layout/           sidebar, mobile top bar, bottom nav
    mascot.tsx        Bibo (original SVG character, 5 moods)
  lib/
    finance/          calculations (pure)
    data/             queries (server-only)
    validation/       Zod schemas
    dates.ts format.ts filters.ts db-errors.ts greeting.ts
  middleware.ts
supabase/migrations/  SQL
tests/unit  tests/db  tests/e2e
docs/                 phase-1 analysis
```
