import Link from "next/link";
import { ArrowRight, CircleCheck } from "lucide-react";
import { DueBadge } from "./due-badge";
import { Button } from "./ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { formatDateDisplay } from "@/lib/dates";
import { formatIDR } from "@/lib/format";
import type { UpcomingItem } from "@/lib/obligations";

export function UpcomingCard({ items }: { items: UpcomingItem[] }) {
  const total = items.reduce((s, i) => s + i.amount, 0);
  return (
    <Card>
      <CardHeader className="mb-3">
        <div>
          <CardTitle>Jatuh tempo minggu ini</CardTitle>
          <CardDescription>{items.length ? `${items.length} tagihan/cicilan · ${formatIDR(total)}` : "Tagihan dan cicilan yang terlambat atau jatuh tempo ≤ 7 hari"}</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/bills">
            Lihat semua <ArrowRight />
          </Link>
        </Button>
      </CardHeader>
      {items.length ? (
        <ul className="divide-y divide-line">
          {items.map((i) => (
            <li key={`${i.kind}-${i.id}`}>
              <Link href={i.kind === "bill" ? "/bills" : "/installments"} className="flex flex-wrap items-center gap-3 py-2.5 hover:opacity-80">
                <span className="min-w-0 flex-1 basis-40">
                  <span className="block truncate text-sm font-extrabold text-ink">{i.name}</span>
                  <span className="block truncate text-xs font-semibold text-ink-faint">
                    {i.kind === "bill" ? "Tagihan" : i.label} · {formatDateDisplay(i.dueDate)}
                  </span>
                </span>
                <DueBadge status={i.status} daysLeft={i.daysLeft} />
                <span className="tabular w-28 text-right text-sm font-black text-ink">{formatIDR(i.amount)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl bg-income-soft px-3 py-2.5 text-sm font-bold text-income-strong">
          <CircleCheck className="size-4" /> Aman, tidak ada yang jatuh tempo minggu ini.
        </p>
      )}
    </Card>
  );
}
