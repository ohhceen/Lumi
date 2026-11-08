/** Formats whole Rupiah: 1000000 -> "Rp1.000.000", -2500 -> "-Rp2.500". */
export function formatIDR(value: number): string {
  const n = Math.round(Number.isFinite(value) ? value : 0);
  const abs = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${n < 0 ? "-" : ""}Rp${abs}`;
}

/** Compact form for chart axes: 1500000 -> "1,5jt", 250000 -> "250rb". */
export function formatIDRCompact(value: number): string {
  const n = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const fmt = (x: number) => x.toFixed(x % 1 === 0 ? 0 : 1).replace(".", ",");
  if (n >= 1_000_000_000) return `${sign}${fmt(n / 1_000_000_000)}M`;
  if (n >= 1_000_000) return `${sign}${fmt(n / 1_000_000)}jt`;
  if (n >= 1_000) return `${sign}${fmt(n / 1_000)}rb`;
  return `${sign}${n}`;
}

/** Digits-only value typed by the user ("1.500.000" / "Rp 1.500.000") -> 1500000. NaN if empty. */
export function parseIDRInput(input: string): number {
  const digits = String(input ?? "").replace(/[^\d]/g, "");
  if (digits === "") return NaN;
  return Number(digits);
}

/** "1500000" -> "1.500.000" for live input formatting. */
export function formatDigitsGrouped(input: string): string {
  const digits = String(input ?? "").replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}
