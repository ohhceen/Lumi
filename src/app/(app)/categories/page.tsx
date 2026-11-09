import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState } from "@/components/empty-state";
import { CategoryActions, CategoryDialog } from "@/components/forms/category-dialogs";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategories, getCategoryUsage } from "@/lib/data";
import type { Category, TransactionType } from "@/lib/types";

export const metadata = { title: "Kategori" };

export default async function CategoriesPage() {
  const [categories, usage] = await Promise.all([getCategories(), getCategoryUsage()]);
  return (
    <div>
      <PageHeader title="Kategori" description="Kelompokkan transaksimu supaya laporan lebih mudah dibaca." character="rex" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Column type="income" categories={categories} usage={usage} />
        <Column type="expense" categories={categories} usage={usage} />
      </div>
    </div>
  );
}

function Column({ type, categories, usage }: { type: TransactionType; categories: Category[]; usage: Map<string, number> }) {
  const list = categories.filter((c) => c.type === type);
  const income = type === "income";
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            {income ? <TrendingUp className="size-5 text-income-strong" /> : <TrendingDown className="size-5 text-expense-strong" />}
            {income ? "Kategori Pemasukan" : "Kategori Pengeluaran"}
          </CardTitle>
          <CardDescription>{list.length} kategori</CardDescription>
        </div>
        <CategoryDialog defaultType={type} trigger={<Button variant={income ? "income" : "expense"} size="sm"><Plus /> Tambah</Button>} />
      </CardHeader>
      {list.length ? (
        <ul className="divide-y divide-line/70">
          {list.map((c) => {
            const n = usage.get(c.id) ?? 0;
            return (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <CategoryIcon icon={c.icon} type={c.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">{c.name}</p>
                  <p className="text-xs font-semibold text-ink-faint">{n ? `${n} transaksi` : "Belum dipakai"}</p>
                </div>
                <CategoryActions category={c} usage={n} siblings={list.filter((x) => x.id !== c.id)} />
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title="Belum ada kategori" className="py-8" />
      )}
    </Card>
  );
}
