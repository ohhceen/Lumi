import type { MascotMood } from "@/components/mascot";
import type { BudgetOverview } from "./finance";

export function greeting(hour: number): string {
  if (hour < 4) return "Selamat malam";
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

const MESSAGES = [
  "Catatan kecil hari ini, tabungan besar nanti. ✨",
  "Setiap Rupiah yang tercatat adalah langkah menuju tujuanmu! 🚀",
  "Hemat bukan pelit — kamu sedang berinvestasi untuk dirimu sendiri. 💙",
  "Bibo bangga kamu rajin mencatat! Terus pertahankan ya. 🌟",
  "Anggaran itu peta, bukan penjara. Jelajahi dengan bijak! 🗺️",
  "Kopi hari ini atau liburan bulan depan? Kamu yang pilih! ☕",
  "Uang yang terencana selalu lebih tenang. 🌙",
];

export function motivationalMessage(today: string): string {
  const n = today.split("-").reduce((s, p) => s + Number(p), 0);
  return MESSAGES[n % MESSAGES.length];
}

/** Mascot mood reacting to the month's financial condition. */
export function moodFor(net: number, budget: BudgetOverview, hasTransactions: boolean): { mood: MascotMood; note: string } {
  if (!hasTransactions) return { mood: "sleepy", note: "Belum ada transaksi bulan ini. Yuk mulai catat!" };
  if (budget.count > 0 && budget.status === "exceeded") return { mood: "worried", note: "Total anggaran bulan ini sudah terlewati." };
  if (net < 0) return { mood: "worried", note: "Pengeluaran bulan ini lebih besar dari pemasukan." };
  if (budget.count > 0 && (budget.status === "danger" || budget.status === "warning")) return { mood: "wink", note: "Anggaran mulai menipis, tetap waspada ya." };
  return { mood: "excited", note: "Keuanganmu bulan ini sehat. Mantap!" };
}
