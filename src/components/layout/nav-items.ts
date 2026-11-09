import { ArrowLeftRight, ChartPie, LayoutDashboard, PiggyBank, Settings, Shapes, TrendingDown, TrendingUp } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", short: "Beranda", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", short: "Transaksi", icon: ArrowLeftRight },
  { href: "/budget", label: "Anggaran", short: "Anggaran", icon: PiggyBank },
  { href: "/reports", label: "Laporan", short: "Laporan", icon: ChartPie },
  { href: "/categories", label: "Kategori", short: "Kategori", icon: Shapes },
  { href: "/settings", label: "Pengaturan", short: "Atur", icon: Settings },
] as const;

/** Shown indented under "Transaksi" in the sidebar (and as tabs on the transaction pages). */
export const TRANSACTION_SUB_ITEMS = [
  { href: "/income", label: "Pemasukan", icon: TrendingUp },
  { href: "/expenses", label: "Pengeluaran", icon: TrendingDown },
] as const;

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
