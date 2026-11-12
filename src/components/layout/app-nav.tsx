"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand";
import { logout } from "@/app/actions/auth";
import { MOBILE_NAV_ITEMS, NAV_ITEMS, TRANSACTION_SUB_ITEMS, isActive } from "./nav-items";

function NavLink({ href, label, icon: Icon, active, sub = false }: { href: string; label: string; icon: React.ElementType; active: boolean; sub?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-full px-3.5 font-extrabold transition-all",
        sub ? "ml-6 py-2 text-[13px]" : "py-2.5 text-sm",
        active ? "bg-primary-soft text-ink shadow-[inset_0_0_0_1px_#e4e4e8]" : "text-ink-soft hover:bg-cream hover:text-ink",
      )}
    >
      <Icon className={cn("shrink-0 transition-transform group-hover:scale-110", sub ? "size-4" : "size-5")} strokeWidth={2.4} />
      {label}
    </Link>
  );
}

export function Sidebar({ name, children }: { name: string; children?: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-4 m-4 mr-0 hidden h-[calc(100dvh-2rem)] w-60 shrink-0 flex-col overflow-y-auto rounded-3xl glass px-3.5 py-6 shadow-pop lg:flex">
      <Link href="/" className="group mb-8 flex items-center gap-3 px-2">
        <LogoMark className="size-11" />
        <div>
          <p className="text-xl leading-none font-black whitespace-nowrap text-ink">Lumi</p>
          <p className="mt-1 text-xs font-bold text-ink-faint">Teman keuanganmu</p>
        </div>
      </Link>

      {children}

      <nav aria-label="Navigasi utama" className="mt-4 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <div key={item.href} className="flex flex-col gap-1">
            <NavLink href={item.href} label={item.label} icon={item.icon} active={isActive(pathname, item.href)} />
            {item.href === "/transactions"
              ? TRANSACTION_SUB_ITEMS.map((s) => <NavLink key={s.href} href={s.href} label={s.label} icon={s.icon} active={isActive(pathname, s.href)} sub />)
              : null}
          </div>
        ))}
      </nav>

      <div className="mt-6 rounded-3xl border border-line bg-cream p-4">
        <p className="text-xs font-bold text-ink-soft">Masuk sebagai</p>
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
    <header className="sticky top-0 z-30 flex items-center justify-between bg-white/72 px-4 backdrop-blur-[22px] backdrop-saturate-[1.6] py-3 shadow-soft lg:hidden">
      <Link href="/" className="flex items-center gap-2">
        <LogoMark className="size-9" />
        <span className="text-lg font-black text-ink">Lumi</span>
      </Link>
      {children}
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi utama" className="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-white/72 backdrop-blur-[22px] backdrop-saturate-[1.6] pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-6">
        {MOBILE_NAV_ITEMS.map(({ href, short, icon: Icon, also }) => {
          const active = isActive(pathname, href) || also.some((p) => isActive(pathname, p));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("flex flex-col items-center gap-0.5 py-2 text-[10px] font-extrabold transition-colors", active ? "text-ink" : "text-ink-faint hover:text-ink")}
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
