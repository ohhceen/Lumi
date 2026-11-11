"use client";

import * as React from "react";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { createTransaction, updateTransaction } from "@/app/actions/transactions";
import { formatDigitsGrouped } from "@/lib/format";
import type { Category, Transaction, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AmountInput } from "./amount-input";

export function TransactionForm({
  categories,
  transaction,
  defaultDate,
  defaultType = "expense",
  defaultCategoryId,
  onDone,
}: {
  categories: Category[];
  transaction?: Pick<Transaction, "id" | "type" | "description" | "amount" | "category_id" | "transaction_date" | "notes">;
  defaultDate: string;
  defaultType?: TransactionType;
  /** preselect a category (quick add) */
  defaultCategoryId?: string;
  onDone?: () => void;
}) {
  const [type, setType] = React.useState<TransactionType>(transaction?.type ?? defaultType);
  const [amount, setAmount] = React.useState(transaction ? formatDigitsGrouped(String(transaction.amount)) : "");
  const [description, setDescription] = React.useState(transaction?.description ?? "");
  const [categoryId, setCategoryId] = React.useState(transaction?.category_id ?? defaultCategoryId ?? "");
  const [date, setDate] = React.useState(transaction?.transaction_date ?? defaultDate);
  const [notes, setNotes] = React.useState(transaction?.notes ?? "");
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [pending, startTransition] = React.useTransition();

  const options = categories.filter((c) => c.type === type);

  function switchType(next: TransactionType) {
    if (next === type) return;
    setType(next);
    // a category of the other type is never valid
    if (!categories.some((c) => c.id === categoryId && c.type === next)) setCategoryId("");
    setErrors((e) => ({ ...e, type: [], category_id: [] }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { type, amount, description, category_id: categoryId, transaction_date: date, notes };
    startTransition(async () => {
      const res = transaction ? await updateTransaction(transaction.id, payload) : await createTransaction(payload);
      if (res.ok) {
        toast.success(res.message);
        setErrors({});
        onDone?.();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.message);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div role="radiogroup" aria-label="Jenis transaksi" className="grid grid-cols-2 gap-2 rounded-2xl bg-cream p-1.5">
        {(
          [
            { v: "expense", label: "Pengeluaran", icon: TrendingDown, on: "bg-btn-expense text-white shadow-soft" },
            { v: "income", label: "Pemasukan", icon: TrendingUp, on: "bg-btn-income text-white shadow-soft" },
          ] as const
        ).map(({ v, label, icon: Icon, on }) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={type === v}
            onClick={() => switchType(v)}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition-all",
              type === v ? on : "text-ink-soft hover:bg-white",
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      <Field label="Jumlah" htmlFor="tx-amount" error={errors.amount}>
        <AmountInput id="tx-amount" value={amount} onChange={setAmount} invalid={!!errors.amount?.length} autoFocus={!transaction} />
      </Field>

      <Field label="Deskripsi" htmlFor="tx-desc" error={errors.description}>
        <Input
          id="tx-desc"
          maxLength={100}
          placeholder={type === "income" ? "cth. Gaji bulan November" : "cth. Makan siang nasi campur"}
          value={description}
          aria-invalid={!!errors.description?.length || undefined}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kategori" htmlFor="tx-cat" error={errors.category_id}>
          <NativeSelect
            id="tx-cat"
            value={categoryId}
            aria-invalid={!!errors.category_id?.length || undefined}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Pilih kategori…</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Tanggal" htmlFor="tx-date" error={errors.transaction_date}>
          <Input
            id="tx-date"
            type="date"
            value={date}
            aria-invalid={!!errors.transaction_date?.length || undefined}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Catatan (opsional)" htmlFor="tx-notes" error={errors.notes}>
        <Textarea id="tx-notes" maxLength={500} placeholder="Tambahkan catatan kecil…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <Button type="submit" size="lg" variant={type === "income" ? "income" : "expense"} className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        {transaction ? "Simpan perubahan" : type === "income" ? "Simpan pemasukan" : "Simpan pengeluaran"}
      </Button>
    </form>
  );
}
