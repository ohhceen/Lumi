import { Plus } from "lucide-react";
import { CategoryIcon } from "./category-icon";
import { TransactionDialog } from "./forms/transaction-dialog";
import type { Category } from "@/lib/types";

/** One-tap shortcuts that open the expense form with the category preselected. */
export function QuickAdd({ shortcuts, categories, today }: { shortcuts: Category[]; categories: Category[]; today: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {shortcuts.map((c) => (
        <TransactionDialog
          key={c.id}
          categories={categories}
          defaultDate={today}
          defaultType="expense"
          defaultCategoryId={c.id}
          trigger={
            <button
              type="button"
              aria-label={`Catat pengeluaran ${c.name}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-soft py-1.5 pr-4 pl-1.5 text-sm font-extrabold text-ink transition-colors hover:bg-[#e6e6ea]"
            >
              <CategoryIcon icon={c.icon} type="expense" size="sm" className="rounded-full" />
              <span className="max-w-32 truncate">{c.name}</span>
            </button>
          }
        />
      ))}
      <TransactionDialog
        categories={categories}
        defaultDate={today}
        trigger={
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#d2d2d8] px-4 text-sm font-extrabold text-ink transition-colors hover:bg-cream"
          >
            <Plus className="size-4" /> Lainnya
          </button>
        }
      />
    </div>
  );
}
