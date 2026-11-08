import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { TransactionDialog } from "@/components/forms/transaction-dialog";
import { PageHeader } from "@/components/page-header";
import { TransactionList, TransactionTable } from "@/components/transaction-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, NativeSelect } from "@/components/ui/input";
import { getAppContext, getCategories, getTotals, searchTransactions } from "@/lib/data";
import { filtersToDateRange, pageCount, PAGE_SIZE } from "@/lib/filters";
import { formatIDR } from "@/lib/format";
import { transactionFilterSchema, type TransactionFilters } from "@/lib/validation";
import { cn } from "@/lib/utils";

export const metadata = { title: "Transaksi" };

function hrefWith(filters: TransactionFilters, patch: Partial<TransactionFilters>) {
  const merged = { ...filters, ...patch };
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined || v === null || v === "") continue;
    if (k === "page" && v === 1) continue;
    if (k === "sort" && v === "newest") continue;
    p.set(k, String(v));
  }
  const qs = p.toString();
  return `/transactions${qs ? `?${qs}` : ""}`;
}

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = transactionFilterSchema.parse(await searchParams);
  const ctx = await getAppContext();
  const { start, end } = filtersToDateRange(filters);
  const [categories, result] = await Promise.all([getCategories(), searchTransactions(filters)]);
  // Totals for the same filters (type/category/text filters are applied in the list; date range here)
  const rangeTotals = await getTotals(start, end);
  const pages = pageCount(result.total);
  const hasFilters = Boolean(filters.q || filters.type || filters.category || filters.date || filters.month);
  const from = result.total ? (filters.page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(filters.page * PAGE_SIZE, result.total);

  return (
    <div>
      <PageHeader title="Transaksi" description="Semua pemasukan dan pengeluaranmu, tercatat rapi.">
        <TransactionDialog
          categories={categories}
          defaultDate={ctx.today}
          defaultType="income"
          trigger={
            <Button variant="income">
              <Plus /> Pemasukan
            </Button>
          }
        />
        <TransactionDialog
          categories={categories}
          defaultDate={ctx.today}
          defaultType="expense"
          trigger={
            <Button variant="expense">
              <Plus /> Pengeluaran
            </Button>
          }
        />
      </PageHeader>

      <Card className="mb-5">
        <form method="get" action="/transactions">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <label htmlFor="f-q" className="sr-only">Cari deskripsi</label>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-faint" />
              <Input id="f-q" name="q" defaultValue={filters.q ?? ""} placeholder="Cari deskripsi, cth. kopi" className="pl-10" />
            </div>
            <Button type="submit" aria-label="Terapkan">
              <Search /> <span className="hidden sm:inline">Terapkan</span>
            </Button>
          </div>
          <details className="group mt-3" open={Boolean(filters.type || filters.category || filters.date || filters.month || filters.sort !== "newest")}>
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-xl px-2 py-1 text-sm font-extrabold text-primary-strong hover:bg-primary-soft [&::-webkit-details-marker]:hidden">
              <SlidersHorizontal className="size-4" /> Filter lainnya
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <Label htmlFor="f-type">Jenis</Label>
                <NativeSelect id="f-type" name="type" defaultValue={filters.type ?? ""}>
                  <option value="">Semua</option>
                  <option value="income">Pemasukan</option>
                  <option value="expense">Pengeluaran</option>
                </NativeSelect>
              </div>
              <div>
                <Label htmlFor="f-cat">Kategori</Label>
                <NativeSelect id="f-cat" name="category" defaultValue={filters.category ?? ""}>
                  <option value="">Semua</option>
                  <optgroup label="Pemasukan">
                    {categories.filter((c) => c.type === "income").map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Pengeluaran">
                    {categories.filter((c) => c.type === "expense").map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                </NativeSelect>
              </div>
              <div>
                <Label htmlFor="f-month">Bulan</Label>
                <Input id="f-month" type="month" name="month" defaultValue={filters.month ?? ""} />
              </div>
              <div>
                <Label htmlFor="f-date">Tanggal</Label>
                <Input id="f-date" type="date" name="date" defaultValue={filters.date ?? ""} />
              </div>
              <div>
                <Label htmlFor="f-sort">Urutkan</Label>
                <NativeSelect id="f-sort" name="sort" defaultValue={filters.sort}>
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                </NativeSelect>
              </div>
            </div>
          </details>
          {hasFilters || filters.date ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {hasFilters ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/transactions">
                    <X /> Reset filter
                  </Link>
                </Button>
              ) : null}
              {filters.date && filters.month ? (
                <p className="text-xs font-bold text-accent-strong">Filter tanggal dipakai (mengalahkan filter bulan).</p>
              ) : null}
            </div>
          ) : null}
        </form>
      </Card>

      {(start || end) && !filters.q && !filters.type && !filters.category ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <SummaryPill label="Pemasukan" value={formatIDR(rangeTotals.income)} className="bg-income-soft text-income-strong" />
          <SummaryPill label="Pengeluaran" value={formatIDR(rangeTotals.expense)} className="bg-expense-soft text-expense-strong" />
          <SummaryPill label="Selisih" value={formatIDR(rangeTotals.income - rangeTotals.expense)} className="bg-primary-soft text-primary-strong" />
        </div>
      ) : null}

      <Card>
        {result.rows.length ? (
          <>
            <div className="hidden md:block">
              <TransactionTable transactions={result.rows} categories={categories} today={ctx.today} />
            </div>
            <div className="md:hidden">
              <TransactionList transactions={result.rows} categories={categories} today={ctx.today} />
            </div>
            <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-line pt-4 sm:flex-row">
              <p className="text-xs font-bold text-ink-faint">
                Menampilkan {from}–{to} dari {result.total} transaksi
              </p>
              {pages > 1 ? (
                <nav aria-label="Halaman" className="flex items-center gap-1">
                  <PageLink href={hrefWith(filters, { page: filters.page - 1 })} disabled={filters.page <= 1} label="Sebelumnya">
                    <ChevronLeft className="size-4" />
                  </PageLink>
                  <span className="px-3 text-sm font-black">
                    {filters.page} / {pages}
                  </span>
                  <PageLink href={hrefWith(filters, { page: filters.page + 1 })} disabled={filters.page >= pages} label="Berikutnya">
                    <ChevronRight className="size-4" />
                  </PageLink>
                </nav>
              ) : null}
            </div>
          </>
        ) : hasFilters ? (
          <EmptyState mood="worried" title="Tidak ada transaksi yang cocok" description="Coba ubah atau reset filter pencarianmu.">
            <Button asChild variant="outline">
              <Link href="/transactions">Reset filter</Link>
            </Button>
          </EmptyState>
        ) : (
          <EmptyState title="Riwayat masih kosong" description="Transaksi yang kamu catat akan muncul di sini.">
            <TransactionDialog categories={categories} defaultDate={ctx.today} trigger={<Button><Plus /> Catat transaksi</Button>} />
          </EmptyState>
        )}
      </Card>
    </div>
  );
}

function SummaryPill({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl px-4 py-3", className)}>
      <p className="text-xs font-extrabold opacity-80">{label}</p>
      <p className="tabular text-lg font-black">{value}</p>
    </div>
  );
}

function PageLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
  if (disabled)
    return (
      <span aria-disabled className="rounded-xl border-2 border-line p-2 text-ink-faint opacity-50">
        {children}
      </span>
    );
  return (
    <Link href={href} aria-label={label} className="rounded-xl border-2 border-line p-2 text-ink-soft hover:border-primary hover:bg-primary-soft">
      {children}
    </Link>
  );
}
