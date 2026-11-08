"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { Category, Transaction, TransactionType } from "@/lib/types";
import { TransactionForm } from "./transaction-form";

export function TransactionDialog({
  trigger,
  categories,
  defaultDate,
  defaultType,
  transaction,
}: {
  trigger: React.ReactNode;
  categories: Category[];
  defaultDate: string;
  defaultType?: TransactionType;
  transaction?: Pick<Transaction, "id" | "type" | "description" | "amount" | "category_id" | "transaction_date" | "notes">;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={transaction ? "Edit transaksi" : "Catat transaksi"}
        description={transaction ? "Ubah detail transaksi. Saldo akan dihitung ulang otomatis." : "Catat pemasukan atau pengeluaranmu hari ini."}
      >
        {/* key: remount = fresh form every time it opens */}
        {open ? (
          <TransactionForm
            categories={categories}
            transaction={transaction}
            defaultDate={defaultDate}
            defaultType={defaultType}
            onDone={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
