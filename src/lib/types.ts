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
