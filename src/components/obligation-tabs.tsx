import Link from "next/link";
import { cn } from "@/lib/utils";

export function ObligationTabs({ active }: { active: "bills" | "installments" }) {
  const tabs = [
    { key: "bills", href: "/bills", label: "Tagihan bulanan" },
    { key: "installments", href: "/installments", label: "Cicilan" },
  ] as const;
  return (
    <nav aria-label="Tagihan dan cicilan" className="mb-4 inline-flex rounded-full bg-white p-1 shadow-soft">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-extrabold transition-colors",
            active === t.key ? "bg-primary-strong text-white" : "text-ink-soft hover:bg-primary-soft",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
