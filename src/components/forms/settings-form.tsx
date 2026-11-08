"use client";

import * as React from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { updateSettings } from "@/app/actions/settings";
import { TIMEZONE_OPTIONS } from "@/lib/dates";
import { formatDigitsGrouped, formatIDR, parseIDRInput } from "@/lib/format";
import { AmountInput } from "./amount-input";

export function SettingsForm({ name, initialBalance, timezone, totals }: { name: string; initialBalance: number; timezone: string; totals: { income: number; expense: number } }) {
  const [n, setN] = React.useState(name);
  const [balance, setBalance] = React.useState((initialBalance < 0 ? "-" : "") + formatDigitsGrouped(String(Math.abs(initialBalance))));
  const [tz, setTz] = React.useState(timezone);
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [pending, startTransition] = React.useTransition();

  const parsed = parseIDRInput(balance);
  const initial = Number.isNaN(parsed) ? 0 : balance.trim().startsWith("-") ? -parsed : parsed;
  const preview = initial + totals.income - totals.expense;
  const tzOptions = TIMEZONE_OPTIONS.some((o) => o.value === tz) ? TIMEZONE_OPTIONS : [...TIMEZONE_OPTIONS, { value: tz, label: tz }];

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await updateSettings({ name: n, initial_balance: balance, timezone: tz });
          if (res.ok) {
            toast.success(res.message);
            setErrors({});
          } else {
            setErrors(res.fieldErrors ?? {});
            toast.error(res.message);
          }
        });
      }}
    >
      <Field label="Nama panggilan" htmlFor="s-name" error={errors.name}>
        <Input id="s-name" value={n} maxLength={60} onChange={(e) => setN(e.target.value)} />
      </Field>
      <Field
        label="Saldo awal"
        htmlFor="s-balance"
        error={errors.initial_balance}
        hint="Titik awal catatan keuanganmu (bukan pemasukan). Ketik tanda minus di depan jika saldo awalmu negatif."
      >
        <AmountInput id="s-balance" value={balance} onChange={setBalance} allowNegative invalid={!!errors.initial_balance?.length} />
      </Field>
      <div className="rounded-2xl bg-primary-soft p-4 text-sm font-bold text-ink">
        <p className="tabular">
          {formatIDR(initial)} <span className="text-income-strong">+ {formatIDR(totals.income)}</span>{" "}
          <span className="text-expense-strong">− {formatIDR(totals.expense)}</span>
        </p>
        <p className="mt-1 text-ink-soft">
          = Saldo saat ini <b className="tabular text-ink">{formatIDR(preview)}</b>
        </p>
      </div>
      <Field label="Zona waktu" htmlFor="s-tz" error={errors.timezone} hint="Menentukan tanggal 'hari ini' dan bulan berjalan.">
        <NativeSelect id="s-tz" value={tz} onChange={(e) => setTz(e.target.value)}>
          {tzOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </NativeSelect>
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />} Simpan pengaturan
      </Button>
    </form>
  );
}
