"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Mascot } from "@/components/mascot";
import { Sparkle } from "@/components/decorations";
import { logout } from "@/app/actions/auth";
import { NAV_ITEMS, isActive } from "./nav-items";

export function Sidebar({ name, children }: { name: string; children?: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line/70 bg-card/80 px-4 py-6 backdrop-blur lg:flex">
      <Link href="/" className="group mb-8 flex items-center gap-3 px-2">
        <Mascot mood="happy" className="size-12 transition-transform group-hover:animate-wiggle" />
        <div>
          <p className="text-lg leading-none font-black text-ink">
            MyMoney <span className="text-primary-strong">Buddy</span>
          </p>
          <p className="mt-1 text-xs font-bold text-ink-faint">Teman keuanganmu</p>
        </div>
      </Link>

      {children}

      <nav aria-label="Navigasi utama" className="mt-4 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-extrabold transition-all",
                active ? "bg-primary-soft text-primary-strong shadow-[inset_0_0_0_2px_#8ec5f7]" : "text-ink-soft hover:bg-cream hover:text-ink",
              )}
            >
              <Icon className={cn("size-5 transition-transform group-hover:scale-110", active && "text-primary-strong")} strokeWidth={2.4} />
              {label}
              {active ? <Sparkle className="ml-auto size-3 text-accent-strong" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-3xl bg-secondary-soft p-4">
        <p className="text-xs font-bold text-secondary-strong">Masuk sebagai</p>
        <p className="truncate font-black text-ink">{name}</p>
        <form action={logout}>
          <button className="mt-2 inline-flex items-center gap-1.5 text-xs font-extrabold text-ink-soft hover:text-expense-strong" type="submit">
            <LogOut className="size-3.5" /> Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileTopBar({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line/70 bg-cream/90 px-4 py-3 backdrop-blur lg:hidden">
      <Link href="/" className="flex items-center gap-2">
        <Mascot className="size-9" />
        <span className="text-base font-black">
          MyMoney <span className="text-primary-strong">Buddy</span>
        </span>
      </Link>
      {children}
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-6">
        {NAV_ITEMS.map(({ href, short, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("flex flex-col items-center gap-0.5 py-2 text-[10px] font-extrabold transition-colors", active ? "text-primary-strong" : "text-ink-faint hover:text-ink")}
              >
                <span className={cn("rounded-full px-3 py-1 transition-colors", active && "bg-primary-soft")}>
                  <Icon className="size-5" strokeWidth={2.4} />
                </span>
                {short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
