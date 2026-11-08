"use client";

import * as React from "react";
import { Copy, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field, NativeSelect } from "@/components/ui/input";
import { copyBudgetsFromPreviousMonth, createBudget, deleteBudget, updateBudget } from "@/app/actions/budgets";
import { formatMonthLabel } from "@/lib/dates";
import { formatDigitsGrouped } from "@/lib/format";
import type { Category, YearMonth } from "@/lib/types";
import { AmountInput } from "./amount-input";

export function BudgetDialog({
  trigger,
  period,
  categories,
  budget,
}: {
  trigger: React.ReactNode;
  period: YearMonth;
  /** expense categories that can still get a budget this month (create mode) */
  categories: Category[];
  budget?: { id: string; amount: number; categoryName: string };
}) {
  const [open, setOpen] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (open) {
      setCategoryId("");
      setAmount(budget ? formatDigitsGrouped(String(budget.amount)) : "");
      setErrors({});
    }
  }, [open, budget]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = budget
        ? await updateBudget(budget.id, { amount })
        : await createBudget({ category_id: categoryId, amount, year: period.year, month: period.month });
      if (res.ok) {
        toast.success(res.message);
        setOpen(false);
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={budget ? `Edit anggaran ${budget.categoryName}` : "Buat anggaran"}
        description={`Batas pengeluaran untuk ${formatMonthLabel(period)}.`}
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          {!budget ? (
            <Field label="Kategori pengeluaran" htmlFor="b-cat" error={errors.category_id}>
              <NativeSelect id="b-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-invalid={!!errors.category_id?.length || undefined}>
                <option value="">Pilih kategori…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          ) : null}
          <Field label="Batas anggaran per bulan" htmlFor="b-amount" error={errors.amount}>
            <AmountInput id="b-amount" value={amount} onChange={setAmount} invalid={!!errors.amount?.length} autoFocus={!!budget} />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {budget ? "Simpan perubahan" : "Simpan anggaran"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BudgetActions({ id, amount, categoryName, period }: { id: string; amount: number; categoryName: string; period: YearMonth }) {
  return (
    <div className="flex gap-0.5">
      <BudgetDialog
        period={period}
        categories={[]}
        budget={{ id, amount, categoryName }}
        trigger={
          <Button variant="ghost" size="icon" className="size-8" aria-label={`Edit anggaran ${categoryName}`}>
            <Pencil />
          </Button>
        }
      />
      <ConfirmDialog
        title="Hapus anggaran ini?"
        description={<>Anggaran <b className="text-ink">{categoryName}</b> untuk {formatMonthLabel(period)} akan dihapus. Transaksi tidak ikut terhapus.</>}
        onConfirm={async () => {
          const res = await deleteBudget(id);
          if (res.ok) toast.success(res.message);
          else toast.error(res.message);
          return res.ok;
        }}
        trigger={
          <Button variant="ghost" size="icon" className="size-8 hover:bg-expense-soft hover:text-expense-strong" aria-label={`Hapus anggaran ${categoryName}`}>
            <Trash2 />
          </Button>
        }
      />
    </div>
  );
}

export function CopyBudgetsButton({ period }: { period: YearMonth }) {
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await copyBudgetsFromPreviousMonth(period.year, period.month);
          if (res.ok) toast.success(res.message);
          else toast.info(res.message);
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <Copy />} Salin dari bulan lalu
    </Button>
  );
}
