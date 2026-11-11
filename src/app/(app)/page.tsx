import Link from "next/link";
import { ArrowRight, CircleCheck, PiggyBank, Plus, Sparkles, TrendingDown, TrendingUp, TriangleAlert, Wallet } from "lucide-react";
import { BudgetAlerts } from "@/components/budget-alerts";
import { BudgetRings } from "@/components/budget-rings";
import { CategoryDonut } from "@/components/charts/category-donut";
import { DailySpendingChart } from "@/components/charts/daily-chart";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { EmptyState } from "@/components/empty-state";
import { TransactionDialog } from "@/components/forms/transaction-dialog";
import { MonthPicker } from "@/components/month-picker";
import { QuickAdd } from "@/components/quick-add";
import { UpcomingCard } from "@/components/upcoming-card";
import { StatCard } from "@/components/stat-card";
import { TransactionList } from "@/components/transaction-list";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppContext, getBillPayments, getBills, getBudgets, getCategories, getInstallments, getMonthlyTotals, getRecentTransactions, getTotals, getTransactionsInRange } from "@/lib/data";
import { formatDateLong, formatMonthLabel, formatShortMonth, hourInTimezone, monthRange, parseYearMonth, shiftMonth } from "@/lib/dates";
import { buildBudgetProgress, categoryBreakdown, computeBalance, dailySeries, monthlyTrend, sumTotals, summarizeBudgets } from "@/lib/finance";
import { formatIDR, formatPercent } from "@/lib/format";
import { billsForMonth, installmentProgress, upcomingObligations } from "@/lib/obligations";
import { greeting, moodFor, motivationalMessage } from "@/lib/greeting";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const sp = await searchParams;
  const ctx = await getAppContext();
  const ym = parseYearMonth(sp.month, ctx.currentMonth);
  const range = monthRange(ym);
  const trendStart = monthRange(shiftMonth(ym, -5)).start;

  const [categories, allTotals, monthTx, budgets, monthRows, recent, bills, billPayments, installments] = await Promise.all([
    getCategories(),
    getTotals(),
    getTransactionsInRange(range.start, range.end),
    getBudgets(ym),
    getMonthlyTotals(trendStart, range.end),
    getRecentTransactions(6),
    getBills(),
    getBillPayments(ctx.currentMonth),
    getInstallments(),
  ]);
  // "Jatuh tempo minggu ini" is always about today, whatever month is selected.
  const hasObligations = bills.length > 0 || installments.length > 0;
  const upcoming = upcomingObligations(
    billsForMonth(bills, billPayments, ctx.currentMonth, ctx.today),
    installments.map((inst) => ({ inst, progress: installmentProgress(inst, inst.payments, ctx.today) })),
    ctx.today,
  );

  const balance = computeBalance(ctx.settings.initial_balance, allTotals);
  const month = sumTotals(monthTx);
  const net = month.income - month.expense;
  const progress = buildBudgetProgress(budgets, monthTx, categories, ym);
  const budget = summarizeBudgets(progress);
  const slices = categoryBreakdown(monthTx, categories, "expense");
  const daily = dailySeries(monthTx, ym);
  const trend = monthlyTrend(monthRows, ym, 6).map((m) => ({ label: formatShortMonth(m), income: m.income, expense: m.expense }));
  const { tone, note } = moodFor(net, budget, monthTx.length > 0);
  // Quick add: the 3 expense categories used most often this month, topped up with the first defaults.
  const expenseCats = categories.filter((c) => c.type === "expense");
  const frequent = [...slices].sort((a, b) => b.count - a.count).map((sl) => expenseCats.find((c) => c.id === sl.categoryId)).filter((c): c is (typeof expenseCats)[number] => Boolean(c));
  const shortcuts = [...frequent, ...expenseCats.filter((c) => !frequent.includes(c))].slice(0, 3);
  const isCurrent = ym.year === ctx.currentMonth.year && ym.month === ctx.currentMonth.month;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section aria-label="Sapaan" className="rounded-3xl bg-card p-5 shadow-pop sm:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-ink-soft capitalize">{formatDateLong(ctx.today)}</p>
            <h1 className="mt-1 text-2xl font-black text-ink sm:text-3xl">
              {greeting(hourInTimezone(ctx.timezone))}, {ctx.profile.name}
            </h1>
            <p className="mt-1 max-w-xl text-sm font-semibold text-ink-soft">{motivationalMessage(ctx.today)}</p>
            <p
              className={cn(
                "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold",
                tone === "alert" ? "bg-expense-soft text-expense-strong" : tone === "warning" ? "bg-accent-soft text-accent-strong" : tone === "great" ? "bg-income-soft text-income-strong" : "bg-primary-soft text-ink-soft",
              )}
            >
              {tone === "alert" || tone === "warning" ? <TriangleAlert className="size-3.5" /> : <CircleCheck className="size-3.5" />} {note}
            </p>
          </div>
          <MonthPicker value={ym} className="self-start md:self-center" />
        </div>
      </section>

      {/* Summary cards */}
      <section aria-label="Ringkasan" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          highlight
          label="Total Saldo"
          icon={Wallet}
          value={<span className={balance < 0 ? "text-expense-strong" : undefined}>{formatIDR(balance)}</span>}
          sub={<>Saldo awal {formatIDR(ctx.settings.initial_balance)}</>}
        />
        <StatCard
          label="Pemasukan"
          tone="income"
          icon={TrendingUp}
          value={formatIDR(month.income)}
          sub={<>Bulan {formatMonthLabel(ym)} · total {formatIDR(allTotals.income)}</>}
        />
        <StatCard
          label="Pengeluaran"
          tone="expense"
          icon={TrendingDown}
          value={formatIDR(month.expense)}
          sub={<>Bulan {formatMonthLabel(ym)} · total {formatIDR(allTotals.expense)}</>}
        />
        <StatCard
          label="Sisa Anggaran"
          tone="secondary"
          icon={PiggyBank}
          value={budget.count ? <span className={budget.remaining < 0 ? "text-expense-strong" : undefined}>{formatIDR(budget.remaining)}</span> : "—"}
          sub={
            budget.count ? (
              <>Terpakai {formatPercent(budget.percentage)} dari {formatIDR(budget.totalLimit)}</>
            ) : (
              <Link href={`/budget?month=${range.start.slice(0, 7)}`} className="text-primary-strong underline-offset-2 hover:underline">
                Buat anggaran bulan ini →
              </Link>
            )
          }
        />
      </section>

      <BudgetAlerts progress={progress} />

      {hasObligations ? <UpcomingCard items={upcoming} /> : null}

      {tone === "great" && net > 0 ? (
        <section aria-label="Pencapaian" className="flex items-center gap-3 rounded-3xl bg-card px-4 py-3 shadow-soft">
          <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-income-soft text-income-strong">
            <Sparkles className="size-5" />
          </span>
          <p className="text-sm font-bold text-ink">
            <span className="font-black">Pencapaian bulan ini!</span> Kamu menyisihkan{" "}
            <span className="tabular font-black text-income-strong">{formatIDR(net)}</span>
            {budget.count && progress.every((p) => p.status === "normal") ? <> dan semua anggaran masih aman.</> : <>. Terus pertahankan!</>}
          </p>
        </section>
      ) : null}

      {/* Charts */}
      <section className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Pemasukan vs Pengeluaran</CardTitle>
              <CardDescription>6 bulan terakhir sampai {formatMonthLabel(ym)}</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-ink-faint">Arus kas bulan ini</p>
              <p className={`tabular text-lg font-black ${net >= 0 ? "text-income-strong" : "text-expense-strong"}`}>
                {net >= 0 ? "+" : ""}
                {formatIDR(net)}
              </p>
            </div>
          </CardHeader>
          <IncomeExpenseChart data={trend} />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Pengeluaran per Kategori</CardTitle>
              <CardDescription>{formatMonthLabel(ym)}</CardDescription>
            </div>
          </CardHeader>
          {slices.length ? (
            <CategoryDonut slices={slices} total={month.expense} />
          ) : (
            <EmptyState title="Belum ada pengeluaran" description="Pengeluaran bulan ini akan muncul di sini." className="py-8" />
          )}
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Pengeluaran Harian</CardTitle>
            <CardDescription>Setiap tanggal di {formatMonthLabel(ym)}</CardDescription>
          </div>
        </CardHeader>
        <DailySpendingChart data={daily} />
      </Card>

      <section className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Transaksi Terbaru</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/transactions">
                Lihat semua <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          {recent.length ? (
            <TransactionList transactions={recent} categories={categories} today={ctx.today} />
          ) : (
            <EmptyState title="Belum ada transaksi" description="Catat pemasukan atau pengeluaran pertamamu, yuk mulai petualangannya!">
              <TransactionDialog
                categories={categories}
                defaultDate={ctx.today}
                trigger={
                  <Button>
                    <Plus /> Catat transaksi pertama
                  </Button>
                }
              />
            </EmptyState>
          )}
        </Card>
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Progres Anggaran</CardTitle>
                <CardDescription>{isCurrent ? "Bulan ini" : formatMonthLabel(ym)}</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/budget?month=${range.start.slice(0, 7)}`}>
                  Kelola <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            {progress.length ? (
              <BudgetRings progress={progress} />
            ) : (
              <EmptyState title="Belum ada anggaran" description="Atur batas belanja per kategori supaya pengeluaran tetap terkendali.">
                <Button asChild variant="secondary">
                  <Link href={`/budget?month=${range.start.slice(0, 7)}`}>Atur anggaran</Link>
                </Button>
              </EmptyState>
            )}
          </Card>
          <Card>
            <CardHeader className="mb-3">
              <CardTitle>Catat cepat</CardTitle>
            </CardHeader>
            <QuickAdd shortcuts={shortcuts} categories={categories} today={ctx.today} />
          </Card>
        </div>
      </section>
    </div>
  );
}
