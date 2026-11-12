import { ChevronDown, Plus, Wallet } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { DueBadge } from "@/components/due-badge";
import { EmptyState } from "@/components/empty-state";
import { InstallmentDialog, PayInstallmentDialog } from "@/components/forms/installment-dialogs";
import { DeleteInstallmentPaymentButton, InstallmentActions } from "@/components/obligation-actions";
import { ObligationTabs } from "@/components/obligation-tabs";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAppContext, getCategories, getInstallments } from "@/lib/data";
import { formatDateDisplay, formatMonthLabel, yearMonthKey } from "@/lib/dates";
import { formatIDR, formatPercent } from "@/lib/format";
import { daysBetween, installmentProgress } from "@/lib/obligations";
import { cn } from "@/lib/utils";

export const metadata = { title: "Cicilan" };

export default async function InstallmentsPage() {
  const ctx = await getAppContext();
  const [categories, installments] = await Promise.all([getCategories(), getInstallments()]);
  const catById = new Map(categories.map((c) => [c.id, c]));
  const items = installments.map((inst) => ({ inst, p: installmentProgress(inst, inst.payments, ctx.today) }));
  const active = items.filter((i) => !i.p.done);
  const done = items.filter((i) => i.p.done);
  const perMonth = active.reduce((s, i) => s + i.inst.monthly_amount, 0);
  const remaining = active.reduce((s, i) => s + i.p.remaining, 0);
  const defaultMonth = yearMonthKey(ctx.currentMonth);

  const addButton = (
    <InstallmentDialog
      categories={categories}
      defaultMonth={defaultMonth}
      trigger={
        <Button>
          <Plus /> Cicilan baru
        </Button>
      }
    />
  );

  return (
    <div>
      <ObligationTabs active="installments" />
      <PageHeader title="Cicilan" description="Pantau cicilan berjalan, jadwal berikutnya, dan sisa yang harus dibayar.">
        {addButton}
      </PageHeader>

      {items.length ? (
        <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
          <Pill label="Per bulan" value={formatIDR(perMonth)} />
          <Pill label="Sisa dibayar" value={formatIDR(remaining)} />
          <Pill label="Berjalan" value={`${active.length} cicilan`} />
        </div>
      ) : null}

      {active.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {active.map(({ inst, p }) => {
            const cat = catById.get(inst.category_id);
            return (
              <Card key={inst.id} className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <CategoryIcon icon={cat?.icon ?? "wallet"} type="expense" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-black text-ink">{inst.name}</p>
                    <p className="text-xs font-semibold text-ink-faint">
                      {formatIDR(inst.monthly_amount)}/bulan · tiap tgl {inst.due_day} · lunas {formatMonthLabel(p.lastMonth)}
                    </p>
                  </div>
                  <InstallmentActions installment={inst} categories={categories} defaultMonth={defaultMonth} />
                </div>

                <div>
                  <div className="mb-1.5 flex items-baseline justify-between text-sm font-bold">
                    <span className="text-ink">
                      {p.paidCount} dari {inst.tenor} kali dibayar
                    </span>
                    <span className="text-ink-soft">{formatPercent(p.percentage)}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`Progres cicilan ${inst.name}`}
                    aria-valuemin={0}
                    aria-valuemax={inst.tenor}
                    aria-valuenow={p.paidCount}
                    className="h-3 overflow-hidden rounded-full bg-primary-soft ring-1 ring-line"
                  >
                    <div className="h-full rounded-full bg-income transition-[width] duration-700" style={{ width: `${p.percentage}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs font-bold text-ink-soft">
                    <span className="tabular">Terbayar {formatIDR(p.paidAmount)}</span>
                    <span className="tabular">Sisa {formatIDR(p.remaining)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-cream px-3 py-2.5">
                  <span className="flex-1 text-sm font-bold text-ink">
                    Cicilan ke-{p.nextNumber} · {p.nextDueDate ? formatDateDisplay(p.nextDueDate) : "—"}
                  </span>
                  <DueBadge status={p.status} daysLeft={p.nextDueDate ? daysBetween(ctx.today, p.nextDueDate) : undefined} />
                  <PayInstallmentDialog
                    installment={inst}
                    nextNumber={p.nextNumber ?? inst.tenor}
                    defaultDate={ctx.today}
                    trigger={
                      <Button size="sm" aria-label={`Bayar cicilan ${inst.name}`}>
                        <Wallet /> Bayar
                      </Button>
                    }
                  />
                </div>

                <PaymentHistory inst={inst} />
              </Card>
            );
          })}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title="Belum ada cicilan" description="Catat cicilan HP, motor, atau paylater untuk melihat progres dan sisa yang harus dibayar.">
            {addButton}
          </EmptyState>
        </Card>
      ) : (
        <Card>
          <EmptyState title="Tidak ada cicilan berjalan" description="Semua cicilanmu sudah lunas. Mantap!" />
        </Card>
      )}

      {done.length ? (
        <section aria-labelledby="done-title" className="mt-6">
          <h2 id="done-title" className="mb-3 text-lg font-black text-on-dark">
            Sudah lunas
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {done.map(({ inst, p }) => (
              <Card key={inst.id} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <CategoryIcon icon={catById.get(inst.category_id)?.icon ?? "wallet"} type="income" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-ink">{inst.name}</p>
                    <p className="text-xs font-semibold text-ink-faint">
                      {inst.tenor}× {formatIDR(inst.monthly_amount)} · total {formatIDR(p.paidAmount)}
                    </p>
                  </div>
                  <DueBadge status="lunas" />
                  <InstallmentActions installment={inst} categories={categories} defaultMonth={defaultMonth} />
                </div>
                <PaymentHistory inst={inst} />
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function PaymentHistory({ inst }: { inst: Awaited<ReturnType<typeof getInstallments>>[number] }) {
  if (!inst.payments.length && !inst.paid_before) return null;
  return (
    <details className="group rounded-2xl border border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-extrabold text-ink [&::-webkit-details-marker]:hidden">
        Riwayat pembayaran
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <ul className="divide-y divide-line border-t border-line">
        {inst.paid_before ? (
          <li className="px-3 py-2 text-xs font-semibold text-ink-soft">
            Ke-1 sampai ke-{inst.paid_before}: dibayar sebelum dicatat di Lumi
          </li>
        ) : null}
        {inst.payments.map((pay, i) => {
          const n = inst.paid_before + i + 1;
          return (
            <li key={pay.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="flex-1 font-bold text-ink">
                Ke-{n} · {formatDateDisplay(pay.paid_on)}
                {pay.transaction_id ? null : <span className="ml-1 text-xs font-semibold text-ink-faint">(tanpa transaksi)</span>}
              </span>
              <span className={cn("tabular font-black text-ink")}>{formatIDR(pay.amount)}</span>
              <DeleteInstallmentPaymentButton paymentId={pay.id} label={`ke-${n}`} recorded={Boolean(pay.transaction_id)} />
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-3xl glass px-3 py-3 shadow-soft sm:px-4">
      <p className="truncate text-[11px] font-extrabold text-ink-soft sm:text-xs">{label}</p>
      <p className="tabular truncate text-sm font-black text-ink sm:text-lg">{value}</p>
    </div>
  );
}
