import { Check, Plus } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { DueBadge } from "@/components/due-badge";
import { EmptyState } from "@/components/empty-state";
import { BillDialog, PayBillDialog } from "@/components/forms/bill-dialogs";
import { MonthPicker } from "@/components/month-picker";
import { BillRowActions, UnpayBillButton } from "@/components/obligation-actions";
import { ObligationTabs } from "@/components/obligation-tabs";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppContext, getBillPayments, getBills, getCategories } from "@/lib/data";
import { formatDateDisplay, monthRange, parseYearMonth } from "@/lib/dates";
import { formatIDR } from "@/lib/format";
import { billsForMonth, summarizeBills } from "@/lib/obligations";
import { cn } from "@/lib/utils";

export const metadata = { title: "Tagihan bulanan" };

export default async function BillsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const sp = await searchParams;
  const ctx = await getAppContext();
  const ym = parseYearMonth(sp.month, ctx.currentMonth);
  const range = monthRange(ym);
  const [categories, bills, payments] = await Promise.all([getCategories(), getBills(), getBillPayments(ym)]);
  const catById = new Map(categories.map((c) => [c.id, c]));
  const rows = billsForMonth(bills, payments, ym, ctx.today);
  const summary = summarizeBills(rows);
  const inactive = bills.filter((b) => !b.active && !rows.some((r) => r.bill.id === b.id));
  const todayInMonth = ctx.today >= range.start && ctx.today < range.end;

  const addButton = (
    <BillDialog
      categories={categories}
      trigger={
        <Button>
          <Plus /> Tagihan baru
        </Button>
      }
    />
  );

  return (
    <div>
      <ObligationTabs active="bills" />
      <PageHeader title="Tagihan bulanan" description="Catat tagihan rutin dan tandai yang sudah lunas tiap bulan.">
        <MonthPicker value={ym} />
        {addButton}
      </PageHeader>

      {rows.length ? (
        <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
          <Pill label="Total tagihan" value={formatIDR(summary.total)} className="bg-white text-ink" />
          <Pill label={`Lunas ${summary.paidCount}/${summary.count}`} value={formatIDR(summary.paid)} className="bg-income-soft text-income-strong" />
          <Pill label="Belum dibayar" value={formatIDR(summary.unpaid)} className={summary.unpaid ? "bg-expense-soft text-expense-strong" : "bg-white text-ink"} />
        </div>
      ) : null}

      <Card>
        {rows.length ? (
          <ul className="divide-y divide-line">
            {rows.map((r) => {
              const cat = catById.get(r.bill.category_id);
              return (
                <li key={r.bill.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                  <CategoryIcon icon={cat?.icon ?? "receipt"} type="expense" />
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate text-sm font-extrabold text-ink">
                      {r.bill.name}
                      {!r.bill.active ? <span className="ml-2 text-xs font-bold text-ink-faint">(dihentikan)</span> : null}
                    </p>
                    <p className="truncate text-xs font-semibold text-ink-faint">
                      Jatuh tempo {formatDateDisplay(r.dueDate)} · {cat?.name ?? "—"}
                      {r.bill.notes ? ` · ${r.bill.notes}` : ""}
                    </p>
                  </div>
                  <DueBadge status={r.status} daysLeft={r.daysLeft} />
                  <span className={cn("tabular text-sm font-black sm:w-28 sm:text-right", r.payment ? "text-income-strong" : "text-ink")}>
                    {formatIDR(r.payment ? r.payment.amount : r.bill.amount)}
                  </span>
                  <div className="flex items-center gap-1">
                    {r.payment ? (
                      <>
                        <span className="hidden text-xs font-bold text-ink-soft sm:inline">
                          <Check className="mr-1 inline size-3.5" />
                          {formatDateDisplay(r.payment.paid_on)}
                        </span>
                        <UnpayBillButton paymentId={r.payment.id} name={r.bill.name} recorded={Boolean(r.payment.transaction_id)} />
                      </>
                    ) : (
                      <PayBillDialog
                        bill={r.bill}
                        period={ym}
                        defaultDate={todayInMonth ? ctx.today : r.dueDate}
                        trigger={
                          <Button size="sm" aria-label={`Tandai lunas ${r.bill.name}`}>
                            <Check /> Tandai lunas
                          </Button>
                        }
                      />
                    )}
                    <BillRowActions bill={r.bill} categories={categories} />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="Belum ada tagihan" description="Tambahkan tagihan rutin seperti listrik, internet, atau kos supaya tidak ada yang terlewat.">
            {addButton}
          </EmptyState>
        )}
      </Card>

      {inactive.length ? (
        <Card className="mt-5">
          <CardHeader>
            <div>
              <CardTitle>Tagihan yang dihentikan</CardTitle>
              <CardDescription>Tidak muncul lagi tiap bulan. Riwayatnya tetap tersimpan.</CardDescription>
            </div>
          </CardHeader>
          <ul className="divide-y divide-line">
            {inactive.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-2.5">
                <CategoryIcon icon={catById.get(b.category_id)?.icon ?? "receipt"} size="sm" />
                <span className="flex-1 text-sm font-bold text-ink-soft">{b.name}</span>
                <span className="tabular text-sm font-bold text-ink-soft">{formatIDR(b.amount)}</span>
                <BillRowActions bill={b} categories={categories} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function Pill({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("min-w-0 rounded-3xl px-3 py-3 shadow-soft sm:px-4", className)}>
      <p className="truncate text-[11px] font-extrabold opacity-80 sm:text-xs">{label}</p>
      <p className="tabular truncate text-sm font-black sm:text-lg">{value}</p>
    </div>
  );
}
