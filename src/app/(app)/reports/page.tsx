import { ArrowDownRight, ArrowUpRight, CalendarDays, Crown, Flame, Minus, Repeat, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { CategoryDonut } from "@/components/charts/category-donut";
import { DailySpendingChart } from "@/components/charts/daily-chart";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { ExpenseTrendChart } from "@/components/charts/trend-chart";
import { CategoryIcon } from "@/components/category-icon";
import { DateParamPicker } from "@/components/date-picker-param";
import { EmptyState } from "@/components/empty-state";
import { MonthPicker } from "@/components/month-picker";
import { PageHeader } from "@/components/page-header";
import { ReportExport, type ExportData } from "@/components/report-export";
import { StatCard } from "@/components/stat-card";
import { TransactionList } from "@/components/transaction-list";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppContext, getCategories, getMonthlyTotals, getTotals, getTransactionsInRange } from "@/lib/data";
import { formatDateDisplay, formatDateLong, formatMonthLabel, formatShortMonth, isValidDateString, monthRange, parseYearMonth, shiftMonth } from "@/lib/dates";
import { categoryBreakdown, dailyReport, dailySeries, monthlyReport, monthlyTrend, type Comparison } from "@/lib/finance";
import { formatIDR, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Laporan" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ month?: string; date?: string }> }) {
  const sp = await searchParams;
  const ctx = await getAppContext();
  const ym = parseYearMonth(sp.month, ctx.currentMonth);
  const range = monthRange(ym);
  const prevRange = monthRange(shiftMonth(ym, -1));
  // selected day: from URL if inside the month, else today (if inside) or the 1st
  const date =
    sp.date && isValidDateString(sp.date) && sp.date >= range.start && sp.date < range.end
      ? sp.date
      : ctx.today >= range.start && ctx.today < range.end
        ? ctx.today
        : range.start;

  const [categories, monthTx, prevTotals, rows] = await Promise.all([
    getCategories(),
    getTransactionsInRange(range.start, range.end),
    getTotals(prevRange.start, prevRange.end),
    getMonthlyTotals(monthRange(shiftMonth(ym, -11)).start, range.end),
  ]);

  const report = monthlyReport(monthTx, categories, ym, prevTotals, ctx.today);
  const day = dailyReport(monthTx, date);
  const dayTx = monthTx.filter((t) => t.transaction_date === date);
  const slices = categoryBreakdown(monthTx, categories, "expense");
  const daily = dailySeries(monthTx, ym);
  const trend = monthlyTrend(rows, ym, 12).map((m) => ({ label: formatShortMonth(m), income: m.income, expense: m.expense }));
  const periodLabel = formatMonthLabel(ym);

  const exportData: ExportData = {
    periodLabel,
    fileStem: `laporan-mymoney-buddy-${range.start.slice(0, 7)}`,
    generatedAt: new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: ctx.timezone }).format(new Date()),
    summary: [
      { label: "Total pemasukan", value: formatIDR(report.income) },
      { label: "Total pengeluaran", value: formatIDR(report.expense) },
      { label: "Arus kas bersih", value: formatIDR(report.net) },
      { label: "Jumlah transaksi", value: String(report.transactionCount) },
      { label: "Rata-rata pengeluaran harian", value: `${formatIDR(report.averageDailyExpense)} (${report.elapsedDays} hari)` },
      { label: "Kategori paling sering", value: report.mostFrequentCategory ? `${report.mostFrequentCategory.name} (${report.mostFrequentCategory.count}x)` : "—" },
      { label: "Kategori pengeluaran terbesar", value: report.highestCategory ? `${report.highestCategory.name} (${formatIDR(report.highestCategory.amount)})` : "—" },
      { label: "Pengeluaran bulan lalu", value: formatIDR(prevTotals.expense) },
      { label: "Pemasukan bulan lalu", value: formatIDR(prevTotals.income) },
    ],
    categories: slices.map((s) => ({ name: s.name, amount: s.amount, count: s.count, percentage: s.percentage })),
    daily: daily.map((d) => ({ date: d.date, income: d.income, expense: d.expense, net: d.net })),
    transactions: [...monthTx]
      .sort((a, b) => a.transaction_date.localeCompare(b.transaction_date) || a.created_at.localeCompare(b.created_at))
      .map((t) => ({
        date: t.transaction_date,
        description: t.description,
        category: t.category_name,
        type: t.type === "income" ? "Pemasukan" : "Pengeluaran",
        amount: t.amount,
        notes: t.notes ?? "",
      })),
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Laporan & Analisis" description="Pahami kebiasaan keuanganmu lewat angka dan grafik." character="hamm">
        <MonthPicker value={ym} />
        <ReportExport data={exportData} />
      </PageHeader>

      {/* Monthly report */}
      <section aria-labelledby="monthly" className="space-y-4">
        <h2 id="monthly" className="text-lg font-black capitalize">Laporan bulanan · {periodLabel}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Pemasukan" tone="income" icon={TrendingUp} value={formatIDR(report.income)} sub={<Delta c={report.vsPrevious.income} good="up" />} />
          <StatCard label="Total Pengeluaran" tone="expense" icon={TrendingDown} value={formatIDR(report.expense)} sub={<Delta c={report.vsPrevious.expense} good="down" />} />
          <StatCard
            label="Arus Kas Bersih"
            icon={Scale}
            value={<span className={report.net < 0 ? "text-expense-strong" : "text-income-strong"}>{report.net > 0 ? "+" : ""}{formatIDR(report.net)}</span>}
            sub={<Delta c={report.vsPrevious.net} good="up" />}
          />
          <StatCard label="Rata-rata Harian" tone="accent" icon={Flame} value={formatIDR(report.averageDailyExpense)} sub={<>pengeluaran per hari · {report.elapsedDays} hari</>} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Insight icon={Repeat} title="Kategori paling sering" slice={report.mostFrequentCategory} detail={(s) => `${s.count} transaksi · ${formatIDR(s.amount)}`} />
          <Insight icon={Crown} title="Pengeluaran terbesar" slice={report.highestCategory} detail={(s) => `${formatIDR(s.amount)} · ${formatPercent(s.percentage)} dari total`} />
        </div>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Dibanding bulan lalu</CardTitle>
              <CardDescription className="capitalize">{formatMonthLabel(shiftMonth(ym, -1))} → {periodLabel}</CardDescription>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-line text-left text-xs font-extrabold text-ink-faint uppercase">
                  <th className="py-2 pr-3"> </th>
                  <th className="py-2 pr-3 text-right">Bulan lalu</th>
                  <th className="py-2 pr-3 text-right">Bulan ini</th>
                  <th className="py-2 text-right">Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70 font-bold">
                {([["Pemasukan", report.vsPrevious.income, "up"], ["Pengeluaran", report.vsPrevious.expense, "down"], ["Arus kas bersih", report.vsPrevious.net, "up"]] as const).map(([label, c, good]) => (
                  <tr key={label}>
                    <td className="py-2.5 pr-3">{label}</td>
                    <td className="tabular py-2.5 pr-3 text-right text-ink-soft">{formatIDR(c.previous)}</td>
                    <td className="tabular py-2.5 pr-3 text-right">{formatIDR(c.current)}</td>
                    <td className="py-2.5 text-right"><Delta c={c} good={good} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Charts */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Pemasukan vs Pengeluaran</CardTitle>
              <CardDescription>12 bulan terakhir</CardDescription>
            </div>
          </CardHeader>
          <IncomeExpenseChart data={trend} />
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Tren Pengeluaran Bulanan</CardTitle>
              <CardDescription>12 bulan terakhir</CardDescription>
            </div>
          </CardHeader>
          <ExpenseTrendChart data={trend} height={268} />
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Rincian per Kategori</CardTitle>
              <CardDescription className="capitalize">{periodLabel}</CardDescription>
            </div>
          </CardHeader>
          {slices.length ? <CategoryDonut slices={slices} total={report.expense} /> : <EmptyState title="Belum ada pengeluaran" className="py-8" />}
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Tren Pengeluaran Harian</CardTitle>
              <CardDescription>Garis putus-putus = rata-rata harian</CardDescription>
            </div>
          </CardHeader>
          <DailySpendingChart data={daily} average={report.averageDailyExpense} height={240} />
        </Card>
      </section>

      {/* Daily report */}
      <section aria-labelledby="daily">
        <Card>
          <CardHeader>
            <div>
              <CardTitle id="daily" className="flex items-center gap-2"><CalendarDays className="size-5 text-primary-strong" /> Laporan Harian</CardTitle>
              <CardDescription className="capitalize">{formatDateLong(date)}</CardDescription>
            </div>
            <DateParamPicker value={date} label="Pilih tanggal laporan harian" />
          </CardHeader>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Pill label="Pemasukan" value={formatIDR(day.income)} className="bg-income-soft text-income-strong" />
            <Pill label="Pengeluaran" value={formatIDR(day.expense)} className="bg-expense-soft text-expense-strong" />
            <Pill label="Arus kas bersih" value={`${day.net > 0 ? "+" : ""}${formatIDR(day.net)}`} className="bg-primary-soft text-primary-strong" />
          </div>
          {dayTx.length ? (
            <TransactionList transactions={dayTx} categories={categories} today={ctx.today} />
          ) : (
            <EmptyState title={`Tidak ada transaksi pada ${formatDateDisplay(date)}`} description="Pilih tanggal lain untuk melihat detailnya." className="py-8" />
          )}
        </Card>
      </section>
    </div>
  );
}

function Delta({ c, good }: { c: Comparison; good: "up" | "down" }) {
  if (c.difference === 0) return <span className="inline-flex items-center gap-1 text-xs font-bold text-ink-faint"><Minus className="size-3" /> sama dengan bulan lalu</span>;
  const up = c.difference > 0;
  const positive = (up && good === "up") || (!up && good === "down");
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-extrabold", positive ? "text-income-strong" : "text-expense-strong")}>
      <Icon className="size-3.5" />
      {c.percentChange === null ? formatIDR(Math.abs(c.difference)) : `${formatPercent(Math.abs(c.percentChange))}`} {up ? "naik" : "turun"} vs bulan lalu
    </span>
  );
}

function Insight<T extends { name: string; icon: string }>({ icon: Icon, title, slice, detail }: { icon: typeof Crown; title: string; slice: T | null; detail: (s: T) => string }) {
  return (
    <Card className="flex items-center gap-4">
      {slice ? <CategoryIcon icon={slice.icon} type="expense" size="lg" /> : <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-cream text-ink-faint"><Icon className="size-6" /></span>}
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs font-extrabold text-ink-faint"><Icon className="size-3.5" /> {title}</p>
        <p className="truncate text-lg font-black">{slice ? slice.name : "Belum ada data"}</p>
        {slice ? <p className="text-xs font-bold text-ink-soft">{detail(slice)}</p> : null}
      </div>
    </Card>
  );
}

function Pill({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl px-4 py-3", className)}>
      <p className="text-xs font-extrabold opacity-80">{label}</p>
      <p className="tabular text-lg font-black">{value}</p>
    </div>
  );
}
