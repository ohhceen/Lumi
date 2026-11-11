import Link from "next/link";
import { ChevronRight, CreditCard, LogOut, Settings, Shapes } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { logout } from "@/app/actions/auth";
import { getAppContext } from "@/lib/data";

export const metadata = { title: "Lainnya" };

const LINKS = [
  { href: "/installments", label: "Cicilan", desc: "Progres dan jadwal cicilan", icon: CreditCard },
  { href: "/categories", label: "Kategori", desc: "Atur kategori pemasukan & pengeluaran", icon: Shapes },
  { href: "/settings", label: "Pengaturan", desc: "Saldo awal, zona waktu, profil", icon: Settings },
] as const;

export default async function MorePage() {
  const ctx = await getAppContext();
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Lainnya" description={`Masuk sebagai ${ctx.profile.name}`} />
      <Card className="p-2 sm:p-2">
        <ul className="divide-y divide-line">
          {LINKS.map(({ href, label, desc, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="flex items-center gap-3 rounded-2xl px-3 py-3.5 hover:bg-cream">
                <span aria-hidden className="inline-flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-ink">
                  <Icon className="size-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-extrabold text-ink">{label}</span>
                  <span className="block text-xs font-semibold text-ink-soft">{desc}</span>
                </span>
                <ChevronRight className="size-4 text-ink-faint" />
              </Link>
            </li>
          ))}
          <li>
            <form action={logout}>
              <button type="submit" className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-3.5 text-left hover:bg-expense-soft">
                <span aria-hidden className="inline-flex size-10 items-center justify-center rounded-2xl bg-expense-soft text-expense-strong">
                  <LogOut className="size-5" />
                </span>
                <span className="text-sm font-extrabold text-expense-strong">Keluar</span>
              </button>
            </form>
          </li>
        </ul>
      </Card>
    </div>
  );
}
