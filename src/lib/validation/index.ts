import { z } from "zod";
import { isValidDateString, isValidTimezone } from "../dates";
import { parseIDRInput } from "../format";

export const MAX_AMOUNT = 1_000_000_000_000; // Rp1 triliun

const transactionType = z.enum(["income", "expense"], { error: "Pilih jenis transaksi." });

/** Accepts 150000, "150000", "150.000", "Rp150.000" -> 150000 (integer Rupiah). */
const rupiah = (label: string) =>
  z.preprocess(
    (v) => {
      if (typeof v === "number") return v;
      const s = String(v ?? "").trim();
      const n = parseIDRInput(s);
      // keep the sign so "-5000" is rejected instead of read as 5000
      return s.startsWith("-") && !Number.isNaN(n) ? -n : n;
    },
    z
      .number({ error: `${label} wajib diisi.` })
      .refine((n) => !Number.isNaN(n), `${label} wajib diisi.`)
      .refine((n) => Number.isInteger(n), `${label} harus bilangan bulat Rupiah.`)
      .refine((n) => n > 0, `${label} harus lebih dari Rp0.`)
      .refine((n) => n <= MAX_AMOUNT, `${label} terlalu besar.`),
  );

const id = (msg: string) => z.guid({ error: msg });

const dateString = z
  .string({ error: "Tanggal wajib diisi." })
  .refine(isValidDateString, "Tanggal tidak valid.");

export const transactionSchema = z.object({
  type: transactionType,
  description: z
    .string({ error: "Deskripsi wajib diisi." })
    .trim()
    .min(1, "Deskripsi wajib diisi.")
    .max(100, "Deskripsi maksimal 100 karakter."),
  amount: rupiah("Jumlah"),
  category_id: id("Pilih kategori."),
  transaction_date: dateString,
  notes: z
    .string()
    .trim()
    .max(500, "Catatan maksimal 500 karakter.")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});
export type TransactionInput = z.infer<typeof transactionSchema>;

export const budgetSchema = z.object({
  category_id: id("Pilih kategori pengeluaran."),
  month: z.coerce.number().int().min(1, "Bulan tidak valid.").max(12, "Bulan tidak valid."),
  year: z.coerce.number().int().min(2000, "Tahun tidak valid.").max(2100, "Tahun tidak valid."),
  amount: rupiah("Batas anggaran"),
});
export type BudgetInput = z.infer<typeof budgetSchema>;

export const categorySchema = z.object({
  name: z
    .string({ error: "Nama kategori wajib diisi." })
    .trim()
    .min(1, "Nama kategori wajib diisi.")
    .max(40, "Nama kategori maksimal 40 karakter."),
  type: transactionType,
  icon: z.string().trim().min(1, "Pilih ikon.").max(40),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const settingsSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(60, "Nama maksimal 60 karakter."),
  initial_balance: z.preprocess(
    (v) => {
      if (typeof v === "number") return v;
      const s = String(v ?? "").trim();
      const negative = s.startsWith("-");
      const n = parseIDRInput(s);
      if (Number.isNaN(n)) return 0; // empty = Rp0
      return negative ? -n : n;
    },
    z
      .number()
      .int("Saldo awal harus bilangan bulat.")
      .min(-MAX_AMOUNT, "Saldo awal terlalu kecil.")
      .max(MAX_AMOUNT, "Saldo awal terlalu besar."),
  ),
  timezone: z.string().refine(isValidTimezone, "Zona waktu tidak valid."),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

/** Filters for the transaction history (from URL search params). */
export const transactionFilterSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  type: z.enum(["income", "expense"]).optional().catch(undefined),
  category: z.guid().optional().catch(undefined),
  date: z.string().refine(isValidDateString).optional().catch(undefined),
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional()
    .catch(undefined),
  sort: z.enum(["newest", "oldest"]).default("newest").catch("newest"),
  page: z.coerce.number().int().min(1).default(1).catch(1),
});
export type TransactionFilters = z.infer<typeof transactionFilterSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Data tidak valid.";
}
