export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  category_id: string;
  transaction_date: string; // YYYY-MM-DD
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category_name: string;
  category_icon: string;
}

export interface Budget {
  id: string;
  category_id: string;
  month: number;
  year: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  initial_balance: number;
  currency: "IDR";
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  name: string;
  created_at: string;
}

export interface YearMonth {
  year: number;
  month: number; // 1-12
}

/** Standard result returned by every server action. */
export type ActionResult<T = undefined> =
  | { ok: true; message: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export interface Bill {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  category_id: string;
  notes: string | null;
  active: boolean;
  created_at: string;
}

export interface BillPayment {
  id: string;
  bill_id: string;
  year: number;
  month: number;
  amount: number;
  paid_on: string;
  transaction_id: string | null;
}

export interface Installment {
  id: string;
  name: string;
  monthly_amount: number;
  tenor: number;
  start_month: string;
  due_day: number;
  paid_before: number;
  category_id: string;
  notes: string | null;
  created_at: string;
}

export interface InstallmentPayment {
  id: string;
  installment_id: string;
  amount: number;
  paid_on: string;
  transaction_id: string | null;
}
