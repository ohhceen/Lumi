"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { createInstallment, payInstallment, updateInstallment } from "@/app/actions/installments";
import { formatDateDisplay } from "@/lib/dates";
import { formatDigitsGrouped, formatIDR, parseIDRInput } from "@/lib/format";
import type { Category, Installment } from "@/lib/types";
import { AmountInput } from "./amount-input";

export function InstallmentDialog({ trigger, categories, installment, defaultMonth }: { trigger: React.ReactNode; categories: Category[]; installment?: Installment; defaultMonth: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent title={installment ? "Edit cicilan" : "Cicilan baru"} description="Cicilan dengan jumlah tetap tiap bulan, misalnya HP, motor, atau paylater.">
        {open ? <InstallmentForm categories={categories} installment={installment} defaultMonth={defaultMonth} onDone={() => setOpen(false)} /> : null}
      </DialogContent>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
    </Dialog>
  );
}

function InstallmentForm({ categories, installment, defaultMonth, onDone }: { categories: Category[]; installment?: Installment; defaultMonth: string; onDone: () => void }) {
  const expense = categories.filter((c) => c.type === "expense");
  const [name, setName] = React.useState(installment?.name ?? "");
  const [monthly, setMonthly] = React.useState(installment ? formatDigitsGrouped(String(installment.monthly_amount)) : "");
  const [tenor, setTenor] = React.useState(installment ? String(installment.tenor) : "");
  const [startMonth, setStartMonth] = React.useState(installment ? installment.start_month.slice(0, 7) : defaultMonth);
  const [dueDay, setDueDay] = React.useState(installment ? String(installment.due_day) : "");
  const [paidBefore, setPaidBefore] = React.useState(installment ? String(installment.paid_before) : "0");
  const [categoryId, setCategoryId] = React.useState(installment?.category_id ?? expense.find((c) => /tagihan/i.test(c.name))?.id ?? "");
  const [notes, setNotes] = React.useState(installment?.notes ?? "");
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [pending, start] = React.useTransition();

  const m = parseIDRInput(monthly);
  const t = Number(tenor);
  const total = Number.isFinite(m) && t > 0 ? m * t : null;

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const payload = { name, monthly_amount: monthly, tenor, start_month: startMonth, due_day: dueDay, paid_before: paidBefore || 0, category_id: categoryId, notes };
        start(async () => {
          const res = installment ? await updateInstallment(installment.id, payload) : await createInstallment(payload);
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
      <Field label="Nama cicilan" htmlFor="i-name" error={errors.name}>
        <Input id="i-name" maxLength={60} placeholder="cth. Cicilan HP" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name?.length || undefined} />
      </Field>
      <Field label="Cicilan per bulan" htmlFor="i-monthly" error={errors.monthly_amount}>
        <AmountInput id="i-monthly" value={monthly} onChange={setMonthly} invalid={!!errors.monthly_amount?.length} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tenor (berapa kali bayar)" htmlFor="i-tenor" error={errors.tenor} hint={total ? `Total ${formatIDR(total)}` : undefined}>
          <Input id="i-tenor" type="number" inputMode="numeric" min={1} max={360} placeholder="cth. 12" value={tenor} onChange={(e) => setTenor(e.target.value)} aria-invalid={!!errors.tenor?.length || undefined} />
        </Field>
        <Field label="Jatuh tempo tiap tanggal" htmlFor="i-due" error={errors.due_day}>
          <Input id="i-due" type="number" inputMode="numeric" min={1} max={31} placeholder="cth. 10" value={dueDay} onChange={(e) => setDueDay(e.target.value)} aria-invalid={!!errors.due_day?.length || undefined} />
        </Field>
        <Field label="Bulan cicilan pertama" htmlFor="i-start" error={errors.start_month}>
          <Input id="i-start" type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} aria-invalid={!!errors.start_month?.length || undefined} />
        </Field>
        <Field label="Sudah dibayar sebelumnya" htmlFor="i-before" error={errors.paid_before} hint="Kali pembayaran sebelum mulai dicatat di Lumi.">
          <Input id="i-before" type="number" inputMode="numeric" min={0} value={paidBefore} onChange={(e) => setPaidBefore(e.target.value)} aria-invalid={!!errors.paid_before?.length || undefined} />
        </Field>
      </div>
      <Field label="Kategori" htmlFor="i-cat" error={errors.category_id}>
        <NativeSelect id="i-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-invalid={!!errors.category_id?.length || undefined}>
          <option value="">Pilih kategori…</option>
          {expense.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Catatan (opsional)" htmlFor="i-notes" error={errors.notes}>
        <Textarea id="i-notes" maxLength={300} placeholder="cth. lewat aplikasi leasing" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {installment ? "Simpan perubahan" : "Simpan cicilan"}
      </Button>
    </form>
  );
}

export function PayInstallmentDialog({
  trigger,
  installment,
  nextNumber,
  defaultDate,
}: {
  trigger: React.ReactNode;
  installment: Pick<Installment, "id" | "name" | "monthly_amount" | "tenor">;
  nextNumber: number;
  defaultDate: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [paidOn, setPaidOn] = React.useState(defaultDate);
  const [record, setRecord] = React.useState(true);
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    if (!open) return;
    setAmount(formatDigitsGrouped(String(installment.monthly_amount)));
    setPaidOn(defaultDate);
    setRecord(true);
    setErrors({});
  }, [open, installment.monthly_amount, defaultDate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={`Bayar ${installment.name}`} description={`Cicilan ke-${nextNumber} dari ${installment.tenor}.`}>
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await payInstallment({ installment_id: installment.id, amount, paid_on: paidOn, record });
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
          <Field label="Nominal dibayar" htmlFor="pi-amount" error={errors.amount}>
            <AmountInput id="pi-amount" value={amount} onChange={setAmount} invalid={!!errors.amount?.length} autoFocus />
          </Field>
          <Field label="Tanggal bayar" htmlFor="pi-date" error={errors.paid_on} hint={paidOn ? formatDateDisplay(paidOn) : undefined}>
            <Input id="pi-date" type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
          </Field>
          <label htmlFor="pi-record" className="flex cursor-pointer items-start gap-3 rounded-2xl bg-cream p-3 text-sm font-semibold text-ink">
            <input id="pi-record" type="checkbox" checked={record} onChange={(e) => setRecord(e.target.checked)} className="mt-0.5 size-5 accent-[#1d1d1f]" />
            <span>
              Catat juga sebagai pengeluaran
              <span className="block text-xs font-semibold text-ink-soft">Matikan kalau pengeluaran ini sudah kamu catat sendiri.</span>
            </span>
          </label>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Catat pembayaran
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
