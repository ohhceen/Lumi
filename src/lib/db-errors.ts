interface PgLikeError {
  code?: string;
  message?: string;
  details?: string | null;
}

/** Maps PostgreSQL / PostgREST errors to friendly Indonesian messages. */
export function friendlyDbError(error: PgLikeError | null | undefined, fallback = "Terjadi kesalahan. Coba lagi ya."): string {
  if (!error) return fallback;
  const text = `${error.message ?? ""} ${error.details ?? ""}`;
  switch (error.code) {
    case "23505":
      if (text.includes("budgets_unique_category_month"))
        return "Anggaran untuk kategori ini di bulan tersebut sudah ada. Edit anggaran yang ada saja ya.";
      if (text.includes("categories_user_type_name_uidx"))
        return "Kategori dengan nama dan jenis ini sudah ada.";
      return "Data ini sudah ada.";
    case "23503":
      if (text.includes("transactions_category_fkey") && /delete|update/i.test(text))
        return "Kategori ini masih dipakai oleh transaksi.";
      if (text.includes("budgets_category_fkey"))
        return "Anggaran hanya bisa dibuat untuk kategori pengeluaran.";
      if (text.includes("transactions_category_fkey"))
        return "Kategori tidak cocok dengan jenis transaksi.";
      return "Data terkait tidak ditemukan.";
    case "23514":
      return "Data tidak valid. Periksa kembali isian kamu.";
    case "22023":
      return "Kategori asal dan tujuan harus berbeda.";
    case "P0002":
      return "Kategori tidak ditemukan.";
    case "PGRST116":
      return "Data tidak ditemukan.";
    case "42501":
      return "Kamu tidak punya akses ke data ini.";
    default:
      return fallback;
  }
}
