import { Plus } from "lucide-react";
import { BudgetAlerts } from "@/components/budget-alerts";
import { BudgetRow } from "@/components/budget-row";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState } from "@/components/empty-state";
import { BudgetActions, BudgetDialog, CopyBudgetsButton } from "@/components/forms/budget-dialog";
import { Character, hasCharacter } from "@/components/character";
import { ToyBlock } from "@/components/decorations";
import { MonthPicker } from "@/components/month-picker";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar, statusStyles } from "@/components/ui/progress";
import { getAppContext, getBudgets, getCategories, getTransactionsInRange } from "@/lib/data";
import { formatMonthLabel, monthRange, parseYearMonth } from "@/lib/dates";
import { buildBudgetProgress, expenseByCategory, summarizeBudgets } from "@/lib/finance";
import { formatIDR, formatPercent } from "@/lib/format";

export const metadata = { title: "Anggaran" };

export default async function BudgetPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const sp = await searchParams;
  const ctx = await getAppContext();
  const ym = parseYearMonth(sp.month, ctx.currentMonth);
  const range = monthRange(ym);
  const [categories, budgets, monthTx] = await Promise.all([getCategories(), getBudgets(ym), getTransactionsInRange(range.start, range.end)]);

  const progress = buildBudgetProgress(budgets, monthTx, categories, ym);
  const overview = summarizeBudgets(progress);
  const budgeted = new Set(budgets.map((b) => b.category_id));
  const available = categories.filter((c) => c.type === "expense" && !budgeted.has(c.id));
  const spentBy = expenseByCategory(monthTx);
  const unbudgeted = available
    .map((c) => ({ c, spent: spentBy.get(c.id) ?? 0 }))
    .filter((x) => x.spent > 0)
    .sort((a, b) => b.spent - a.spent);
  const st = statusStyles[overview.status];

  const addButton = (
    <BudgetDialog
      period={ym}
      categories={available}
      trigger={
        <Button disabled={!available.length}>
          <Plus /> Buat anggaran
        </Button>
      }
    />
  );

  return (
    <div>
      <PageHeader title="Anggaran Bulanan" description="Tentukan batas belanja per kategori, para alien bantu mengawasi.">
        <MonthPicker value={ym} />
      </PageHeader>

      <Card className="mb-5 border-2 border-income/40 bg-[#f1fbf4]">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          {hasCharacter("aliens") ? <Character name="aliens" className="size-24 shrink-0 animate-float" /> : <ToyBlock letter="Rp" color="#3fae6f" className="size-16 shrink-0" />}
          <div className="flex-1">
            <p className="text-sm font-extrabold text-ink-soft capitalize">Total anggaran {formatMonthLabel(ym)}</p>
            {overview.count ? (
              <>
                <p className="tabular mt-1 text-2xl font-black">
                  {formatIDR(overview.totalSpent)} <span className="text-base font-bold text-ink-faint">/ {formatIDR(overview.totalLimit)}</span>
                </p>
                <ProgressBar value={overview.percentage} status={overview.status} className="mt-3 h-4" label="Total pemakaian anggaran" />
                <p className={`mt-2 text-sm font-extrabold ${st.text}`}>
                  {formatPercent(overview.percentage)} terpakai ·{" "}
                  {overview.remaining >= 0 ? `sisa ${formatIDR(overview.remaining)}` : `lewat ${formatIDR(-overview.remaining)}`}
                </p>
              </>
            ) : (
              <p className="mt-1 font-bold text-ink">Belum ada anggaran untuk bulan ini.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {addButton}
            <CopyBudgetsButton period={ym} />
          </div>
        </div>
      </Card>

      <BudgetAlerts progress={progress} className="mb-5" />

      {progress.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {progress.map((p) => (
            <BudgetRow key={p.budgetId} p={p} actions={<BudgetActions id={p.budgetId} amount={p.limit} categoryName={p.categoryName} period={ym} />} />
          ))}
        </div>
      ) : (
        <EmptyState title="Yuk buat anggaran pertama" description="Contoh: Makanan & Minuman Rp1.000.000, Transportasi Rp500.000. Hanya pengeluaran di bulan ini yang dihitung.">
          {addButton}
        </EmptyState>
      )}

      {unbudgeted.length ? (
        <Card className="mt-5">
          <CardHeader>
            <div>
              <CardTitle>Pengeluaran tanpa anggaran</CardTitle>
              <CardDescription>Kategori ini sudah dipakai bulan ini tapi belum punya batas.</CardDescription>
            </div>
          </CardHeader>
          <ul className="divide-y divide-line/70">
            {unbudgeted.map(({ c, spent }) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <CategoryIcon icon={c.icon} type="expense" size="sm" />
                <span className="flex-1 text-sm font-bold">{c.name}</span>
                <span className="tabular text-sm font-black text-expense-strong">{formatIDR(spent)}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
