import { ArrowLeftRight, ChartPie, CreditCard, Ellipsis, LayoutDashboard, PiggyBank, Receipt, Settings, Shapes, TrendingDown, TrendingUp } from "lucide-react";

/** Sidebar (desktop). */
export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/budget", label: "Anggaran", icon: PiggyBank },
  { href: "/bills", label: "Tagihan", icon: Receipt },
  { href: "/installments", label: "Cicilan", icon: CreditCard },
  { href: "/reports", label: "Laporan", icon: ChartPie },
  { href: "/categories", label: "Kategori", icon: Shapes },
  { href: "/settings", label: "Pengaturan", icon: Settings },
] as const;

/** Shown indented under "Transaksi" in the sidebar (and as tabs on the transaction pages). */
export const TRANSACTION_SUB_ITEMS = [
  { href: "/income", label: "Pemasukan", icon: TrendingUp },
  { href: "/expenses", label: "Pengeluaran", icon: TrendingDown },
] as const;

/** Bottom bar (phones): 6 slots; `also` = other paths that light the tab up. */
export const MOBILE_NAV_ITEMS = [
  { href: "/", short: "Beranda", icon: LayoutDashboard, also: [] as string[] },
  { href: "/transactions", short: "Transaksi", icon: ArrowLeftRight, also: ["/income", "/expenses"] },
  { href: "/budget", short: "Anggaran", icon: PiggyBank, also: [] as string[] },
  { href: "/bills", short: "Tagihan", icon: Receipt, also: ["/installments"] },
  { href: "/reports", short: "Laporan", icon: ChartPie, also: [] as string[] },
  { href: "/more", short: "Lainnya", icon: Ellipsis, also: ["/categories", "/settings"] },
] as const;

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
