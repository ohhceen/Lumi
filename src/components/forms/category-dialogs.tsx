"use client";

import * as React from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_ICONS, CategoryIcon, ICON_KEYS } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { createCategory, deleteCategory, updateCategory } from "@/app/actions/categories";
import type { Category, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryDialog({
  trigger,
  category,
  defaultType = "expense",
  locked = false,
}: {
  trigger: React.ReactNode;
  category?: Category;
  defaultType?: TransactionType;
  /** type cannot change when the category is in use */
  locked?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<TransactionType>(defaultType);
  const [icon, setIcon] = React.useState("circle");
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setType(category?.type ?? defaultType);
    setIcon(category?.icon ?? (defaultType === "income" ? "wallet" : "tag"));
    setErrors({});
  }, [open, category, defaultType]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const payload = { name, type, icon };
      const res = category ? await updateCategory(category.id, payload) : await createCategory(payload);
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
      <DialogContent title={category ? "Edit kategori" : "Kategori baru"} description="Nama, jenis, dan ikon kategori.">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="flex items-center gap-3 rounded-2xl bg-cream p-3">
            <CategoryIcon icon={icon} type={type} size="lg" />
            <p className="truncate font-black">{name || "Nama kategori"}</p>
          </div>
          <Field label="Nama" htmlFor="c-name" error={errors.name}>
            <Input id="c-name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="cth. Kopi & Jajan" aria-invalid={!!errors.name?.length || undefined} />
          </Field>
          <Field label="Jenis" htmlFor="c-type" error={errors.type} hint={locked ? "Jenis tidak bisa diubah karena kategori sudah dipakai." : undefined}>
            <NativeSelect id="c-type" value={type} disabled={locked} onChange={(e) => setType(e.target.value as TransactionType)}>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </NativeSelect>
          </Field>
          <fieldset>
            <legend className="mb-1.5 text-sm font-extrabold">Ikon</legend>
            <div className="grid grid-cols-8 gap-1.5">
              {ICON_KEYS.map((k) => {
                const Icon = CATEGORY_ICONS[k];
                return (
                  <button
                    key={k}
                    type="button"
                    aria-label={k}
                    aria-pressed={icon === k}
                    onClick={() => setIcon(k)}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-xl border-2 transition-all hover:scale-105",
                      icon === k ? "border-primary-strong bg-primary-soft text-primary-strong" : "border-transparent bg-cream text-ink-soft hover:border-line",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={2.4} />
                  </button>
                );
              })}
            </div>
          </fieldset>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {category ? "Simpan perubahan" : "Tambah kategori"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CategoryActions({ category, usage, siblings }: { category: Category; usage: number; siblings: Category[] }) {
  const [target, setTarget] = React.useState("");
  const needsTarget = usage > 0;
  return (
    <div className="flex shrink-0 gap-0.5">
      <CategoryDialog
        category={category}
        locked={usage > 0}
        trigger={
          <Button variant="ghost" size="icon" className="size-8" aria-label={`Edit kategori ${category.name}`}>
            <Pencil />
          </Button>
        }
      />
      <ConfirmDialog
        title={`Hapus kategori "${category.name}"?`}
        confirmLabel={needsTarget ? "Pindahkan & hapus" : "Ya, hapus"}
        description={
          needsTarget ? (
            <>Kategori ini dipakai <b className="text-ink">{usage} transaksi</b>. Pilih kategori pengganti — semua transaksinya akan dipindahkan, saldo tidak berubah. Anggaran kategori ini ikut dihapus.</>
          ) : (
            <>Kategori ini belum dipakai transaksi. Anggaran kategori ini (jika ada) ikut dihapus.</>
          )
        }
        onConfirm={async () => {
          if (needsTarget && !target) {
            toast.error("Pilih kategori pengganti dulu ya.");
            return false;
          }
          const res = await deleteCategory(category.id, needsTarget ? target : null);
          if (res.ok) toast.success(res.message);
          else toast.error(res.message);
          return res.ok;
        }}
        trigger={
          <Button variant="ghost" size="icon" className="size-8 hover:bg-expense-soft hover:text-expense-strong" aria-label={`Hapus kategori ${category.name}`}>
            <Trash2 />
          </Button>
        }
      >
        {needsTarget ? (
          <div className="mt-4">
            <label htmlFor={`move-${category.id}`} className="mb-1.5 block text-sm font-extrabold">Pindahkan transaksi ke</label>
            <NativeSelect id={`move-${category.id}`} value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Pilih kategori…</option>
              {siblings.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </NativeSelect>
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
