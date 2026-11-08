"use client";

import * as React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Loader2 } from "lucide-react";
import { Button } from "./button";

/** Confirmation dialog. `onConfirm` may be async; the dialog closes when it resolves to true. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Ya, hapus",
  cancelLabel = "Batal",
  onConfirm,
  children,
}: {
  trigger: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<boolean> | boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  return (
    <AlertDialog.Root open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px]" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-line bg-card p-6 shadow-pop data-[state=open]:animate-pop-in">
          <AlertDialog.Title className="text-lg font-black text-ink">{title}</AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div className="mt-2 text-sm font-semibold text-ink-soft">{description}</div>
          </AlertDialog.Description>
          {children}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline" disabled={pending}>
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant="danger"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                try {
                  const ok = await onConfirm();
                  if (ok) setOpen(false);
                } finally {
                  setPending(false);
                }
              }}
            >
              {pending ? <Loader2 className="animate-spin" /> : null}
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
