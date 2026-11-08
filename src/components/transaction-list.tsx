"use client";

import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CategoryIcon } from "./category-icon";
import { Money } from "./money";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { TransactionDialog } from "./forms/transaction-dialog";
import { deleteTransaction } from "@/app/actions/transactions";
import { formatDateDisplay } from "@/lib/dates";
import { formatIDR } from "@/lib/format";
import type { Category, TransactionWithCategory } from "@/lib/types";

export function TransactionList({
  transactions,
  categories,
  today,
  actions = true,
}: {
  transactions: TransactionWithCategory[];
  categories: Category[];
  today: string;
  actions?: boolean;
}) {
  return (
    <ul className="divide-y divide-line/70">
      {transactions.map((t) => (
        <li key={t.id} className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <CategoryIcon icon={t.category_icon} type={t.type} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-ink">{t.description}</p>
            <p className="truncate text-xs font-semibold text-ink-faint">
              {t.category_name} · {formatDateDisplay(t.transaction_date)}
              {t.notes ? <span title={t.notes}> · {t.notes}</span> : null}
            </p>
          </div>
          <Money amount={t.amount} type={t.type} className="text-sm sm:text-base" />
          {actions ? <TransactionRowActions t={t} categories={categories} today={today} /> : null}
        </li>
      ))}
    </ul>
  );
}

export function TransactionRowActions({ t, categories, today }: { t: TransactionWithCategory; categories: Category[]; today: string }) {
  return (
    <div className="flex shrink-0 justify-end gap-0.5 sm:opacity-60 sm:transition-opacity sm:group-hover:opacity-100">
      <TransactionDialog
        categories={categories}
        defaultDate={today}
        transaction={t}
        trigger={
          <Button variant="ghost" size="icon" className="size-8" aria-label={`Edit ${t.description}`}>
            <Pencil />
          </Button>
        }
      />
      <ConfirmDialog
        title="Hapus transaksi ini?"
        description={
          <>
            <b className="text-ink">{t.description}</b> ({t.type === "income" ? "pemasukan" : "pengeluaran"} {formatIDR(t.amount)}) akan dihapus permanen dan saldo dihitung ulang.
          </>
        }
        onConfirm={async () => {
          const res = await deleteTransaction(t.id);
          if (res.ok) toast.success(res.message);
          else toast.error(res.message);
          return res.ok;
        }}
        trigger={
          <Button variant="ghost" size="icon" className="size-8 hover:bg-expense-soft hover:text-expense-strong" aria-label={`Hapus ${t.description}`}>
            <Trash2 />
          </Button>
        }
      />
    </div>
  );
}

export function TransactionTable({ transactions, categories, today }: { transactions: TransactionWithCategory[]; categories: Category[]; today: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b-2 border-line text-xs font-extrabold tracking-wide text-ink-faint uppercase">
            <th className="py-2 pr-3">Tanggal</th>
            <th className="py-2 pr-3">Deskripsi</th>
            <th className="py-2 pr-3">Kategori</th>
            <th className="py-2 pr-3">Jenis</th>
            <th className="py-2 pr-3 text-right">Jumlah</th>
            <th className="py-2 text-right"><span className="sr-only">Aksi</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/70">
          {transactions.map((t) => (
            <tr key={t.id} className="group transition-colors hover:bg-cream/70">
              <td className="py-3 pr-3 font-bold whitespace-nowrap text-ink-soft">{formatDateDisplay(t.transaction_date)}</td>
              <td className="max-w-64 py-3 pr-3">
                <p className="truncate font-extrabold text-ink">{t.description}</p>
                {t.notes ? <p className="truncate text-xs font-semibold text-ink-faint" title={t.notes}>{t.notes}</p> : null}
              </td>
              <td className="py-3 pr-3">
                <span className="flex items-center gap-2 font-bold text-ink-soft">
                  <CategoryIcon icon={t.category_icon} type={t.type} size="sm" /> {t.category_name}
                </span>
              </td>
              <td className="py-3 pr-3">
                <Badge tone={t.type}>{t.type === "income" ? "Pemasukan" : "Pengeluaran"}</Badge>
              </td>
              <td className="py-3 pr-3 text-right"><Money amount={t.amount} type={t.type} /></td>
              <td className="py-3"><TransactionRowActions t={t} categories={categories} today={today} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
