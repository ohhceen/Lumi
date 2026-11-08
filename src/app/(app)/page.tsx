import Link from "next/link";
import { ArrowRight, PiggyBank, Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { BudgetAlerts } from "@/components/budget-alerts";
import { BudgetRow } from "@/components/budget-row";
import { CategoryDonut } from "@/components/charts/category-donut";
import { DailySpendingChart } from "@/components/charts/daily-chart";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { StarField, Planet } from "@/components/decorations";
import { EmptyState } from "@/components/empty-state";
import { TransactionDialog } from "@/components/forms/transaction-dialog";
import { Mascot } from "@/components/mascot";
import { MonthPicker } from "@/components/month-picker";
import { StatCard } from "@/components/stat-card";
import { TransactionList } from "@/components/transaction-list";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppContext, getBudgets, getCategories, getMonthlyTotals, getRecentTransactions, getTotals, getTransactionsInRange } from "@/lib/data";
import { formatDateLong, formatMonthLabel, formatShortMonth, hourInTimezone, monthRange, parseYearMonth, shiftMonth } from "@/lib/dates";
import { buildBudgetProgress, categoryBreakdown, computeBalance, dailySeries, monthlyTrend, sumTotals, summarizeBudgets } from "@/lib/finance";
import { formatIDR, formatPercent } from "@/lib/format";
import { greeting, moodFor, motivationalMessage } from "@/lib/greeting";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const sp = await searchParams;
  const ctx = await getAppContext();
  const ym = parseYearMonth(sp.month, ctx.currentMonth);
  const range = monthRange(ym);
  const trendStart = monthRange(shiftMonth(ym, -5)).start;

  const [categories, allTotals, monthTx, budgets, monthRows, recent] = await Promise.all([
    getCategories(),
    getTotals(),
    getTransactionsInRange(range.start, range.end),
    getBudgets(ym),
    getMonthlyTotals(trendStart, range.end),
    getRecentTransactions(6),
  ]);

  const balance = computeBalance(ctx.settings.initial_balance, allTotals);
  const month = sumTotals(monthTx);
  const net = month.income - month.expense;
  const progress = buildBudgetProgress(budgets, monthTx, categories, ym);
  const budget = summarizeBudgets(progress);
  const slices = categoryBreakdown(monthTx, categories, "expense");
  const daily = dailySeries(monthTx, ym);
  const trend = monthlyTrend(monthRows, ym, 6).map((m) => ({ label: formatShortMonth(m), income: m.income, expense: m.expense }));
  const { mood, note } = moodFor(net, budget, monthTx.length > 0);
  const isCurrent = ym.year === ctx.currentMonth.year && ym.month === ctx.currentMonth.month;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#a9cdf7] to-secondary p-5 text-ink shadow-pop sm:p-7">
        <StarField />
        <Planet className="absolute -right-3 -bottom-4 size-24 opacity-70 sm:right-40" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <Mascot mood={mood} className="size-24 shrink-0 animate-float drop-shadow-lg sm:size-28" />
          <div className="flex-1">
            <p className="text-sm font-extrabold text-ink/70 capitalize">{formatDateLong(ctx.today)}</p>
            <h1 className="mt-0.5 text-2xl font-black sm:text-3xl">
              {greeting(hourInTimezone(ctx.timezone))}, {ctx.profile.name}! 👋
            </h1>
            <p className="mt-1 text-sm font-bold text-ink/80">{motivationalMessage(ctx.today)}</p>
            <p className="mt-2 inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-extrabold text-ink">Bibo: {note}</p>
          </div>
          <MonthPicker value={ym} className="self-start sm:self-center" />
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
            <EmptyState title="Belum ada transaksi" description="Catat pemasukan atau pengeluaran pertamamu, Bibo siap membantu!">
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
        <Card className="lg:col-span-2">
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
            <div className="space-y-5">
              {progress.slice(0, 5).map((p) => (
                <BudgetRow key={p.budgetId} p={p} compact />
              ))}
            </div>
          ) : (
            <EmptyState mood="wink" title="Belum ada anggaran" description="Atur batas belanja per kategori supaya pengeluaran tetap terkendali.">
              <Button asChild variant="secondary">
                <Link href={`/budget?month=${range.start.slice(0, 7)}`}>Atur anggaran</Link>
              </Button>
            </EmptyState>
          )}
        </Card>
      </section>
    </div>
  );
}
