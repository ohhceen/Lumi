"use client";

import { Pause, Pencil, Play, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { BillDialog } from "./forms/bill-dialogs";
import { InstallmentDialog } from "./forms/installment-dialogs";
import { deleteBill, setBillActive, unpayBill } from "@/app/actions/bills";
import { deleteInstallment, deleteInstallmentPayment } from "@/app/actions/installments";
import type { ActionResult, Bill, Category, Installment } from "@/lib/types";

const notify = (res: ActionResult) => {
  if (res.ok) toast.success(res.message);
  else toast.error(res.message);
  return res.ok;
};

const iconBtn = "size-9";

export function BillRowActions({ bill, categories }: { bill: Bill; categories: Category[] }) {
  return (
    <div className="flex shrink-0 gap-0.5">
      <BillDialog
        bill={bill}
        categories={categories}
        trigger={
          <Button variant="ghost" size="icon" className={iconBtn} aria-label={`Edit tagihan ${bill.name}`}>
            <Pencil />
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="icon"
        className={iconBtn}
        aria-label={bill.active ? `Hentikan tagihan ${bill.name}` : `Aktifkan lagi tagihan ${bill.name}`}
        title={bill.active ? "Hentikan (sudah tidak berlangganan)" : "Aktifkan lagi"}
        onClick={async () => notify(await setBillActive(bill.id, !bill.active))}
      >
        {bill.active ? <Pause /> : <Play />}
      </Button>
      <ConfirmDialog
        title={`Hapus tagihan "${bill.name}"?`}
        description={<>Tagihan dan riwayat status lunasnya akan dihapus. Transaksi pengeluaran yang sudah tercatat <b className="text-ink">tidak</b> ikut terhapus.</>}
        onConfirm={async () => notify(await deleteBill(bill.id))}
        trigger={
          <Button variant="ghost" size="icon" className={`${iconBtn} hover:bg-expense-soft hover:text-expense-strong`} aria-label={`Hapus tagihan ${bill.name}`}>
            <Trash2 />
          </Button>
        }
      />
    </div>
  );
}

export function UnpayBillButton({ paymentId, name, recorded }: { paymentId: string; name: string; recorded: boolean }) {
  return (
    <ConfirmDialog
      title="Batalkan status lunas?"
      confirmLabel="Ya, batalkan"
      description={
        recorded ? (
          <>Transaksi pengeluaran <b className="text-ink">{name}</b> yang tercatat saat ditandai lunas juga akan dihapus, dan saldo dihitung ulang.</>
        ) : (
          <>Tagihan <b className="text-ink">{name}</b> kembali berstatus belum dibayar.</>
        )
      }
      onConfirm={async () => notify(await unpayBill(paymentId))}
      trigger={
        <Button variant="ghost" size="sm" aria-label={`Batalkan lunas ${name}`}>
          <Undo2 /> Batalkan
        </Button>
      }
    />
  );
}

export function InstallmentActions({ installment, categories, defaultMonth }: { installment: Installment; categories: Category[]; defaultMonth: string }) {
  return (
    <div className="flex shrink-0 gap-0.5">
      <InstallmentDialog
        installment={installment}
        categories={categories}
        defaultMonth={defaultMonth}
        trigger={
          <Button variant="ghost" size="icon" className={iconBtn} aria-label={`Edit cicilan ${installment.name}`}>
            <Pencil />
          </Button>
        }
      />
      <ConfirmDialog
        title={`Hapus cicilan "${installment.name}"?`}
        description={<>Cicilan dan riwayat pembayarannya akan dihapus. Transaksi pengeluaran yang sudah tercatat <b className="text-ink">tidak</b> ikut terhapus.</>}
        onConfirm={async () => notify(await deleteInstallment(installment.id))}
        trigger={
          <Button variant="ghost" size="icon" className={`${iconBtn} hover:bg-expense-soft hover:text-expense-strong`} aria-label={`Hapus cicilan ${installment.name}`}>
            <Trash2 />
          </Button>
        }
      />
    </div>
  );
}

export function DeleteInstallmentPaymentButton({ paymentId, label, recorded }: { paymentId: string; label: string; recorded: boolean }) {
  return (
    <ConfirmDialog
      title="Hapus pembayaran ini?"
      description={recorded ? <>Transaksi pengeluarannya juga dihapus dan saldo dihitung ulang. Progres cicilan mundur satu.</> : <>Progres cicilan mundur satu.</>}
      onConfirm={async () => notify(await deleteInstallmentPayment(paymentId))}
      trigger={
        <Button variant="ghost" size="icon" className="size-8 hover:bg-expense-soft hover:text-expense-strong" aria-label={`Hapus pembayaran ${label}`}>
          <Trash2 />
        </Button>
      }
    />
  );
}
