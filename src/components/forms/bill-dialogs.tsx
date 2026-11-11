"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { createBill, payBill, updateBill } from "@/app/actions/bills";
import { formatDateDisplay, formatMonthLabel } from "@/lib/dates";
import { formatDigitsGrouped } from "@/lib/format";
import type { Bill, Category, YearMonth } from "@/lib/types";
import { AmountInput } from "./amount-input";

export function BillDialog({ trigger, categories, bill }: { trigger: React.ReactNode; categories: Category[]; bill?: Bill }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={bill ? "Edit tagihan" : "Tagihan baru"} description="Tagihan rutin tiap bulan, misalnya listrik, internet, atau kos.">
        {open ? <BillForm categories={categories} bill={bill} onDone={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function BillForm({ categories, bill, onDone }: { categories: Category[]; bill?: Bill; onDone: () => void }) {
  const expense = categories.filter((c) => c.type === "expense");
  const [name, setName] = React.useState(bill?.name ?? "");
  const [amount, setAmount] = React.useState(bill ? formatDigitsGrouped(String(bill.amount)) : "");
  const [dueDay, setDueDay] = React.useState(bill ? String(bill.due_day) : "");
  const [categoryId, setCategoryId] = React.useState(bill?.category_id ?? expense.find((c) => /tagihan/i.test(c.name))?.id ?? "");
  const [notes, setNotes] = React.useState(bill?.notes ?? "");
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [pending, start] = React.useTransition();

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const payload = { name, amount, due_day: dueDay, category_id: categoryId, notes };
        start(async () => {
          const res = bill ? await updateBill(bill.id, payload) : await createBill(payload);
          if (res.ok) {
            toast.success(res.message);
            onDone();
          } else {
            setErrors(res.fieldErrors ?? {});
            toast.error(res.message);
          }
        });
      }}
    >
      <Field label="Nama tagihan" htmlFor="b-name" error={errors.name}>
        <Input id="b-name" maxLength={60} placeholder="cth. Listrik PLN" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name?.length || undefined} />
      </Field>
      <Field label="Nominal biasanya" htmlFor="b-amount" error={errors.amount} hint="Perkiraan; saat ditandai lunas kamu bisa mengisi nominal sebenarnya.">
        <AmountInput id="b-amount" value={amount} onChange={setAmount} invalid={!!errors.amount?.length} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jatuh tempo tiap tanggal" htmlFor="b-due" error={errors.due_day} hint="1–31. Tanggal 31 di bulan pendek = akhir bulan.">
          <Input id="b-due" type="number" inputMode="numeric" min={1} max={31} placeholder="cth. 20" value={dueDay} onChange={(e) => setDueDay(e.target.value)} aria-invalid={!!errors.due_day?.length || undefined} />
        </Field>
        <Field label="Kategori" htmlFor="b-cat" error={errors.category_id}>
          <NativeSelect id="b-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-invalid={!!errors.category_id?.length || undefined}>
            <option value="">Pilih kategori…</option>
            {expense.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label="Catatan (opsional)" htmlFor="b-notes" error={errors.notes}>
        <Textarea id="b-notes" maxLength={300} placeholder="cth. nomor pelanggan" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {bill ? "Simpan perubahan" : "Simpan tagihan"}
      </Button>
    </form>
  );
}

/** Record that a bill was paid for a month (optionally as an expense transaction). */
export function PayBillDialog({
  trigger,
  bill,
  period,
  defaultDate,
}: {
  trigger: React.ReactNode;
  bill: Pick<Bill, "id" | "name" | "amount">;
  period: YearMonth;
  defaultDate: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState(formatDigitsGrouped(String(bill.amount)));
  const [paidOn, setPaidOn] = React.useState(defaultDate);
  const [record, setRecord] = React.useState(true);
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    if (!open) return;
    setAmount(formatDigitsGrouped(String(bill.amount)));
    setPaidOn(defaultDate);
    setRecord(true);
    setErrors({});
  }, [open, bill.amount, defaultDate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={`Tandai lunas: ${bill.name}`} description={`Tagihan ${formatMonthLabel(period)}.`}>
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await payBill({ bill_id: bill.id, year: period.year, month: period.month, amount, paid_on: paidOn, record });
              if (res.ok) {
                toast.success(res.message);
                setOpen(false);
              } else {
                setErrors(res.fieldErrors ?? {});
                toast.error(res.message);
              }
            });
          }}
        >
          <Field label="Nominal dibayar" htmlFor="pb-amount" error={errors.amount}>
            <AmountInput id="pb-amount" value={amount} onChange={setAmount} invalid={!!errors.amount?.length} autoFocus />
          </Field>
          <Field label="Tanggal bayar" htmlFor="pb-date" error={errors.paid_on} hint={paidOn ? formatDateDisplay(paidOn) : undefined}>
            <Input id="pb-date" type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
          </Field>
          <label htmlFor="pb-record" className="flex cursor-pointer items-start gap-3 rounded-2xl bg-cream p-3 text-sm font-semibold text-ink">
            <input id="pb-record" type="checkbox" checked={record} onChange={(e) => setRecord(e.target.checked)} className="mt-0.5 size-5 accent-[#1d1d1f]" />
            <span>
              Catat juga sebagai pengeluaran
              <span className="block text-xs font-semibold text-ink-soft">
                Matikan kalau pengeluaran ini sudah kamu catat sendiri, supaya tidak tercatat dua kali.
              </span>
            </span>
          </label>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Tandai lunas
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
