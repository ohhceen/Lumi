import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentYearMonth, DEFAULT_TIMEZONE, todayInTimezone } from "@/lib/dates";
import { filtersToDateRange, PAGE_SIZE } from "@/lib/filters";
import type { MonthTotalRow, Totals } from "@/lib/finance";
import type { Bill, BillPayment, Budget, Category, Installment, InstallmentPayment, Profile, Settings, TransactionWithCategory, Transaction, YearMonth } from "@/lib/types";
import type { TransactionFilters } from "@/lib/validation";

class DataError extends Error {
  constructor(what: string, cause: { message: string }) {
    super(`Gagal memuat ${what}: ${cause.message}`);
  }
}

const num = (v: unknown) => Number(v ?? 0);

/** Authenticated Supabase client for this request, or redirect to login. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
});

export const getAppContext = cache(async () => {
  const { supabase, user } = await getSession();
  const load = () =>
    Promise.all([
      supabase.from("settings").select("*").maybeSingle(),
      supabase.from("profiles").select("*").maybeSingle(),
    ]);
  let [settingsRes, profileRes] = await load();
  if (!settingsRes.error && (!settingsRes.data || !profileRes.data)) {
    // first login of an account created before the migration ran
    const { error } = await supabase.rpc("ensure_user_setup");
    if (error) throw new DataError("pengaturan awal", error);
    [settingsRes, profileRes] = await load();
  }
  if (settingsRes.error) throw new DataError("pengaturan", settingsRes.error);
  if (profileRes.error) throw new DataError("profil", profileRes.error);

  const settings = { ...(settingsRes.data as Settings), initial_balance: num(settingsRes.data?.initial_balance) };
  const profile = profileRes.data as Profile;
  const timezone = settings.timezone || DEFAULT_TIMEZONE;
  return {
    user,
    settings,
    profile,
    timezone,
    today: todayInTimezone(timezone),
    currentMonth: currentYearMonth(timezone),
  };
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("categories").select("*").order("type").order("name");
  if (error) throw new DataError("kategori", error);
  return data as Category[];
});

export interface CategoryUsage {
  transactions: number;
  bills: number;
  installments: number;
}

export async function getCategoryUsage(): Promise<Map<string, CategoryUsage>> {
  const { supabase } = await getSession();
  const { data, error } = await supabase.rpc("category_usage");
  if (error) throw new DataError("pemakaian kategori", error);
  return new Map(
    (data as { category_id: string; transaction_count: number; bill_count: number; installment_count: number }[]).map((r) => [
      r.category_id,
      { transactions: num(r.transaction_count), bills: num(r.bill_count), installments: num(r.installment_count) },
    ]),
  );
}

/** All transactions with transaction_date in [start, end). */
export async function getTransactionsInRange(start: string, end: string): Promise<TransactionWithCategory[]> {
  const { supabase } = await getSession();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, categories(name, icon)")
    .gte("transaction_date", start)
    .lt("transaction_date", end)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10000);
  if (error) throw new DataError("transaksi", error);
  return (data as (Transaction & { categories: { name: string; icon: string } | null })[]).map(({ categories, ...t }) => ({
    ...t,
    amount: num(t.amount),
    category_name: categories?.name ?? "—",
    category_icon: categories?.icon ?? "circle",
  }));
}

export async function getTotals(start: string | null = null, end: string | null = null): Promise<Totals & { count: number }> {
  const { supabase } = await getSession();
  const { data, error } = await supabase.rpc("transaction_totals", { p_start: start, p_end: end }).single();
  if (error) throw new DataError("total transaksi", error);
  const row = data as { total_income: number; total_expense: number; transaction_count: number };
  return { income: num(row.total_income), expense: num(row.total_expense), count: num(row.transaction_count) };
}

export async function getMonthlyTotals(start: string, end: string): Promise<MonthTotalRow[]> {
  const { supabase } = await getSession();
  const { data, error } = await supabase.rpc("monthly_totals", { p_start: start, p_end: end });
  if (error) throw new DataError("tren bulanan", error);
  return (data as MonthTotalRow[]).map((r) => ({ ...r, total_income: num(r.total_income), total_expense: num(r.total_expense) }));
}

export async function getBudgets(ym: YearMonth): Promise<Budget[]> {
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("budgets").select("*").eq("year", ym.year).eq("month", ym.month);
  if (error) throw new DataError("anggaran", error);
  return (data as Budget[]).map((b) => ({ ...b, amount: num(b.amount) }));
}

export async function searchTransactions(filters: TransactionFilters) {
  const { supabase } = await getSession();
  const { start, end } = filtersToDateRange(filters);
  const { data, error } = await supabase.rpc("search_transactions", {
    p_search: filters.q ?? null,
    p_type: filters.type ?? null,
    p_category: filters.category ?? null,
    p_start: start,
    p_end: end,
    p_sort: filters.sort,
    p_limit: PAGE_SIZE,
    p_offset: (filters.page - 1) * PAGE_SIZE,
  });
  if (error) throw new DataError("riwayat transaksi", error);
  const rows = (data as (TransactionWithCategory & { total_count: number })[]).map((r) => ({ ...r, amount: num(r.amount) }));
  return { rows, total: rows.length ? num(rows[0].total_count) : 0 };
}

export async function getRecentTransactions(limit = 6): Promise<TransactionWithCategory[]> {
  const { supabase } = await getSession();
  const { data, error } = await supabase.rpc("search_transactions", { p_limit: limit });
  if (error) throw new DataError("transaksi terbaru", error);
  return (data as TransactionWithCategory[]).map((r) => ({ ...r, amount: num(r.amount) }));
}

export async function getBills(): Promise<Bill[]> {
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("bills").select("*").order("due_day").order("name");
  if (error) throw new DataError("tagihan", error);
  return (data as Bill[]).map((b) => ({ ...b, amount: num(b.amount) }));
}

export async function getBillPayments(ym: YearMonth): Promise<BillPayment[]> {
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("bill_payments").select("*").eq("year", ym.year).eq("month", ym.month);
  if (error) throw new DataError("pembayaran tagihan", error);
  return (data as BillPayment[]).map((p) => ({ ...p, amount: num(p.amount) }));
}

export async function getInstallments(): Promise<(Installment & { payments: InstallmentPayment[] })[]> {
  const { supabase } = await getSession();
  const { data, error } = await supabase
    .from("installments")
    .select("*, payments:installment_payments(id, installment_id, amount, paid_on, transaction_id)")
    .order("created_at");
  if (error) throw new DataError("cicilan", error);
  return (data as (Installment & { payments: InstallmentPayment[] })[]).map((i) => ({
    ...i,
    monthly_amount: num(i.monthly_amount),
    payments: [...i.payments].map((p) => ({ ...p, amount: num(p.amount) })).sort((a, b) => a.paid_on.localeCompare(b.paid_on)),
  }));
}
