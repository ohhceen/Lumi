import { ArrowLeftRight, ChartPie, LayoutDashboard, PiggyBank, Settings, Shapes } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", short: "Beranda", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", short: "Transaksi", icon: ArrowLeftRight },
  { href: "/budget", label: "Anggaran", short: "Anggaran", icon: PiggyBank },
  { href: "/reports", label: "Laporan", short: "Laporan", icon: ChartPie },
  { href: "/categories", label: "Kategori", short: "Kategori", icon: Shapes },
  { href: "/settings", label: "Pengaturan", short: "Atur", icon: Settings },
] as const;

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
